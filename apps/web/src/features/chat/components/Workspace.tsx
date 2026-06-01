"use client";

import { useCallback, useState } from "react";
import { MessageSquare, Route, Sparkles, ShieldCheck } from "lucide-react";
import { useChatStream } from "@/features/chat/hooks/useChatStream";
import { useSendMessage } from "@/features/chat/hooks/useSendMessage";
import { ChatPanel } from "@/features/chat/components/ChatPanel";
import { ItineraryPanel } from "@/features/itinerary/components/ItineraryPanel";
import { Segmented } from "@/shared/ui/segmented";

type MobileTab = "chat" | "itinerary";

export function Workspace() {
  const {
    messages,
    stages,
    itinerary,
    activeTurnId,
    pendingTurnId,
    stageLabels,
    addUserMessage,
    beginTurn,
  } = useChatStream();

  // Mobile pane switching + unseen-update indicator.
  const [tab, setTab] = useState<MobileTab>("chat");
  const [itineraryUnseen, setItineraryUnseen] = useState(false);

  // A turn starting is a real event — flag the itinerary tab if the agent is
  // looking at chat, so they get a nudge that the plan is updating there.
  const handleTurnAccepted = useCallback(
    (turnId: string) => {
      beginTurn(turnId);
      if (tab === "chat") setItineraryUnseen(true);
    },
    [beginTurn, tab],
  );

  const { send, isSending, error } = useSendMessage({
    onUserMessage: addUserMessage,
    onTurnAccepted: handleTurnAccepted,
  });

  const isActive = Boolean(activeTurnId || pendingTurnId);
  const isStreaming = Boolean(activeTurnId);
  const hasStarted = messages.length > 0 || isActive;

  const handleTab = (next: MobileTab) => {
    setTab(next);
    if (next === "itinerary") setItineraryUnseen(false);
  };

  return (
    <div className="flex h-[100dvh] flex-col">
      {/* Header */}
      <header className="glass-strong z-20 flex shrink-0 items-center justify-between border-b border-base-700/60 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500 text-base-950 shadow-[0_8px_20px_-8px_var(--color-accent-600)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-base-50">Aria</p>
            <p className="text-[0.7rem] text-base-400">
              Corporate travel assistant
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-base-700 bg-base-850/60 px-3 py-1 text-xs text-base-300 sm:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-accent-300" />
          Policy-aware · Cited · Auditable
        </div>
      </header>

      {/* Desktop / tablet: two panes. Mobile: segmented switch. */}
      <main className="relative min-h-0 flex-1">
        {/* lg+ two-pane */}
        <div className="hidden h-full lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <section className="min-h-0 border-r border-base-700/60">
            <ChatPanel
              messages={messages}
              onSend={send}
              isSending={isSending}
              isStreaming={isStreaming}
              error={error}
            />
          </section>
          <section className="min-h-0 bg-base-950/30">
            <ItineraryPanel
              stages={stages}
              stageLabels={stageLabels}
              itinerary={itinerary}
              isActive={isActive}
              hasStarted={hasStarted}
            />
          </section>
        </div>

        {/* < lg single column with segmented control */}
        <div className="flex h-full flex-col lg:hidden">
          <div className="shrink-0 px-4 pt-3 sm:px-6">
            <Segmented<MobileTab>
              layoutId="mobile-pane"
              value={tab}
              onValueChange={handleTab}
              options={[
                {
                  value: "chat",
                  label: "Chat",
                  icon: <MessageSquare className="h-4 w-4" />,
                },
                {
                  value: "itinerary",
                  label: "Itinerary",
                  icon: <Route className="h-4 w-4" />,
                  notify: itineraryUnseen,
                },
              ]}
            />
          </div>
          <div className="min-h-0 flex-1">
            {tab === "chat" ? (
              <ChatPanel
                messages={messages}
                onSend={send}
                isSending={isSending}
                isStreaming={isStreaming}
                error={error}
              />
            ) : (
              <ItineraryPanel
                stages={stages}
                stageLabels={stageLabels}
                itinerary={itinerary}
                isActive={isActive}
                hasStarted={hasStarted}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
