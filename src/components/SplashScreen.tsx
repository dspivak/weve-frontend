"use client";

import Image from "next/image";

/**
 * Splash screen shown while the dashboard is loading (auth check).
 */
export function SplashScreen() {
  return (
    <div className="splash-page">
      {/* Gradient background */}
      <div className="splash-bg" aria-hidden />
      {/* Animated glow */}
      <div className="splash-glow" aria-hidden />
      {/* Grid pattern */}
      <div className="splash-grid" aria-hidden />

      {/* Centered content */}
      <div className="splash-content">
        <div className="splash-logo-wrap">
          <Image
            src="/app-logo.png"
            alt="Weve"
            width={240}
            height={96}
            className="splash-logo-img"
            priority
          />
        </div>
        <p className="splash-tagline">Plausible futures, built together</p>
        <div className="splash-loader" aria-label="Loading">
          <span className="splash-loader-dot" />
          <span className="splash-loader-dot" />
          <span className="splash-loader-dot" />
        </div>
      </div>

      {/* Bottom line */}
      <div className="splash-line" aria-hidden />
    </div>
  );
}
