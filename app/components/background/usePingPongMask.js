"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFBO } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

import simVertex from "./shaders/simVertex.glsl";
import simFragment from "./shaders/simFragment.glsl";

function clampResolution(value) {
  return Math.round(THREE.MathUtils.clamp(value, 256, 1024));
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function pickZonePosition(zonePadding = 0.08, zoneSpread = 0.1) {
  const pad = THREE.MathUtils.clamp(zonePadding, 0.02, 0.35);
  const spread = THREE.MathUtils.clamp(zoneSpread, 0.02, 0.24);
  const zones = [
    [pad + 0.1, pad + 0.1],
    [1.0 - pad - 0.1, pad + 0.1],
    [pad + 0.1, 1.0 - pad - 0.1],
    [1.0 - pad - 0.1, 1.0 - pad - 0.1],
    [0.5, 0.5],
  ];
  const z = zones[Math.floor(Math.random() * zones.length)];
  const jitter = new THREE.Vector2(
    randomRange(-spread, spread),
    randomRange(-spread, spread),
  );
  return new THREE.Vector2(
    THREE.MathUtils.clamp(z[0] + jitter.x, pad, 1.0 - pad),
    THREE.MathUtils.clamp(z[1] + jitter.y, pad, 1.0 - pad),
  );
}

function pickFarZonePosition(origin, zonePadding, zoneSpread, minDistance = 0.25) {
  let candidate = pickZonePosition(zonePadding, zoneSpread);
  for (let i = 0; i < 8; i++) {
    if (candidate.distanceTo(origin) >= minDistance) break;
    candidate = pickZonePosition(zonePadding, zoneSpread);
  }
  return candidate;
}

function createVirtualCursorState() {
  const p = new THREE.Vector2(0.5, 0.5);
  return {
    start: p.clone(),
    end: p.clone(),
    current: p.clone(),
    prev: p.clone(),
    velocity: new THREE.Vector2(0, 0),
    dir: new THREE.Vector2(1, 0),
    state: "travel",
    timer: 0,
    travelDuration: 0,
    lingerDuration: 3,
    fadeDuration: 0.9,
    strength: 1.0,
  };
}

function ensureAutoCursorState(state) {
  if (!state.start) state.start = new THREE.Vector2(0.5, 0.5);
  if (!state.end) state.end = new THREE.Vector2(0.5, 0.5);
  if (!state.current) state.current = new THREE.Vector2(0.5, 0.5);
  if (!state.prev) state.prev = state.current.clone();
  if (!state.velocity) state.velocity = new THREE.Vector2(0, 0);
  if (!state.dir) state.dir = new THREE.Vector2(1, 0);
  if (typeof state.state !== "string") state.state = "travel";
  if (typeof state.timer !== "number") state.timer = 0;
  if (typeof state.travelDuration !== "number") state.travelDuration = 0;
  if (typeof state.lingerDuration !== "number") state.lingerDuration = 3;
  if (typeof state.fadeDuration !== "number") state.fadeDuration = 0.9;
  if (typeof state.strength !== "number") state.strength = 1.0;
}

export default function usePingPongMask({
  scale = 0.45,
  decay = 0.975,
  brushRadius = 0.12,
  softness = 0.12,
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
} = {}) {
  const { gl, size } = useThree();

  const simWidth = clampResolution(size.width * scale);
  const simHeight = clampResolution(size.height * scale);

  const fboConfig = useMemo(
    () => ({
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      generateMipmaps: false,
    }),
    [],
  );

  const fboA = useFBO(simWidth, simHeight, fboConfig);
  const fboB = useFBO(simWidth, simHeight, fboConfig);

  const simScene = useMemo(() => new THREE.Scene(), []);
  const simCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);
  const simMatRef = useRef(null);
  const readRef = useRef(fboA);
  const writeRef = useRef(fboB);
  const autoCursorRef = useRef(createVirtualCursorState());

  if (!simMatRef.current) {
    simMatRef.current = new THREE.ShaderMaterial({
      uniforms: {
        uPrevMask: { value: null },
        uPointer: { value: new THREE.Vector2(0.5, 0.5) },
        uVelocity: { value: new THREE.Vector2(0, 0) },
        uResolution: { value: new THREE.Vector2(simWidth, simHeight) },
        uTime: { value: 0 },
        uDelta: { value: 0.016 },
        uDecay: { value: decay },
        uBrushRadius: { value: brushRadius },
        uSoftness: { value: softness },
        uNoiseAmount: { value: noiseAmount },
        uAdvection: { value: advection },
        uVelocityStretch: { value: velocityStretch },
        uVelocityGain: { value: velocityGain },
        uActive: { value: 0 },
        uAutoPointer: { value: new THREE.Vector2(0.5, 0.5) },
        uAutoVelocity: { value: new THREE.Vector2(0, 0) },
        uAutoActive: { value: 0 },
      },
      vertexShader: simVertex,
      fragmentShader: simFragment,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
  }

  const simQuad = useMemo(() => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), simMatRef.current);
    mesh.frustumCulled = false;
    return mesh;
  }, []);

  useEffect(() => {
    simScene.add(simQuad);
    return () => {
      simScene.remove(simQuad);
      simQuad.geometry.dispose();
      simMatRef.current?.dispose();
    };
  }, [simQuad, simScene]);

  useEffect(() => {
    readRef.current = fboA;
    writeRef.current = fboB;
    const prevRT = gl.getRenderTarget();
    const prevColor = new THREE.Color();
    gl.getClearColor(prevColor);
    const prevAlpha = gl.getClearAlpha();
    gl.setClearColor(0x000000, 0);
    gl.setRenderTarget(fboA);
    gl.clear(true, false, false);
    gl.setRenderTarget(fboB);
    gl.clear(true, false, false);
    gl.setRenderTarget(prevRT);
    gl.setClearColor(prevColor, prevAlpha);
  }, [fboA, fboB, gl]);

  const resetAutoCursor = () => {
    const state = autoCursorRef.current;
    const start = pickZonePosition(autoZonePadding, autoZoneSpread);
    const end = pickFarZonePosition(start, autoZonePadding, autoZoneSpread, 0.26);
    const dir = end.clone().sub(start).normalize();
    state.start.copy(start);
    state.end.copy(end);
    state.dir.copy(dir);
    state.current.copy(start);
    state.prev.copy(start);
    state.velocity.set(0, 0);
    state.state = "travel";
    state.timer = 0;
    state.travelDuration = randomRange(autoTravelMin, autoTravelMax);
    state.lingerDuration = Math.max(autoLingerSeconds, 0);
    state.fadeDuration = Math.max(autoFadeSeconds, 0.05);
    state.strength = randomRange(1.0, 1.35);
  };

  const step = ({ pointer, velocity, delta, time, active }) => {
    const mat = simMatRef.current;
    if (!mat) return;
    const safeDelta = Math.max(delta, 1 / 240);
    const auto = autoCursorRef.current;
    ensureAutoCursorState(auto);

    if (auto.travelDuration <= 0) {
      resetAutoCursor();
    }

    auto.timer += safeDelta;
    let autoLevel = 1.0;

    if (auto.state === "travel") {
      const t = THREE.MathUtils.clamp(
        auto.timer / Math.max(auto.travelDuration, 1e-4),
        0,
        1,
      );
      const eased = THREE.MathUtils.smoothstep(t, 0, 1);
      auto.current.lerpVectors(auto.start, auto.end, eased);
      // Keep point A internal, but bring reveal up faster so random pass reads clearly.
      autoLevel = THREE.MathUtils.smoothstep(t, 0.06, 0.18);
      if (t >= 1) {
        auto.state = "linger";
        auto.timer = 0;
      }
    } else if (auto.state === "linger") {
      // Linger with tiny directional drift so endpoint does not read as a static blob.
      const lingerWobble = Math.sin(time * 2.2) * 0.012;
      auto.current.copy(auto.end).addScaledVector(auto.dir, lingerWobble);
      autoLevel = 1.0;
      if (auto.timer >= auto.lingerDuration) {
        auto.state = "fade";
        auto.timer = 0;
      }
    } else {
      auto.current.copy(auto.end);
      const fadeT = THREE.MathUtils.clamp(
        auto.timer / Math.max(auto.fadeDuration, 1e-4),
        0,
        1,
      );
      autoLevel = 1.0 - THREE.MathUtils.smoothstep(fadeT, 0, 1);
      if (fadeT >= 1) {
        resetAutoCursor();
      }
    }

    auto.velocity.set(
      (auto.current.x - auto.prev.x) / safeDelta,
      (auto.current.y - auto.prev.y) / safeDelta,
    );
    auto.prev.copy(auto.current);

    mat.uniforms.uPrevMask.value = readRef.current.texture;
    mat.uniforms.uPointer.value.copy(pointer);
    mat.uniforms.uVelocity.value.copy(velocity);
    mat.uniforms.uTime.value = time;
    mat.uniforms.uDelta.value = safeDelta;
    mat.uniforms.uDecay.value = decay;
    mat.uniforms.uBrushRadius.value = brushRadius;
    mat.uniforms.uSoftness.value = softness;
    mat.uniforms.uNoiseAmount.value = noiseAmount;
    mat.uniforms.uAdvection.value = advection;
    mat.uniforms.uVelocityStretch.value = velocityStretch;
    mat.uniforms.uVelocityGain.value = velocityGain;
    mat.uniforms.uActive.value = active ? 1 : 0;
    mat.uniforms.uAutoPointer.value.copy(auto.current);
    mat.uniforms.uAutoVelocity.value.copy(auto.velocity);
    mat.uniforms.uAutoActive.value = autoLevel * auto.strength * autoStrength;
    mat.uniforms.uResolution.value.set(simWidth, simHeight);

    const prevTarget = gl.getRenderTarget();
    gl.setRenderTarget(writeRef.current);
    gl.render(simScene, simCamera);
    gl.setRenderTarget(prevTarget);

    const tmp = readRef.current;
    readRef.current = writeRef.current;
    writeRef.current = tmp;
  };

  return {
    textureRef: readRef,
    resolution: new THREE.Vector2(simWidth, simHeight),
    step,
  };
}
