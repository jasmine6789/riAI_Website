"use client";

import { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────
   USE CASES DATA
   ───────────────────────────────────────────── */
const USE_CASES = [
  { id: "wm-1", number: "01", label: "Wealth management" },
  { id: "wm-2", number: "02", label: "Financial planning" },
  { id: "wm-3", number: "03", label: "Portfolio Management" },
  { id: "wm-4", number: "04", label: "Small Business Ownership" },
  { id: "wm-5", number: "05", label: "Financial Education" },
];

const IMAGES = [
  "https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1527&q=80",
  "https://images.unsplash.com/photo-1477120206578-46b3ca98a4e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80",
  "https://images.unsplash.com/photo-1505576391880-b3f9d713dc4f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80",
  "https://images.unsplash.com/photo-1527986654082-0b5b3fef2632?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
  "https://images.unsplash.com/photo-1523699289804-55347c09047d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80",
];

/* ─────────────────────────────────────────────
   USE CASES SECTION COMPONENT
   Replicated from AuXie / Twinbro Website
   ───────────────────────────────────────────── */
export default function UseCasesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef(null);
  const imageWrapperRef = useRef(null);

  /* Handle hover on each use-case row — shift images via translateY */
  const handleHover = (index) => {
    setActiveIndex(index);
  };

  return (
    <section className="auxie-usecases" id="what-we-do-section" ref={sectionRef}>
      <div className="auxie-usecases__inner">
        {/* ── LEFT COLUMN ── */}
        <div className="auxie-usecases__left">
          <div className="auxie-usecases__left-top">
            <h2 className="auxie-usecases__heading">What we do</h2>
          </div>

          <div className="auxie-usecases__left-bottom">
            <div className="auxie-usecases__list">
              {USE_CASES.map((item, i) => (
                <div
                  key={item.id}
                  className={`auxie-usecases__item ${
                    activeIndex === i ? "auxie-usecases__item--active" : ""
                  }`}
                  onMouseEnter={() => handleHover(i)}
                >
                  <div className="auxie-usecases__item-inner">
                    <h4 className="auxie-usecases__item-number">{item.number}</h4>
                    <p className="auxie-usecases__item-label">{item.label}</p>
                    <svg
                      className="auxie-usecases__item-arrow"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="auxie-usecases__right">
          <div className="auxie-usecases__image-wrapper" ref={imageWrapperRef}>
            {IMAGES.map((src, i) => (
              <div className="auxie-usecases__image-slide" key={i}>
                <img
                  className="auxie-usecases__image"
                  src={src}
                  alt={USE_CASES[i]?.label ?? `Focus area ${i + 1}`}
                  style={{
                    transform: `translateY(${(i - activeIndex) * 100}%)`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
