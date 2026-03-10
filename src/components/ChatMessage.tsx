import type { ChatMessage as ChatMessageType } from "../hooks/useChatStore";
import TransactionDraftCard from "./TransactionDraftCard";

interface Props {
  message: ChatMessageType;
  onDraftCancel?: () => void;
}

export default function ChatMessage({ message, onDraftCancel }: Props) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-[80%]">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant messages
  if (message.response_type === "draft" && message.data) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%]">
          <div className="bg-gray-700 text-white rounded-lg px-4 py-2 mb-2">
            {message.content}
          </div>
          <TransactionDraftCard
            data={message.data}
            onCancel={onDraftCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="bg-gray-700 text-white rounded-lg px-4 py-2 max-w-[80%]">
        {message.content}
      </div>
    </div>
  );
}
