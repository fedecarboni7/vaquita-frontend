import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";

import { useAudioRecorder } from "../hooks/useAudioRecorder";

interface Props {
  onSend: (text: string) => void;
  onSendAudio: (audioBlob: Blob) => Promise<void> | void;
  isLoading?: boolean;
}

export default function ChatInput({ onSend, onSendAudio, isLoading }: Props) {
  const [text, setText] = useState("");
  const [recorderError, setRecorderError] = useState<string | null>(null);
  const { isRecording, start, stop, audioBlob } = useAudioRecorder();
  const lastSentBlobRef = useRef<Blob | null>(null);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setText("");
  };

  const handleMicClick = async () => {
    if (isLoading) {
      return;
    }

    setRecorderError(null);
    if (isRecording) {
      stop();
      return;
    }

    try {
      await start();
    } catch {
      setRecorderError("No se pudo iniciar la grabacion");
    }
  };

  useEffect(() => {
    if (!audioBlob || lastSentBlobRef.current === audioBlob) {
      return;
    }

    lastSentBlobRef.current = audioBlob;

    const sendAudio = async () => {
      try {
        await onSendAudio(audioBlob);
      } catch {
        setRecorderError("No se pudo enviar el audio");
      }
    };

    void sendAudio();
  }, [audioBlob, onSendAudio]);

  return (
    <div className="border-t border-gray-700 p-4">
      {isRecording && (
        <p className="mb-2 text-xs font-medium text-red-400">Grabando...</p>
      )}
      {recorderError && (
        <p className="mb-2 text-xs font-medium text-red-400">{recorderError}</p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ej: Gaste 500 en el super..."
          disabled={isLoading}
          className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleMicClick}
          disabled={isLoading}
          aria-label={isRecording ? "Detener grabacion" : "Iniciar grabacion"}
          className={
            isRecording
              ? "bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg disabled:opacity-50"
              : "bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-lg disabled:opacity-50"
          }
        >
          {isRecording ? <Square size={18} /> : <Mic size={18} />}
        </button>
        <button
          type="submit"
          disabled={isLoading || !text.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {isLoading ? "..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}