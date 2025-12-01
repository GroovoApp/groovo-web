"use client";
import React, { ReactNode } from "react";
import Link, { LinkProps } from "next/link";

interface CustomLinkProps extends LinkProps {
  underlined?: boolean;
  className?: string;
  children: ReactNode;
}

export default function CustomLink({
  children,
  underlined = false,
  className = "",
  ...props
}: CustomLinkProps) {
  return (
    <Link
      {...props}
      className={`text-blue-600 hover:text-blue-700 transition-colors ${
        underlined ? "underline" : "no-underline"
      } ${className}`}
    >
      {children}
    </Link>
  );
}
