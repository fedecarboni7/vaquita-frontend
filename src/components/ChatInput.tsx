import { useLayoutEffect, useRef, useState, type KeyboardEvent, type SyntheticEvent } from "react";
import { Loader2, Mic, Send, Square } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "../api";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import type { SessionApiKeyPayload } from "../types/settings";

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  isProcessing?: boolean;
}

interface TranscriptionResponse {
  transcript: string;
}

const SESSION_API_KEY_STORAGE_KEY = "session_llm_api_key";

function parseSessionApiKey(): SessionApiKeyPayload | null {
  const rawSessionApiKey = sessionStorage.getItem(SESSION_API_KEY_STORAGE_KEY);
  if (!rawSessionApiKey) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawSessionApiKey) as Partial<SessionApiKeyPayload>;
    if (
      (parsed.provider === "google" || parsed.provider === "groq") &&
      typeof parsed.api_key === "string" &&
      parsed.api_key.trim()
    ) {
      return {
        provider: parsed.provider,
        api_key: parsed.api_key,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function formatElapsedTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function ChatInput({ onSend, onStop, isProcessing = false }: Props) {
  const [text, setText] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { isRecording, startRecording, stopRecording, elapsedSeconds, canvasRef } = useAudioRecorder();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    const nextHeight = Math.min(textarea.scrollHeight, 176);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > 176 ? "auto" : "hidden";
  };

  useLayoutEffect(() => {
    autoResizeTextarea();
  }, [text]);

  const sendCurrentText = () => {
    const trimmed = text.trim();
    if (!trimmed || isProcessing || isTranscribing) return;
    onSend(trimmed);
    setText("");
  };

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendCurrentText();
  };

  const handleTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendCurrentText();
    }
  };

  const handleMicClick = async () => {
    if (isProcessing || isTranscribing) {
      return;
    }

    if (isRecording) {
      const audioBlob = await stopRecording();
      if (!audioBlob) {
        setText("");
        return;
      }

      setIsTranscribing(true);

      try {
        const formData = new FormData();
        const extension = audioBlob.type.includes("ogg") ? "ogg" : "webm";
        formData.append("audio", audioBlob, `voice-message.${extension}`);
        const sessionApiKey = parseSessionApiKey();
        if (sessionApiKey) {
          formData.append("session_api_key", JSON.stringify(sessionApiKey));
        }

        const { transcript } = await apiFetch<TranscriptionResponse>("/transcribe", {
          method: "POST",
          body: formData,
        });

        const normalizedTranscript = transcript.trim();
        if (!normalizedTranscript) {
          throw new Error("La transcripción llegó vacía");
        }

        setText((currentText) => {
          const trimmedCurrentText = currentText.trim();
          return trimmedCurrentText ? `${trimmedCurrentText} ${normalizedTranscript}` : normalizedTranscript;
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo transcribir el audio";
        toast.error(message);
        setText("");
      } finally {
        setIsTranscribing(false);
      }

      return;
    }

    try {
      await startRecording();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo iniciar la grabación";
      toast.error(message);
    }
  };

  return (
    <div className="border-t border-border bg-card/95 px-4 py-4">
      {isRecording && (
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-border bg-muted/50 px-3 py-2">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent animate-pulse" />
            <canvas
              ref={canvasRef}
              className="h-11 w-full min-w-0 flex-1 rounded-xl border border-border bg-background/80"
              aria-hidden="true"
            />
          </div>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {formatElapsedTime(elapsedSeconds)}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder={isTranscribing ? "Transcribiendo..." : "Ej: Gasté 500 en el super con..."}
            disabled={isProcessing || isTranscribing}
            className={`block w-full min-h-11 rounded-xl border border-border bg-background px-4 py-3 text-sm leading-5 text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60 resize-none ${
              isTranscribing ? "pr-32" : "pr-4"
            }`}
          />

          {isTranscribing && (
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Loader2 size={14} className="animate-spin" />
              <span>Transcribiendo...</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleMicClick}
          disabled={isProcessing || isTranscribing}
          aria-label={isRecording ? "Detener grabación" : "Iniciar grabación"}
          className={
            isRecording
              ? "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-[var(--destructive)] text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              : "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-secondary text-secondary-foreground transition hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-60"
          }
        >
          {isRecording ? <Square size={18} /> : <Mic size={18} />}
        </button>

        {isProcessing ? (
          <button
            type="button"
            onClick={onStop}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-[var(--destructive)] px-4 text-sm font-medium text-background transition hover:opacity-90"
            aria-label="Detener procesamiento"
          >
            <Square size={18} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!text.trim() || isTranscribing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={16} />
            <span>Enviar</span>
          </button>
        )}
      </form>
    </div>
  );
}