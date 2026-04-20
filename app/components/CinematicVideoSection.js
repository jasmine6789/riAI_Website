"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getOwlLenis } from "@/lib/owlLenis";
import FluidVideoDistortion from "./fluid/FluidVideoDistortion";

const MARQUEE_REPEAT = 20;

function CinemaMarquee({ variant }) {
  const dir = variant === "top" ? "rtl" : "ltr";
  const renderSeq = (keyPrefix) =>
    Array.from({ length: MARQUEE_REPEAT }, (_, i) => (
      <span key={`${keyPrefix}-${i}`} className="owl-cinema__marqueeItem">
        <span className="owl-cinema__marqueeTri" aria-hidden="true">{"\u25B6\u25B6\u25B6"}</span>
        PLAY VIDEO
      </span>
    ));

  return (
    <div className={`owl-cinema__marquee owl-cinema__marquee--${variant}`} aria-hidden="true">
      <div className={`owl-cinema__marqueeTrack owl-cinema__marqueeTrack--${dir}`}>
        <div className="owl-cinema__marqueeSeq">{renderSeq("a")}</div>
        <div className="owl-cinema__marqueeSeq">{renderSeq("b")}</div>
      </div>
    </div>
  );
}

export default function CinematicVideoSection({
  src,
  poster,
  headline,
  sectionId = "story",
}) {
  const videoRef = useRef(null);
  const sectionRef = useRef(null);
  const frameRef = useRef(null);
  const fsCursorRef = useRef(null);
  const fsCursorMarkRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playHovered, setPlayHovered] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
    document.documentElement.style.overflow = "";
    const v = videoRef.current;
    if (v) {
      v.controls = false;
    }
  }, []);

  const openFullscreen = useCallback(() => {
    if (isFullscreen) return;
    const v = videoRef.current;
    if (v) {
      v.muted = false;
      void v.play().catch(() => {
        v.muted = true;
        void v.play().catch(() => {});
      });
    }
    setIsFullscreen(true);
    document.documentElement.style.overflow = "hidden";
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) setPlayHovered(false);
  }, [isFullscreen]);

  /** After commit, unmute + play. JSX `muted={!isFullscreen}` keeps inline muted for autoplay; React was re-applying `muted` every render and undoing unmute in fullscreen. */
  useEffect(() => {
    if (!isFullscreen) return undefined;
    const v = videoRef.current;
    if (!v) return undefined;

    let cancelled = false;

    const startPlayback = async () => {
      try {
        await v.play();
      } catch {
        if (cancelled) return;
        try {
          v.muted = true;
          await v.play();
        } catch {
          /* ignore */
        }
      }
    };

    void startPlayback();

    return () => {
      cancelled = true;
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) return undefined;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }
    const section = sectionRef.current;
    if (!section) return undefined;

    let cooling = false;
    const coolMs = 1100;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || cooling) return;
        const r = section.getBoundingClientRect();
        const mid = (r.top + r.bottom) / 2;
        const vmid = window.innerHeight / 2;
        if (Math.abs(mid - vmid) > window.innerHeight * 0.06) {
          cooling = true;
          window.setTimeout(() => {
            cooling = false;
          }, coolMs);
          const lenis = getOwlLenis();
          const rect = section.getBoundingClientRect();
          const offset = rect.height / 2 - window.innerHeight / 2;
          if (lenis) {
            lenis.scrollTo(section, { offset });
          } else {
            section.scrollIntoView({ block: "center", behavior: "smooth" });
          }
        }
      },
      { threshold: [0, 0.12, 0.25] }
    );

    io.observe(section);
    return () => io.disconnect();
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const frame = frameRef.current;
    if (frame) {
      frame.style.transform = "";
      frame.style.willChange = "auto";
    }
    return undefined;
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return undefined;

    const cursorEl = fsCursorRef.current;
    const markEl = fsCursorMarkRef.current;
    if (!cursorEl || !markEl) return undefined;

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const target = { x: cx, y: cy };
    const pos = { x: cx, y: cy };
    let lastMx = cx;
    let lastMy = cy;
    const vel = { x: 0, y: 0 };
    let tilt = 0;
    let tiltTarget = 0;
    let scale = 1;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;

      const lerpPos = 0.14;
      pos.x += (target.x - pos.x) * lerpPos;
      pos.y += (target.y - pos.y) * lerpPos;

      vel.x *= 0.86;
      vel.y *= 0.86;

      const speed = Math.hypot(vel.x, vel.y);
      if (speed > 0.35) {
        const angleDeg = (Math.atan2(vel.y, vel.x) * 180) / Math.PI;
        tiltTarget = clamp(angleDeg * 0.2, -20, 20);
      } else {
        tiltTarget *= 0.9;
      }
      tilt += (tiltTarget - tilt) * 0.16;

      const scaleTarget = 1 + clamp(speed * 0.014, 0, 0.14);
      scale += (scaleTarget - scale) * 0.14;

      cursorEl.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${scale})`;
      markEl.style.transform = `rotate(${tilt}deg)`;

      if (!cancelled) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);

    const onMove = (e) => {
      const dx = e.clientX - lastMx;
      const dy = e.clientY - lastMy;
      lastMx = e.clientX;
      lastMy = e.clientY;
      target.x = e.clientX;
      target.y = e.clientY;
      vel.x += dx * 0.55;
      vel.y += dy * 0.55;
    };

    const onKey = (e) => {
      if (e.key === "Escape") closeFullscreen();
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("keydown", onKey);

    return () => {
      cancelled = true;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("keydown", onKey);
    };
  }, [isFullscreen, closeFullscreen]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;

    const syncMeta = () => {
      setDuration(Number.isFinite(v.duration) ? v.duration : 0);
    };
    const syncTime = () => {
      setCurrentTime(v.currentTime || 0);
    };
    const syncMute = () => {
      setIsMuted(!!v.muted);
    };
    const syncPlaying = () => {
      setIsPlaying(!v.paused);
    };

    syncMeta();
    syncTime();
    syncMute();
    syncPlaying();

    v.addEventListener("loadedmetadata", syncMeta);
    v.addEventListener("durationchange", syncMeta);
    v.addEventListener("timeupdate", syncTime);
    v.addEventListener("volumechange", syncMute);
    v.addEventListener("play", syncPlaying);
    v.addEventListener("pause", syncPlaying);

    return () => {
      v.removeEventListener("loadedmetadata", syncMeta);
      v.removeEventListener("durationchange", syncMeta);
      v.removeEventListener("timeupdate", syncTime);
      v.removeEventListener("volumechange", syncMute);
      v.removeEventListener("play", syncPlaying);
      v.removeEventListener("pause", syncPlaying);
    };
  }, []);

  const onFullscreenLayerClick = useCallback(() => {
    closeFullscreen();
  }, [closeFullscreen]);

  const onFrameKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openFullscreen();
      }
    },
    [openFullscreen]
  );

  const progressValue = duration > 0 ? (currentTime / duration) * 100 : 0;

  const onProgressInput = useCallback((e) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const nextPct = Number(e.target.value);
    const nextTime = (nextPct / 100) * duration;
    v.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, [duration]);

  const toggleMute = useCallback((e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }, []);

  const togglePlayPause = useCallback((e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play().catch(() => {});
      return;
    }
    v.pause();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`owl-cinema${isFullscreen ? " owl-cinema--fs-active" : ""}`}
      id={sectionId}
      aria-label={headline || "Video"}
    >
      <div
        className={`owl-cinema__shell${isFullscreen ? " owl-cinema__shell--fullscreen" : ""}`}
        onClick={isFullscreen ? onFullscreenLayerClick : undefined}
      >
        <div
          className="owl-cinema__inner"
          style={isFullscreen ? { pointerEvents: "none" } : undefined}
        >
          <div
            className={`owl-cinema__videoStack${!isFullscreen && playHovered ? " owl-cinema__videoStack--playHover" : ""}`}
          >
            <div className="owl-cinema__videoStage">
              {/* Hover marquee disabled temporarily:
              {!isFullscreen && playHovered ? <CinemaMarquee variant="top" /> : null}
              */}
              <div
                ref={frameRef}
                className="owl-cinema__frame"
                role={isFullscreen ? undefined : "button"}
                tabIndex={isFullscreen ? -1 : 0}
                aria-label={isFullscreen ? undefined : "Open video fullscreen"}
                aria-expanded={isFullscreen}
                onClick={isFullscreen ? undefined : () => openFullscreen()}
                onKeyDown={isFullscreen ? undefined : onFrameKeyDown}
              >
                <video
                  ref={videoRef}
                  className={`owl-cinema__video${!isFullscreen ? " owl-cinema__video--sourceOnly" : ""}`}
                  src={src}
                  poster={poster}
                  playsInline
                  muted={!isFullscreen}
                  loop
                  autoPlay
                  preload="metadata"
                />
                {!isFullscreen ? <FluidVideoDistortion videoRef={videoRef} /> : null}
                {!isFullscreen ? (
                  <div className="owl-cinema__playOverlay">
                    <div className="owl-cinema__playRow">
                      {playHovered ? <span className="owl-cinema__playWord">PLAY</span> : null}
                      <button
                        type="button"
                        className="owl-cinema__playBtn"
                        aria-label="Play video fullscreen"
                        onMouseEnter={() => setPlayHovered(true)}
                        onMouseLeave={() => setPlayHovered(false)}
                        onFocus={() => setPlayHovered(true)}
                        onBlur={() => setPlayHovered(false)}
                        onClick={(e) => {
                          e.stopPropagation();
                          openFullscreen();
                        }}
                      >
                        <span className="owl-cinema__playBtnFill" aria-hidden="true" />
                        <svg className="owl-cinema__playBtnIcon" viewBox="0 0 24 24" aria-hidden="true">
                          <path fill="currentColor" d="M9.5 7.5v9l7.5-4.5L9.5 7.5z" />
                        </svg>
                      </button>
                      {playHovered ? <span className="owl-cinema__playWord">VIDEO</span> : null}
                    </div>
                  </div>
                ) : null}
              </div>
              {/* Hover marquee disabled temporarily:
              {!isFullscreen && playHovered ? <CinemaMarquee variant="bottom" /> : null}
              */}
            </div>
          </div>
        </div>

        {isFullscreen ? (
          <div
            className="owl-cinema__fs-controls"
            role="group"
            aria-label="Video controls"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="owl-cinema__fs-playBtn"
              onClick={togglePlayPause}
              aria-pressed={!isPlaying}
              aria-label={isPlaying ? "Pause video" : "Play video"}
            >
              {isPlaying ? "Play" : "Paused"}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progressValue}
              onChange={onProgressInput}
              className="owl-cinema__fs-progress"
              aria-label="Video progress"
              style={{ "--owl-fs-progress": progressValue }}
            />
            <button
              type="button"
              className="owl-cinema__fs-muteBtn"
              onClick={toggleMute}
              aria-pressed={isMuted}
              aria-label={isMuted ? "Unmute video" : "Mute video"}
            >
              {isMuted ? "UNMUTE" : "MUTE"}
            </button>
          </div>
        ) : null}

        {isFullscreen ? (
          <div ref={fsCursorRef} className="owl-cinema__fs-cursor" aria-hidden="true">
            <div ref={fsCursorMarkRef} className="owl-cinema__fs-cursorMark">
              <svg
                className="owl-cinema__fs-cursorX"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" stroke="currentColor" strokeWidth="1.65" strokeLinecap="butt" />
                <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" stroke="currentColor" strokeWidth="1.65" strokeLinecap="butt" />
              </svg>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
