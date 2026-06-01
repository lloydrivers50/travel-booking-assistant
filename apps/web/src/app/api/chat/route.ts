// DEV MOCK — delete when the NestJS backend is live. Not part of the real app.
//
// POST /api/chat → mint a server id, store a scripted job, return 202 { id }.
// No work happens here; the long-lived SSE stream carries the work.

import { NextResponse } from "next/server";
import { buildJob, jobs } from "@/app/api/_mock/script";

export async function POST(req: Request) {
  let message = "";
  try {
    const body = (await req.json()) as { message?: string };
    message = body?.message ?? "";
  } catch {
    /* tolerate empty body in the mock */
  }

  const id = crypto.randomUUID();
  jobs.set(id, buildJob(id, message));

  return NextResponse.json({ id }, { status: 202 });
}
