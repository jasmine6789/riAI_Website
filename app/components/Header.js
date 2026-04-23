"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import "./Header.css";

const NAV_LINKS = [
  { href: "#hero", label: "Home" },
  { href: "#what-we-do-section", label: "What We Do" },
  { href: "#gallery-editorial", label: "Who We Serve" },
  { href: "#know-us-better", label: "Know Us Better" },
  { href: "#oryzo-section", label: "Resources" },
];

export default function Header() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroFrameVisible, setHeroFrameVisible] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const audioRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    const audioUrl = "/Clarinet%20Concerto%20in%20A%20major%2C%20K.%20622%20-%20II.%20Adagio.mp3";
    audioRef.current = new Audio(audioUrl);
    audioRef.current.loop = true;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const onScroll = useCallback(() => {
    const threshold = typeof window !== "undefined" ? window.innerHeight * 0.65 : 520;
    setScrolled(window.scrollY > threshold);
  }, []);

  useEffect(() => {
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  /* Thin page frame: only while #hero is on screen; fades out when scrolling into the next section */
  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return undefined;

    const io = new IntersectionObserver(
      ([entry]) => {
        setHeroFrameVisible(entry.isIntersecting && entry.intersectionRatio > 0.02);
      },
      { root: null, rootMargin: "0px", threshold: [0, 0.02, 0.05, 0.1] },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("pk-nav-mobile-open", mobileOpen);
    return () => document.body.classList.remove("pk-nav-mobile-open");
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((e) => console.error("Audio play failed:", e));
    }
    setIsPlaying(!isPlaying);
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <div
        className={`pk-page-frame${heroFrameVisible ? "" : " pk-page-frame--hidden"}`}
        aria-hidden="true"
      />
      <header ref={headerRef} className={`pk-header${scrolled ? " is-scrolled" : ""}${mobileOpen ? " is-mobile-open" : ""}`}>
        <div className="pk-header-left pk-box">
          <a href="#hero" className="pk-logo">
            riAI
          </a>
          <button
            type="button"
            className={`pk-sound-btn ${isPlaying ? "playing" : ""}`}
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause ambient audio" : "Play ambient audio"}
          >
            <div className="sound-bars">
              <span className="bar" />
              <span className="bar" />
              <span className="bar" />
              <span className="bar" />
              <span className="bar" />
            </div>
          </button>
          <button
            type="button"
            className="pk-mobile-toggle"
            aria-expanded={mobileOpen}
            aria-controls="pk-mobile-nav"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span className="pk-mobile-toggle__bar" />
            <span className="pk-mobile-toggle__bar" />
            <span className="pk-mobile-toggle__bar" />
            <span className="visually-hidden">Menu</span>
          </button>
        </div>

        <nav className="pk-header-center pk-box" aria-label="Primary">
          {NAV_LINKS.map(({ href, label }) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>

        <div className="pk-header-right pk-box">
          <a href="#site-footer-region" className="pk-contact-cta">
            Contact Us
          </a>
        </div>

        <div
          id="pk-mobile-nav"
          className={`pk-mobile-drawer${mobileOpen ? " pk-mobile-drawer--open" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
        >
          <div className="pk-mobile-drawer__inner">
            <button type="button" className="pk-mobile-drawer__close" onClick={closeMobile} aria-label="Close menu">
              ×
            </button>
            {NAV_LINKS.map(({ href, label }) => (
              <a key={href} href={href} className="pk-mobile-drawer__link" onClick={closeMobile}>
                {label}
              </a>
            ))}
            <a href="#site-footer-region" className="pk-mobile-drawer__cta" onClick={closeMobile}>
              Contact Us
            </a>
          </div>
        </div>
      </header>
    </>
  );
}
