"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getOwlLenis } from "@/lib/owlLenis";
import { SCROLL_END_EDITORIAL } from "@/app/lib/pinnedSectionConstants";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const DEFAULT_ASSETS = [
  "/Video_Photos/photo1.png",
  "/Video_Photos/photo2.png",
  "/Video_Photos/photo3.png",
  "/Video_Photos/photo4.png",
  "/Video_Photos/photo5.png",
  "/Video_Photos/photo6.png",
];

/** Side rail “filmstrip” count — wrapped modulo so rails never look empty */
const THUMBNAILS_PER_SIDE = 5;

function modIndex(i, total) {
  if (total <= 0) return 0;
  return ((i % total) + total) % total;
}

function clampIndex(index, total) {
  return Math.max(0, Math.min(total - 1, index));
}

export default function CinematicEditorialGallery({
  id = "gallery-editorial",
  title = "Who we serve",
  assets = DEFAULT_ASSETS,
}) {
  const total = assets.length;
  const maxIndex = Math.max(total - 1, 0);
  const [trackPosition, setTrackPosition] = useState(0);
  const [motionDirection, setMotionDirection] = useState(1);

  const trackRef = useRef(null);
  const lockViewportRef = useRef(null);
  const lockStageActiveRef = useRef(false);

  const trackPositionRef = useRef(0);
  const targetPositionRef = useRef(0);
  const motionDirectionRef = useRef(1);
  const loadedAssetsRef = useRef(new Set());
  const loadingPromisesRef = useRef(new Map());
  const lenisLockedRef = useRef(false);
  const wheelCooldownUntilRef = useRef(0);

  // CAUSE 1: decode lag at interaction time.
  // Fix: eager preload and decode all assets.
  const ensureImageLoaded = useCallback((src) => {
    if (!src) return Promise.resolve();
    if (loadedAssetsRef.current.has(src)) return Promise.resolve();
    if (loadingPromisesRef.current.has(src)) return loadingPromisesRef.current.get(src);

    const promise = new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      const done = async () => {
        try {
          if (typeof img.decode === "function") {
            await img.decode();
          }
        } catch {
          // Continue even if decode() is unavailable or rejected.
        }
        loadedAssetsRef.current.add(src);
        loadingPromisesRef.current.delete(src);
        resolve();
      };
      if (img.complete) {
        void done();
        return;
      }
      img.onload = () => {
        void done();
      };
      img.onerror = () => {
        void done();
      };
    });

    loadingPromisesRef.current.set(src, promise);
    return promise;
  }, []);

  useEffect(() => {
    assets.forEach((src) => {
      void ensureImageLoaded(src);
    });
  }, [assets, ensureImageLoaded]);

  useEffect(() => {
    if (total <= 1) return;
    const current = Math.round(trackPositionRef.current);
    const spread = THUMBNAILS_PER_SIDE + 1;
    for (let d = -spread; d <= spread; d += 1) {
      void ensureImageLoaded(assets[modIndex(current + d, total)]);
    }
  }, [assets, ensureImageLoaded, total, trackPosition]);

  const setLenisLocked = useCallback((locked) => {
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
  }, []);

  const updateTargetPosition = useCallback(
    (nextTarget) => {
      const clamped = Math.max(0, Math.min(maxIndex, nextTarget));
      targetPositionRef.current = clamped;
    },
    [maxIndex],
  );

  useLayoutEffect(() => {
    const track = trackRef.current;
    const stage = lockViewportRef.current;
    if (!track || !stage) return undefined;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: track,
        start: "top top",
        end: SCROLL_END_EDITORIAL,
        pin: stage,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      });
    }, track);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      const current = trackPositionRef.current;
      const target = targetPositionRef.current;
      const diff = target - current;

      if (Math.abs(diff) > 0.0008) {
        const next = current + diff * 0.17;
        const direction = Math.sign(next - current) || motionDirectionRef.current;
        if (direction !== motionDirectionRef.current) {
          motionDirectionRef.current = direction;
          setMotionDirection(direction);
        }
        trackPositionRef.current = next;
        setTrackPosition(next);
      } else if (current !== target) {
        const direction = Math.sign(target - current) || motionDirectionRef.current;
        if (direction !== motionDirectionRef.current) {
          motionDirectionRef.current = direction;
          setMotionDirection(direction);
        }
        trackPositionRef.current = target;
        setTrackPosition(target);
      }

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const safeCurrent = Math.max(0, Math.min(maxIndex, trackPositionRef.current));
    const safeTarget = Math.max(0, Math.min(maxIndex, targetPositionRef.current));
    trackPositionRef.current = safeCurrent;
    targetPositionRef.current = safeTarget;
    setTrackPosition(safeCurrent);
  }, [maxIndex]);

  const recomputeLockStageActive = useCallback(() => {
    const viewport = lockViewportRef.current;
    if (!viewport) {
      lockStageActiveRef.current = false;
      return;
    }
    const lockContainer = viewport.closest(".editorial-gallery-lock");
    if (!lockContainer) {
      lockStageActiveRef.current = false;
      return;
    }
    const lockRect = lockContainer.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    const intersects = lockRect.top < window.innerHeight && lockRect.bottom > 0;
    const pinnedTop = Math.abs(viewportRect.top) <= 24;
    const pinnedBottom = Math.abs(viewportRect.bottom - window.innerHeight) <= 24;
    lockStageActiveRef.current = intersects && pinnedTop && pinnedBottom;
  }, []);

  useEffect(() => {
    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        recomputeLockStageActive();
      });
    };
    recomputeLockStageActive();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [recomputeLockStageActive]);

  const onThumbnailSelect = useCallback(
    (index) => {
      updateTargetPosition(index);
    },
    [updateTargetPosition],
  );

  const onSectionKeyDown = useCallback(
    (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        updateTargetPosition(Math.round(targetPositionRef.current + 1));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        updateTargetPosition(Math.round(targetPositionRef.current - 1));
      }
    },
    [updateTargetPosition],
  );

  useEffect(() => {
    const onWheel = (event) => {
      if (!lockStageActiveRef.current) {
        setLenisLocked(false);
        return;
      }
      if (total <= 1) return;

      const currentTarget = targetPositionRef.current;
      const atFirst = currentTarget <= 0.0001;
      const atLast = currentTarget >= maxIndex - 0.0001;
      const scrollingDown = event.deltaY > 0;
      const scrollingUp = event.deltaY < 0;
      const canMoveForward = scrollingDown && !atLast;
      const canMoveBackward = scrollingUp && !atFirst;
      const isSettling = Math.abs(trackPositionRef.current - currentTarget) > 0.0008;
      const shouldCapture = canMoveForward || canMoveBackward || isSettling;
      if (!shouldCapture) {
        setLenisLocked(false);
        return;
      }

      setLenisLocked(true);
      event.preventDefault();

      const now = performance.now();
      if (now < wheelCooldownUntilRef.current) return;
      const delta = Math.max(-56, Math.min(56, event.deltaY));
      const progressDelta = delta * 0.0032;
      wheelCooldownUntilRef.current = now + 24;
      updateTargetPosition(targetPositionRef.current + progressDelta);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      setLenisLocked(false);
    };
  }, [maxIndex, setLenisLocked, total, updateTargetPosition]);

  const snapEpsilon = 0.02;
  const nearestIndex = Math.round(trackPosition);
  const snappedTrackPosition =
    Math.abs(trackPosition - nearestIndex) < snapEpsilon ? nearestIndex : trackPosition;

  const roundedIndex = clampIndex(Math.round(snappedTrackPosition), total);
  const lowerIndex = clampIndex(Math.floor(snappedTrackPosition), total);
  const upperIndex = clampIndex(Math.ceil(snappedTrackPosition), total);
  const fraction = Math.max(0, Math.min(1, snappedTrackPosition - Math.floor(snappedTrackPosition)));
  const movementDirection = motionDirection;

  // Left rail uses justify-content: flex-end, so the last DOM child sits next to the hero.
  // Order indices left→right in DOM as [i-N, …, i-2, i-1] so the hero-adjacent thumb is always i-1
  // (avoids i-1 and i+1 colliding when total divides THUMBNAILS_PER_SIDE).
  const leftIndices = useMemo(() => {
    if (total <= 0) return [];
    return Array.from({ length: THUMBNAILS_PER_SIDE }, (_, s) =>
      modIndex(roundedIndex - THUMBNAILS_PER_SIDE + s, total),
    );
  }, [roundedIndex, total]);

  const rightIndices = useMemo(() => {
    if (total <= 0) return [];
    return Array.from({ length: THUMBNAILS_PER_SIDE }, (_, s) => modIndex(roundedIndex + 1 + s, total));
  }, [roundedIndex, total]);

  const leftSlots = useMemo(
    () => leftIndices.map((imageIndex, slot) => ({ slot, imageIndex })),
    [leftIndices],
  );

  const rightSlots = useMemo(
    () => rightIndices.map((imageIndex, slot) => ({ slot, imageIndex })),
    [rightIndices],
  );

  const currentOpacity = lowerIndex === upperIndex ? 1 : 1 - fraction;
  const nextOpacity = lowerIndex === upperIndex ? 0 : fraction;
  const currentXPercent =
    lowerIndex === upperIndex ? 0 : movementDirection >= 0 ? -fraction * 12 : -(1 - fraction) * 12;
  const nextXPercent = lowerIndex === upperIndex ? 0 : movementDirection >= 0 ? (1 - fraction) * 12 : fraction * 12;
  const currentClipPath =
    lowerIndex === upperIndex
      ? "inset(0 0 0 0)"
      : movementDirection >= 0
        ? "inset(0 0 0 0)"
        : `inset(0 ${Math.max(0, (1 - fraction) * 44)}% 0 0)`;
  const nextClipPath =
    lowerIndex === upperIndex
      ? "inset(0 0 0 0)"
      : movementDirection >= 0
        ? `inset(0 0 0 ${Math.max(0, (1 - fraction) * 44)}%)`
        : "inset(0 0 0 0)";
  const railShift = movementDirection >= 0 ? -fraction * 18 : fraction * 18;

  return (
    <div ref={trackRef} className="editorial-gallery-lock pk-section-track" id={id} data-pk-pin-track>
      <div ref={lockViewportRef} className="editorial-gallery-lock__sticky pk-section-stage">
        <section
          className="editorial-gallery"
          aria-label={title}
          tabIndex={0}
          onKeyDown={onSectionKeyDown}
        >
          <div className="editorial-gallery__intro editorial-gallery__intro--lead">
            <h2 className="editorial-gallery__title">Who we serve</h2>
            <p className="editorial-gallery__copy">
              We work with individuals across professions, from educators to entrepreneurs, each with unique financial
              goals and challenges.
            </p>
          </div>

          <div className="editorial-gallery__stageWrap">
            <div className="editorial-gallery__railWrap editorial-gallery__railWrap--left">
              <div
                className="editorial-gallery__rail editorial-gallery__rail--left"
                style={{ transform: `translate3d(${railShift}%, 0, 0)` }}
              >
                {leftSlots.map(({ slot, imageIndex }) => (
                  <button
                    key={`left-${slot}`}
                    type="button"
                    className="editorial-gallery__thumb"
                    aria-label={`Show image ${imageIndex + 1}`}
                    onClick={() => onThumbnailSelect(imageIndex)}
                  >
                    <img src={assets[imageIndex]} alt={`Editorial frame ${imageIndex + 1}`} loading="eager" />
                  </button>
                ))}
              </div>
            </div>

            <div className="editorial-gallery__heroFrame" role="region" aria-live="polite">
              <img
                className="editorial-gallery__heroMedia editorial-gallery__heroMedia--layerA"
                src={assets[lowerIndex]}
                alt={`Feature image ${lowerIndex + 1}`}
                loading="eager"
                fetchPriority="high"
                style={{
                  opacity: currentOpacity,
                  transform: `translate3d(${currentXPercent}%, 0, 0) scale(${1 - fraction * 0.02})`,
                  clipPath: currentClipPath,
                }}
              />
              <img
                className="editorial-gallery__heroMedia editorial-gallery__heroMedia--layerB"
                src={assets[upperIndex]}
                alt={`Feature image ${upperIndex + 1}`}
                loading="eager"
                fetchPriority="high"
                style={{
                  opacity: nextOpacity,
                  transform: `translate3d(${nextXPercent}%, 0, 0) scale(${1 + (1 - fraction) * 0.02})`,
                  clipPath: nextClipPath,
                }}
              />
              <div className="editorial-gallery__heroGlow" aria-hidden="true" />
            </div>

            <div className="editorial-gallery__railWrap editorial-gallery__railWrap--right">
              <div
                className="editorial-gallery__rail editorial-gallery__rail--right"
                style={{ transform: `translate3d(${railShift}%, 0, 0)` }}
              >
                {rightSlots.map(({ slot, imageIndex }) => (
                  <button
                    key={`right-${slot}`}
                    type="button"
                    className="editorial-gallery__thumb"
                    aria-label={`Show image ${imageIndex + 1}`}
                    onClick={() => onThumbnailSelect(imageIndex)}
                  >
                    <img src={assets[imageIndex]} alt={`Editorial frame ${imageIndex + 1}`} loading="eager" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="editorial-gallery__footer">
            <span className="editorial-gallery__meta">
              {String(roundedIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </div>

          <div className="editorial-gallery__thumbStrip">
            {assets.map((src, index) => (
              <button
                key={`strip-${src}-${index}`}
                type="button"
                className={`editorial-gallery__stripThumb${index === roundedIndex ? " is-active" : ""}`}
                onClick={() => onThumbnailSelect(index)}
                aria-label={`Show image ${index + 1}`}
              >
                <img src={src} alt={`Editorial strip ${index + 1}`} loading="eager" />
              </button>
            ))}
          </div>

          <span className="editorial-gallery__srOnly">
            Previous frame {String(Math.max(1, roundedIndex))}
          </span>
        </section>
      </div>
    </div>
  );
}
