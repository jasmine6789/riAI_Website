"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function PieterSplitSection() {
  const trackRef = useRef(null);
  const cardOneRef = useRef(null);
  const cardTwoRef = useRef(null);
  const cardThreeRef = useRef(null);

  useLayoutEffect(() => {
    if (!trackRef.current) return undefined;

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

      gsap.timeline({
        scrollTrigger: {
          trigger: trackRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
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
            x: 30,
            y: 40,
            rotate: 8,
            yPercent: -50,
            duration: 0.7,
            ease: "none",
          },
          0.98,
        );
    }, trackRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="pieter-split-track" ref={trackRef} aria-label="Pieter process highlights">
      <div className="pieter-split-sticky">
        <div className="pieter-split">
          <div className="pieter-split__left">
            <h2 className="pieter-split__heading">
              <span>SELLING YOUR</span>
              <span>PAINTING?</span>
              <em>IT STARTS HERE</em>
            </h2>
            <p className="pieter-split__body">
              At Pieter Koopt®, your artwork takes centre stage: we treat each piece with respect and personal
              attention. Our goal is to offer a hassle-free sales process, so that the story of your artwork lives on.
            </p>
            <a className="pieter-split__cta" href="#contact">
              <span>READ MORE ABOUT PIETER KOOPT</span>
              <span className="pieter-split__ctaArrow" aria-hidden="true">
                ›
              </span>
            </a>
          </div>

          <div className="pieter-split__right">
            <article className="pieter-split__card pieter-split__card--one" ref={cardOneRef}>
              <h3>NO HIDDEN FEES</h3>
              <p>You receive 100% of the offer.</p>
            </article>
            <article className="pieter-split__card pieter-split__card--two" ref={cardTwoRef}>
              <h3>EXPERT ASSESSMENT AT HOME</h3>
              <p>We come to you and arrange everything.</p>
            </article>
            <article className="pieter-split__card pieter-split__card--three" ref={cardThreeRef}>
              <h3>FAST AND PERSONAL PROCESS</h3>
              <p>A response to your submission within 48 hours.</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

