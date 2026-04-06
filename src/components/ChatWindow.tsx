import ChatMessage from "./ChatMessage";
import type { ChatMessage as ChatMessageType } from "../hooks/useChatStore";

interface Props {
  messages: ChatMessageType[];
  isProcessing?: boolean;
  onDraftCancel?: (messageId: string) => void;
}

export default function ChatWindow({ messages, isProcessing = false, onDraftCancel }: Props) {
  if (messages.length === 0 && !isProcessing) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Mandá un mensaje para empezar a registrar tus gastos.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <ChatMessage
          key={msg.id}
          message={msg}
          onDraftCancel={() => onDraftCancel?.(msg.id)}
        />
      ))}
      {isProcessing && (
        <div className="flex justify-start">
          <div className="bg-gray-700 text-white rounded-lg px-4 py-3 max-w-[92%] sm:max-w-[80%]">
            <span className="sr-only">El asistente esta escribiendo</span>
            <div className="flex items-center gap-1" aria-hidden="true">
              <span
                className="h-2 w-2 rounded-full bg-gray-300 animate-bounce"
                style={{ animationDelay: "-0.3s" }}
              />
              <span
                className="h-2 w-2 rounded-full bg-gray-300 animate-bounce"
                style={{ animationDelay: "-0.15s" }}
              />
              <span className="h-2 w-2 rounded-full bg-gray-300 animate-bounce" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}