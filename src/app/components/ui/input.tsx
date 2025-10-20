import React from "react"

type NativeInputProps = React.ComponentPropsWithoutRef<'input'>

interface InputProps extends NativeInputProps {
  label?: React.ReactNode
  variant?: "default" | "disabled" | "destructive"
  width?: "full" | "auto"
}

export default function Input({
  label,
  className = "",
  id,
  placeholder,
  variant = "default",
  width = "full",
  ...props
}: InputProps) {
  const baseStyles =
    "block px-[12px] py-[10px] rounded-lg text-[14px] box-border transition-colors border focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-text"

  const variantStyles = {
    default:
      "bg-white border-[#e2e8f0] text-slate-900 placeholder-slate-400 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400",
    destructive:
      "bg-red-50 border-red-300 text-red-700 placeholder-red-300 focus:ring-red-500 focus:border-red-500 hover:border-red-400",
    disabled:
      "bg-slate-100 border-slate-200 text-slate-400 placeholder-slate-400 cursor-not-allowed pointer-events-none",
  }[variant]

  const widthStyles = {
    full: "w-full",
    auto: "w-auto",
  }[width]

  return (
    <div className="flex flex-col gap-[4px]">
      {label && (
        <label
          className={`text-[13px] font-medium ${
            variant === "disabled" ? "text-slate-400" : "text-slate-700"
          }`}
          htmlFor={id}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`${baseStyles} ${variantStyles} ${widthStyles} ${className}`}
        placeholder={placeholder}
        disabled={variant === "disabled"}
        {...props}
      />
    </div>
  )
}
