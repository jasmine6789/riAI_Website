"use client";

/**
 * Single plane with THREE.VideoTexture so Fluid postprocessing distorts
 * the actual <video> pixels (video stays in DOM as texture source).
 */

import { useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function FluidVideoPlane({ videoRef }) {
  const [map, setMap] = useState(null);
  const { width, height } = useThree((s) => s.viewport);

  useEffect(() => {
    const el = videoRef?.current;
    if (!el) return undefined;
    const tex = new THREE.VideoTexture(el);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    setMap(tex);
    return () => {
      tex.dispose();
    };
  }, [videoRef]);

  useFrame(() => {
    if (map) map.needsUpdate = true;
  });

  if (!map) return null;

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={map} toneMapped={false} />
    </mesh>
  );
}
