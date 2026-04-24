export type ApiKeyProvider = "google" | "groq";

export interface ApiKeyStatusResponse {
  provider: ApiKeyProvider | null;
  persist: boolean | null;
  has_key: boolean;
}

export interface ApiKeyUpsertRequest {
  provider: ApiKeyProvider;
  api_key: string;
  persist: boolean;
}

export interface SessionApiKeyPayload {
  provider: ApiKeyProvider;
  api_key: string;
}
