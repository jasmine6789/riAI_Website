"use client";

import { createContext, useContext, useLayoutEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Refs to the pin track (scroll runway) and pinned stage (100vh content shell).
 * Child sections can use this as ScrollTrigger `trigger` for scrub timelines.
 */
export const PinnedTrackContext = createContext(null);

export function usePinnedTrackOptional() {
  return useContext(PinnedTrackContext);
}

/**
 * Scroll runway + GSAP-pinned viewport stage (Lenis-friendly; keep ScrollTrigger.refresh on resize).
 *
 * @param {string} [props.id] - Optional id on the track (in-page anchors).
 * @param {string} [props.className] - Extra classes on the track.
 * @param {string} props.scrollEnd - e.g. `"+=200vh"` or `"+=2400"` (passed to ScrollTrigger `end`).
 * @param {boolean} [props.pinSpacing]
 * @param {string} [props.start]
 * @param {import('react').ReactNode} props.children
 */
export default function PinnedSection({
  id,
  className = "",
  scrollEnd,
  pinSpacing = true,
  start = "top top",
  children,
}) {
  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const value = useMemo(() => ({ trackRef, stageRef }), []);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage || !scrollEnd) return undefined;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: track,
        start,
        end: scrollEnd,
        pin: stage,
        pinSpacing,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      });
    }, track);

    return () => ctx.revert();
  }, [scrollEnd, pinSpacing, start]);

  return (
    <PinnedTrackContext.Provider value={value}>
      <div
        ref={trackRef}
        id={id}
        className={`pk-section-track ${className}`.trim()}
        data-pk-pin-track
      >
        <div ref={stageRef} className="pk-section-stage">
          {children}
        </div>
      </div>
    </PinnedTrackContext.Provider>
  );
}
