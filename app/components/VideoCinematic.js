"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function VideoCinematic({
  src,
  poster,
  eyebrow,
  headline,
  subtext,
}) {
  const sectionRef = useRef(null);
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const videoWrapperRef = useRef(null);
  const videoRef = useRef(null);
  const vignetteRef = useRef(null);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLockedIn, setIsLockedIn] = useState(false);
  const [showCloseBtn, setShowCloseBtn] = useState(false);
  
  // Track scroll position for stability
  const savedScrollY = useRef(0);
  const tlFullscreen = useRef(null);
  
// GSAP SCROLL SETUP
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return; 

    // We must ensure layout is stable before measuring
    const ctx = gsap.context(() => {
      
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "center center",
          end: "+=300%",
          pin: true,
          scrub: true,
          onUpdate: (self) => {
            if (self.progress > 0.95 && !isLockedIn) {
              setIsLockedIn(true);
            } else if (self.progress <= 0.95 && isLockedIn) {
              setIsLockedIn(false);
            }
          }
        },
      });

      // Calculate pure transform-based scroll pull
      const measureAndAnimate = () => {
        const wrapEl = videoWrapperRef.current;
        if (!wrapEl) return;
        
        // Reset safely to measure State A natively
        gsap.set(wrapEl, { clearProps: "all" });
        
        // State A: Get initial resting physical layout state
        const rect = wrapEl.getBoundingClientRect();
        
        // State C Target Dimensions:
        // Make the lock-in state 85vw, capped at 85vh to leave breathing room
        const maxW = window.innerWidth * 0.85;
        const maxH = window.innerHeight * 0.85;
        
        // Calculate max scale to fit within boundaries while preserving the exact 4/3 aspect ratio visually!
        const scaleByWidth = maxW / rect.width;
        const scaleByHeight = maxH / rect.height;
        const targetScale = Math.min(scaleByWidth, scaleByHeight);
        
        // Center coordinates
        const targetX = window.innerWidth / 2;
        const targetY = window.innerHeight / 2;

        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;

        // Transform distances mapped directly to physical center
        const moveX = targetX - startX;
        const moveY = targetY - startY;

        // State B: The Pinned Scroll Pull timeline
        // 100% Transform-based animation for pristine smooth interpolation (NO layout jitter)
        scrollTl
          .to(textRef.current, {
            opacity: 0,
            x: 40,
            filter: "blur(8px)",
            ease: "power2.inOut",
            duration: 0.4,
          }, 0)
          .to(vignetteRef.current, {
            opacity: 1,
            ease: "power2.inOut",
            duration: 0.7,
          }, 0)
          .to(wrapEl, {
            x: moveX,
            y: moveY,
            scale: targetScale,
            // Optically perfectly preserve the 24px border radius across scaling
            // by inversely scaling the CSS property relative to the container expansion!
            borderRadius: 24 / targetScale,
            transformOrigin: "center center",
            ease: "power2.inOut",
            duration: 1,
          }, 0)
          // State C: The explicit centered lock-in hold
          .to({}, { duration: 1.0 });
      };

      // Measure immediately
      measureAndAnimate();
      
      // Setup debounced resize for recalcs
      let resizeTimer;
      const onResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          measureAndAnimate();
        }, 100);
      };
      
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // FULLSCREEN TRANSITION LOGIC
  const handleVideoClick = () => {
    if (!isLockedIn || isFullscreen) return;

    const wrapEl = videoWrapperRef.current;
    if (!wrapEl) return;
    
    // 1. Capture the exact visually transformed boundaries currently on screen
    const rect = wrapEl.getBoundingClientRect();
    savedScrollY.current = window.scrollY;

    document.documentElement.style.overflow = "hidden";
    setIsFullscreen(true);

    const videoObj = videoRef.current;
    if (videoObj) {
      videoObj.muted = false;
      videoObj.controls = true;
    }

    // 2. Instantly convert visually scaled bounds into pristine Fixed bounds
    // By clearing the CSS transform, we avoid parent transformation traps,
    // allowing the fixed wrapper to perfectly sit exact where its ghost was.
    gsap.set(wrapEl, {
      clearProps: "transform,borderRadius",
      position: "fixed",
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      zIndex: 9998,
      margin: 0,
      borderRadius: "24px",
    });

    // 3. State D: Smoothly morph pristine fixed bounds to viewport
    tlFullscreen.current = gsap.timeline({
      onComplete: () => {
        setTimeout(() => setShowCloseBtn(true), 150);
      }
    });

    // Provide a safe uniform ~2cm (80px) padding at all inner bounds
    const paddingPerSide = 80;
    const maxW = window.innerWidth - (paddingPerSide * 2);
    const maxH = window.innerHeight - (paddingPerSide * 2);
    const aspectRatio = 16 / 9;

    let finalW = maxW;
    let finalH = finalW / aspectRatio;

    if (finalH > maxH) {
      finalH = maxH;
      finalW = finalH * aspectRatio;
    }

    const finalTop = (window.innerHeight - finalH) / 2;
    const finalLeft = (window.innerWidth - finalW) / 2;

    tlFullscreen.current.to(wrapEl, {
      top: finalTop,
      left: finalLeft,
      width: finalW,
      height: finalH,
      borderRadius: "24px",
      duration: 0.7,
      ease: "power3.inOut",
    });
  };

  const handleClose = () => {
    if (!tlFullscreen.current) return;
    
    setShowCloseBtn(false);

    // Completely reverse back to exactly where the lock-in state boundaries were
    tlFullscreen.current.reverse().then(() => {
      const wrapEl = videoWrapperRef.current;
      const videoObj = videoRef.current;
      
      if (wrapEl) {
        // Strip the fixed absolute CSS, restoring it seamlessly to GSAP's scroll tracking
        gsap.set(wrapEl, { clearProps: "position,top,left,width,height,zIndex,margin,borderRadius" });
      }
      
      if (videoObj) {
        videoObj.muted = true;
        videoObj.controls = false;
      }
      
      document.documentElement.style.overflow = "";
      window.scrollTo(0, savedScrollY.current); // Guarantee no layout slip
      
      setIsFullscreen(false);
    });
  };

  return (
    <>
      <section 
        ref={sectionRef} 
        className="cinematic-section"
        id="showcase"
      >
        {/* Fullscreen Vignette Overlay (Pin phase) */}
        <div ref={vignetteRef} className="cinematic-vignette" />

        {/* INNER CONTENT WRAPPER */}
        <div 
          ref={containerRef} 
          className="cinematic-container"
        >
          
          {/* LEFT: Small Video Block Wrapper */}
          <div className="cinematic-left-col">
            <div 
              ref={videoWrapperRef} 
              className="cinematic-video-wrapper"
              onClick={handleVideoClick}
            >
              <video
                ref={videoRef}
                src={src}
                poster={poster}
                autoPlay
                muted
                loop
                playsInline
                className={`cinematic-video-element ${isLockedIn && !isFullscreen ? "locked-in" : ""} ${isFullscreen ? "animating-fullscreen" : ""}`}
                style={{ borderRadius: isFullscreen ? "0px" : "24px" }}
              />
            </div>
          </div>

          {/* RIGHT: Text Content Block */}
          <div ref={textRef} className="cinematic-right-col">
            {eyebrow && (
              <span className="cinematic-eyebrow">
                {eyebrow}
              </span>
            )}
            <h2 className="cinematic-headline">
              {headline}
            </h2>
            <p className="cinematic-subtext">
              {subtext}
            </p>
          </div>
          
        </div>
      </section>

      {/* FULLSCREEN MODAL OVERLAYS */}
      <div className={`fullscreen-modal-bg ${isFullscreen ? "active" : ""}`} />
      
      <button 
        className={`cinematic-close-btn ${showCloseBtn ? "visible" : ""}`}
        onClick={handleClose}
        aria-label="Close fullscreen video"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </>
  );
}
