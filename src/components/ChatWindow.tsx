import ChatMessage from "./ChatMessage";
import type { ChatMessage as ChatMessageType } from "../hooks/useChatStore";

interface Props {
  messages: ChatMessageType[];
  isProcessing?: boolean;
}

export default function ChatWindow({ messages, isProcessing = false }: Props) {
  if (messages.length === 0 && !isProcessing) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm text-center">
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
        />
      ))}
      {isProcessing && (
        <div className="flex gap-2 items-end">
          <div className="shrink-0 w-6 h-6 mb-0.5">
            <img src="/vaquita-logo-light.png" alt="" className="w-6 h-6 rounded-full border border-border object-contain opacity-80 dark:hidden" />
            <img src="/vaquita-logo-dark.png" alt="" className="w-6 h-6 rounded-full border border-border object-contain opacity-80 hidden dark:block" />
          </div>
          <div className="bg-muted border border-border rounded-2xl rounded-bl-sm px-4 py-3 max-w-[92%] sm:max-w-[80%]">
            <span className="sr-only">El asistente está escribiendo</span>
            <div className="flex items-center gap-1" aria-hidden="true">
              <span
                className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"
                style={{ animationDelay: "-0.3s" }}
              />
              <span
                className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"
                style={{ animationDelay: "-0.15s" }}
              />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}