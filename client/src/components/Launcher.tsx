import { MessageCircle, X } from "lucide-react";

interface LauncherProps {
  isOpen: boolean;
  onClick: () => void;
  hasUnread: boolean;
}

export function Launcher({ isOpen, onClick, hasUnread }: LauncherProps) {
  return (
    <button
      data-testid="button-launcher"
      onClick={onClick}
      className={`
        fixed bottom-5 right-5 z-50
        w-14 h-14 rounded-full
        flex items-center justify-center
        transition-all duration-300 ease-out
        focus:outline-none
        ${isOpen
          ? "bg-[#2a2a2a] rotate-0"
          : "bg-[#6200EA] animate-pulse-glow rotate-0"
        }
      `}
      style={{ border: "none" }}
    >
      <div className={`transition-transform duration-300 ${isOpen ? "rotate-90" : "rotate-0"}`}>
        {isOpen ? (
          <X className="w-6 h-6 text-white/80" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </div>
      {hasUnread && !isOpen && (
        <span
          data-testid="badge-unread"
          className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 border-2 border-[#1a1a1a]"
        />
      )}
    </button>
  );
}
