"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  assertContentVersion,
  createInitialState,
  validateStateShape,
} from "@/lib/game/engine";
import type { GameState } from "@/lib/game/types";
import { Prisma } from "@/app/generated/prisma/client";

export async function loadGame(): Promise<GameState> {
  const session = await auth();
  if (!session?.user?.id) {
    return createInitialState();
  }

  const row = await prisma.gameSave.findUnique({
    where: { userId: session.user.id },
  });

  if (!row?.state) {
    return createInitialState();
  }

  const parsed = validateStateShape(row.state);
  if (!parsed) {
    return createInitialState();
  }

  return assertContentVersion(parsed);
}

export async function saveGame(state: GameState): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await prisma.gameSave.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      state: state as unknown as Prisma.InputJsonValue,
    },
    update: { state: state as unknown as Prisma.InputJsonValue },
  });
}

export async function resetGame(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await prisma.gameSave.deleteMany({
    where: { userId: session.user.id },
  });
}
