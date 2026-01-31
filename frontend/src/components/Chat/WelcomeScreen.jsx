import React from "react";
import {
  SparklesIcon,
  ChartBarIcon,
  LightBulbIcon,
  DocumentMagnifyingGlassIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

const WelcomeScreen = () => {
  const modes = [
    {
      icon: ChartBarIcon,
      label: "Analyze",
      description: "Deep analysis of complex topics",
    },
    {
      icon: LightBulbIcon,
      label: "Recommend",
      description: "Get personalized suggestions",
    },
    {
      icon: DocumentMagnifyingGlassIcon,
      label: "Research",
      description: "Comprehensive research mode",
    },
    {
      icon: AcademicCapIcon,
      label: "Learn",
      description: "Educational explanations",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 bg-black overflow-hidden">
      {/* Centered Content */}
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center flex-1">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <SparklesIcon className="w-9 h-9 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-light text-white mb-3 text-center tracking-tight">
          Enterprise AI Assistant
        </h1>

        {/* Subtitle */}
        {/* <p className="text-lg text-gray-500 mb-12 text-center max-w-xl">
          Powered by Gemini 2.0 Flash
        </p> */}

        {/* Mode Buttons */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {modes.map((mode, index) => (
            <button
              key={index}
              className="group flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-full transition-all duration-200"
              title={mode.description}
            >
              <mode.icon className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 transition-colors" />
              <span className="text-sm text-gray-300 group-hover:text-white font-medium">
                {mode.label}
              </span>
            </button>
          ))}
        </div>

        {/* Example Prompts */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
          {[
            "Explain our company's leave policy in detail",
            "How do I troubleshoot VPN connection issues?",
            "What are the upcoming training sessions?",
            "Analyze this quarterly performance report",
          ].map((prompt, index) => (
            <button
              key={index}
              className="text-left p-4 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all duration-200 group"
            >
              <p className="text-sm text-gray-400 group-hover:text-gray-300">
                {prompt}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pb-8 flex gap-4 text-xs text-gray-600">
        <span>⚡ Fast responses</span>
        <span>🔒 Secure</span>
        <span>📄 Document analysis</span>
      </div>
    </div>
  );
};

export default WelcomeScreen;
