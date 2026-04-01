"use client";

import dynamic from "next/dynamic";

const HomeSessionActions = dynamic(
  () => import("@/components/HomeSessionActions"),
  {
    ssr: false,
    loading: () => (
      <div className="mt-10 flex min-h-12 flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <div
          className="h-12 w-56 max-w-full rounded-full bg-zinc-200 dark:bg-zinc-800"
          aria-hidden
        />
      </div>
    ),
  }
);

export function HomeAuthSection() {
  return <HomeSessionActions />;
}
