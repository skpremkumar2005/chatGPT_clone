import { useState, useRef, useCallback } from "react";

/**
 * Custom hook that wraps the Web Speech API (SpeechRecognition).
 * Works in Chrome, Edge, and most Chromium-based browsers.
 * Returns isListening, isSupported, transcript, start, stop.
 */
const useSpeechRecognition = ({ onResult, onError } = {}) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  const isSupported = Boolean(SpeechRecognition);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    if (!isSupported) {
      onError?.("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    if (isListening) {
      stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;       // keep recording until stopped
    recognition.interimResults = true;   // stream partial results
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t + " ";
        } else {
          interim += t;
        }
      }
      // Pass both final+interim to the caller so the textarea updates live
      onResult?.(finalTranscript + interim, finalTranscript);
    };

    recognition.onerror = (event) => {
      const messages = {
        "not-allowed": "Microphone access was denied. Please allow microphone permission in your browser.",
        "no-speech": "No speech detected. Please try again.",
        "network": "Network error during speech recognition.",
        "audio-capture": "No microphone found.",
      };
      onError?.(messages[event.error] || `Speech recognition error: ${event.error}`);
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, isListening, stop, onResult, onError, SpeechRecognition]);

  return { isListening, isSupported, start, stop };
};

export default useSpeechRecognition;
