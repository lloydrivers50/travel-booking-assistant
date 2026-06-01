// DEV MOCK — delete when the NestJS backend is live. Not part of the real app.
//
// GET /api/chat/stream → one long-lived text/event-stream. It watches the
// module-level job store and replays each newly-minted job's scripted events
// (tokens word-by-word, stages, itinerary, done), every frame tagged with its
// turn id. This mirrors the real seam: POST returns instantly, the stream does
// the work, correlated by id.

import { jobs, type ScriptedEvent } from "@/app/api/_mock/script";

export const dynamic = "force-dynamic";

const dispatched = new Set<string>();

function frame(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      req.signal.addEventListener("abort", close);

      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(frame(event, data)));
        } catch {
          close();
        }
      };

      // Open comment + retry hint so the client connects cleanly.
      send("open", { ok: true });

      const replay = async (id: string, events: ScriptedEvent[]) => {
        for (const ev of events) {
          if (closed) return;
          await sleep(ev.delay);
          if (closed) return;
          switch (ev.kind) {
            case "token":
              send("token", { id, chunk: ev.chunk });
              break;
            case "stage":
              send("stage", {
                id,
                name: ev.name,
                status: ev.status,
                detail: ev.detail,
              });
              break;
            case "itinerary":
              send("itinerary", { id, itinerary: ev.itinerary });
              break;
            case "done":
              send("done", { id });
              break;
          }
        }
      };

      // Poll for new jobs and replay them. Keepalive comments hold the
      // connection open while idle.
      let idleTicks = 0;
      while (!closed) {
        let workedThisTick = false;
        for (const [id, job] of jobs) {
          if (dispatched.has(id)) continue;
          dispatched.add(id);
          workedThisTick = true;
          await replay(id, job.events);
        }
        if (workedThisTick) {
          idleTicks = 0;
        } else {
          idleTicks += 1;
          if (idleTicks % 30 === 0 && !closed) {
            controller.enqueue(encoder.encode(`: keepalive\n\n`));
          }
        }
        await sleep(120);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
