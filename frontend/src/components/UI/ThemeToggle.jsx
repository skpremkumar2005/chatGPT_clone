import React from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import useTheme from "../../hooks/useTheme";

const ThemeToggle = ({ className = "", compact = false }) => {
  const { isDark, toggleTheme } = useTheme();

  // Compact: single icon button for tight spaces (sidebar icon bar)
  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className={`w-12 h-12 flex items-center justify-center rounded-xl text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all ${className}`}
      >
        {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
        isDark
          ? "bg-zinc-700 hover:bg-zinc-600"
          : "bg-amber-100 hover:bg-amber-200 border border-amber-200"
      } ${className}`}
    >
      <SunIcon
        className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-300 ${
          isDark ? "text-zinc-500 opacity-50" : "text-amber-500 opacity-100"
        }`}
      />
      <MoonIcon
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-300 ${
          isDark ? "text-cyan-400 opacity-100" : "text-zinc-400 opacity-50"
        }`}
      />
      <span
        className={`absolute top-0.5 w-6 h-6 rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
          isDark ? "translate-x-7 bg-zinc-900" : "translate-x-0.5 bg-white"
        }`}
      >
        {isDark ? (
          <MoonIcon className="w-3.5 h-3.5 text-cyan-400" />
        ) : (
          <SunIcon className="w-3.5 h-3.5 text-amber-500" />
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;
