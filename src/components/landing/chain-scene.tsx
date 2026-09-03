"use client";

import { useEffect, useRef, useState } from "react";
import type { MotionValue } from "motion/react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import * as Sentry from "@sentry/nextjs";
import { hasWebGL } from "@/lib/has-webgl";

/**
 * Photorealistic scroll-linked breaking chain, rendered with real 3D geometry
 * and PBR lighting rather than flat SVG shapes.
 *
 * Why WebGL and not vector art: the "dimensional steel" look lives almost
 * entirely in specular highlights that slide across a curved surface as the
 * viewing/lighting angle changes — that's a property of real geometry lit in
 * real time, not something a hand-tuned gradient can reproduce convincingly.
 * A flat SVG oval only ever shows one fixed highlight regardless of what's
 * "supposed" to be catching the light. There's no image-generation tool
 * available here either, which rules out pre-rendered link sprites — so a
 * procedural 3D mesh is the only path left to an actually-realistic result.
 */

/* ------------------------------------------------------------------ */
/* Link geometry: a "stadium" ring (two straight sides + two semicircle
 * caps) extruded into a round tube, matching how a real chain link is
 * shaped — this is what gives the round cross-section its correct
 * highlight/shadow falloff under lighting.                            */
/* ------------------------------------------------------------------ */

/*
 * Proportioned like real chain stock: link roughly 2.2x as long as it is
 * wide, on comparatively thin wire. The previous stubbier link plus a tight
 * pitch made consecutive same-orientation links overlap by nearly half their
 * length, fusing their straight sides into one continuous rail — it read as a
 * rod with rings threaded onto it rather than as a chain.
 */
const ARM_LENGTH = 0.864;
const ARM_RADIUS = 0.24;
const TUBE_RADIUS = 0.12;
const TUBULAR_SEGMENTS = 48;
const RADIAL_SEGMENTS = 14;

const ARC = Math.PI * ARM_RADIUS;
const PERIMETER = 2 * ARC + 2 * ARM_LENGTH;
/** Where the top and bottom straight sections cross the link's centerline. */
const D_TOP_MID = ARC + ARM_LENGTH / 2;
const D_BOTTOM_MID = 2 * ARC + 1.5 * ARM_LENGTH;

/** Point on the canonical stadium boundary at arc-length distance `d`. */
function stadiumPoint(d: number): [number, number] {
  let rem = ((d % PERIMETER) + PERIMETER) % PERIMETER;

  if (rem < ARC) {
    const a = -Math.PI / 2 + rem / ARM_RADIUS;
    return [ARM_LENGTH / 2 + ARM_RADIUS * Math.cos(a), ARM_RADIUS * Math.sin(a)];
  }
  rem -= ARC;
  if (rem < ARM_LENGTH) {
    return [ARM_LENGTH / 2 - rem, ARM_RADIUS];
  }
  rem -= ARM_LENGTH;
  if (rem < ARC) {
    const a = Math.PI / 2 + rem / ARM_RADIUS;
    return [-ARM_LENGTH / 2 + ARM_RADIUS * Math.cos(a), ARM_RADIUS * Math.sin(a)];
  }
  rem -= ARC;
  return [-ARM_LENGTH / 2 + rem, -ARM_RADIUS];
}

/** A slice of the stadium boundary, starting `startD` along, `length` long. */
class LinkArcCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    private startD: number,
    private length: number,
  ) {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const [x, y] = stadiumPoint(this.startD + t * this.length);
    return target.set(x, y, 0);
  }
}

function makeTube(startD: number, length: number, closed: boolean) {
  const curve = new LinkArcCurve(startD, length);
  return new THREE.TubeGeometry(
    curve,
    Math.round((TUBULAR_SEGMENTS * length) / PERIMETER) || 8,
    TUBE_RADIUS,
    RADIAL_SEGMENTS,
    closed,
  );
}

/* ------------------------------------------------------------------ */
/* Chain layout                                                        */
/* ------------------------------------------------------------------ */

/** Three links either side of the break, plus the broken link between them. */
const LINKS_PER_SIDE = 3;
const LINK_COUNT = LINKS_PER_SIDE * 2 + 1;
const MID = LINKS_PER_SIDE;
/*
 * Pitch. Must stay under the link's inner half-length
 * (ARM_LENGTH / 2 + ARM_RADIUS - TUBE_RADIUS) or a link stops passing through
 * its neighbour's opening and the chain comes apart; sitting just below that
 * bound spreads the links as far as they can go while still interlocking.
 */
/*
 * Chain pitch — the distance between consecutive links.
 *
 * Set to the link's centreline half-length, which is what actually makes a
 * chain: each link's end cap lands at its neighbour's centre, so consecutive
 * same-orientation links overlap by only twice the wire radius. Alternating
 * links are rotated about the chain's own axis (X), keeping their long axis
 * along the chain — rotating them about Y instead points the long axis across
 * the chain, which never threads through the neighbouring link at all and
 * forced a pitch tight enough to fuse the links into a solid rail.
 */
const SPACING = ARM_LENGTH / 2 + ARM_RADIUS;
/** Half the chain's resting length, used to shape the arc below. */
const HALF_SPAN = LINKS_PER_SIDE * SPACING;
/**
 * Gentle catenary sag, plus a small alternating roll per link.
 *
 * Interlocking links must overlap along the chain's axis, so a perfectly
 * straight chain has every same-orientation link's straight sides collinear —
 * their union becomes one unbroken rail and the whole thing reads as a rod
 * with rings threaded on. Real chain never hangs that way. Breaking the
 * collinearity is what makes it read as links.
 */
const SAG = 0.16;
const ROLL = 0.07;

const CAMERA_FOV = 22;
/**
 * How much slack to leave around the fitted bounds. Above ~1 this doubles as
 * the anti-clipping headroom; well above it, it's what stops a short chain
 * from filling the whole band and reading as a chunky close-up.
 */
const FIT_MARGIN = 1.35;

/** Piecewise-linear interpolation with clamping, keyframe-style. */
function mapRange(t: number, stops: [number, number][]): number {
  if (t <= stops[0][0]) return stops[0][1];
  const last = stops[stops.length - 1];
  if (t >= last[0]) return last[1];
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, v0] = stops[i];
    const [t1, v1] = stops[i + 1];
    if (t >= t0 && t <= t1) return v0 + ((t - t0) / (t1 - t0)) * (v1 - v0);
  }
  return last[1];
}

type LinkHandle = {
  mesh: THREE.Mesh;
  /** Resting pose along the arc, animation is layered on top of these. */
  baseY: number;
  baseRotZ: number;
  baseRotX: number;
  /** -1 for links left of the break, +1 for links right of it. */
  side: number;
  /** 0 at the break, 1 at the chain's outer ends. */
  dist: number;
  baseX: number;
  /** 0 = flat to camera, 1 = turned 90° — alternates to read as interlocked. */
  parity: number;
  /** Which way this link drifts vertically as the chain comes apart. */
  ySign: number;
};

type BreakHalfHandle = {
  mesh: THREE.Mesh;
  side: -1 | 1;
};

export function ChainScene({
  progress,
  animate,
  className,
}: {
  progress: MotionValue<number>;
  animate: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Always starts false on both server and client so the first hydrated
  // render is structurally identical either way — a lazy initializer that
  // called hasWebGL() here would resolve differently client-side than the
  // server's "unknown" case whenever WebGL is genuinely unavailable,
  // producing exactly the hydration mismatch this pattern is meant to avoid
  // (the same bug class fixed in Reveal). The capability check happens
  // inside the effect below instead, alongside the render-failure check.
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || failed) return;

    if (!hasWebGL()) {
      queueMicrotask(() => setFailed(true));
      return;
    }

    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    let resizeObserver: ResizeObserver | undefined;

    try {
      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 200);
      camera.position.set(0, 0, 10);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);

      // Context loss happens after successful setup (GPU driver reset, tab
      // backgrounding on some platforms) — not a thrown exception, so the
      // try/catch below can't see it. Without this the canvas would just
      // freeze on its last frame with nothing logged anywhere.
      const onContextLost = (event: Event) => {
        event.preventDefault();
        console.error("[ChainScene] WebGL context lost");
        Sentry.captureMessage("chain-scene: WebGL context lost", "warning");
      };
      renderer.domElement.addEventListener("webglcontextlost", onContextLost);

      // Studio-style image-based lighting for realistic metal reflections,
      // generated procedurally so there's no external HDRI file to fetch.
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

      const key = new THREE.DirectionalLight(0xffffff, 2.4);
      key.position.set(4, 5, 6);
      scene.add(key);

      const rim = new THREE.DirectionalLight(0x9fc8ff, 1.6);
      rim.position.set(-6, -2, -4);
      scene.add(rim);

      const fill = new THREE.AmbientLight(0xffffff, 0.35);
      scene.add(fill);

      // MeshStandardMaterial rather than MeshPhysicalMaterial: no clearcoat
      // layer means one fewer shader permutation to compile, which matters
      // because a shader compile failure on some GPU/driver combination is
      // the most likely way this scene silently fails for a given visitor.
      // Visually near-identical for a satin steel look; meaningfully safer.
      const steel = new THREE.MeshStandardMaterial({
        color: 0xcfd2d6,
        metalness: 1,
        roughness: 0.38,
        envMapIntensity: 1.15,
      });

      const closedGeometry = makeTube(0, PERIMETER, true);
      const rightHalfGeometry = makeTube(D_BOTTOM_MID, ARC + ARM_LENGTH, false);
      const leftHalfGeometry = makeTube(D_TOP_MID, ARC + ARM_LENGTH, false);

      const group = new THREE.Group();
      scene.add(group);

      const links: LinkHandle[] = [];
      const breakHalves: BreakHalfHandle[] = [];

      for (let i = 0; i < LINK_COUNT; i++) {
        const baseX = (i - MID) * SPACING;
        // Parity is measured from the break, not from index 0, so the
        // interlock pattern stays symmetric around it and the broken link
        // itself sits flat to the camera where the split is most readable.
        const parity = Math.abs(i - MID) % 2;
        const side = i < MID ? -1 : i > MID ? 1 : 0;
        const dist = Math.abs(i - MID) / MID;
        const ySign = i % 2 === 0 ? -1 : 1;

        // Shallow arc: lowest at the break, rising toward both ends.
        const t = baseX / HALF_SPAN;
        const baseY = -SAG * (1 - t * t);
        // Tangent of that arc, so links sit along the curve rather than
        // hanging off it at an angle.
        const baseRotZ = Math.atan((2 * SAG * baseX) / (HALF_SPAN * HALF_SPAN));
        // Alternating quarter turn about the chain's axis is what interlocks
        // the links, plus a slight roll so the chain isn't machine-perfect.
        const baseRotX =
          (parity === 1 ? Math.PI / 2 : 0) + (i % 2 === 0 ? 1 : -1) * ROLL;

        if (i === MID) {
          // The break: two open half-tubes instead of one closed ring.
          // Both are centered at 0 by construction (MID sits at the chain's
          // exact center), so no base offset is needed here.
          for (const half of [-1, 1] as const) {
            const mesh = new THREE.Mesh(
              half === 1 ? rightHalfGeometry : leftHalfGeometry,
              steel,
            );
            group.add(mesh);
            breakHalves.push({ mesh, side: half });
          }
          continue;
        }

        const mesh = new THREE.Mesh(closedGeometry, steel);
        mesh.position.x = baseX;
        group.add(mesh);
        links.push({
          mesh,
          side,
          dist,
          baseX,
          parity,
          ySign,
          baseY,
          baseRotZ,
          baseRotX,
        });
      }

      /** Places every piece for a given scroll progress. */
      function applyTransforms(p: number) {
        const ramp = mapRange(p, [
          [0, 0],
          [0.12, 0],
          [1, 1],
        ]);

        group.rotation.x = -0.14;
        group.rotation.y = p * 0.18;

        for (const link of links) {
          const spin = link.side;
          link.mesh.position.x = link.baseX + spin * link.dist * 2.2 * ramp;
          link.mesh.position.y = link.baseY + link.ySign * link.dist * 0.35 * ramp;
          link.mesh.position.z =
            link.dist * 0.5 * ramp * (link.parity === 0 ? 1 : -1);
          link.mesh.rotation.z =
            link.baseRotZ + spin * (0.3 + link.dist * 1.6) * ramp;
          link.mesh.rotation.x =
            link.baseRotX +
            link.dist * 0.45 * ramp * (link.parity === 0 ? 1 : -1);
        }

        for (const half of breakHalves) {
          const hinge = mapRange(p, [
            [0, 0],
            [0.35, 1],
            [1, 1],
          ]);
          const fly = mapRange(p, [
            [0.3, 0],
            [1, 1],
          ]);
          half.mesh.rotation.z = half.side * (0.55 * hinge + 1.7 * fly);
          half.mesh.position.x = half.side * (0.35 * hinge + 2.0 * fly);
          half.mesh.position.y = -SAG + half.side * (-0.12 * hinge - 0.3 * fly);
          half.mesh.position.z = 0.15 * hinge + 0.35 * fly;
        }
      }

      const bounds = new THREE.Box3();

      /** Half-width of the chain at rest, measured once from real geometry. */
      applyTransforms(0);
      group.updateMatrixWorld(true);
      bounds.setFromObject(group);
      const restHalfWidth = Math.max(
        Math.abs(bounds.min.x),
        Math.abs(bounds.max.x),
      );

      /**
       * Pulls the camera back far enough that the chain's *actual* bounding
       * box fits the viewport — measured from the geometry rather than
       * guessed from a constant. A rotating link's vertical footprint peaks
       * near sqrt(halfLength² + halfHeight²), roughly 1.8x its resting
       * height, which a fixed allowance underestimates; that overflow was
       * what clipped the chain against the bottom edge mid-animation.
       *
       * Height is fitted to the live bounds so nothing is ever cut off.
       * Width is fitted only to the resting width, so pieces are free to fly
       * out past the left and right edges — leaving frame sideways reads as
       * intended, being sliced off at the bottom does not.
       */
      function fitCamera() {
        group.updateMatrixWorld(true);
        bounds.setFromObject(group);

        const halfHeight =
          Math.max(Math.abs(bounds.min.y), Math.abs(bounds.max.y)) * FIT_MARGIN;
        const halfWidth = restHalfWidth * FIT_MARGIN;

        const tanHalfFov = Math.tan((camera.fov * Math.PI) / 360);
        const forHeight = halfHeight / tanHalfFov;
        const forWidth = halfWidth / (tanHalfFov * camera.aspect);

        // Measured from the frontmost geometry, since pieces travel toward
        // the camera as they scatter.
        camera.position.z = bounds.max.z + Math.max(forHeight, forWidth);
        camera.updateProjectionMatrix();
      }

      let lastProgress = animate ? progress.get() : 0;

      function render(p: number) {
        lastProgress = p;
        applyTransforms(p);
        fitCamera();
        renderer.render(scene, camera);
      }

      function resize() {
        const rect = container!.getBoundingClientRect();
        const width = Math.max(1, rect.width);
        const height = Math.max(1, rect.height);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        // Re-fit at the current scroll position, not a reset one.
        render(lastProgress);
      }

      resize();
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);

      if (animate) {
        unsubscribe = progress.on("change", (v) => {
          if (!disposed) render(v);
        });
      }

      return () => {
        disposed = true;
        unsubscribe?.();
        resizeObserver?.disconnect();
        renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
        container!.removeChild(renderer.domElement);
        closedGeometry.dispose();
        rightHalfGeometry.dispose();
        leftHalfGeometry.dispose();
        steel.dispose();
        scene.environment?.dispose();
        pmrem.dispose();
        renderer.dispose();
      };
    } catch (error) {
      // Logged directly, not just to Sentry, so the exact failure is visible
      // in devtools without needing dashboard access.
      console.error("[ChainScene] falling back — WebGL setup failed:", error);
      Sentry.captureException(error, { tags: { component: "chain-scene" } });
      // Deferred so this reads as reacting to the failure, not a synchronous
      // setState-during-effect (which react-hooks/set-state-in-effect flags).
      queueMicrotask(() => setFailed(true));
      return;
    }
    // progress is a stable MotionValue instance for the component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, failed]);

  if (failed) {
    // Sized the same as the real canvas would be (`className` carries the
    // height/width utilities from Hero), with the visible mark nested inside
    // rather than merged into the same class string — concatenating classes
    // onto one element let Tailwind's cascade silently override the intended
    // "thin line" look with the container's full h-56/h-80 sizing instead,
    // producing a plain gray box instead of a subtle divider.
    return (
      <div aria-hidden="true" className={`flex items-center justify-center ${className ?? ""}`}>
        <div className="h-px w-2/3 bg-gradient-to-r from-transparent via-line-strong to-transparent" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="presentation"
      aria-hidden="true"
      className={className}
    />
  );
}
