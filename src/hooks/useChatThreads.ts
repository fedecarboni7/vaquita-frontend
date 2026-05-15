import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api";

export interface ChatThreadSummary {
  thread_id: string;
  started_at: string;
  interaction_count: number;
  transactions_created: number;
}

export interface ChatThreadsResponse {
  threads: ChatThreadSummary[];
}

export interface ChatThreadInteraction {
  id: string;
  user_message: string;
  agent_reply: string;
  created_at: string;
}

export interface ChatThreadDetailResponse {
  thread_id: string;
  interactions: ChatThreadInteraction[];
}

export function useChatThreads(query: string | null) {
  return useQuery({
    queryKey: ["chat-threads", query],
    queryFn: () => {
      const params = query ? `?q=${encodeURIComponent(query)}` : "";
      return apiFetch<ChatThreadsResponse>(`/chat/threads${params}`);
    },
  });
}

export function useChatThread(threadId: string | undefined) {
  return useQuery({
    queryKey: ["chat-thread", threadId],
    queryFn: () => apiFetch<ChatThreadDetailResponse>(`/chat/threads/${threadId}`),
    enabled: Boolean(threadId),
  });
}
