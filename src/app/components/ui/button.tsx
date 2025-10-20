import React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "destructive"
  size?: "sm" | "md" | "lg"
  width?: "full" | "auto"
  cursor?: "pointer" | "not-allowed" | "default" | "text" | "move" | "wait" | "crosshair" | "help"
}

export default function Button({
  children,
  className,
  variant = "default",
  cursor = "pointer",
  size = "md",
  width = "full",
  ...props
}: ButtonProps) {

  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"

  const variantStyles = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-400",
    outline: "border border-gray-300 text-gray-900 hover:bg-gray-100",
    destructive: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
  }[variant]

  const cursorStyles = {
    pointer: "cursor-pointer",
    "not-allowed": "cursor-not-allowed",
    default: "cursor-default",
    text: "cursor-text",
    move: "cursor-move",
    wait: "cursor-wait",
    crosshair: "cursor-crosshair",
    help: "cursor-help"
  }[cursor]

  const sizeStyles = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-8 text-base",
  }[size]

  const widthStyles = {
    full: "w-full",
    auto: "w-auto",
  }[width]

  return (
    <button
       className={`${baseStyles} ${variantStyles} ${cursorStyles} ${sizeStyles} ${widthStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
