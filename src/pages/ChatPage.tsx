import { useEffect, useRef } from "react";
import ChatWindow from "../components/ChatWindow";
import ChatInput from "../components/ChatInput";
import { useChatStore } from "../hooks/useChatStore";

export default function ChatPage() {
  const {
    messages,
    isProcessing,
    sendMessage,
    stopProcessing,
  } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isProcessing, messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <ChatWindow
          messages={messages}
          isProcessing={isProcessing}
        />
        <div ref={bottomRef} />
      </div>

      <ChatInput
        onSend={sendMessage}
        onStop={stopProcessing}
        isProcessing={isProcessing}
      />
    </div>
  );
}