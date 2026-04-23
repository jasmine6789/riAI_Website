"use client";

import { useEffect, useRef, useMemo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePinnedTrackOptional } from "@/app/components/pinned/PinnedSection";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ─────────────────────────────────────────────────────────────
   ORYZO — Cinematic "Full-Screen Hero → Magazine Card" Section
   ─────────────────────────────────────────────────────────────
   Scroll 0 %  → Full-bleed immersive video (scale 1.08, no radius)
   Scroll 100% → Compact magazine card (centered, rounded, shadowed)
   ──────────────────────────────────────────────────────────── */

export default function OryzoSection() {
  const pinnedTrack = usePinnedTrackOptional();
  const sectionRef = useRef(null);
  const mediaRef = useRef(null);
  const videoInnerRef = useRef(null);
  const overlayRef = useRef(null);
  const textARef = useRef(null);
  const textBRef = useRef(null);
  const scrollHintRef = useRef(null);

  /* Barcode lines — memoised so random heights are stable */
  const barcodeLines = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        height: `${14 + Math.random() * 12}px`,
        width: i % 3 === 0 ? "3px" : "2px",
      })),
    []
  );

  useEffect(() => {
    const triggerEl = pinnedTrack?.trackRef?.current ?? sectionRef.current;
    if (!triggerEl) return undefined;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerEl,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.2,
        },
      });

      /* ═══════════════════════════════════════════
         PHASE 1 (0 → 0.65): Full-screen → Card
         ═══════════════════════════════════════════ */

      /* Media wrapper: 100vw/100vh → 48vw/78vh, centered in right half */
      tl.fromTo(
        mediaRef.current,
        {
          width: "100vw",
          height: "100vh",
          top: "0px",
          left: "0px",
          borderRadius: "0px",
          boxShadow: "none",
        },
        {
          width: "60vw",
          height: "80vh",
          top: "10vh",
          left: "35vw",
          borderRadius: "0px",         // magazine covers are sharp
          boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
          ease: "power2.inOut",
          duration: 0.65,
        },
        0
      );

      /* Inner video: slight cinematic zoom-out as wrapper shrinks */
      tl.fromTo(
        videoInnerRef.current,
        { scale: 1.08 },
        { scale: 1, ease: "power2.inOut", duration: 0.65 },
        0
      );

      /* Magazine overlay: fades in during the second half of the shrink */
      tl.fromTo(
        overlayRef.current,
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, ease: "power2.out", duration: 0.4 },
        0.25
      );

      /* ═══════════════════════════════════════════
         PHASE 2 (0.3 → 0.8): Text crossfade
         ═══════════════════════════════════════════ */

      /* Text A (Initial Hero Text): fades OUT as card forms */
      tl.fromTo(
        textARef.current,
        { opacity: 1, y: 0 },
        { opacity: 0, y: -30, ease: "power2.inOut", duration: 0.35 },
        0.1
      );

      /* Text B ("SO PORTABLE, About the team"): fades IN later */
      tl.fromTo(
        textBRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, ease: "power2.out", duration: 0.4 },
        0.35
      );

      /* ═══════════════════════════════════════════
         Scroll hint: disappears immediately
         ═══════════════════════════════════════════ */
      tl.fromTo(
        scrollHintRef.current,
        { opacity: 1 },
        { opacity: 0, ease: "none", duration: 0.15 },
        0
      );
    }, triggerEl);

    return () => ctx.revert();
  }, [pinnedTrack]);

  return (
    <section
      ref={sectionRef}
      className={`oryzo-mag${pinnedTrack ? " oryzo-mag--inPinnedTrack" : ""}`}
      id={pinnedTrack ? undefined : "oryzo-section"}
    >
      {/* ── STICKY VIEWPORT ── */}
      <div className="oryzo-mag__sticky">
        {/* ── LEFT COLUMN: TYPOGRAPHY & BLUR ── */}
        <div className="oryzo-mag__left">
          {/* Text Block A — Initial Hero Text */}
          <div ref={textARef} className="oryzo-mag__text-a">
            <div className="oryzo-mag__icon-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </div>
            <h2 className="oryzo-mag__heading-a">RISE ABOVE MEDIOCRITY</h2>
            <p className="oryzo-mag__body-a">
              With a precision-engineered lift (exactly one coaster thick),
              Oryzo doesn&apos;t just hold your mug — it elevates it.
              Literally. Above every boring surface you&apos;ve ever known.
            </p>
            <div className="oryzo-mag__separator" />
            <div className="oryzo-mag__subheading-a">ELEVATE YOUR COFFEE EXPERIENCE</div>
            <div className="oryzo-mag__dot-a" />
          </div>
          {/* Text Block B — fades in later in the scroll */}
          <div ref={textBRef} className="oryzo-mag__text-b">
            <span className="oryzo-mag__label-b">SO PORTABLE,</span>
            <h2 className="oryzo-mag__heading-b">About the team</h2>
          </div>
        </div>

        {/* ── MEDIA WRAPPER: starts covering entire viewport ── */}
        <div ref={mediaRef} className="oryzo-mag__media">
          {/* Inner video with cinematic zoom */}
          <div ref={videoInnerRef} className="oryzo-mag__video-inner">
            <video
              className="oryzo-mag__video"
              src="/Video_Photos/SteveOffice.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
            />
          </div>

          {/* ── MAGAZINE UI OVERLAY (fades in as card forms) ── */}
          <div ref={overlayRef} className="oryzo-mag__overlay">
            {/* Dotted border frame */}
            <div className="oryzo-mag__frame" />

            {/* Top Right: Small white dot */}
            <div className="oryzo-mag__top-right-dot" />

            {/* "RISE" Title */}
            <h1 className="oryzo-mag__title">RISE</h1>

            {/* Issue number (top-right) */}
            <div className="oryzo-mag__issue">ISSUE NO. 00124</div>

            {/* Feature box */}
            <div className="oryzo-mag__feature-box">
              <span className="oryzo-mag__feature-number">25</span>
              <span className="oryzo-mag__feature-text">
                AI SLOP IDEAS<br />FOR THIS<br />WINTER
              </span>
            </div>

            {/* Center headline */}
            <div className="oryzo-mag__headline">
              <span className="oryzo-mag__headline-pre">We Are So</span>
              <span className="oryzo-mag__headline-main">Cooked!</span>
            </div>

            {/* Bottom-Left: Issue circle and text */}
            <div className="oryzo-mag__bottom-left">
              <div className="oryzo-mag__issue-circle">
                <span className="oryzo-mag__issue-no-label">
                  N<sup>o</sup>
                </span>
                <span className="oryzo-mag__issue-no-value">6</span>
              </div>
              <div className="oryzo-mag__subheadline">
                ORYZO IS TAKING EVERYONE&apos;S JOBS...<br />
                AND REPLACING THEM WITH AI!
              </div>
            </div>

            {/* Bottom-Center: Product info + barcode */}
            <div className="oryzo-mag__bottom-center">
              <div className="oryzo-mag__product-info">
                <div className="oryzo-mag__product-name">ORYZO-1</div>
                <p className="oryzo-mag__product-desc">
                  AN OPEN WEIGHT MODEL, DESIGNED TO BE<br />
                  LIGHTWEIGHT AND EASY TO CARRY.
                </p>
              </div>
              <div className="oryzo-mag__barcode" aria-hidden="true">
                {barcodeLines.map((style, i) => (
                  <span
                    key={i}
                    className="oryzo-mag__barcode-line"
                    style={style}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── SCROLL HINT ── */}
        <div ref={scrollHintRef} className="oryzo-mag__scroll-hint">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
          <span>SCROLL TO CONTINUE</span>
        </div>
      </div>
    </section>
  );
}
