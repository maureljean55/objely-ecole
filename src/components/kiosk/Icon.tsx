import type { CSSProperties } from "react";

type IconProps = {
  name: string;
  /** Filled glyph variant. */
  fill?: boolean;
  /** Pixel size; defaults to 24. */
  size?: number;
  className?: string;
  style?: CSSProperties;
};

// Material Symbols Outlined, subset-hosted in /public/fonts. Decorative by
// default: give the surrounding control an accessible name instead.
export function Icon({ name, fill = false, size = 24, className = "", style }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size, fontVariationSettings: `"FILL" ${fill ? 1 : 0}`, ...style }}
    >
      {name}
    </span>
  );
}
