import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatWindow from "../components/ChatWindow";
import ChatInput from "../components/ChatInput";
import ChatHistorySheet from "../components/ChatHistorySheet";
import { Button } from "@/components/ui/button";
import { useChatStore } from "../hooks/useChatStore";

export default function ChatPage() {
  const {
    messages,
    isProcessing,
    sendMessage,
    stopProcessing,
    resetConversation,
    inputResetKey,
  } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { openHistory?: boolean; startNewConversation?: boolean } | null;
  const [historyOpen, setHistoryOpen] = useState(() => Boolean(locationState?.openHistory));

  const openHistoryPanel = useCallback(() => {
    setHistoryOpen(true);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isProcessing, messages]);

  useEffect(() => {
    if (!locationState) {
      return;
    }

    if (locationState.startNewConversation) {
      resetConversation();
    }

    if (locationState.startNewConversation || locationState.openHistory) {
      navigate(".", { replace: true, state: null });
    }
  }, [locationState, navigate, resetConversation]);

  const handleSelectThread = (threadId: string) => {
    setHistoryOpen(false);
    navigate(`/chat/threads/${threadId}`);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/60 bg-background px-4 py-3">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={openHistoryPanel}>
            Historial
          </Button>
          <Button variant="ghost" size="sm" onClick={resetConversation}>
            Nueva conversacion
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <ChatWindow
          messages={messages}
          isProcessing={isProcessing}
        />
        <div ref={bottomRef} />
      </div>

      <div className="-mx-3 -mb-[calc(88px-4rem)] sm:-mx-4 sm:-mb-[calc(88px-4rem)] md:-mx-12 md:-mb-10">
        <ChatInput
          onSend={sendMessage}
          onStop={stopProcessing}
          isProcessing={isProcessing}
          resetSignal={inputResetKey}
        />
      </div>

      <ChatHistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onSelectThread={handleSelectThread}
      />
    </div>
  );
}