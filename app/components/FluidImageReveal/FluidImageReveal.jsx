"use client";

import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

import vertexShader from "./shader/vertex.glsl";
import fragmentShader from "./shader/fragment.glsl";

const defaultBase = "/1imagelanding.jpg";
const defaultReveal = "/2imagelanding.jpg";

function FluidRevealPlane({
  baseImage,
  revealImage,
  revealRadius,
  noiseIntensity,
  distortionStrength,
  glowIntensity,
  chromaStrength,
  lerpFactor,
  speedRevealScale,
  mouseRef,
}) {
  const meshRef = useRef(null);
  const materialRef = useRef(null);
  const { viewport, size } = useThree();

  const loaded = useTexture([baseImage, revealImage]);
  const t1 = loaded[0];
  const t2 = loaded[1];

  useLayoutEffect(() => {
    for (const t of [t1, t2]) {
      if (!t) continue;
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.generateMipmaps = true;
    }
  }, [t1, t2]);

  const uniforms = useMemo(
    () => ({
      uTexture1: { value: null },
      uTexture2: { value: null },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uRevealRadius: { value: revealRadius },
      uNoiseIntensity: { value: noiseIntensity },
      uDistortionStrength: { value: distortionStrength },
      uGlowIntensity: { value: glowIntensity },
      uChromaStrength: { value: chromaStrength },
      uVelocity: { value: 0 },
    }),
    [],
  );

  useEffect(() => {
    uniforms.uTexture1.value = t1;
    uniforms.uTexture2.value = t2;
  }, [t1, t2, uniforms]);

  useEffect(() => {
    uniforms.uRevealRadius.value = revealRadius;
  }, [revealRadius, uniforms]);
  useEffect(() => {
    uniforms.uNoiseIntensity.value = noiseIntensity;
  }, [noiseIntensity, uniforms]);
  useEffect(() => {
    uniforms.uDistortionStrength.value = distortionStrength;
  }, [distortionStrength, uniforms]);
  useEffect(() => {
    uniforms.uGlowIntensity.value = glowIntensity;
  }, [glowIntensity, uniforms]);
  useEffect(() => {
    uniforms.uChromaStrength.value = chromaStrength;
  }, [chromaStrength, uniforms]);

  const targetMouse = useRef(new THREE.Vector2(0.5, 0.5));
  const currentMouse = useRef(new THREE.Vector2(0.5, 0.5));
  const prevMouse = useRef(new THREE.Vector2(0.5, 0.5));
  const smoothedSpeed = useRef(0);

  useFrame((_, delta) => {
    const mat = materialRef.current;
    if (!mat) return;

    const w = Math.max(size.width, 1);
    const h = Math.max(size.height, 1);
    mat.uniforms.uResolution.value.set(w, h);

    targetMouse.current.copy(mouseRef.current);
    currentMouse.current.lerp(targetMouse.current, Math.min(1, lerpFactor * (delta > 0 ? 60 * delta : 1)));

    const dx = currentMouse.current.x - prevMouse.current.x;
    const dy = currentMouse.current.y - prevMouse.current.y;
    const inst = Math.sqrt(dx * dx + dy * dy);
    smoothedSpeed.current = THREE.MathUtils.lerp(smoothedSpeed.current, inst * 80, 0.08);
    prevMouse.current.copy(currentMouse.current);

    mat.uniforms.uMouse.value.copy(currentMouse.current);
    mat.uniforms.uTime.value += delta;
    mat.uniforms.uVelocity.value = THREE.MathUtils.clamp(smoothedSpeed.current * speedRevealScale, 0, 1);
  });

  const w = viewport.width;
  const h = viewport.height;

  return (
    <mesh ref={meshRef} scale={[w, h, 1]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        key={`${baseImage}-${revealImage}`}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        toneMapped={false}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

function Scene(props) {
  return <FluidRevealPlane {...props} />;
}

/**
 * Full-viewport fluid image reveal (cursor-driven, noise-shaped mask).
 * Mount only on client (parent handles SSR placeholder).
 */
function FluidImageRevealCanvas(props) {
  const {
    baseImage = defaultBase,
    revealImage = defaultReveal,
    className,
    style,
    dpr = [1, 2],
    revealRadius = 0.2,
    noiseIntensity = 0.14,
    distortionStrength = 0.04,
    glowIntensity = 0.45,
    chromaStrength = 1.0,
    lerpFactor = 0.1,
    speedRevealScale = 1.0,
  } = props;

  const wrapRef = useRef(null);
  const mouseRef = useRef(new THREE.Vector2(0.5, 0.5));

  const onPointerMove = useCallback((e) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / Math.max(r.width, 1);
    const y = 1 - (e.clientY - r.top) / Math.max(r.height, 1);
    mouseRef.current.set(THREE.MathUtils.clamp(x, 0, 1), THREE.MathUtils.clamp(y, 0, 1));
  }, []);

  const onPointerLeave = useCallback(() => {
    mouseRef.current.set(0.5, 0.5);
  }, []);

  return (
    <div
      ref={wrapRef}
      role="presentation"
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        touchAction: "none",
        ...style,
      }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <Canvas
        orthographic
        camera={{ position: [0, 0, 10], zoom: 100, near: 0.1, far: 1000 }}
        dpr={dpr}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <Suspense fallback={null}>
          <Scene
            baseImage={baseImage}
            revealImage={revealImage}
            revealRadius={revealRadius}
            noiseIntensity={noiseIntensity}
            distortionStrength={distortionStrength}
            glowIntensity={glowIntensity}
            chromaStrength={chromaStrength}
            lerpFactor={lerpFactor}
            speedRevealScale={speedRevealScale}
            mouseRef={mouseRef}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default function FluidImageReveal({
  fullScreen = true,
  wrapperClassName,
  wrapperStyle,
  ...canvasProps
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const outerStyle = {
    position: fullScreen ? "fixed" : "relative",
    inset: fullScreen ? 0 : undefined,
    width: "100%",
    height: fullScreen ? "100vh" : "100%",
    minHeight: fullScreen ? "100vh" : "min(70vh, 720px)",
    overflow: "hidden",
    ...(wrapperStyle || {}),
  };

  if (!mounted) {
    return (
      <div
        className={wrapperClassName}
        style={{
          ...outerStyle,
          background: "#e8eaef",
        }}
        aria-hidden
      />
    );
  }

  return (
    <div className={wrapperClassName} style={outerStyle}>
      <FluidImageRevealCanvas {...canvasProps} />
    </div>
  );
}
