import { useState, useCallback } from "react";
import { apiFetch } from "../api";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  response_type?: string;
  data?: Record<string, unknown> | null;
}

interface ChatResponse {
  response_type: string;
  message: string;
  data: Record<string, unknown> | null;
}

export function useChatStore() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        // Build payload: last 2 interactions (4 msgs) + current message
        const allMessages = [...messages, userMsg];
        const historyWindow = allMessages.slice(-5); // max 4 history + 1 current

        const payload = {
          messages: historyWindow.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        };

        const response = await apiFetch<ChatResponse>("/chat", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.message,
          response_type: response.response_type,
          data: response.data,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Error al procesar el mensaje. Intentá de nuevo.",
          response_type: "answer",
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  return { messages, isLoading, sendMessage, setMessages };
}
