import { useState, useRef, useEffect } from "react";
import { Send, Wifi, WifiOff, Headphones } from "lucide-react";
import type { Message } from "@shared/schema";

interface ChatWindowProps {
  messages: Message[];
  onSend: (content: string) => void;
  isConnected: boolean;
  userName: string;
}

function formatTime(timestamp: string | Date) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-fade-in">
      <div className="w-7 h-7 rounded-full bg-[#6200EA]/20 border border-[#6200EA]/30 flex items-center justify-center flex-shrink-0">
        <Headphones className="w-3.5 h-3.5 text-[#6200EA]" />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-md rounded-bl-none px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#6200EA] typing-dot" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#6200EA] typing-dot" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#6200EA] typing-dot" />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.sender === "user";

  return (
    <div
      data-testid={`message-bubble-${message.id}`}
      className={`flex items-end gap-2 animate-fade-in ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-[#6200EA]/20 border border-[#6200EA]/30 flex items-center justify-center flex-shrink-0">
          <Headphones className="w-3.5 h-3.5 text-[#6200EA]" />
        </div>
      )}
      <div className="flex flex-col gap-1 max-w-[75%]">
        <div
          className={`
            px-3.5 py-2.5 rounded-md text-sm leading-relaxed break-words
            ${isUser
              ? "bg-[#6200EA] text-white rounded-br-none"
              : "bg-white/5 border border-white/10 text-white/90 rounded-bl-none"
            }
          `}
        >
          {message.content}
        </div>
        <span
          className={`text-[10px] text-white/30 ${isUser ? "text-right" : "text-left"}`}
        >
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

export function ChatWindow({ messages, onSend, isConnected, userName }: ChatWindowProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#6200EA]/20 border border-[#6200EA]/30 flex items-center justify-center">
          <Headphones className="w-4 h-4 text-[#6200EA]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 data-testid="text-header-title" className="text-sm font-semibold text-white truncate">Support Team</h3>
          <div className="flex items-center gap-1.5">
            {isConnected ? (
              <Wifi className="w-3 h-3 text-green-400" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-400" />
            )}
            <span data-testid="text-connection-status" className={`text-[11px] ${isConnected ? "text-green-400" : "text-red-400"}`}>
              {isConnected ? "Online" : "Connecting..."}
            </span>
          </div>
        </div>
        <div data-testid="text-user-name" className="text-xs text-white/30 truncate max-w-[100px]">
          {userName}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 chat-scrollbar">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-14 h-14 rounded-full bg-[#6200EA]/10 border border-[#6200EA]/20 flex items-center justify-center mb-4">
              <Headphones className="w-7 h-7 text-[#6200EA]/60" />
            </div>
            <p className="text-sm text-white/40 mb-1">No messages yet</p>
            <p className="text-xs text-white/25">
              Send a message to start the conversation
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="px-3 py-3 border-t border-white/10 flex items-center gap-2"
      >
        <input
          ref={inputRef}
          data-testid="input-message"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="
            flex-1 py-2.5 px-3.5 rounded-md
            bg-white/5 border border-white/10
            text-white text-sm placeholder:text-white/25
            focus:outline-none focus:ring-1 focus:ring-[#6200EA] focus:border-[#6200EA]
            transition-colors
          "
        />
        <button
          data-testid="button-send"
          type="submit"
          disabled={!input.trim() || !isConnected}
          className="
            w-10 h-10 rounded-md flex items-center justify-center
            bg-[#6200EA] text-white
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all duration-200
            hover:bg-[#7c2fff]
            active:scale-95
            focus:outline-none
          "
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
