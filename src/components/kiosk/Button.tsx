import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "./Icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet";
  icon?: string;
  iconPosition?: "start" | "end";
  children: ReactNode;
};

// Flat, solid, in the accent of the side being filled in.
const VARIANTS = {
  primary: "bg-accent px-9 text-white",
  secondary: "border-2 border-ink/80 bg-white px-7 text-ink",
  quiet: "px-5 text-slate hover:text-ink",
} as const;

// 60px kiosk button. Everything tappable is at least 52px.
export function Button({
  variant = "primary",
  icon,
  iconPosition = "end",
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`press inline-flex h-[60px] items-center justify-center gap-3 rounded-cta text-label-xl ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {icon && iconPosition === "start" && <Icon name={icon} size={26} />}
      {children}
      {icon && iconPosition === "end" && <Icon name={icon} size={26} />}
    </button>
  );
}
