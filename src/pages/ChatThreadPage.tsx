import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ChatWindow from "@/components/ChatWindow";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/hooks/useChatStore";
import { useChatThread, useChatThreads } from "@/hooks/useChatThreads";

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "Fecha desconocida";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Fecha desconocida";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatCount(value: number | null | undefined, singular: string, plural: string): string {
  const safeValue = typeof value === "number" ? value : 0;
  if (safeValue === 1) {
    return `1 ${singular}`;
  }
  return `${safeValue} ${plural}`;
}

export default function ChatThreadPage() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const threadQuery = useChatThread(threadId);
  const threadsQuery = useChatThreads(null);

  const threadSummary = useMemo(() => {
    const threads = threadsQuery.data?.threads ?? [];
    return threads.find((thread) => thread.thread_id === threadId);
  }, [threadId, threadsQuery.data]);

  const messages = useMemo<ChatMessage[]>(() => {
    const interactions = threadQuery.data?.interactions ?? [];
    return interactions.flatMap((interaction) => [
      {
        id: `${interaction.id}-user`,
        role: "user",
        content: interaction.user_message,
      },
      {
        id: `${interaction.id}-assistant`,
        role: "assistant",
        content: interaction.agent_reply,
        response_type: "answer",
      },
    ]);
  }, [threadQuery.data]);

  const handleBackToHistory = () => {
    navigate("/", { state: { openHistory: true } });
  };

  const handleNewConversation = () => {
    navigate("/", { state: { startNewConversation: true } });
  };

  const headerText = useMemo(() => {
    const startedAt = threadSummary?.started_at ?? null;
    const interactionCount = threadSummary?.interaction_count ?? threadQuery.data?.interactions.length ?? 0;
    const transactionsCreated = threadSummary?.transactions_created ?? 0;
    return `${formatDateTime(startedAt)} · ${formatCount(interactionCount, "mensaje", "mensajes")} · ${formatCount(
      transactionsCreated,
      "registro",
      "registros",
    )}`;
  }, [threadQuery.data?.interactions.length, threadSummary]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/60 bg-background px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-medium text-foreground">{headerText}</div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleBackToHistory}>
              Volver al historial
            </Button>
            <Button variant="ghost" size="sm" onClick={handleNewConversation}>
              Nueva conversacion
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {threadQuery.isLoading && (
          <div className="text-sm text-muted-foreground">Cargando conversacion...</div>
        )}
        {threadQuery.isError && (
          <div className="text-sm text-muted-foreground">No se pudo cargar la conversacion.</div>
        )}
        {!threadQuery.isLoading && !threadQuery.isError && (
          <ChatWindow messages={messages} isProcessing={false} />
        )}
      </div>
    </div>
  );
}
