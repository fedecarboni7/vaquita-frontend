import { Mic } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "../hooks/useChatStore";
import TransactionDraftCard from "./TransactionDraftCard";

interface Props {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";
  const isAudioTranscription = isUser && message.input_source === "audio";
  const isSystemNotice = message.role === "system";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="bg-primary/10 text-foreground border border-primary/20 rounded-2xl rounded-br-sm px-4 py-2 max-w-[92%] sm:max-w-[80%] break-words whitespace-pre-wrap">
          {isAudioTranscription && (
            <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-primary">
              <Mic size={12} />
              <span>Transcripción de audio</span>
            </div>
          )}
          <p className={isAudioTranscription ? "italic text-foreground" : undefined}>
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  // System notice messages
  if (isSystemNotice) {
    return (
      <div className="flex items-end">
        <div className="text-muted-foreground text-xs italic px-2 py-1 max-w-[92%] sm:max-w-[80%] break-words">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant messages
  if (message.response_type === "draft" && message.data) {
    return (
      <div className="flex items-end">
        <div className="max-w-[95%] sm:max-w-[85%] min-w-0">
          <TransactionDraftCard data={message.data} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end">
      <div className="bg-muted text-foreground border border-border rounded-2xl rounded-bl-sm px-4 py-2 max-w-[92%] sm:max-w-[80%] break-words whitespace-pre-wrap">
        {message.content}
      </div>
    </div>
  );
}
