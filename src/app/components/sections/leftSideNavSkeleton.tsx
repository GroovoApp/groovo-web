"use client";

import React from "react";
import Skeleton from "../ui/skeleton";

export default function LeftSideNavSkeleton() {
  return (
    <div className="h-full w-[300px] flex flex-col gap-2 bg-neutral-900 rounded-lg p-4 pt-4 overflow-hidden">
      <Skeleton className="h-5 w-32" />

      <div className="mt-2 flex-1 min-h-0 flex flex-col gap-2 overflow-y-auto">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded">
            <Skeleton className="h-12 w-12 rounded" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2 mt-2" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </div>
  );
}
