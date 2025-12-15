"use client";

import React from "react";
import Skeleton from "./skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="px-6 py-8">
      <Skeleton className="h-8 w-56 mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="group relative bg-neutral-900 p-2 rounded-lg"
          >
            <div className="relative aspect-square mb-4 overflow-hidden rounded-md shadow-lg">
              <Skeleton className="absolute inset-0 w-full h-full" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
