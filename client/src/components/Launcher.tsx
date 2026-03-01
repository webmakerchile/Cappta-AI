import { MessageCircle } from "lucide-react";

interface LauncherProps {
  isOpen: boolean;
  onClick: () => void;
  hasUnread: boolean;
  color?: string;
  launcherImage?: string;
}

export function Launcher({ isOpen, onClick, hasUnread, color, launcherImage }: LauncherProps) {
  const bgColor = color || "#10b981";
  return (
    <button
      data-testid="button-launcher"
      onClick={onClick}
      className="
        relative w-12 h-12 rounded-full
        flex items-center justify-center
        transition-all duration-300 ease-out
        focus:outline-none
        animate-pulse-glow
        overflow-hidden
      "
      style={{ border: "none", backgroundColor: launcherImage ? "transparent" : bgColor }}
    >
      {launcherImage ? (
        <img
          src={launcherImage}
          alt="Chat"
          className="w-full h-full rounded-full object-cover"
          data-testid="img-launcher-custom"
        />
      ) : (
        <MessageCircle className="w-5 h-5 text-white" />
      )}
      {hasUnread && (
        <span
          data-testid="badge-unread"
          className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 border-2 border-[#1a1a1a]"
        />
      )}
    </button>
  );
}
