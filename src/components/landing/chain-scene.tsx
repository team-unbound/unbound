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
const FIT_MARGIN = 1.18;
/**
 * Vertical room reserved up front for the break, on top of the resting fit.
 * Paid once in the static framing rather than by zooming out mid-animation.
 */
const BREAK_HEADROOM = 1.08;

/* ------------------------------------------------------------------ */
/* Break physics                                                       */
/* ------------------------------------------------------------------ */

/** Scroll position where the strained link finally lets go. */
const SNAP_AT = 0.2;
/** How much scroll the fall plays out over after the snap. */
const FALL_SPAN = 0.7;
/** Links further from the break let go later, as the slack runs out. */
const STAGGER = 0.09;
/** Uniform outward recoil of each half once the link parts. */
const RECOIL = 2.3;
/** Small upward flick at the moment of release, before gravity wins. */
const KICK = 0.07;
/**
 * Downward acceleration applied as t², so pieces arc rather than fly flat.
 * Kept modest, and the tumble below is biased toward the X and Y axes:
 * rotation about Z swings a link's long axis toward vertical and roughly
 * doubles its silhouette height, which is what would push pieces through the
 * top and bottom of a fixed frame. X and Y turn that length into depth
 * instead, so pieces can tumble freely without growing vertically.
 */
const FALL = 0.22;
/**
 * How far each half turns as it falls. Applied about the half's own centre of
 * mass, not its outer end: nothing anchors this chain, so a free fragment
 * rotates about its centroid. Pivoting at the end instead drags every link
 * toward that end as the angle opens up, folding the half into a bunch.
 */
const SWING = 0.2;
/** Centroid of one half's links, measured from the break. */
const HALF_CENTROID = (SPACING * (LINKS_PER_SIDE + 1)) / 2;

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Fast initial movement, decelerating — recoil bleeding off. */
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function smoothstep(t: number) {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
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
  /** Deterministic per-link variation so pieces don't tumble in unison. */
  phase: number;
  /** Extra delay before this link lets go, measured from the break outward. */
  release: number;
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
        // Deterministic spread of tumble rates, and a release delay that
        // travels outward from the break as the slack runs out.
        const phase = (((i * 7) % 5) / 4 - 0.5) * 2;
        const release = dist * STAGGER;

        if (i === MID) {
          // The break: two open half-tubes instead of one closed ring.
          // Both are centered at 0 by construction (MID sits at the chain's
          // exact center), so no base offset is needed here.
          for (const half of [-1, 1] as const) {
            const mesh = new THREE.Mesh(
              half === 1 ? rightHalfGeometry : leftHalfGeometry,
              steel,
            );
            mesh.rotation.order = "ZYX";
            group.add(mesh);
            breakHalves.push({ mesh, side: half });
          }
          continue;
        }

        const mesh = new THREE.Mesh(closedGeometry, steel);
        mesh.position.x = baseX;
        // ZYX so the link's own quarter-turn about X is applied first and the
        // swing about Z acts in world space. Three's default XYZ order applies
        // Z first, which for the alternating (already X-tipped) links swung
        // them about the wrong axis and twisted the half out of formation.
        mesh.rotation.order = "ZYX";
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
          phase,
          release,
        });
      }

      /** Places every piece for a given scroll progress. */
      /**
       * Places every piece for a given scroll progress, in three stages that
       * follow how chain actually fails under load:
       *
       *  1. Strain — the chain pulls taut, its sag flattening out, while the
       *     weakest link stretches and its two sides bow apart. Nothing has
       *     separated yet.
       *  2. Snap — that link lets go. Both halves recoil away from the break
       *     hard and fast, then decelerate (easeOutCubic).
       *  3. Fall — gravity takes over as an accelerating t² term, so pieces
       *     arc downward rather than flying straight out, tumbling as they
       *     go. Links release progressively outward from the break, so the
       *     chain comes apart as a travelling wave rather than in unison.
       */
      function applyTransforms(p: number) {
        const strain = smoothstep(p / SNAP_AT);

        group.rotation.x = -0.14;
        group.rotation.y = p * 0.14;

        // The half translates as one body, so it keeps its shape. Staggering
        // the translation instead makes the inner links — released first —
        // travel further outward than the outer ones and catch up with them,
        // compressing the half into a bunch. The stagger belongs on the
        // tumble, where it reads as pieces moving individually.
        const tBody = clamp01((p - SNAP_AT) / FALL_SPAN);
        const bodyRecoil = easeOutCubic(tBody);
        const bodyGravity = tBody * tBody;
        const bodyTurn = 0.3 * bodyRecoil + 0.7 * bodyGravity;

        for (const link of links) {
          const tl = clamp01((p - SNAP_AT - link.release) / FALL_SPAN);
          const jitter = 0.3 * easeOutCubic(tl) + 0.7 * tl * tl;

          // Taut before the break: the arc flattens and links creep apart.
          const straighten = 1 - 0.75 * strain;
          const stretch = link.side * link.dist * 0.06 * strain;

          // Rotation about the half's own centre of mass — nothing anchors
          // this chain, so a free fragment turns about its centroid.
          const swing = link.side * SWING * bodyTurn;
          const pivotX = link.side * HALF_CENTROID;
          const dx = link.baseX + stretch - pivotX;
          const dy = link.baseY * straighten;
          const sin = Math.sin(swing);
          const cos = Math.cos(swing);

          link.mesh.position.x =
            pivotX + dx * cos - dy * sin + link.side * RECOIL * bodyRecoil;
          link.mesh.position.y =
            dx * sin +
            dy * cos +
            KICK * bodyRecoil -
            FALL * bodyGravity +
            link.phase * 0.1 * jitter;
          link.mesh.position.z = link.phase * 0.22 * bodyRecoil;

          link.mesh.rotation.z = link.baseRotZ + swing + link.phase * 0.1 * jitter;
          link.mesh.rotation.x = link.baseRotX + link.phase * 1.5 * jitter;
          link.mesh.rotation.y = link.phase * 1.1 * (tl * tl);
        }

        for (const half of breakHalves) {
          const tl = clamp01((p - SNAP_AT) / FALL_SPAN);
          const jitter = 0.3 * easeOutCubic(tl) + 0.7 * tl * tl;
          const straighten = 1 - 0.75 * strain;

          // The failing link stretches and bows open before it parts, then
          // releases back to its own shape once it has separated.
          half.mesh.scale.x = 1 + 0.16 * strain * (1 - tl);

          // Each snapped end is still threaded through its neighbour, so it
          // travels with its own half rather than flying off ahead of it —
          // giving it a larger recoil made it overtake and land on top of the
          // links it is supposed to be attached to.
          const swing = half.side * SWING * bodyTurn;
          const pivotX = half.side * HALF_CENTROID;
          const dx = -pivotX;
          const dy = -SAG * straighten;
          const sin = Math.sin(swing);
          const cos = Math.cos(swing);
          // The small extra push that the two ends give each other as the
          // metal lets go.
          const spring = half.side * (0.14 * strain + 0.6 * bodyRecoil);

          half.mesh.position.x =
            pivotX + dx * cos - dy * sin + half.side * RECOIL * bodyRecoil + spring;
          half.mesh.position.y =
            dx * sin + dy * cos + KICK * bodyRecoil - FALL * bodyGravity;
          half.mesh.position.z = 0.18 * bodyRecoil;

          half.mesh.rotation.z =
            swing + half.side * (0.5 * strain + 0.3 * bodyTurn);
          half.mesh.rotation.x = -ROLL + half.side * 1.9 * jitter;
          half.mesh.rotation.y = half.side * 0.9 * (tl * tl);
        }
      }

      const bounds = new THREE.Box3();

      // Rest pose measured once from real geometry — the camera is framed
      // against this and nothing else.
      applyTransforms(0);
      group.updateMatrixWorld(true);
      bounds.setFromObject(group);
      const restHalfWidth = Math.max(
        Math.abs(bounds.min.x),
        Math.abs(bounds.max.x),
      );
      const restHalfHeight = Math.max(
        Math.abs(bounds.min.y),
        Math.abs(bounds.max.y),
      );
      const restMaxZ = bounds.max.z;

      /**
       * Frames the chain once, against its resting bounds only.
       *
       * This deliberately does NOT track the live bounds. Refitting per frame
       * meant that as the pieces flew apart the bounding box grew and the
       * camera retreated to keep up, so the chain steadily shrank through the
       * break — an apparent zoom-out nobody asked for, produced as a side
       * effect of the motion. The frame is now constant for a given viewport,
       * so apparent size is constant too; BREAK_HEADROOM reserves the extra
       * vertical room the break needs up front instead of chasing it.
       */
      function fitCamera() {
        const halfHeight = restHalfHeight * FIT_MARGIN * BREAK_HEADROOM;
        const halfWidth = restHalfWidth * FIT_MARGIN;

        const tanHalfFov = Math.tan((camera.fov * Math.PI) / 360);
        const forHeight = halfHeight / tanHalfFov;
        const forWidth = halfWidth / (tanHalfFov * camera.aspect);

        camera.position.z = restMaxZ + Math.max(forHeight, forWidth);
        camera.updateProjectionMatrix();
      }

      let lastProgress = animate ? progress.get() : 0;

      function render(p: number) {
        lastProgress = p;
        applyTransforms(p);
        renderer.render(scene, camera);
      }

      function resize() {
        const rect = container!.getBoundingClientRect();
        const width = Math.max(1, rect.width);
        const height = Math.max(1, rect.height);
        // updateStyle left on (the third argument defaults to true): with it
        // suppressed the canvas got a backing store of width*devicePixelRatio
        // but no CSS width, so it laid out at its bitmap size in CSS pixels —
        // i.e. correct only on a DPR-1 display. Every phone is DPR 2-3, which
        // rendered the chain at 2-3x inside an overflow-hidden panel: the frame
        // was right, the canvas showing it was two viewports wide.
        renderer.setSize(width, height);
        camera.aspect = width / height;
        // Framing depends on aspect, so it is recomputed here and only here.
        fitCamera();
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
