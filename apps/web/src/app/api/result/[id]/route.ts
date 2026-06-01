// DEV MOCK — delete when the NestJS backend is live. Not part of the real app.
//
// GET /api/result/:id → the persisted itinerary for that turn id.

import { NextResponse } from "next/server";
import { jobs } from "@/app/api/_mock/script";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const job = jobs.get(id);

  if (!job) {
    return NextResponse.json({ message: "Unknown itinerary id" }, { status: 404 });
  }

  return NextResponse.json({ itinerary: job.itinerary });
}
