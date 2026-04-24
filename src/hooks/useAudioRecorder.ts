import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

const RECORDER_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/mp4",
];

interface AudioRecorderState {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  elapsedSeconds: number;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

function pickRecorderMimeType(): string | null {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return null;
  }

  return RECORDER_MIME_TYPES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? null;
}

function getAudioContextConstructor(): typeof AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const typedWindow = window as Window & { webkitAudioContext?: typeof AudioContext };
  return window.AudioContext ?? typedWindow.webkitAudioContext ?? null;
}

function resizeCanvas(canvas: HTMLCanvasElement) {
  const devicePixelRatio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width * devicePixelRatio));
  const height = Math.max(1, Math.round(rect.height * devicePixelRatio));

  if (canvas.width !== width) {
    canvas.width = width;
  }

  if (canvas.height !== height) {
    canvas.height = height;
  }
}

function getCanvasColors() {
  const styles = getComputedStyle(document.documentElement);

  return {
    accent: styles.getPropertyValue("--accent").trim() || "oklch(0.40 0.09 155)",
    muted: styles.getPropertyValue("--muted").trim() || "oklch(0.94 0.003 90)",
    border: styles.getPropertyValue("--border").trim() || "oklch(0.91 0.003 90)",
  };
}

export function useAudioRecorder(): AudioRecorderState {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const isRecordingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const stopResolverRef = useRef<((blob: Blob | null) => void) | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mimeTypeRef = useRef<string | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const cleanupResources = useCallback(() => {
    clearTimer();
    clearAnimation();
    analyserRef.current = null;
    isRecordingRef.current = false;

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, [clearAnimation, clearTimer]);

  const drawWaveform = useCallback(() => {
    const renderFrame = () => {
      if (!isRecordingRef.current) {
        return;
      }

      const canvas = canvasRef.current;
      const analyser = analyserRef.current;

      if (!canvas || !analyser) {
        animationFrameRef.current = window.requestAnimationFrame(renderFrame);
        return;
      }

      const context = canvas.getContext("2d");
      if (!context) {
        animationFrameRef.current = window.requestAnimationFrame(renderFrame);
        return;
      }

      resizeCanvas(canvas);
      const { width, height } = canvas;
      const colors = getCanvasColors();
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteTimeDomainData(data);

      context.clearRect(0, 0, width, height);
      context.fillStyle = colors.muted;
      context.fillRect(0, 0, width, height);

      const centerY = height / 2;
      const amplitude = height * 0.36;
      const sliceWidth = width / Math.max(1, data.length - 1);

      context.lineWidth = Math.max(2, Math.round((window.devicePixelRatio || 1) * 1.5));
      context.lineJoin = "round";
      context.lineCap = "round";
      context.strokeStyle = colors.accent;
      context.beginPath();

      for (let index = 0; index < data.length; index += 1) {
        const normalized = data[index] / 128 - 1;
        const y = centerY + normalized * amplitude;
        const x = sliceWidth * index;

        if (index === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }

      context.stroke();

      context.strokeStyle = colors.border;
      context.lineWidth = Math.max(1, Math.round(window.devicePixelRatio || 1));
      context.beginPath();
      context.moveTo(0, centerY);
      context.lineTo(width, centerY);
      context.stroke();

      animationFrameRef.current = window.requestAnimationFrame(renderFrame);
    };

    renderFrame();
  }, []);

  const startRecording = useCallback(async () => {
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

    const audioContextConstructor = getAudioContextConstructor();
    if (!audioContextConstructor) {
      throw new Error("Web Audio API is not supported in this browser");
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new audioContextConstructor();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      const sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNode.connect(analyser);

      streamRef.current = stream;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      chunksRef.current = [];
      mimeTypeRef.current = pickRecorderMimeType();
      isRecordingRef.current = true;
      setElapsedSeconds(0);
      setIsRecording(true);

      const recorder = mimeTypeRef.current
        ? new MediaRecorder(stream, { mimeType: mimeTypeRef.current })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blobType = mimeTypeRef.current ?? chunksRef.current[0]?.type ?? "audio/webm";
        const blob = new Blob(chunksRef.current, { type: blobType });
        const resolver = stopResolverRef.current;

        stopResolverRef.current = null;
        chunksRef.current = [];
        isRecordingRef.current = false;
        setIsRecording(false);
        setElapsedSeconds(0);
        cleanupResources();
        resolver?.(blob.size > 0 ? blob : null);
      };

      recorder.onerror = () => {
        const resolver = stopResolverRef.current;

        stopResolverRef.current = null;
        chunksRef.current = [];
        isRecordingRef.current = false;
        setIsRecording(false);
        setElapsedSeconds(0);
        cleanupResources();
        resolver?.(null);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;

      clearTimer();
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((currentSeconds) => currentSeconds + 1);
      }, 1000);

      clearAnimation();
      drawWaveform();
    } catch (error) {
      isRecordingRef.current = false;
      setIsRecording(false);
      setElapsedSeconds(0);
      cleanupResources();
      mediaRecorderRef.current = null;
      throw error;
    }
  }, [clearAnimation, clearTimer, cleanupResources, drawWaveform, isRecording]);

  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") {
      return null;
    }

    const stopPromise = new Promise<Blob | null>((resolve) => {
      stopResolverRef.current = resolve;
    });

    recorder.stop();
    mediaRecorderRef.current = null;

    return stopPromise;
  }, []);

  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state === "recording") {
        recorder.stop();
      }

      stopResolverRef.current?.(null);
      stopResolverRef.current = null;
      isRecordingRef.current = false;
      cleanupResources();
    };
  }, [cleanupResources]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    elapsedSeconds,
    canvasRef,
  };
}
