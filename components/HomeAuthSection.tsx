"use client";

import dynamic from "next/dynamic";

const HomeSessionActions = dynamic(
  () => import("@/components/HomeSessionActions"),
  {
    ssr: false,
    loading: () => (
      <div className="mt-10 flex min-h-12 w-full max-w-md flex-col items-stretch gap-3 sm:mx-auto">
        <div
          className="h-12 w-full rounded-full bg-zinc-200 dark:bg-zinc-800"
          aria-hidden
        />
        <div
          className="h-12 w-full rounded-full bg-zinc-200 dark:bg-zinc-800"
          aria-hidden
        />
      </div>
    ),
  }
);

export function HomeAuthSection() {
  return <HomeSessionActions />;
}
