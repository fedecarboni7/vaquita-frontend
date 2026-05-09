export type ApiKeyProvider = "google" | "groq";

export interface ApiKeyStatusResponse {
  provider: ApiKeyProvider | null;
  has_key: boolean;
}

export interface ApiKeyUpsertRequest {
  provider: ApiKeyProvider;
  api_key: string;
}