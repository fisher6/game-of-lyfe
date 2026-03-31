import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { GameShell } from "@/components/GameShell";
import { loadGame } from "@/app/play/actions";

export const dynamic = "force-dynamic";

export default async function PlayPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const initial = await loadGame();

  return (
    <div className="flex min-h-full flex-col bg-zinc-100 dark:bg-zinc-950">
      <GameShell initialState={initial} />
    </div>
  );
}
