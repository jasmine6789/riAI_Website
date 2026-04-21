"use client";

import { Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

import RevealPlane from "./RevealPlane";
import useSmoothPointer from "./useSmoothPointer";
import usePingPongMask from "./usePingPongMask";
import { LIGHTBG2_TEXTURE } from "./framer/Lightbg2Vendored";

function FluidRevealScene({
  hiddenLayerSrc,
  topLayerSrc,
  pointerLag,
  velocityLag,
  simScale,
  trailDecay,
  revealSize,
  revealSoftness,
  noiseAmount,
  advection,
  velocityStretch,
  velocityGain,
  autoStrength,
  autoTravelMin,
  autoTravelMax,
  autoLingerSeconds,
  autoFadeSeconds,
  autoZonePadding,
  autoZoneSpread,
  distortionStrength,
  edgeGlow,
  topTextureScale,
  topLayerOpacity,
}) {
  const pointer = useSmoothPointer({
    lag: pointerLag,
    velocityLag,
  });

  const mask = usePingPongMask({
    scale: simScale,
    decay: trailDecay,
    brushRadius: revealSize,
    softness: revealSoftness,
    noiseAmount,
    advection,
    velocityStretch,
    velocityGain,
    autoStrength,
    autoTravelMin,
    autoTravelMax,
    autoLingerSeconds,
    autoFadeSeconds,
    autoZonePadding,
    autoZoneSpread,
  });

  useFrame((state, delta) => {
    pointer.advance(delta);
    mask.step({
      pointer: pointer.currentRef.current,
      velocity: pointer.velocityRef.current,
      delta,
      time: state.clock.elapsedTime,
      active: pointer.activeRef.current,
    });
  });

  return (
    <RevealPlane
      maskTextureRef={mask.textureRef}
      pointerRef={pointer.currentRef}
      velocityRef={pointer.velocityRef}
      hiddenLayerSrc={hiddenLayerSrc}
      topLayerSrc={topLayerSrc}
      distortionStrength={distortionStrength}
      edgeGlow={edgeGlow}
      topTextureScale={topTextureScale}
      topLayerOpacity={topLayerOpacity}
    />
  );
}

export default function FluidRevealBackground({
  className,
  hiddenLayerSrc = "/Hiddenlayer.png",
  topLayerSrc = LIGHTBG2_TEXTURE,
  pointerLag = 0.115,
  velocityLag = 0.18,
  simScale = 0.45,
  trailDecay = 0.975,
  revealSize = 0.122,
  revealSoftness = 0.11,
  noiseAmount = 0.07,
  advection = 1.0,
  velocityStretch = 0.9,
  velocityGain = 0.7,
  autoStrength = 2.5,
  autoTravelMin = 2.8,
  autoTravelMax = 6.4,
  autoLingerSeconds = 3.0,
  autoFadeSeconds = 0.9,
  autoZonePadding = 0.08,
  autoZoneSpread = 0.1,
  distortionStrength = 0.09,
  edgeGlow = 0.14,
  topTextureScale = 8,
  topLayerOpacity = 0.68,
}) {
  return (
    <div className={className} aria-hidden="true">
      <Canvas
        orthographic
        camera={{ position: [0, 0, 5], zoom: 100, near: 0.1, far: 20 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
        }}
      >
        <Suspense fallback={null}>
          <FluidRevealScene
            hiddenLayerSrc={hiddenLayerSrc}
            topLayerSrc={topLayerSrc}
            pointerLag={pointerLag}
            velocityLag={velocityLag}
            simScale={simScale}
            trailDecay={trailDecay}
            revealSize={revealSize}
            revealSoftness={revealSoftness}
            noiseAmount={noiseAmount}
            advection={advection}
            velocityStretch={velocityStretch}
            velocityGain={velocityGain}
            autoStrength={autoStrength}
            autoTravelMin={autoTravelMin}
            autoTravelMax={autoTravelMax}
            autoLingerSeconds={autoLingerSeconds}
            autoFadeSeconds={autoFadeSeconds}
            autoZonePadding={autoZonePadding}
            autoZoneSpread={autoZoneSpread}
            distortionStrength={distortionStrength}
            edgeGlow={edgeGlow}
            topTextureScale={topTextureScale}
            topLayerOpacity={topLayerOpacity}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
