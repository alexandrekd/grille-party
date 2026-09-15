import { useEffect, useState, type ReactNode } from "react";

const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;

/** Centers the fixed 390x844 phone design and scales it down only if the viewport
 * is smaller (a real phone browser renders it near 1:1; a desktop dev window gets a
 * scaled-down preview instead of clipping). */
export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function update() {
      setScale(Math.min(1, window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT));
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0E0A13",
        overflow: "hidden",
      }}
    >
      <div style={{ width: DESIGN_WIDTH, height: DESIGN_HEIGHT, flexShrink: 0, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}
