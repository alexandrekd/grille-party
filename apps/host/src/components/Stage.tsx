import { useEffect, useState, type ReactNode } from "react";

const DESIGN_WIDTH = 1280;
const DESIGN_HEIGHT = 720;

/** Scales the fixed 1280x720 TV design to fit whatever window/TV it's opened on,
 * so the screens beneath can be ported at the DA's exact pixel values. */
export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function update() {
      setScale(Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT));
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
      <div
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          flexShrink: 0,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
