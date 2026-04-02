"use client";

import { LocaleProvider } from "@/lib/i18n/context";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LocaleProvider>{children}</LocaleProvider>
    </SessionProvider>
  );
}
