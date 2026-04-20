"use client";

import { useEffect, useLayoutEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { setOwlLenis } from "@/lib/owlLenis";
import CinematicVideoSection from "./CinematicVideoSection";
import FluidRevealBackground from "./background/FluidRevealBackground";
import SpatialCarouselFeatures from "./SpatialCarouselFeatures";
// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const FEATURE_ITEMS = [
  {
    icon: "🌫️",
    title: "Cloud Masking",
    description:
      "A cursor-driven reveal system that gently brushes away clouds to expose the sky beneath — soft, diffused, and organic.",
  },
  {
    icon: "✨",
    title: "6-Layer Depth",
    description:
      "From the distant sky to floating cards, each layer moves at its own pace to create genuine atmospheric depth.",
  },
  {
    icon: "🪶",
    title: "Subtle Parallax",
    description:
      "Content cards float above the atmosphere with gentle parallax scrolling — each piece feeling isolated and elevated.",
  },
  {
    icon: "💫",
    title: "Ambient Motion",
    description:
      "Barely visible shapes drift through the layers, adding life and breath to the atmosphere without distraction.",
  },
  {
    icon: "🎬",
    title: "Cinematic Reveals",
    description:
      "Scroll-triggered entrance animations bring each section to life with slow, smooth, refined timing.",
  },
  {
    icon: "🌊",
    title: "Smooth Scrolling",
    description:
      "Lenis-powered scroll with custom easing curves ensures every interaction feels fluid and intentional.",
  },
];

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
  const navRef = useRef(null);

  // ========== CURSOR TRACKING ==========
  const handleMouseMove = useCallback((e) => {
    // Cursor light follows with GSAP easing
    if (cursorLightRef.current) {
      gsap.to(cursorLightRef.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 1.6,
        ease: "power3.out",
      });
    }
  }, []);

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

    // ========== CURSOR EVENTS ==========
    window.addEventListener("mousemove", handleMouseMove);

    // ========== NAV SCROLL STATE ==========
    const nav = navRef.current;
    ScrollTrigger.create({
      start: "top -80",
      onUpdate: (self) => {
        if (nav) {
          if (self.scroll() > 80) {
            nav.classList.add("scrolled");
          } else {
            nav.classList.remove("scrolled");
          }
        }
      },
    });

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

    // ========== VIDEO CARD PARALLAX ==========
    // ========== GALLERY CARD PARALLAX ==========
    const galleryCards = document.querySelectorAll(".gallery-card");
    galleryCards.forEach((card, i) => {
      gsap.to(card, {
        y: -(15 + i * 5),
        ease: "none",
        scrollTrigger: {
          trigger: card,
          start: "top bottom",
          end: "bottom top",
          scrub: 2,
        },
      });
    });

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

    // Gallery cards reveal
    galleryCards.forEach((card, i) => {
      gsap.to(card, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        delay: i * 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: card,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });
    });

    // Gallery header
    const galleryHeader = document.querySelectorAll(
      ".gallery-header .section-label, .gallery-header .section-heading, .gallery-header .section-desc"
    );
    galleryHeader.forEach((el, i) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        delay: i * 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });
    });

    // Features section
    const featuresHeader = document.querySelectorAll(
      ".features-header .section-label, .features-header .section-heading, .features-header .section-desc"
    );
    featuresHeader.forEach((el, i) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        delay: i * 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });
    });

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
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      ScrollTrigger.getAll().forEach((st) => st.kill());
      setOwlLenis(null);
      lenis.destroy();
    };
  }, [handleMouseMove]);

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

      {/* ============ NAVIGATION ============ */}
      <nav className="nav" ref={navRef} id="main-nav">
        <a href="#" className="nav-logo">
          Owl Journey
        </a>
        <ul className="nav-links">
          <li>
            <a href="#story">Story</a>
          </li>
          <li>
            <a href="#gallery">Gallery</a>
          </li>
          <li>
            <a href="#about">About</a>
          </li>
          <li>
            <a href="#contact">Contact</a>
          </li>
        </ul>
        <a href="#contact" className="nav-cta">
          Explore
        </a>
      </nav>

      {/* ============ LAYERS 5 & 6: SCROLLABLE CONTENT ============ */}
      <div className="scroll-container" ref={containerRef} id="scroll-container">
        {/* ===== HERO ===== */}
        <section className="hero" id="hero">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            A Scroll-Driven Story
          </div>

          <h1 className="hero-title">
            Through the Clouds, <em>Into the Unknown</em>
          </h1>

          <p className="hero-subtitle">
            Follow the journey of an owl soaring through layers of mist and
            sky — an immersive, depth-driven experience crafted for wonder.
          </p>

          <div className="hero-actions">
            <a href="#story" className="btn-primary">
              Begin the Journey
            </a>
            <a href="#gallery" className="btn-ghost">
              View Gallery
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
        {/* ===== GALLERY / IMAGE CARDS SECTION ===== */}
        <section className="section-gallery" id="gallery">
          <div className="gallery-header">
            <span className="section-label">Gallery</span>
            <h2 className="section-heading">
              Moments captured between earth and sky
            </h2>
            <p className="section-desc">
              Each frame floats independently — isolated, elevated,
              suspended in the quiet atmosphere of the journey.
            </p>
          </div>

          <div className="gallery-grid">
            <div className="glass-card gallery-card">
              <div className="gallery-card-inner">
                <img
                  src="/Background/BlueSky.png"
                  alt="Dawn breaking through clouds"
                />
              </div>
              <div className="gallery-card-content">
                <h3>First Light</h3>
                <p>
                  The earliest moments of flight, when the world below is
                  still draped in morning mist.
                </p>
              </div>
            </div>

            <div className="glass-card gallery-card">
              <div className="gallery-card-inner">
                <img
                  src="/Background/BlueSky.png"
                  alt="Soaring through cloud layers"
                />
              </div>
              <div className="gallery-card-content">
                <h3>Cloud Passage</h3>
                <p>
                  Threading through veils of vapor, where visibility
                  narrows to just wingspans ahead.
                </p>
              </div>
            </div>

            <div className="glass-card gallery-card">
              <div className="gallery-card-inner">
                <img
                  src="/Background/BlueSky.png"
                  alt="Open sky above the clouds"
                />
              </div>
              <div className="gallery-card-content">
                <h3>Above It All</h3>
                <p>
                  Breaking through the final layer into boundless blue —
                  where the journey finds its clarity.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FEATURES SECTION ===== */}
        <section className="section-features" id="about">
          <div className="features-header">
            <span className="section-label">About This Experience</span>
            <h2 className="section-heading">
              Built with depth, motion, and intention
            </h2>
            <p className="section-desc">
              Every layer, every motion, every subtle shift is designed
              to immerse you in the atmosphere of flight.
            </p>
          </div>

          <div className="features-lock">
            <div className="features-lock__sticky">
              <SpatialCarouselFeatures items={FEATURE_ITEMS} />
            </div>
          </div>
        </section>

        {/* ===== STATS SECTION ===== */}
        <section className="section-stats">
          <div className="glass-card stats-card">
            <div className="stat-item">
              <span className="stat-number">6</span>
              <span className="stat-label">Depth Layers</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">∞</span>
              <span className="stat-label">Scroll Moments</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">1</span>
              <span className="stat-label">Owl&apos;s Journey</span>
            </div>
          </div>
        </section>

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

        {/* ===== FOOTER ===== */}
        <footer className="footer">
          <p>
            © 2026 Owl Journey. A scroll-driven storytelling experience.
            Crafted with depth and intention.
          </p>
        </footer>
      </div>
    </>
  );
}
