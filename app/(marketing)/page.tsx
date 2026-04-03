import { HomeLanding } from "@/components/HomeLanding";

export default async function HomePage() {
  // #region agent log
  fetch("http://127.0.0.1:7373/ingest/6deaeb97-8931-4824-938c-b7636948ee33", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "a0f287",
    },
    body: JSON.stringify({
      sessionId: "a0f287",
      location: "app/(marketing)/page.tsx",
      message: "Home RSC render",
      data: {},
      timestamp: Date.now(),
      runId: "pre-fix",
      hypothesisId: "H4",
    }),
  }).catch(() => {});
  // #endregion
  return <HomeLanding />;
}
