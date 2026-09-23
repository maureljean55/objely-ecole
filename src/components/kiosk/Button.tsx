import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "./Icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet";
  icon?: string;
  iconPosition?: "start" | "end";
  children: ReactNode;
};

const VARIANTS = {
  primary: "bg-signature px-10 text-white shadow-cta",
  secondary: "border-2 border-line bg-white px-8 text-ink hover:border-line-strong",
  quiet: "px-5 text-slate hover:bg-white hover:text-ink",
} as const;

// 60px kiosk CTA. Everything tappable is at least 52px.
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
