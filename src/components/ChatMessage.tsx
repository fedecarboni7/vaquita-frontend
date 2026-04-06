import { Mic } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "../hooks/useChatStore";
import TransactionDraftCard from "./TransactionDraftCard";

interface Props {
  message: ChatMessageType;
  onDraftCancel?: () => void;
}

export default function ChatMessage({ message, onDraftCancel }: Props) {
  const isUser = message.role === "user";
  const isAudioTranscription = isUser && message.input_source === "audio";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-[92%] sm:max-w-[80%] break-words whitespace-pre-wrap">
          {isAudioTranscription && (
            <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-blue-500/70 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-blue-50">
              <Mic size={12} />
              <span>Transcripción de audio</span>
            </div>
          )}
          <p className={isAudioTranscription ? "italic text-blue-50" : undefined}>
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  // Assistant messages
  if (message.response_type === "draft" && message.data) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[95%] sm:max-w-[85%] min-w-0">
          <div className="bg-gray-700 text-white rounded-lg px-4 py-2 mb-2 break-words whitespace-pre-wrap">
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
      <div className="bg-gray-700 text-white rounded-lg px-4 py-2 max-w-[92%] sm:max-w-[80%] break-words whitespace-pre-wrap">
        {message.content}
      </div>
    </div>
  );
}
