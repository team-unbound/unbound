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

const ARM_LENGTH = 0.62;
const ARM_RADIUS = 0.42;
const TUBE_RADIUS = 0.155;
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

const LINK_COUNT = 17;
const MID = Math.floor(LINK_COUNT / 2); // deliberately even -> faces the camera flat
const SPACING = 0.46;
const CHAIN_WIDTH = (LINK_COUNT - 1) * SPACING + ARM_LENGTH + 2 * ARM_RADIUS + 2 * TUBE_RADIUS;

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
  /** -1 for links left of the break, +1 for links right of it. */
  side: number;
  /** 0 at the break, 1 at the chain's outer ends. */
  dist: number;
  baseX: number;
  parity: number;
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
  // Computed lazily so it reflects the real client the moment this renders,
  // rather than needing a post-mount setState just to react to it.
  const [failed, setFailed] = useState(
    () => typeof window !== "undefined" && !hasWebGL(),
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || failed) return;

    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    let resizeObserver: ResizeObserver | undefined;

    try {
      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
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

      const steel = new THREE.MeshPhysicalMaterial({
        color: 0xcfd2d6,
        metalness: 1,
        roughness: 0.36,
        clearcoat: 0.2,
        clearcoatRoughness: 0.3,
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
        const parity = i % 2;
        const side = i < MID ? -1 : i > MID ? 1 : 0;
        const dist = Math.abs(i - MID) / MID;

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
        // Alternating orientation is what makes adjacent links read as
        // interlocked rather than stacked flat.
        if (parity === 1) mesh.rotation.y = Math.PI / 2;
        group.add(mesh);
        links.push({ mesh, side, dist, baseX, parity });
      }

      const size = new THREE.Vector2();
      function resize() {
        const rect = container!.getBoundingClientRect();
        const width = Math.max(1, rect.width);
        const height = Math.max(1, rect.height);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;

        // Fit the chain's world-space width into the viewport at any aspect.
        const vFov = (camera.fov * Math.PI) / 180;
        const margin = 1.3;
        const desiredWidth = CHAIN_WIDTH * margin;
        const distanceForWidth = desiredWidth / (2 * Math.tan(vFov / 2) * camera.aspect);
        const distanceForHeight = ARM_RADIUS * 6 / (2 * Math.tan(vFov / 2));
        camera.position.z = Math.max(distanceForWidth, distanceForHeight, 6);
        camera.updateProjectionMatrix();

        renderer.getSize(size);
      }
      resize();
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);

      function render(p: number) {
        const ramp = mapRange(p, [
          [0, 0],
          [0.12, 0],
          [1, 1],
        ]);

        group.rotation.y = p * 0.18;

        for (const link of links) {
          const spin = link.side;
          link.mesh.position.x =
            link.baseX + spin * link.dist * 2.6 * ramp;
          link.mesh.position.y =
            (link.parity === 0 ? -1 : 1) * link.dist * 0.85 * ramp;
          link.mesh.position.z = link.dist * 1.1 * ramp * (link.parity === 0 ? 1 : -1);
          link.mesh.rotation.z = spin * (0.25 + link.dist * 2.1) * ramp;
          link.mesh.rotation.x = link.dist * 0.5 * ramp * (link.parity === 0 ? 1 : -1);
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
          half.mesh.rotation.z = half.side * (0.55 * hinge + 2.1 * fly);
          half.mesh.position.x = half.side * (0.35 * hinge + 2.3 * fly);
          half.mesh.position.y = half.side * (-0.12 * hinge - 0.7 * fly);
          half.mesh.position.z = 0.15 * hinge + 0.5 * fly;
        }

        renderer.render(scene, camera);
      }

      render(animate ? progress.get() : 0);


      if (animate) {
        unsubscribe = progress.on("change", (v) => {
          if (!disposed) render(v);
        });
      }

      return () => {
        disposed = true;
        unsubscribe?.();
        resizeObserver?.disconnect();
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
    return (
      <div
        aria-hidden="true"
        className={`h-px w-2/3 bg-gradient-to-r from-transparent via-line-strong to-transparent ${className ?? ""}`}
      />
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
