"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { setOwlLenis } from "@/lib/owlLenis";
import CinematicVideoSection from "./CinematicVideoSection";
import CinematicEditorialGallery from "./CinematicEditorialGallery";
import FluidRevealBackground from "./background/FluidRevealBackground";
import OryzoSection from "./OryzoSection";
import UseCasesSection from "./UseCasesSection";
import Header from "./Header";
import PieterSplitSection from "./PieterSplitSection";
import StickyStackingCardsSection from "./StickyStackingCardsSection";
// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}



/**
 * ScrollJourney — 6-Layer Immersive Design
 *
 * Layer 1: Fixed sky background (airy, soft, distant)
 * Layer 2: Cloud overlay + cursor-driven mask (canvas)
 * Layer 3: Atmospheric floating shapes (barely visible)
 * Layer 4: Cursor-following soft ambient light
 * Layer 5: Floating content cards with parallax
 * Layer 6: Text elements with entrance animations
 *
 * Features:
 *   - Canvas-based cloud masking with cursor tracking
 *   - Soft radial reveal with fade/recovery
 *   - Lenis smooth scroll
 *   - GSAP ScrollTrigger for reveals
 *   - Subtle parallax effects
 */
export default function ScrollJourney() {
  const containerRef = useRef(null);
  const progressBarRef = useRef(null);
  const cursorLightRef = useRef(null);
  const bgSkyRef = useRef(null);

  // ========== CURSOR TRACKING (ref + rAF + transform3d) ==========
  const cursorTarget = useRef({ x: 0, y: 0 });
  const cursorPos = useRef({ x: 0, y: 0 });
  const cursorRaf = useRef(null);

  useLayoutEffect(() => {
    // ========== LENIS SMOOTH SCROLL ==========
    // useLayoutEffect so Lenis is registered before child useEffects (e.g. video centering).
    const lenis = new Lenis({
      duration: 1.6,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 2,
    });

    setOwlLenis(lenis);

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // ========== CURSOR EVENTS (passive, ref-based) ==========
    const lerpVal = (a, b, n) => (1 - n) * a + n * b;
    const cursorTick = () => {
      cursorPos.current.x = lerpVal(cursorPos.current.x, cursorTarget.current.x, 0.08);
      cursorPos.current.y = lerpVal(cursorPos.current.y, cursorTarget.current.y, 0.08);
      if (cursorLightRef.current) {
        cursorLightRef.current.style.transform =
          `translate3d(${cursorPos.current.x}px, ${cursorPos.current.y}px, 0) translate(-50%, -50%)`;
      }
      const dx = cursorTarget.current.x - cursorPos.current.x;
      const dy = cursorTarget.current.y - cursorPos.current.y;
      if (dx * dx + dy * dy > 0.01) {
        cursorRaf.current = requestAnimationFrame(cursorTick);
      } else {
        cursorRaf.current = null;
      }
    };
    const handleMouseMove = (e) => {
      cursorTarget.current.x = e.clientX;
      cursorTarget.current.y = e.clientY;
      if (!cursorRaf.current) cursorRaf.current = requestAnimationFrame(cursorTick);
    };
    window.addEventListener("pointermove", handleMouseMove, { passive: true });

    // ========== SCROLL PROGRESS ==========
    if (progressBarRef.current) {
      gsap.to(progressBarRef.current, {
        width: "100%",
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.3,
        },
      });
    }

    // ========== BACKGROUND PARALLAX ==========
    if (bgSkyRef.current) {
      gsap.to(bgSkyRef.current, {
        // Move upward slightly to avoid exposing a top strip while scrolling.
        yPercent: -4,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.5,
        },
      });
    }

    // Fade scroll indicator on scroll
    gsap.to(".scroll-indicator", {
      opacity: 0,
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "20% top",
        scrub: true,
      },
    });

    // ========== SECTION REVEALS ==========
    // (Video showcase section handles its own animation & pinning.)

    // Stats section
    const statsCard = document.querySelector(".stats-card");
    if (statsCard) {
      gsap.to(statsCard, {
        opacity: 1,
        y: 0,
        duration: 1.0,
        ease: "power3.out",
        scrollTrigger: {
          trigger: statsCard,
          start: "top 82%",
          toggleActions: "play none none none",
        },
      });
    }

    // CTA section
    const ctaEls = document.querySelectorAll(
      ".cta-title, .cta-sub, .cta-actions"
    );
    ctaEls.forEach((el, i) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 1.0,
        delay: i * 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });
    });

    // ========== LOADING SCREEN ==========
    const loadingScreen = document.querySelector(".loading-screen");
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.classList.add("hidden");
        setTimeout(() => {
          loadingScreen.style.display = "none";
        }, 1000);
      }, 2000);
    }

    // ========== RESIZE ==========
    const handleResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", handleResize);

    // ========== CLEANUP ==========
    return () => {
      window.removeEventListener("pointermove", handleMouseMove);
      if (cursorRaf.current) cancelAnimationFrame(cursorRaf.current);
      window.removeEventListener("resize", handleResize);
      ScrollTrigger.getAll().forEach((st) => st.kill());
      setOwlLenis(null);
      lenis.destroy();
    };
  }, []);

  return (
    <>
      {/* ============ LOADING SCREEN ============ */}
      <div className="loading-screen">
        <div className="loading-logo">Owl Journey</div>
        <div className="loading-bar-track">
          <div className="loading-bar-fill" />
        </div>
      </div>

      {/* ============ SCROLL PROGRESS ============ */}
      <div className="scroll-progress" ref={progressBarRef} />

      {/* ============ LAYER 1: FIXED FLUID BACKGROUND ============ */}
      <div className="bg-sky">
        <div className="bg-sky__parallax" ref={bgSkyRef}>
          <FluidRevealBackground className="bg-sky__fx" hiddenLayerSrc="/Hiddenlayer.png" />
        </div>
      </div>

      {/* Layer 2 cloud canvas removed; fluid shader now owns both cursor and autonomous reveals. */}

      {/* ============ LAYER 3: CURSOR AMBIENT LIGHT ============ */}
      <div className="cursor-light" ref={cursorLightRef} />

      {/* ============ HEADER ============ */}
      <Header />

      {/* ============ LAYERS 5 & 6: SCROLLABLE CONTENT ============ */}
      <div className="scroll-container" ref={containerRef} id="scroll-container">
        {/* ===== HERO ===== */}
        <section className="hero" id="hero">
          <h1 className="hero-title">
            Wealth Intelligence for a <em>Confident Future.</em>
          </h1>

          <p className="hero-subtitle">
            Human expertise, amplified by advanced AI, to dynamically build, protect, and optimize your financial legacy.
          </p>

          <div className="hero-actions">
            <a href="#story" className="btn-primary">
              Start Your Strategy
            </a>
            <a href="#gallery" className="btn-ghost">
              See How It Works
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </a>
          </div>

          <div className="scroll-indicator">
            <span>Scroll</span>
            <div className="scroll-line" />
          </div>
        </section>

        {/* ===== VIDEO SECTION ===== */}
        <CinematicVideoSection
          src="/Video_Photos/video.mp4"
          poster="/Background/BlueSky.png"
          eyebrow="The Story"
          headline="A cinematic journey, centered with intent."
          subtext="Scroll to bring the frame into focus, then click to watch fullscreen. The transition uses strict bounding-box calculations for seamless expansion."
        />

        {/* ===== CINEMATIC EDITORIAL GALLERY ===== */}
        <CinematicEditorialGallery />

        {/* ===== PRECEDING TEXT + USE CASES SECTION (AuXie) ===== */}
        <div className="auxie-preceding-text">
          <p>
            Every journey begins with a single glance upward. Move your cursor. Scroll the page. Watch the clouds part and the sky reveal itself, one layer at a time.
          </p>
        </div>
        <UseCasesSection />

        {/* ===== ORYZO SCROLL-DRIVEN SECTION ===== */}
        <OryzoSection />

        {/* ===== CTA SECTION ===== */}
        <section className="section-cta" id="contact">
          <h2 className="cta-title">
            Every journey begins with a single glance upward.
          </h2>
          <p className="cta-sub">
            Move your cursor. Scroll the page. Watch the clouds
            part and the sky reveal itself, one layer at a time.
          </p>
          <div className="cta-actions">
            <a href="#hero" className="btn-primary">
              Return to the Sky
            </a>
          </div>
        </section>

        <PieterSplitSection />

        {/* End of scroll narrative: card sequence, then footer in normal flow (no overlap with pinned stage) */}
        <div className="site-end-cap">
          <StickyStackingCardsSection />
          <div className="site-footer-region" id="site-footer-region">
            <footer className="footer" id="site-footer">
              <p>
                © 2026 Owl Journey. A scroll-driven storytelling experience.
                Crafted with depth and intention.
              </p>
            </footer>
          </div>
        </div>
      </div>
    </>
  );
}
