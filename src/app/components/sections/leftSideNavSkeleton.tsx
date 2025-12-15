"use client";

import React from "react";
import Skeleton from "../ui/skeleton";

export default function LeftSideNavSkeleton() {
  return (
    <>
      <div className="w-full">
        <Skeleton className="h-5 w-32" />
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden w-full">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded flex-shrink-0 w-full max-w-full">
            <Skeleton className="h-12 w-12 rounded flex-shrink-0" />
            <div className="flex-1 min-w-0 max-w-[calc(100%-60px)]">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2 mt-2" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto flex-shrink-0 w-full">
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </>
  );
}
