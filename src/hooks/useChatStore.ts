import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
  transcribed_text?: string | null;
}

interface ChatRequestMessage {
  role: ChatMessage["role"];
  content: string;
}

interface TextMutationPayload {
  messages: ChatRequestMessage[];
}

interface AudioMutationPayload {
  audioBlob: Blob;
  messages: ChatRequestMessage[];
}

const CHAT_HISTORY_LIMIT = 5;
const AUDIO_HISTORY_LIMIT = 4;

function toRequestMessages(messages: ChatMessage[]): ChatRequestMessage[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

function buildAssistantMessage(
  response: ChatResponse,
  data: Record<string, unknown> | null = response.data,
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: response.message,
    response_type: response.response_type,
    data,
  };
}

function buildErrorMessage(): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: "Error al procesar el mensaje. Intenta de nuevo.",
    response_type: "answer",
  };
}

export function useChatStore() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const textMutation = useMutation({
    mutationFn: ({ messages: requestMessages }: TextMutationPayload) =>
      apiFetch<ChatResponse>("/chat", {
        method: "POST",
        body: JSON.stringify({ messages: requestMessages }),
      }),
  });

  const audioMutation = useMutation({
    mutationFn: ({ audioBlob, messages: requestMessages }: AudioMutationPayload) => {
      const formData = new FormData();
      formData.append("audio", audioBlob, "voice-message.webm");
      if (requestMessages.length > 0) {
        formData.append("messages", JSON.stringify(requestMessages));
      }

      return apiFetch<ChatResponse>("/chat/audio", {
        method: "POST",
        body: formData,
      });
    },
  });

  const isLoading = textMutation.isPending || audioMutation.isPending;

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) {
        return;
      }

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      };

      const allMessages = [...messages, userMsg];
      const historyWindow = toRequestMessages(allMessages.slice(-CHAT_HISTORY_LIMIT));

      setMessages((prev) => [...prev, userMsg]);

      try {
        const response = await textMutation.mutateAsync({
          messages: historyWindow,
        });
        setMessages((prev) => [...prev, buildAssistantMessage(response)]);
      } catch {
        setMessages((prev) => [...prev, buildErrorMessage()]);
      }
    },
    [isLoading, messages, textMutation],
  );

  const sendAudioMessage = useCallback(
    async (audioBlob: Blob) => {
      if (isLoading || !audioBlob || audioBlob.size === 0) {
        return;
      }

      try {
        const historyWindow = toRequestMessages(messages.slice(-AUDIO_HISTORY_LIMIT));
        const response = await audioMutation.mutateAsync({
          audioBlob,
          messages: historyWindow,
        });

        const transcribedText = (response.transcribed_text ?? "").trim();
        if (transcribedText) {
          const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: transcribedText,
          };
          setMessages((prev) => [...prev, userMsg]);
        }

        setMessages((prev) => [...prev, buildAssistantMessage(response)]);
      } catch {
        setMessages((prev) => [...prev, buildErrorMessage()]);
      }
    },
    [audioMutation, isLoading, messages],
  );

  return { messages, isLoading, sendMessage, sendAudioMessage, setMessages };
}
