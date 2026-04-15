import { useSelector } from "react-redux";
import { useChat } from "../../hooks/useChat";
import { useNavigate } from "react-router-dom";

const SUGGESTION_GROUPS = [
  {
    label: "Company Policy",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    prompts: [
      "Explain our company's leave policy",
      "What is the work-from-home policy?",
    ],
  },
  {
    label: "HR & People",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    prompts: [
      "How do I apply for a salary review?",
      "What are the employee benefits?",
    ],
  },
  {
    label: "IT & Tools",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    prompts: [
      "How do I troubleshoot VPN issues?",
      "What software tools do we use?",
    ],
  },
  {
    label: "Training",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    ),
    prompts: [
      "What are upcoming training sessions?",
      "How do I access learning resources?",
    ],
  },
];

const WelcomeScreen = () => {
  const { user } = useSelector((state) => state.auth);
  const { createNewChat, sendMessageToNewChat } = useChat();
  const navigate = useNavigate();

  const firstName = user?.name?.split(" ")[0] || "there";

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const handlePromptClick = async (prompt) => {
    if (sendMessageToNewChat) {
      const chatId = await sendMessageToNewChat(prompt);
      if (chatId) navigate(`/chat/${chatId}`);
    } else {
      createNewChat();
      navigate("/");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black overflow-y-auto">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl mx-auto">

          {/* Greeting */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/20 mb-5">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white mb-2 tracking-tight">
              {getGreeting()}, {firstName}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              What can I help you with today?
            </p>
          </div>

          {/* Suggestion cards */}
          <div className="grid grid-cols-2 gap-3">
            {SUGGESTION_GROUPS.map((group) => (
              <div key={group.label} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-zinc-400 dark:text-zinc-500">{group.icon}</span>
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{group.label}</span>
                </div>
                <div className="space-y-2">
                  {group.prompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handlePromptClick(prompt)}
                      className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl px-3 py-2.5 transition-all leading-snug"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
