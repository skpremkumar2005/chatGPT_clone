import { memo, useState } from "react";
import { formatTimestamp } from "../../utils/helpers";
import { DocumentTextIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

const AttachmentBadge = ({ attachment }) => {
  const [expanded, setExpanded] = useState(false);
  const sizeKB = attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : null;

  return (
    <div className="mt-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 overflow-hidden max-w-sm">
      <div className="flex items-center gap-2 px-3 py-2">
        <DocumentTextIcon className="w-4 h-4 text-cyan-500 flex-shrink-0" />
        <span className="text-xs font-medium text-zinc-800 dark:text-white truncate flex-1">{attachment.filename}</span>
        {sizeKB && <span className="text-xs text-zinc-400 flex-shrink-0">{sizeKB}</span>}
        {attachment.processed_data && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="ml-1 p-0.5 text-zinc-400 hover:text-cyan-500 transition-colors flex-shrink-0"
          >
            {expanded ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
      {expanded && attachment.processed_data && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 px-3 py-2 max-h-48 overflow-y-auto">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
            {attachment.processed_data}
          </p>
        </div>
      )}
    </div>
  );
};

// Inline markdown: **bold**, *italic*, `code`
const renderInline = (text) => {
  const parts = [];
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[2] !== undefined)
      parts.push(<strong key={match.index} className="font-semibold text-zinc-900 dark:text-white">{match[2]}</strong>);
    else if (match[3] !== undefined)
      parts.push(<em key={match.index} className="italic text-zinc-600 dark:text-zinc-300">{match[3]}</em>);
    else if (match[4] !== undefined)
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-cyan-600 dark:text-cyan-300 rounded text-xs font-mono">
          {match[4]}
        </code>
      );
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : text;
};

const CodeBlock = ({ code, lang }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="my-3 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{lang || "code"}</span>
        <button onClick={handleCopy} className="text-xs text-zinc-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors font-medium">
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="px-4 py-3 bg-zinc-50 dark:bg-zinc-950 overflow-x-auto text-xs text-zinc-700 dark:text-zinc-300 font-mono leading-relaxed whitespace-pre">
        {code}
      </pre>
    </div>
  );
};

const renderFormattedContent = (content) => {
  if (!content) return null;
  const blocks = [];
  const lines = content.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    const fenceMatch = line.match(/^```(\w*)$/);
    if (fenceMatch) {
      const lang = fenceMatch[1];
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { codeLines.push(lines[i]); i++; }
      blocks.push(<CodeBlock key={`code-${i}`} code={codeLines.join("\n")} lang={lang} />);
      i++;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const cls = level === 1
        ? "text-base font-bold text-zinc-900 dark:text-white mt-4 mb-2"
        : level === 2
        ? "text-sm font-bold text-zinc-800 dark:text-zinc-100 mt-3 mb-1.5"
        : "text-sm font-semibold text-zinc-700 dark:text-zinc-200 mt-2 mb-1";
      blocks.push(<p key={`h-${i}`} className={cls}>{renderInline(headingMatch[2])}</p>);
      i++; continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push(<hr key={`hr-${i}`} className="border-zinc-200 dark:border-zinc-700 my-3" />);
      i++; continue;
    }

    // List items
    if (/^[\s]*[-•*]\s/.test(line) || /^[\s]*\d+\.\s/.test(line)) {
      const listItems = [];
      while (i < lines.length && (/^[\s]*[-•*]\s/.test(lines[i]) || /^[\s]*\d+\.\s/.test(lines[i]))) {
        const m = lines[i].match(/^[\s]*([-•*]\s|\d+\.\s)(.+)$/);
        if (m) listItems.push({ key: i, text: m[2], ordered: /\d+\./.test(m[1]) });
        i++;
      }
      const isOrdered = listItems[0]?.ordered;
      blocks.push(
        <ul key={`list-${i}`} className="space-y-1.5 mb-3 ml-1">
          {listItems.map((item, idx) => (
            <li key={item.key} className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed flex gap-2">
              <span className="text-cyan-500 dark:text-cyan-400 flex-shrink-0 mt-0.5 font-semibold">
                {isOrdered ? `${idx + 1}.` : "•"}
              </span>
              <span>{renderInline(item.text)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      blocks.push(
        <blockquote key={`bq-${i}`} className="border-l-2 border-cyan-400 dark:border-cyan-500/50 pl-3 my-2 text-sm text-zinc-500 dark:text-zinc-400 italic">
          {renderInline(line.slice(2))}
        </blockquote>
      );
      i++; continue;
    }

    // Empty line
    if (line.trim() === "") { i++; continue; }

    // Paragraph
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].match(/^#{1,3}\s/) &&
      !/^[\s]*[-•*]\s/.test(lines[i]) &&
      !/^[\s]*\d+\.\s/.test(lines[i]) &&
      !lines[i].startsWith("> ") &&
      !lines[i].startsWith("```") &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    if (paraLines.length > 0) {
      blocks.push(
        <p key={`p-${i}`} className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed mb-2">
          {renderInline(paraLines.join(" "))}
        </p>
      );
    }
  }

  return blocks;
};

const Message = memo(({ message }) => {
  const isUser = message.role === "user";

  return (
    <div className={`w-full ${isUser ? "bg-white dark:bg-black" : "bg-zinc-50/80 dark:bg-zinc-950/50"}`}>
      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="space-y-3">
          {/* Label */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isUser ? "text-cyan-600 dark:text-cyan-400" : "text-violet-600 dark:text-violet-400"}`}>
              {isUser ? "You" : "Answer"}
            </span>
            {message.response_time && (
              <span className="text-xs text-zinc-400 dark:text-zinc-600">
                • {message.response_time.toFixed(1)}s
              </span>
            )}
          </div>

          {/* Content */}
          <div className="space-y-1">
            {isUser ? (
              <p className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {message.content}
              </p>
            ) : (
              <div>{renderFormattedContent(message.content)}</div>
            )}
          </div>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-2">
              {message.attachments.map((att) => (
                <AttachmentBadge key={att.id || att.filename} attachment={att} />
              ))}
            </div>
          )}

          {/* Timestamp */}
          <div className="text-xs text-zinc-400 dark:text-zinc-600 pt-1">
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
});

Message.displayName = "Message";

export default Message;
