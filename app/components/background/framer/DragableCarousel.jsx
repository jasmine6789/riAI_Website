"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addPropertyControls, ControlType } from "framer";
import { animate, useMotionValue, useMotionValueEvent, useSpring } from "framer-motion";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80",
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function DragableCarousel(props) {
  const {
    images,
    slideWidth,
    slideHeight,
    gap,
    borderRadius,
    objectFit,
    perspective,
    rotateYMax,
    depthMax,
    sideScale,
    sideOpacity,
    snapStiffness,
    snapDamping,
    inertiaFactor,
    showArrows,
    showDots,
  } = props;

  const slides = images?.length ? images : FALLBACK_IMAGES;
  const count = slides.length;
  const step = slideWidth + gap;
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const wrapperRef = useRef(null);
  const trackRef = useRef(null);
  const slidesRef = useRef([]);
  const stopSnapRef = useRef(null);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startTrackX: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
  });
  const trackX = useMotionValue(0);
  const smoothedX = useSpring(trackX, {
    stiffness: Math.max(80, snapStiffness * 0.75),
    damping: Math.max(20, snapDamping * 0.7),
    mass: 0.72,
  });

  const centerXFor = useCallback(
    (index) => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return -index * step;
      return wrapper.offsetWidth * 0.5 - index * step - slideWidth * 0.5;
    },
    [slideWidth, step],
  );

  const renderSlides = useCallback(
    (xValue) => {
      const wrapper = wrapperRef.current;
      const track = trackRef.current;
      if (!wrapper || !track) return;

      const center = wrapper.offsetWidth * 0.5;
      track.style.transform = `translate3d(${xValue}px, 0, 0)`;
      slidesRef.current.forEach((slide, index) => {
        if (!slide) return;
        const slideCenter = index * step + slideWidth * 0.5 + xValue;
        const normalized = (slideCenter - center) / step;
        const abs = Math.abs(normalized);
        const clamped = Math.min(abs, 2);
        const rotate = clamp(-normalized * rotateYMax, -rotateYMax, rotateYMax);
        const depth = -Math.min(abs, 2.2) * depthMax;
        const scale = clamp(1 - clamped * (1 - sideScale), sideScale, 1);
        const opacity = clamp(1 - clamped * (1 - sideOpacity), sideOpacity, 1);
        const inwardX = -normalized * Math.min(abs, 1) * 30;
        const zIndex = Math.round(1000 - clamped * 90);

        slide.style.transform =
          `translate3d(${inwardX}px, 0, ${depth}px) rotateY(${rotate}deg) scale(${scale})`;
        slide.style.opacity = `${opacity}`;
        slide.style.zIndex = `${zIndex}`;
      });
    },
    [depthMax, rotateYMax, sideOpacity, sideScale, slideWidth, step],
  );

  const snapTo = useCallback(
    (index, immediate = false) => {
      const target = clamp(index, 0, Math.max(count - 1, 0));
      const x = centerXFor(target);
      activeIndexRef.current = target;
      setActiveIndex(target);

      if (stopSnapRef.current) stopSnapRef.current();
      if (immediate) {
        trackX.set(x);
        return;
      }

      stopSnapRef.current = animate(trackX, x, {
        type: "spring",
        stiffness: snapStiffness,
        damping: snapDamping,
        mass: 0.85,
      });
    },
    [centerXFor, count, snapDamping, snapStiffness, trackX],
  );

  useMotionValueEvent(smoothedX, "change", (value) => {
    renderSlides(value);
  });

  useEffect(() => {
    slidesRef.current = slidesRef.current.slice(0, count);
    requestAnimationFrame(() => snapTo(activeIndexRef.current, true));
    return () => {
      if (stopSnapRef.current) stopSnapRef.current();
    };
  }, [count, snapTo]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return undefined;

    const start = (event) => {
      if (stopSnapRef.current) stopSnapRef.current();
      dragRef.current.active = true;
      const x = "touches" in event ? event.touches[0].clientX : event.clientX;
      dragRef.current.startX = x;
      dragRef.current.startTrackX = trackX.get();
      dragRef.current.lastX = x;
      dragRef.current.lastTime = performance.now();
      dragRef.current.velocity = 0;
      wrapper.style.cursor = "grabbing";
    };

    const move = (event) => {
      if (!dragRef.current.active) return;
      if (event.cancelable) event.preventDefault();
      const x = "touches" in event ? event.touches[0].clientX : event.clientX;
      const now = performance.now();
      const dt = now - dragRef.current.lastTime;
      if (dt > 0) {
        dragRef.current.velocity = ((x - dragRef.current.lastX) / dt) * 1000;
      }
      dragRef.current.lastX = x;
      dragRef.current.lastTime = now;
      trackX.set(dragRef.current.startTrackX + (x - dragRef.current.startX));
    };

    const end = () => {
      if (!dragRef.current.active) return;
      dragRef.current.active = false;
      wrapper.style.cursor = "grab";

      const projected = trackX.get() + dragRef.current.velocity * inertiaFactor;
      const center = wrapper.offsetWidth * 0.5;
      let nearest = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let index = 0; index < count; index += 1) {
        const slideCenter = index * step + slideWidth * 0.5 + projected;
        const distance = Math.abs(slideCenter - center);
        if (distance < bestDistance) {
          bestDistance = distance;
          nearest = index;
        }
      }
      snapTo(nearest);
    };

    const resize = () => snapTo(activeIndexRef.current, true);

    wrapper.addEventListener("mousedown", start);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    wrapper.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);
    window.addEventListener("resize", resize);
    renderSlides(trackX.get());

    return () => {
      wrapper.removeEventListener("mousedown", start);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);
      wrapper.removeEventListener("touchstart", start);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
      window.removeEventListener("resize", resize);
      wrapper.style.cursor = "grab";
    };
  }, [count, inertiaFactor, renderSlides, slideWidth, snapTo, step, trackX]);

  return (
    <div ref={wrapperRef} style={{ ...wrapperStyle, perspective }}>
      <div ref={trackRef} style={{ ...trackStyle, gap }}>
        {slides.map((src, index) => (
          <div
            key={`${src}-${index}`}
            ref={(node) => {
              slidesRef.current[index] = node;
            }}
            style={{
              ...slideStyle,
              width: slideWidth,
              height: slideHeight,
              borderRadius,
              background: "#0f1720",
            }}
          >
            <img
              src={src}
              alt=""
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit,
                display: "block",
                pointerEvents: "none",
              }}
            />
          </div>
        ))}
      </div>

      {showArrows ? (
        <>
          <button type="button" aria-label="Previous slide" style={{ ...arrowStyle, left: 12 }} onClick={() => snapTo(activeIndexRef.current - 1)}>
            <span aria-hidden="true">&#8249;</span>
          </button>
          <button type="button" aria-label="Next slide" style={{ ...arrowStyle, right: 12 }} onClick={() => snapTo(activeIndexRef.current + 1)}>
            <span aria-hidden="true">&#8250;</span>
          </button>
        </>
      ) : null}

      {showDots ? (
        <div style={dotsRowStyle}>
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => snapTo(index)}
              style={{
                ...dotStyle,
                opacity: index === activeIndex ? 1 : 0.4,
                transform: index === activeIndex ? "scale(1.35)" : "scale(1)",
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

const wrapperStyle = {
  width: "100%",
  height: "100%",
  position: "relative",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  cursor: "grab",
  userSelect: "none",
  transformStyle: "preserve-3d",
};

const trackStyle = {
  display: "flex",
  alignItems: "center",
  willChange: "transform",
  transformStyle: "preserve-3d",
  padding: "0 32px",
};

const slideStyle = {
  flexShrink: 0,
  overflow: "hidden",
  transformStyle: "preserve-3d",
  backfaceVisibility: "hidden",
  boxShadow: "0 22px 58px rgba(0, 0, 0, 0.25)",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  willChange: "transform, opacity",
};

const arrowStyle = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 2000,
  width: 44,
  height: 44,
  borderRadius: 999,
  border: "none",
  background: "rgba(255,255,255,0.85)",
  color: "#111827",
  cursor: "pointer",
};

const dotsRowStyle = {
  position: "absolute",
  bottom: 14,
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  gap: 8,
  zIndex: 2000,
};

const dotStyle = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  border: "none",
  background: "rgba(17,24,39,0.8)",
  cursor: "pointer",
  transition: "opacity 0.2s ease, transform 0.2s ease",
};

DragableCarousel.defaultProps = {
  images: [],
  slideWidth: 320,
  slideHeight: 420,
  gap: 24,
  borderRadius: 14,
  objectFit: "cover",
  perspective: 1300,
  rotateYMax: 34,
  depthMax: 210,
  sideScale: 0.82,
  sideOpacity: 0.52,
  snapStiffness: 260,
  snapDamping: 32,
  inertiaFactor: 0.12,
  showArrows: true,
  showDots: true,
};

addPropertyControls(DragableCarousel, {
  images: { type: ControlType.Array, title: "Images", control: { type: ControlType.Image } },
  slideWidth: { type: ControlType.Number, title: "Slide W", min: 120, max: 900, step: 10 },
  slideHeight: { type: ControlType.Number, title: "Slide H", min: 120, max: 900, step: 10 },
  gap: { type: ControlType.Number, title: "Gap", min: 0, max: 120, step: 1 },
  borderRadius: { type: ControlType.Number, title: "Radius", min: 0, max: 64, step: 1 },
  objectFit: {
    type: ControlType.Enum,
    title: "Fit",
    options: ["cover", "contain", "fill"],
    optionTitles: ["Cover", "Contain", "Fill"],
  },
  perspective: { type: ControlType.Number, title: "Perspective", min: 400, max: 2400, step: 20 },
  rotateYMax: { type: ControlType.Number, title: "Rotate Y", min: 0, max: 70, step: 1 },
  depthMax: { type: ControlType.Number, title: "Depth", min: 0, max: 420, step: 5 },
  sideScale: { type: ControlType.Number, title: "Side Scale", min: 0.55, max: 1, step: 0.01 },
  sideOpacity: { type: ControlType.Number, title: "Side Opacity", min: 0.2, max: 1, step: 0.01 },
  snapStiffness: { type: ControlType.Number, title: "Snap K", min: 80, max: 420, step: 5 },
  snapDamping: { type: ControlType.Number, title: "Snap D", min: 10, max: 60, step: 1 },
  inertiaFactor: { type: ControlType.Number, title: "Inertia", min: 0.02, max: 0.25, step: 0.01 },
  showArrows: { type: ControlType.Boolean, title: "Arrows", enabledTitle: "On", disabledTitle: "Off" },
  showDots: { type: ControlType.Boolean, title: "Dots", enabledTitle: "On", disabledTitle: "Off" },
});

