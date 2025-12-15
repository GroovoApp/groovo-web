"use client";

import React from "react";
import Skeleton from "./skeleton";

export default function PlaylistSkeleton() {
  // Header + table skeleton
  return (
    <div className="p-8 flex flex-col gap-8">
      <div className="flex gap-4 items-end max-h-72">
        <Skeleton className="w-[200px] h-[200px] rounded-lg" />
        <div className="flex flex-col gap-3 w-full max-w-xl">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <div className="mt-2">
            <Skeleton className="h-9 w-36 rounded-md" />
          </div>
        </div>
      </div>

      <div className="w-full">
        <div className="grid grid-cols-[40px_1fr_1fr_120px_80px] gap-2 mb-4">
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
        </div>

        <div className="flex flex-col">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[40px_1fr_1fr_120px_80px] gap-2 py-3 border-b border-neutral-800">
              <Skeleton className="h-4 w-6" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-2/5 mt-2" />
                </div>
              </div>
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
