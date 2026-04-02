import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { GameShell } from "@/components/GameShell";
import { loadGame } from "@/app/play/actions";

export const dynamic = "force-dynamic";

/** Same save as `/play`, plus skip-years and undo (obscure URL, not a security boundary). */
export default async function PlayAdminPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const initial = await loadGame();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 dark:bg-zinc-950">
      <GameShell initialState={initial} adminMode />
    </div>
  );
}
