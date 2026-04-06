import { useCallback, useEffect, useRef, useState } from "react";

const RECORDER_MIME_TYPE = "audio/webm;codecs=opus";

interface AudioRecorderState {
  isRecording: boolean;
  start: () => Promise<void>;
  stop: () => void;
  audioBlob: Blob | null;
}

export function useAudioRecorder(): AudioRecorderState {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    if (isRecording) {
      return;
    }

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      throw new Error("Audio recording is not supported in this browser");
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      setAudioBlob(null);

      if (!MediaRecorder.isTypeSupported(RECORDER_MIME_TYPE)) {
        throw new Error("audio/webm;codecs=opus is not supported in this browser");
      }

      const recorder = new MediaRecorder(stream, { mimeType: RECORDER_MIME_TYPE });

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: RECORDER_MIME_TYPE });
        chunksRef.current = [];
        setAudioBlob(blob.size > 0 ? blob : null);
        mediaRecorderRef.current = null;
        setIsRecording(false);
        cleanupStream();
      };

      recorder.onerror = () => {
        mediaRecorderRef.current = null;
        setIsRecording(false);
        cleanupStream();
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (error) {
      mediaRecorderRef.current = null;
      setIsRecording(false);
      cleanupStream();
      throw error;
    }
  }, [cleanupStream, isRecording]);

  const stop = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") {
      return;
    }

    recorder.stop();
  }, []);

  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state === "recording") {
        recorder.stop();
      }
      cleanupStream();
    };
  }, [cleanupStream]);

  return {
    isRecording,
    start,
    stop,
    audioBlob,
  };
}
