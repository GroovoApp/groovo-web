import React from "react";

type SkeletonProps = {
  className?: string;
};

export default function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-neutral-800/70 rounded ${className}`}
      aria-busy="true"
      aria-live="polite"
    />
  );
}
