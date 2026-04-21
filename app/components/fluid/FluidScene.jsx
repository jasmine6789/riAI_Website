"use client";

/**
 * Canvas sized to the video frame only: VideoTexture plane + EffectComposer + Fluid.
 * showBackground=false so no extra tint layer — site background matches rest of page.
 * Library still uses window pointermove for splats.
 */

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { Fluid } from "@whatisjery/react-fluid-distortion";
import FluidVideoPlane from "./FluidVideoPlane";

const EXAMPLE3_FLUID = {
  radius: 0.03,
  curl: 10,
  swirl: 5,
  distortion: 1,
  force: 2,
  pressure: 0.94,
  densityDissipation: 0.98,
  velocityDissipation: 0.99,
  intensity: 0.3,
  rainbow: false,
  blend: 0,
  showBackground: false,
  backgroundColor: "#a7958b",
  fluidColor: "#cfc0a8",
};

export default function FluidScene({ videoRef }) {
  return (
    <Canvas
      className="owl-fluid-canvas"
      dpr={[1, 1.5]}
      gl={{
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
        stencil: false,
      }}
      camera={{ position: [0, 0, 1.25], fov: 38, near: 0.01, far: 50 }}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <Suspense fallback={null}>
        <FluidVideoPlane videoRef={videoRef} />
      </Suspense>
      <EffectComposer enableNormalPass={false} multisampling={0}>
        <Fluid {...EXAMPLE3_FLUID} />
      </EffectComposer>
    </Canvas>
  );
}
