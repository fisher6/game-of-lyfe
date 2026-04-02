import { AppLogo } from "@/components/AppLogo";
import { HomeAuthSection } from "@/components/HomeAuthSection";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-100 px-6 py-16 dark:bg-zinc-950">
      <div className="max-w-lg text-center">
        <div className="flex flex-col items-center gap-5">
          <AppLogo
            size={80}
            className="drop-shadow-md drop-shadow-violet-900/10 dark:drop-shadow-violet-950/40"
          />
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Game of Lyfe
          </h1>
        </div>
        <p className="mt-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          Grow up from age eight with health, happiness, and assets on the line.
          Pick school paths, social media moments, college or work — a small
          demo you can extend into a full life sim.
        </p>

        <HomeAuthSection />
      </div>
    </div>
  );
}
