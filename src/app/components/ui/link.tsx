import React from "react"

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  underlined?: boolean
}

export default function Link({
  children,
  href,
  underlined = false,
  className = "",
  ...props
}: LinkProps) {
  return (
    <a
      href={href}
      className={`text-blue-600 hover:text-blue-700 transition-colors
        ${underlined ? "underline" : "no-underline"}
        ${className}`}
      {...props}
    >
      {children}
    </a>
  )
}
