"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import revealVertex from "./shaders/revealVertex.glsl";
import revealFragment from "./shaders/revealFragment.glsl";

export default function RevealPlane({
  maskTextureRef,
  pointerRef,
  velocityRef,
  hiddenLayerSrc,
  topLayerSrc,
  distortionStrength = 0.09,
  edgeGlow = 0.14,
  topTextureScale = 8.0,
  topLayerOpacity = 0.68,
}) {
  const { viewport, size } = useThree();
  const materialRef = useRef(null);
  const [topTexture, bottomTexture] = useTexture([topLayerSrc, hiddenLayerSrc]);

  useEffect(() => {
    [topTexture, bottomTexture].forEach((texture, index) => {
      if (!texture) return;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.wrapS = index === 0 ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
      texture.wrapT = index === 0 ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    });
  }, [topTexture, bottomTexture]);

  const uniforms = useMemo(
    () => ({
      uMaskTex: { value: null },
      uTopTex: { value: topTexture || null },
      uBottomTex: { value: bottomTexture || null },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uVelocity: { value: new THREE.Vector2(0, 0) },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uDistortionStrength: { value: distortionStrength },
      uEdgeGlow: { value: edgeGlow },
      uTopTextureScale: { value: topTextureScale },
      uTopLayerOpacity: { value: topLayerOpacity },
      uBottomAspect: { value: 1 },
    }),
    [bottomTexture, distortionStrength, edgeGlow, topLayerOpacity, topTexture, topTextureScale],
  );

  const bottomAspectRef = useRef(0);
  useEffect(() => {
    const img = bottomTexture?.image;
    if (!img?.width) return;
    bottomAspectRef.current = img.width / Math.max(1, img.height);
  }, [bottomTexture]);

  useFrame((_, delta) => {
    const mat = materialRef.current;
    if (!mat) return;
    if (bottomAspectRef.current > 0) {
      mat.uniforms.uBottomAspect.value = bottomAspectRef.current;
    }
    mat.uniforms.uResolution.value.set(size.width, size.height);
    mat.uniforms.uTime.value += delta;
    mat.uniforms.uMaskTex.value = maskTextureRef.current?.texture ?? null;
    mat.uniforms.uPointer.value.copy(pointerRef.current);
    mat.uniforms.uVelocity.value.copy(velocityRef.current);
    mat.uniforms.uDistortionStrength.value = distortionStrength;
    mat.uniforms.uEdgeGlow.value = edgeGlow;
    mat.uniforms.uTopTextureScale.value = topTextureScale;
    mat.uniforms.uTopLayerOpacity.value = topLayerOpacity;
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]} frustumCulled={false}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={revealVertex}
        fragmentShader={revealFragment}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
      />
    </mesh>
  );
}
