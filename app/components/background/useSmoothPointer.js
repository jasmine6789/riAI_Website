"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

function clamp01(value) {
  return THREE.MathUtils.clamp(value, 0, 1);
}

export default function useSmoothPointer({
  lag = 0.12,
  velocityLag = 0.18,
  idleTarget = new THREE.Vector2(0.5, 0.5),
} = {}) {
  const targetRef = useRef(new THREE.Vector2(idleTarget.x, idleTarget.y));
  const currentRef = useRef(new THREE.Vector2(idleTarget.x, idleTarget.y));
  const prevRef = useRef(new THREE.Vector2(idleTarget.x, idleTarget.y));
  const velocityRef = useRef(new THREE.Vector2(0, 0));
  const activeRef = useRef(false);

  const setPointer = useCallback((clientX, clientY) => {
    if (typeof window === "undefined") return;
    const x = clamp01(clientX / Math.max(window.innerWidth, 1));
    const y = clamp01(1 - clientY / Math.max(window.innerHeight, 1));
    targetRef.current.set(x, y);
    activeRef.current = true;
  }, []);

  useEffect(() => {
    const onMouseMove = (e) => setPointer(e.clientX, e.clientY);
    const onTouchMove = (e) => {
      if (!e.touches || e.touches.length === 0) return;
      const t = e.touches[0];
      setPointer(t.clientX, t.clientY);
    };
    const onTouchStart = (e) => {
      if (!e.touches || e.touches.length === 0) return;
      const t = e.touches[0];
      setPointer(t.clientX, t.clientY);
    };
    const onLeave = () => {
      targetRef.current.copy(idleTarget);
      activeRef.current = false;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onLeave, { passive: true });
    document.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onLeave);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [idleTarget, setPointer]);

  const advance = useCallback(
    (delta) => {
      const d = Math.max(delta, 1 / 240);
      const followAlpha = 1 - Math.exp((-60 * d) * lag);
      currentRef.current.lerp(targetRef.current, followAlpha);

      const vx = (currentRef.current.x - prevRef.current.x) / d;
      const vy = (currentRef.current.y - prevRef.current.y) / d;
      const velTarget = new THREE.Vector2(vx, vy);
      const velAlpha = 1 - Math.exp((-60 * d) * velocityLag);
      velocityRef.current.lerp(velTarget, velAlpha);
      prevRef.current.copy(currentRef.current);
    },
    [lag, velocityLag],
  );

  return useMemo(
    () => ({
      targetRef,
      currentRef,
      velocityRef,
      activeRef,
      advance,
      setPointer,
    }),
    [advance, setPointer],
  );
}
