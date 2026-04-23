"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { STICKY_STACK_SCROLL_END_PX } from "@/app/lib/pinnedSectionConstants";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STICKY_STACK_SCRUB = 1.25;

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

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const pinTrack = pinTrackRef.current;
    const pinContainer = pinContainerRef.current;
    if (!section || !pinTrack || !pinContainer) return undefined;

    const ctx = gsap.context(() => {
      const motions = cardRefs.current.filter(Boolean);
      if (!motions.length) return;

      const fixedBg = fixedStageBgRef.current;

      gsap.set(motions, {
        yPercent: 150,
        autoAlpha: 0,
        scale: 1,
        x: 0,
        y: 0,
        rotate: 0,
        filter: "none",
        force3D: true,
      });

      gsap.set(motions[0], { yPercent: 0, autoAlpha: 1 });
      gsap.set([motions[1], motions[2]], { yPercent: 150, autoAlpha: 0 });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: pinTrack,
            start: "top top",
            end: `+=${STICKY_STACK_SCROLL_END_PX}px`,
            scrub: STICKY_STACK_SCRUB,
            pin: pinContainer,
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
          motions[1],
          {
            autoAlpha: 1,
            yPercent: 0,
            y: 0,
            duration: 0.48,
            ease: "none",
          },
          0.2,
        )
        .to(
          motions[0],
          {
            autoAlpha: 0,
            duration: 0.22,
            ease: "none",
          },
          0.34,
        )
        .to(
          motions[2],
          {
            autoAlpha: 1,
            yPercent: 0,
            y: 0,
            duration: 0.5,
            ease: "none",
          },
          0.56,
        )
        .to(
          motions[1],
          {
            autoAlpha: 0,
            duration: 0.22,
            ease: "none",
          },
          0.68,
        );
    }, section);

    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      fixedStageBgRef.current?.classList.remove("is-active");
      ctx.revert();
    };
  }, []);

  return (
    <section
      className="sticky-stack-section"
      id="how-it-works"
      aria-label="Our promise"
      ref={sectionRef}
    >
      <div className="sticky-stack-pinTrack" ref={pinTrackRef}>
        <div className="sticky-stack-pinContainer" ref={pinContainerRef}>
          <div className="sticky-stack-main">
            <div className="sticky-stack-introStage">
              <header className="sticky-stack-intro">
                <h2 className="sticky-stack-intro__title">
                  <span className="sticky-stack-intro__titleLine">
                    Our <em className="sticky-stack-intro__titleAccent">Promise</em>
                  </span>
                </h2>
              </header>
            </div>

            <div className="sticky-stack-cardsViewport">
              <div className="sticky-stack-cards">
                {STEP_CARDS.map((card, index) => (
                  <article
                    className={`sticky-stack-card sticky-stack-card--${index + 1}`}
                    key={`${card.number}-${card.titleMain}`}
                  >
                    <div
                      className="sticky-stack-card__motion"
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
        </div>
      </div>

      <div className="sticky-stack-fixedStageBg" aria-hidden="true" ref={fixedStageBgRef} />
    </section>
  );
}
