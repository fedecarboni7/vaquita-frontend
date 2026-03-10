import ChatMessage from "./ChatMessage";
import type { ChatMessage as ChatMessageType } from "../hooks/useChatStore";

interface Props {
  messages: ChatMessageType[];
  onDraftCancel?: (messageId: string) => void;
}

export default function ChatWindow({ messages, onDraftCancel }: Props) {
  if (messages.length === 0) {
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
    </div>
  );
}