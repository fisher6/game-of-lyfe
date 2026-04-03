import { handlers } from "@/auth";
import type { NextRequest } from "next/server";

// #region agent log
function debugLog(hypothesisId: string, message: string, data: Record<string, unknown>) {
  fetch("http://127.0.0.1:7373/ingest/6deaeb97-8931-4824-938c-b7636948ee33", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "a0f287",
    },
    body: JSON.stringify({
      sessionId: "a0f287",
      location: "app/api/auth/[...nextauth]/route.ts",
      message,
      data,
      timestamp: Date.now(),
      runId: "pre-fix",
      hypothesisId,
    }),
  }).catch(() => {});
}
// #endregion

export async function GET(req: NextRequest) {
  // #region agent log
  debugLog("H3", "auth GET invoked", { url: req.url, pathname: req.nextUrl.pathname });
  // #endregion
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  // #region agent log
  debugLog("H3", "auth POST invoked", { url: req.url, pathname: req.nextUrl.pathname });
  // #endregion
  return handlers.POST(req);
}
