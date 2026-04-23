"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "riai-cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const persist = (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-consent" role="dialog" aria-label="Cookie preferences">
      <p className="cookie-consent__text">
        We use cookies to improve your experience. See our{" "}
        <a href="/cookies">Cookie Policy</a> for details.
      </p>
      <div className="cookie-consent__actions">
        <button type="button" className="cookie-consent__btn cookie-consent__btn--ghost" onClick={() => persist("rejected")}>
          Reject
        </button>
        <button type="button" className="cookie-consent__btn cookie-consent__btn--primary" onClick={() => persist("accepted")}>
          Accept
        </button>
      </div>
    </div>
  );
}
