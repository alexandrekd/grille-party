import { useState, type CSSProperties, type ReactNode } from "react";

export interface ButtonProps {
  label: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  bg: string;
  color: string;
  height?: number;
  radius?: number;
  fontSize?: number;
  /** Gives the button the game's signature offset "hard shadow" 3D press style. */
  shadowColor?: string;
  border?: string;
  icon?: ReactNode;
  /** Pulsing attention ring, used on the primary "Scanner le QR" CTA. */
  ringAnimation?: boolean;
  style?: CSSProperties;
}

export function Button({
  label,
  onClick,
  disabled,
  bg,
  color,
  height = 76,
  radius = 26,
  fontSize = 27,
  shadowColor,
  border,
  icon,
  ringAnimation,
  style,
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const canPress = !disabled && !!onClick;

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseDown={() => canPress && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => canPress && setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      disabled={disabled}
      style={{
        height,
        borderRadius: radius,
        background: bg,
        color,
        border: border ?? "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        font: `700 ${fontSize}px 'Fredoka',sans-serif`,
        width: "100%",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
        boxShadow: shadowColor ? `0 ${pressed ? 3 : 8}px 0 ${shadowColor}` : undefined,
        transform: shadowColor && pressed ? "translateY(5px)" : undefined,
        transition: "transform .08s ease, box-shadow .08s ease",
        animation: ringAnimation ? "mring 2s infinite" : undefined,
        ...style,
      }}
    >
      {icon}
      {label}
    </button>
  );
}
