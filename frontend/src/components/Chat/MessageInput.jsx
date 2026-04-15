import { useState, useRef, useEffect, useCallback } from "react";
import {
  PaperAirplaneIcon,
  MicrophoneIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import useSpeechRecognition from "../../hooks/useSpeechRecognition";
import toast from "react-hot-toast";

const MODE_BUTTONS = [
  {
    label: "Analyze",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: "Recommend",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    label: "Plan",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    label: "Learn",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
];

const MessageInput = ({ onSend, disabled, onAttachClick }) => {
  const [text, setText] = useState("");
  const [activeMode, setActiveMode] = useState(null);
  const baseTextRef = useRef("");
  const textareaRef = useRef(null);

  const handleResult = useCallback((liveTranscript) => {
    setText(baseTextRef.current + liveTranscript);
  }, []);

  const handleError = useCallback((msg) => {
    toast.error(msg, { duration: 4000 });
  }, []);

  const { isListening, isSupported, start, stop } = useSpeechRecognition({
    onResult: handleResult,
    onError: handleError,
  });

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [text]);

  useEffect(() => {
    if (!isListening) baseTextRef.current = text;
  }, [isListening, text]);

  const handleMicClick = () => {
    if (!isSupported) {
      toast.error("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    if (isListening) {
      stop();
    } else {
      baseTextRef.current = text;
      start();
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (isListening) stop();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    const finalText = activeMode ? `[${activeMode}] ${trimmed}` : trimmed;
    onSend(finalText);
    setText("");
    baseTextRef.current = "";
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <div className="w-full px-4 pb-5 pt-3 bg-white dark:bg-black">
      <div className="max-w-3xl mx-auto space-y-2">

        {/* Mode buttons */}
        <div className="flex items-center gap-1.5 px-1">
          {MODE_BUTTONS.map(({ label, icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => setActiveMode(activeMode === label ? null : label)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                activeMode === label
                  ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/30"
                  : "text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 bg-transparent"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Input box */}
        <form onSubmit={handleSubmit}>
          <div
            className={`flex items-end gap-2 bg-zinc-50 dark:bg-zinc-900 border rounded-2xl px-4 py-3 transition-all ${
              isListening
                ? "border-red-400 dark:border-red-500/50"
                : "border-zinc-200 dark:border-zinc-800 focus-within:border-cyan-400 dark:focus-within:border-cyan-500/40"
            }`}
          >
            {/* Listening indicator */}
            {isListening && (
              <div className="mb-1 flex-shrink-0">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
              </div>
            )}

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => { setText(e.target.value); baseTextRef.current = e.target.value; }}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening… speak now" : "Ask anything..."}
              disabled={disabled}
              rows={1}
              className="flex-1 bg-transparent text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none resize-none text-sm leading-relaxed py-0.5"
              style={{ minHeight: "24px", maxHeight: "160px" }}
            />

            {/* Action buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                disabled={disabled}
                onClick={onAttachClick}
                className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all disabled:opacity-40"
                title="Attach document"
              >
                <PaperClipIcon className="w-5 h-5" />
              </button>

              <button
                type="button"
                disabled={disabled}
                onClick={handleMicClick}
                title={!isSupported ? "Not supported" : isListening ? "Stop recording" : "Voice input"}
                className={`p-1.5 rounded-lg transition-all disabled:opacity-40 ${
                  isListening
                    ? "text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20"
                    : "text-zinc-400 dark:text-zinc-500 hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                } ${!isSupported ? "opacity-30 cursor-not-allowed" : ""}`}
              >
                <MicrophoneIcon className="w-5 h-5" />
              </button>

              <button
                type="submit"
                disabled={!canSend}
                className={`p-2 rounded-xl transition-all ${
                  canSend
                    ? "bg-cyan-500 hover:bg-cyan-400 text-white shadow-sm shadow-cyan-500/30"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
                }`}
                title="Send"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isListening && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1.5 px-1">
              Recording — press Enter or click mic to stop
            </p>
          )}
        </form>

        <p className="text-center text-xs text-zinc-300 dark:text-zinc-700">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
};

export default MessageInput;
