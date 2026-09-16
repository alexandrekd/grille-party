import { useEffect, useState, type ReactNode } from "react";

const DESIGN_WIDTH = 390;

/**
 * Every screen's layout is absolutely positioned assuming a 390px-wide canvas,
 * anchored from the top/left/right/bottom edges (never assuming a specific total
 * height) — so scaling by *width only* and stretching the canvas's logical height
 * to exactly match the real viewport height fills the screen edge to edge with no
 * letterboxing, on any real phone's aspect ratio, without touching any individual
 * screen. (On a desktop dev window, width easily exceeds 390 so scale caps at 1 —
 * same centered phone-mockup preview as before, just no longer height-cropped.)
 *
 * The math: logical height = viewport height / scale, then CSS `scale()` shrinks
 * it back down by that same factor, so the rendered box is always exactly
 * `viewportWidth x viewportHeight`.
 */
export function Stage({ children }: { children: ReactNode }) {
  const [size, setSize] = useState({ scale: 1, height: 0 });

  useEffect(() => {
    function update() {
      const scale = Math.min(1, window.innerWidth / DESIGN_WIDTH);
      setSize({ scale, height: window.innerHeight / scale });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0E0A13",
        overflow: "hidden",
      }}
    >
      <div style={{ width: DESIGN_WIDTH, height: size.height, flexShrink: 0, transform: `scale(${size.scale})` }}>
        {children}
      </div>
    </div>
  );
}
