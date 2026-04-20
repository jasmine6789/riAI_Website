"use client";

/**
 * Client-only WebGL overlay on the video frame. Pass the same ref as <video>.
 * npm: three @react-three/fiber @react-three/drei @react-three/postprocessing postprocessing @whatisjery/react-fluid-distortion
 */

import dynamic from "next/dynamic";

const FluidScene = dynamic(() => import("./FluidScene"), {
  ssr: false,
  loading: () => null,
});

export default function FluidVideoDistortion({ videoRef }) {
  return (
    <div className="owl-cinema__fluidSlot" aria-hidden="true">
      <FluidScene videoRef={videoRef} />
    </div>
  );
}
