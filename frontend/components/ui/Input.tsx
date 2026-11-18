
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export default function Input({
  label,
  error,
  id,
  className = "",
  ...props
}: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="w-full space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-200"
        >
          {label}
        </label>
      )}

      <input
        id={inputId}
        className={`w-full rounded-xl border border-[#352744] bg-[#15101e] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#82758f] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50 ${
          error ? "border-red-500 focus:border-red-500" : ""
        } ${className}`}
        {...props}
      />

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
