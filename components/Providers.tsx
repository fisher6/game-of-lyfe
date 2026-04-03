"use client";

import { LocaleProvider } from "@/lib/i18n/context";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // #region agent log
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    void fetch("/api/auth/session", { method: "GET" })
      .then((r) => {
        return fetch(
          "http://127.0.0.1:7373/ingest/6deaeb97-8931-4824-938c-b7636948ee33",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Debug-Session-Id": "a0f287",
            },
            body: JSON.stringify({
              sessionId: "a0f287",
              location: "components/Providers.tsx:sessionProbe",
              message: "client session fetch result",
              data: { origin, status: r.status, ct: r.headers.get("content-type") },
              timestamp: Date.now(),
              runId: "pre-fix",
              hypothesisId: "H5",
            }),
          }
        );
      })
      .catch(() => {});
    // #endregion
  }, []);

  return (
    <SessionProvider>
      <LocaleProvider>{children}</LocaleProvider>
    </SessionProvider>
  );
}
