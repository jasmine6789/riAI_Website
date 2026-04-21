"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import NextImage from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const ALL_FILTER = "All";

const GALLERY_ITEMS = [
  {
    id: "item-1",
    title: "Quiet Horizon",
    caption: "A restrained composition of open air and soft gradients.",
    category: "Abstract",
    image: "/Background/BlueSky.png",
  },
  {
    id: "item-2",
    title: "Still Current",
    caption: "Minimal forms arranged to keep attention on atmosphere.",
    category: "Minimal",
    image: "/Background/BlueSky.png",
  },
  {
    id: "item-3",
    title: "Light Drift",
    caption: "Subtle tonal movement that feels calm and editorial.",
    category: "Visual",
    image: "/Background/BlueSky.png",
  },
  {
    id: "item-4",
    title: "Open Interval",
    caption: "Negative space used deliberately for visual breathing room.",
    category: "Abstract",
    image: "/Background/BlueSky.png",
  },
  {
    id: "item-5",
    title: "Thin Line Sky",
    caption: "Reduced detail with a clean, modern framing language.",
    category: "Minimal",
    image: "/Background/BlueSky.png",
  },
  {
    id: "item-6",
    title: "Soft Plane",
    caption: "A balanced visual that favors clarity over ornament.",
    category: "Visual",
    image: "/Background/BlueSky.png",
  },
];

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function FilterableGallerySection() {
  const sectionRef = useRef(null);
  const filterRowRef = useRef(null);
  const gridRef = useRef(null);
  const revealTriggerRef = useRef(null);
  const filterTimelineRef = useRef(null);
  const isFilteringRef = useRef(false);

  const [activeFilter, setActiveFilter] = useState(ALL_FILTER);
  const [visibleItems, setVisibleItems] = useState(GALLERY_ITEMS);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(GALLERY_ITEMS.map((item) => item.category)));
    return [ALL_FILTER, ...unique];
  }, []);

  const getFilteredItems = useCallback((filterValue) => {
    if (filterValue === ALL_FILTER) return GALLERY_ITEMS;
    return GALLERY_ITEMS.filter((item) => item.category === filterValue);
  }, []);

  useEffect(() => {
    const img = new window.Image();
    img.src = "/Background/BlueSky.png";
    if (!img.complete) return;
    void img.decode?.();
  }, []);

  useLayoutEffect(() => {
    if (!sectionRef.current) return undefined;

    const ctx = gsap.context(() => {
      const headerEls = gsap.utils.toArray(".gallery-header .section-label, .gallery-header .section-heading");
      const descEl = sectionRef.current?.querySelector(".gallery-header .section-desc");
      const filterEl = filterRowRef.current;
      const cards = gsap.utils.toArray(".gallery-card");
      const revealTargets = [...headerEls, descEl, filterEl, ...cards].filter(Boolean);

      gsap.set(revealTargets, { autoAlpha: 0, y: 16 });

      revealTriggerRef.current = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 82%",
          toggleActions: "play none none none",
          once: true,
        },
      });

      revealTriggerRef.current
        .to(headerEls, {
          autoAlpha: 1,
          y: 0,
          duration: 0.58,
          stagger: 0.07,
          ease: "power2.out",
        })
        .to(
          [descEl, filterEl].filter(Boolean),
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.05,
            ease: "power2.out",
          },
          "-=0.24",
        )
        .to(
          cards,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.44,
            stagger: 0.07,
            ease: "power2.out",
          },
          "-=0.16",
        );
    }, sectionRef);

    return () => {
      revealTriggerRef.current?.kill();
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    if (!gridRef.current) return;

    const cards = gridRef.current.querySelectorAll(".gallery-card");
    if (!cards.length) return;

    gsap.fromTo(
      cards,
      { autoAlpha: 0, y: 10 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.34,
        stagger: 0.05,
        ease: "power2.out",
        force3D: true,
      },
    );
  }, [visibleItems]);

  const handleFilterClick = useCallback(
    (nextFilter) => {
      if (nextFilter === activeFilter || isFilteringRef.current) return;

      setActiveFilter(nextFilter);
      isFilteringRef.current = true;
      filterTimelineRef.current?.kill();

      const nextItems = getFilteredItems(nextFilter);
      const currentCards = gridRef.current ? Array.from(gridRef.current.querySelectorAll(".gallery-card")) : [];

      if (!currentCards.length) {
        setVisibleItems(nextItems);
        isFilteringRef.current = false;
        return;
      }

      filterTimelineRef.current = gsap.timeline({
        defaults: { ease: "power2.out" },
        onComplete: () => {
          setVisibleItems(nextItems);
          requestAnimationFrame(() => {
            isFilteringRef.current = false;
          });
        },
      });

      filterTimelineRef.current.to(currentCards, {
        autoAlpha: 0,
        y: 8,
        duration: 0.2,
        stagger: 0.03,
        force3D: true,
      });
    },
    [activeFilter, getFilteredItems],
  );

  return (
    <section className="section-gallery" id="gallery" ref={sectionRef} aria-label="Filterable gallery">
      <div className="gallery-header">
        <h2 className="section-heading">A curated visual collection</h2>
        <p className="section-desc">
          Explore a refined set of stills with a clean filter system designed for clarity and focus.
        </p>
      </div>

      <div className="gallery-filterRow" ref={filterRowRef} role="tablist" aria-label="Gallery categories">
        {categories.map((category) => {
          const isActive = category === activeFilter;
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`gallery-filterBtn${isActive ? " is-active" : ""}`}
              onClick={() => handleFilterClick(category)}
            >
              {category}
            </button>
          );
        })}
      </div>

      <div className="gallery-grid" ref={gridRef}>
        {visibleItems.map((item) => (
          <article className="gallery-card" key={item.id}>
            <div className="gallery-card-inner">
              <NextImage
                src={item.image}
                alt={item.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="gallery-card-image"
              />
            </div>
            <div className="gallery-card-content">
              <h3>{item.title}</h3>
              <p>{item.caption}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

