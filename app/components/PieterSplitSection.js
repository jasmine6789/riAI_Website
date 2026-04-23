"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const PIETER_SCRUB = 1.25;

export default function PieterSplitSection() {
  const trackRef = useRef(null);
  const cardOneRef = useRef(null);
  const cardTwoRef = useRef(null);
  const cardThreeRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const ctx = gsap.context(() => {
      const cards = [cardOneRef.current, cardTwoRef.current, cardThreeRef.current].filter(Boolean);
      if (!cards.length) return;

      gsap.set(cards, {
        x: 0,
        y: 0,
        xPercent: -50,
        yPercent: 150,
        rotate: 0,
        autoAlpha: 1,
        force3D: true,
      });

      gsap.set([cardTwoRef.current, cardThreeRef.current], { autoAlpha: 0 });

      gsap.timeline({
        scrollTrigger: {
          trigger: track,
          start: "top top",
          end: "bottom bottom",
          scrub: PIETER_SCRUB,
          invalidateOnRefresh: true,
        },
      })
        .to(
          cardOneRef.current,
          {
            x: 0,
            y: 0,
            rotate: 0,
            yPercent: -50,
            duration: 0.7,
            ease: "none",
          },
          0.06,
        )
        .to(
          cardTwoRef.current,
          {
            autoAlpha: 1,
            x: 15,
            y: 20,
            rotate: 4,
            yPercent: -50,
            duration: 0.7,
            ease: "none",
          },
          0.52,
        )
        .to(
          cardThreeRef.current,
          {
            autoAlpha: 1,
            x: 30,
            y: 40,
            rotate: 8,
            yPercent: -50,
            duration: 0.7,
            ease: "none",
          },
          0.98,
        );
    }, track);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={trackRef}
      id="know-us-better"
      className="pieter-split-section-track"
      aria-label="Pieter process highlights"
    >
      <div className="pieter-split-section-stage">
        <div className="pieter-split">
          <div className="pieter-split__left">
            <h2 className="pieter-split__heading">
              <span>PROTECT YOUR</span>
              <span>LEGACY?</span>
              <em>IT STARTS HERE</em>
            </h2>
            <p className="pieter-split__body">
              At RIAI Capital, your financial future takes centre stage: we treat each portfolio with respect and personal
              attention. Our goal is to offer a dynamic management process, so that your legacy lives on.
            </p>
            <a className="pieter-split__cta" href="#about">
              <span>READ MORE ABOUT RIAI CAPITAL</span>
              <span className="pieter-split__ctaArrow" aria-hidden="true">
                ›
              </span>
            </a>
          </div>

          <div className="pieter-split__right">
            <article className="pieter-split__card pieter-split__card--one" ref={cardOneRef}>
              <h3>NO HIDDEN FEES</h3>
              <p>Transparent pricing, 100% value focused.</p>
            </article>
            <article className="pieter-split__card pieter-split__card--two" ref={cardTwoRef}>
              <h3>AI-POWERED INSIGHTS</h3>
              <p>Advanced intelligence monitoring your assets 24/7.</p>
            </article>
            <article className="pieter-split__card pieter-split__card--three" ref={cardThreeRef}>
              <h3>PERSONAL STRATEGY</h3>
              <p>A bespoke plan tailored to your unique financial goals.</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
