
import Link from "next/link";

type LogoProps = {
  size?: "small" | "medium" | "large";
  href?: string;
};

export default function Logo({
  size = "medium",
  href = "/home",
}: LogoProps) {
  const sizes = {
    small: {
      icon: "h-8 w-8 text-base",
      text: "text-lg",
    },
    medium: {
      icon: "h-10 w-10 text-xl",
      text: "text-xl",
    },
    large: {
      icon: "h-12 w-12 text-2xl",
      text: "text-2xl",
    },
  };

  return (
    <Link
      href={href}
      aria-label="Tenderr home"
      className="inline-flex items-center gap-2.5"
    >
      <span
        className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 to-purple-700 font-bold text-white ${sizes[size].icon}`}
      >
        T
      </span>

      <span className={`font-bold tracking-tight text-white ${sizes[size].text}`}>
        Tenderr
      </span>
    </Link>
  );
}
