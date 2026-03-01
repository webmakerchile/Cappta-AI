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
        relative w-14 h-14 rounded-full
        flex items-center justify-center
        transition-transform duration-200 ease-out
        hover:scale-105 active:scale-95
        focus:outline-none
        shadow-lg
      "
      style={{
        border: "none",
        backgroundColor: launcherImage ? "transparent" : bgColor,
        boxShadow: launcherImage ? "none" : `0 4px 20px ${bgColor}40`,
      }}
    >
      {launcherImage ? (
        <img
          src={launcherImage}
          alt="Chat"
          className="w-full h-full rounded-full object-cover"
          style={{ display: "block" }}
          data-testid="img-launcher-custom"
        />
      ) : (
        <MessageCircle className="w-6 h-6 text-white" />
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
