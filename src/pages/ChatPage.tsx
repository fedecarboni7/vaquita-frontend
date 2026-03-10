import { useEffect, useRef } from "react";
import ChatWindow from "../components/ChatWindow";
import ChatInput from "../components/ChatInput";
import { useChatStore } from "../hooks/useChatStore";

export default function ChatPage() {
  const { messages, isLoading, sendMessage, setMessages } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleDraftCancel = (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <header className="p-4 border-b border-gray-700">
        <h1 className="text-lg font-semibold text-white">Expenses Tracker</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <ChatWindow
          messages={messages}
          onDraftCancel={handleDraftCancel}
        />
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={sendMessage} isLoading={isLoading} />
    </div>
  );
}