
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
};

export default function Button({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-purple-600 text-white hover:bg-purple-500 disabled:bg-purple-900",
    secondary:
      "border border-purple-500/30 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20",
    ghost:
      "bg-transparent text-gray-300 hover:bg-white/5 hover:text-white",
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
        variants[variant]
      } ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
