"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { getOwlLenis } from "@/lib/owlLenis";

const FEATURE_CARD_BACKGROUND = "rgba(239, 230, 212, 0.9)";

const MAX_VISIBLE_SLOT = 3;
const WHEEL_STEP_THRESHOLD = 70;

// Fixed 7-slot pose map for the staged carousel.
// Rotation sequence is exact: +42, +30, +16, 0, -16, -30, -42.
const SLOT_POSES = {
  [-3]: { x: -860, y: 52, z: -330, rotateY: 58, scale: 0.62, opacity: 0.2 },
  [-2]: { x: -620, y: 8, z: -240, rotateY: 44, scale: 0.74, opacity: 0.4 },
  [-1]: { x: -340, y: 34, z: -120, rotateY: 26, scale: 0.9, opacity: 0.76 },
  [0]: { x: 0, y: 0, z: 26, rotateY: 0, scale: 1, opacity: 1 },
  [1]: { x: 340, y: 56, z: -120, rotateY: -26, scale: 0.9, opacity: 0.76 },
  [2]: { x: 620, y: 18, z: -240, rotateY: -44, scale: 0.74, opacity: 0.4 },
  [3]: { x: 860, y: 78, z: -330, rotateY: -58, scale: 0.62, opacity: 0.2 },
};

const SNAP_SPRING = {
  type: "spring",
  stiffness: 210,
  damping: 24,
  mass: 0.86,
};

function toPx(value) {
  return typeof value === "number" ? `${value}px` : value;
}

function toDeg(value) {
  return typeof value === "number" ? `${value}deg` : value;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function interpolateSlotPose(distance) {
  const clamped = clamp(distance, -MAX_VISIBLE_SLOT, MAX_VISIBLE_SLOT);
  const lower = Math.floor(clamped);
  const upper = Math.ceil(clamped);
  const t = clamped - lower;
  const a = SLOT_POSES[lower];
  const b = SLOT_POSES[upper];

  if (!a && !b) return SLOT_POSES[0];
  if (!a) return b;
  if (!b) return a;
  if (lower === upper) return a;

  return {
    x: mix(a.x, b.x, t),
    y: mix(a.y, b.y, t),
    z: mix(a.z, b.z, t),
    rotateY: mix(a.rotateY, b.rotateY, t),
    scale: mix(a.scale, b.scale, t),
    opacity: mix(a.opacity, b.opacity, t),
  };
}

function getCardState(index, virtualIndex, totalCards) {
  const distance = index - virtualIndex;
  const absDistance = Math.abs(distance);
  const isVisible = absDistance <= MAX_VISIBLE_SLOT + 0.05;

  if (!isVisible) {
    const direction = Math.sign(distance) || 1;
    return {
      x: direction * 980,
      y: 0,
      z: -420,
      rotateY: direction * -54,
      scale: 0.58,
      opacity: 0,
      zIndex: 0,
      isVisible: false,
    };
  }

  const pose = interpolateSlotPose(distance);
  return {
    ...pose,
    zIndex: Math.round(1200 - absDistance * 120),
    isVisible: true,
  };
}

export default function SpatialCarouselFeatures({
  items,
  perspective = 1100,
  showArrows = true,
}) {
  const viewportRef = useRef(null);
  const stopAnimationRef = useRef(null);
  const activeIndexRef = useRef(0);
  const wheelStateRef = useRef({
    accumulatedDelta: 0,
    lastTs: 0,
  });
  const isAnimatingRef = useRef(false);
  const lenisLockedRef = useRef(false);

  const count = items.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const virtualIndexMotion = useMotionValue(0);

  const cardStates = useMemo(
    () => items.map((_, index) => getCardState(index, activeIndex, count)),
    [items, activeIndex, count],
  );

  const isLockStageActive = () => {
    const viewport = viewportRef.current;
    if (!viewport) return false;
    const lockContainer = viewport.closest(".features-lock");
    if (!lockContainer) return false;
    const section = viewport.closest(".section-features");
    const header = section?.querySelector(".features-header");
    const lockRect = lockContainer.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    const lockIntersectsScreen = lockRect.top < window.innerHeight && lockRect.bottom > 0;
    // Sticky stage is considered truly active only when pinned to viewport edges.
    const viewportPinnedTop = Math.abs(viewportRect.top) <= 24;
    const viewportPinnedBottom = Math.abs(viewportRect.bottom - window.innerHeight) <= 24;
    const viewportPinned = viewportPinnedTop && viewportPinnedBottom;
    // Exclude section heading from lock gating; only lock once heading has passed.
    const headingPassed = !header || header.getBoundingClientRect().bottom <= 24;
    return lockIntersectsScreen && viewportPinned && headingPassed;
  };

  const setLenisLocked = (locked) => {
    if (lenisLockedRef.current === locked) return;
    const lenis = getOwlLenis();
    if (!lenis) return;
    if (locked) {
      lenis.stop();
      lenisLockedRef.current = true;
    } else {
      lenis.start();
      lenisLockedRef.current = false;
    }
  };

  const stopRunningAnimation = () => {
    const controls = stopAnimationRef.current;
    if (!controls) return;
    if (typeof controls === "function") {
      controls();
      stopAnimationRef.current = null;
      return;
    }
    if (typeof controls.stop === "function") {
      controls.stop();
      stopAnimationRef.current = null;
    }
    isAnimatingRef.current = false;
  };

  const animateToIndex = (nextIndex) => {
    const clamped = clamp(nextIndex, 0, Math.max(0, count - 1));
    if (clamped === activeIndexRef.current) return;
    stopRunningAnimation();
    activeIndexRef.current = clamped;
    setActiveIndex(clamped);
    isAnimatingRef.current = true;
    stopAnimationRef.current = animate(virtualIndexMotion, clamped, {
      ...SNAP_SPRING,
      onComplete: () => {
        isAnimatingRef.current = false;
      },
    });
  };

  const goNext = () => animateToIndex(activeIndex + 1);
  const goPrev = () => animateToIndex(activeIndex - 1);

  const handleWheel = (event) => {
    if (!isLockStageActive()) {
      setLenisLocked(false);
      return;
    }
    if (count <= 1) return;
    const currentVirtual = virtualIndexMotion.get();
    const atFirstCentered =
      activeIndexRef.current <= 0 && Math.abs(currentVirtual - 0) < 0.015 && !isAnimatingRef.current;
    const atLastCentered =
      activeIndexRef.current >= count - 1 &&
      Math.abs(currentVirtual - (count - 1)) < 0.015 &&
      !isAnimatingRef.current;
    const scrollingDown = event.deltaY > 0;
    const scrollingUp = event.deltaY < 0;
    const canMoveForward = scrollingDown && !atLastCentered;
    const canMoveBackward = scrollingUp && !atFirstCentered;
    const shouldCapture = canMoveForward || canMoveBackward || isAnimatingRef.current;

    if (!shouldCapture) {
      setLenisLocked(false);
      return;
    }
    setLenisLocked(true);
    event.preventDefault();

    if (isAnimatingRef.current) return;

    const now = performance.now();
    if (now - wheelStateRef.current.lastTs > 280) {
      wheelStateRef.current.accumulatedDelta = 0;
    }
    wheelStateRef.current.lastTs = now;
    wheelStateRef.current.accumulatedDelta += event.deltaY;

    if (Math.abs(wheelStateRef.current.accumulatedDelta) < WHEEL_STEP_THRESHOLD) return;

    const direction = wheelStateRef.current.accumulatedDelta > 0 ? 1 : -1;
    wheelStateRef.current.accumulatedDelta = 0;
    animateToIndex(activeIndexRef.current + direction);
  };

  useEffect(() => {
    virtualIndexMotion.set(activeIndex);
    activeIndexRef.current = activeIndex;
  }, [activeIndex, virtualIndexMotion]);

  useEffect(() => {
    const clamped = clamp(activeIndex, 0, Math.max(0, count - 1));
    if (clamped !== activeIndex) {
      setActiveIndex(clamped);
      virtualIndexMotion.set(clamped);
    }
  }, [activeIndex, count, virtualIndexMotion]);

  useEffect(() => {
    if (wheelStateRef.current) {
      wheelStateRef.current.accumulatedDelta = 0;
      wheelStateRef.current.lastTs = 0;
    }
  }, [activeIndex]);

  useEffect(() => {
    const onWheelNative = (event) => handleWheel(event);
    window.addEventListener("wheel", onWheelNative, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheelNative);
      setLenisLocked(false);
      stopRunningAnimation();
    };
  }, [count]);

  return (
    <div className="spatial-carousel">
      <div
        ref={viewportRef}
        className="spatial-carousel__viewport"
        style={{ perspective: `${perspective}px` }}
      >
        <div className="spatial-carousel__track">
          {items.map((item, index) => {
            const state = cardStates[index];
            return (
              <motion.article
                key={item.title}
                className="glass-card spatial-carousel__card"
                initial={false}
                animate={{
                  x: state.x,
                  y: state.y,
                  z: state.z,
                  rotateY: state.rotateY,
                  scale: state.scale,
                  opacity: state.opacity,
                }}
                transition={SNAP_SPRING}
                transformTemplate={({ x, y, z, rotateY, scale }) =>
                  `translate(-50%, -50%) translate3d(${toPx(x)}, ${toPx(y)}, ${toPx(z)}) rotateY(${toDeg(rotateY)}) scale(${scale})`
                }
                style={{
                  zIndex: state.zIndex,
                  pointerEvents: state.isVisible ? "auto" : "none",
                  visibility: state.isVisible ? "visible" : "hidden",
                  background: FEATURE_CARD_BACKGROUND,
                  borderColor: "rgba(255, 255, 255, 0.55)",
                }}
              >
                <div className="feature-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </motion.article>
            );
          })}
        </div>
        {showArrows ? (
          <>
            <button
              type="button"
              aria-label="Previous feature"
              className="spatial-carousel__arrow spatial-carousel__arrow--prev"
              onClick={goPrev}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <span aria-hidden="true">{"<"}</span>
            </button>
            <button
              type="button"
              aria-label="Next feature"
              className="spatial-carousel__arrow spatial-carousel__arrow--next"
              onClick={goNext}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <span aria-hidden="true">{">"}</span>
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
