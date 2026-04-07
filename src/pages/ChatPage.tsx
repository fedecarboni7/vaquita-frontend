import { useEffect, useRef } from "react";
import ChatWindow from "../components/ChatWindow";
import ChatInput from "../components/ChatInput";
import { useChatStore } from "../hooks/useChatStore";

export default function ChatPage() {
  const {
    messages,
    isProcessing,
    sendMessage,
    sendAudioMessage,
    stopProcessing,
  } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isProcessing, messages]);

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold">Chat</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <ChatWindow
          messages={messages}
          isProcessing={isProcessing}
        />
        <div ref={bottomRef} />
      </div>

      <ChatInput
        onSend={sendMessage}
        onSendAudio={sendAudioMessage}
        onStop={stopProcessing}
        isProcessing={isProcessing}
      />
    </div>
  );
}