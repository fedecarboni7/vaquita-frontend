import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../api";
import type { SessionApiKeyPayload } from "@/types/settings";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  input_source?: "text" | "audio";
  response_type?: string;
  data?: Record<string, unknown> | null;
}

interface ChatResponse {
  response_type: string;
  message: string;
  data: Record<string, unknown> | null;
}

interface ChatRequestMessage {
  role: ChatMessage["role"];
  content: string;
}

interface ChatRequestPayload {
  messages: ChatRequestMessage[];
  session_api_key?: SessionApiKeyPayload;
}

interface TextMutationPayload {
  payload: ChatRequestPayload;
  signal: AbortSignal;
}

const CHAT_HISTORY_LIMIT = 5;
const SESSION_API_KEY_STORAGE_KEY = "session_llm_api_key";

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
    content: "Error al procesar el mensaje. Intentá de nuevo.",
    response_type: "answer",
  };
}

function buildRateLimitMessage(content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content,
    response_type: "answer",
  };
}

function getUserFacingHttpDetail(error: unknown): string | null {
  if (!(error instanceof Error)) {
    return null;
  }

  const message = error.message.trim();
  if (!(message.startsWith("HTTP 429: ") || message.startsWith("HTTP 400: "))) {
    return null;
  }

  const detail = message.replace(/^HTTP\s\d{3}:\s*/, "").trim();
  return detail || null;
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: string }).name === "AbortError"
  );
}

export function useChatStore() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const textMutation = useMutation({
    mutationFn: ({ payload, signal }: TextMutationPayload) =>
      apiFetch<ChatResponse>("/chat", {
        method: "POST",
        body: JSON.stringify(payload),
        signal,
      }),
  });

  const beginProcessing = useCallback(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsProcessing(true);
    return controller;
  }, []);

  const finishProcessing = useCallback((controller: AbortController) => {
    if (abortControllerRef.current !== controller) {
      return;
    }

    abortControllerRef.current = null;
    setIsProcessing(false);
  }, []);

  const stopProcessing = useCallback(() => {
    const activeController = abortControllerRef.current;
    if (activeController) {
      activeController.abort();
      abortControllerRef.current = null;
    }

    setIsProcessing(false);
  }, []);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isProcessing) {
        return;
      }

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        input_source: "text",
      };

      const allMessages = [...messages, userMsg];
      const historyWindow = toRequestMessages(allMessages.slice(-CHAT_HISTORY_LIMIT));
      const rawSessionApiKey = sessionStorage.getItem(SESSION_API_KEY_STORAGE_KEY);
      const sessionApiKey = rawSessionApiKey
        ? (JSON.parse(rawSessionApiKey) as SessionApiKeyPayload)
        : undefined;
      const requestPayload: ChatRequestPayload = {
        messages: historyWindow,
      };
      if (sessionApiKey?.api_key && sessionApiKey.provider) {
        requestPayload.session_api_key = sessionApiKey;
      }
      const controller = beginProcessing();

      setMessages((prev) => [...prev, userMsg]);

      try {
        const response = await textMutation.mutateAsync({
          payload: requestPayload,
          signal: controller.signal,
        });
        setMessages((prev) => [...prev, buildAssistantMessage(response)]);
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }

        const userFacingDetail = getUserFacingHttpDetail(error);
        if (userFacingDetail) {
          setMessages((prev) => [...prev, buildRateLimitMessage(userFacingDetail)]);
          return;
        }

        setMessages((prev) => [...prev, buildErrorMessage()]);
      } finally {
        finishProcessing(controller);
      }
    },
    [beginProcessing, finishProcessing, isProcessing, messages, textMutation],
  );

  return {
    messages,
    isProcessing,
    sendMessage,
    stopProcessing,
    setMessages,
  };
}
