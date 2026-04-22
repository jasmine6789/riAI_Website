"use client";

import { useState, useRef, useEffect } from "react";
import "./Header.css";

export default function Header() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Initialize audio with the file provided by user in public folder
    const audioUrl = "/Clarinet%20Concerto%20in%20A%20major%2C%20K.%20622%20-%20II.%20Adagio.mp3";
    audioRef.current = new Audio(audioUrl);
    audioRef.current.loop = true;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <>
      <div className="pk-page-frame"></div>
      <header className="pk-header">
        {/* LEFT SECTION */}
        <div className="pk-header-left pk-box">
        <a href="/" className="pk-logo">RIAI Capital</a>
        <button 
          className={`pk-sound-btn ${isPlaying ? 'playing' : ''}`} 
          onClick={togglePlay} 
          aria-label="Toggle Sound"
        >
          <div className="sound-bars">
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </div>
        </button>
        <button className="pk-lang-btn">EN</button>
        <a href="#whatsapp" className="pk-wa-btn" aria-label="WhatsApp">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
        </a>
      </div>

      {/* CENTER SECTION */}
      <nav className="pk-header-center pk-box">
        <a href="#home">Home</a>
        <a href="#about-us">About Us</a>
        <a href="#planning">Planning</a>
        <a href="#clients">Clients</a>
        <a href="#resources">Resources</a>
        <a href="#contact-us">Contact us</a>
      </nav>

      {/* RIGHT SECTION */}
      <div className="pk-header-right pk-box">
        <a href="#offer" className="pk-offer-btn">
          Know your benefits
          <span className="arrow-box">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </span>
        </a>
      </div>
    </header>
    </>
  );
}
