"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/** Must match `.sticky-stack-pinTrack { --sticky-stack-scroll-end }` in `globals.css` (drives layout height vs ScrollTrigger `end`). */
const STICKY_STACK_SCROLL_END_PX = 3600;

const STEP_CARDS = [
  {
    number: "01",
    titleMain: "DISCOVERY &",
    titleAccent: "ALIGNMENT",
    description:
      "We begin by understanding your unique financial goals, risk tolerance, and long-term vision for your legacy.",
    image: "/Background/BlueSky.png",
  },
  {
    number: "02",
    titleMain: "AI STRATEGY",
    titleAccent: "MODELING",
    description:
      "Our advanced AI models analyze global markets to build a dynamically optimized portfolio tailored specifically to you.",
    image: "/Background/BlueSky.png",
  },
  {
    number: "03",
    titleMain: "DYNAMIC",
    titleAccent: "OPTIMIZATION",
    description:
      "We continuously monitor and adjust your strategy in real-time, ensuring your wealth is protected and growing with precision.",
    image: "/Background/BlueSky.png",
  },
];

export default function StickyStackingCardsSection() {
  const sectionRef = useRef(null);
  const pinTrackRef = useRef(null);
  const pinContainerRef = useRef(null);
  const fixedStageBgRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    if (!sectionRef.current || !pinTrackRef.current || !pinContainerRef.current) return undefined;

    const ctx = gsap.context(() => {
      const motions = cardRefs.current.filter(Boolean);
      if (!motions.length) return;

      const fixedBg = fixedStageBgRef.current;

      gsap.set(motions, {
        yPercent: 150,
        autoAlpha: 1,
        scale: 1,
        y: 0,
        filter: "brightness(1)",
        force3D: true,
      });

      gsap.set(motions[0], { yPercent: 0 });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: pinTrackRef.current,
            start: "top top",
            end: `+=${STICKY_STACK_SCROLL_END_PX}px`,
            scrub: 1,
            pin: pinContainerRef.current,
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onToggle: (self) => {
              if (!fixedBg) return;
              fixedBg.classList.toggle("is-active", self.isActive);
            },
          },
        })
        .to(
          motions[0],
          {
            y: 0,
            duration: 0.24,
            ease: "none",
          },
          0,
        )
        .to(
          motions[1],
          {
            yPercent: 0,
            y: 20,
            duration: 0.6,
            ease: "none",
          },
          0.3,
        )
        .to(
          motions[0],
          {
            scale: 0.95,
            y: -40,
            filter: "brightness(0.78)",
            autoAlpha: 0.84,
            duration: 0.6,
            ease: "none",
          },
          0.3,
        )
        .to(
          motions[2],
          {
            yPercent: 0,
            y: 0,
            duration: 0.72,
            ease: "none",
          },
          0.84,
        )
        .to(
          motions[1],
          {
            scale: 0.86,
            y: -68,
            filter: "brightness(0.62)",
            autoAlpha: 0.38,
            duration: 0.72,
            ease: "none",
          },
          0.84,
        )
        .to(
          motions[0],
          {
            scale: 0.78,
            y: -104,
            filter: "brightness(0.48)",
            autoAlpha: 0.14,
            duration: 0.72,
            ease: "none",
          },
          0.84,
        );
    }, sectionRef);

    return () => {
      fixedStageBgRef.current?.classList.remove("is-active");
      ctx.revert();
    };
  }, []);

  return (
    <section
      className="sticky-stack-section"
      id="how-it-works"
      aria-label="Selling paintings without the hassle"
      ref={sectionRef}
    >
      <div className="sticky-stack-introStage">
        <header className="sticky-stack-intro">
          <h2 className="sticky-stack-intro__title">BUILDING WEALTH WITHOUT THE HASSLE</h2>
          <p className="sticky-stack-intro__copy">
            At RIAI Capital, we keep things simple, fast and transparent. Follow the steps below and we will take care of
            the rest.
          </p>
        </header>
      </div>

      {/* Fixed to the viewport (not the pinned wrapper) so charcoal stays perfectly still while only cards animate */}
      <div className="sticky-stack-fixedStageBg" aria-hidden="true" ref={fixedStageBgRef} />

      <div className="sticky-stack-pinTrack" ref={pinTrackRef}>
        <div className="sticky-stack-pinContainer" ref={pinContainerRef}>
          <div className="sticky-stack-cards">
            {STEP_CARDS.map((card, index) => (
              <article
                className={`sticky-stack-card sticky-stack-card--${index + 1}`}
                key={`${card.number}-${card.titleMain}`}
              >
                <div
                  className={`sticky-stack-card__motion${index > 0 ? " is-angled" : ""}`}
                  ref={(el) => {
                    cardRefs.current[index] = el;
                  }}
                >
                  <div className="sticky-stack-card__textCol">
                    <span className="sticky-stack-card__number">{card.number}</span>
                    <h3 className="sticky-stack-card__title">
                      <span>{card.titleMain} </span>
                      <em>{card.titleAccent}</em>
                    </h3>
                    <p className="sticky-stack-card__desc">{card.description}</p>
                  </div>

                  <div className="sticky-stack-card__imageCol">
                    <div className="sticky-stack-card__imageWrap">
                      <Image
                        src={card.image}
                        alt={`Step ${card.number} visual`}
                        fill
                        sizes="(max-width: 900px) 100vw, 42vw"
                        className="sticky-stack-card__image"
                      />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
