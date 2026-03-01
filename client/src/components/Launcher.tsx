import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";

interface LauncherProps {
  isOpen: boolean;
  onClick: () => void;
  hasUnread: boolean;
  color?: string;
  launcherImage?: string;
  bubbleText?: string;
}

export function Launcher({ isOpen, onClick, hasUnread, color, launcherImage, bubbleText }: LauncherProps) {
  const bgColor = color || "#10b981";
  const [showBubble, setShowBubble] = useState(!!bubbleText);
  const [imageReady, setImageReady] = useState(!launcherImage);

  useEffect(() => {
    if (!launcherImage) {
      setImageReady(true);
      return;
    }
    setImageReady(false);
    const img = new Image();
    img.onload = () => setImageReady(true);
    img.onerror = () => setImageReady(true);
    img.src = launcherImage;
  }, [launcherImage]);

  useEffect(() => {
    if (!bubbleText) return;
    setShowBubble(true);
    const timer = setTimeout(() => setShowBubble(false), 5000);
    return () => clearTimeout(timer);
  }, [bubbleText]);

  if (!imageReady) return null;

  return (
    <div className="relative flex items-center gap-2">
      {showBubble && bubbleText && !isOpen && (
        <div
          className="absolute right-full mr-2 max-w-[200px] px-3 py-2 rounded-xl rounded-br-sm text-xs font-medium animate-in fade-in slide-in-from-right-2 duration-300 whitespace-pre-wrap"
          style={{
            backgroundColor: "#1a1a1a",
            color: "#e0e0e0",
            border: `1px solid ${bgColor}30`,
            boxShadow: `0 4px 12px rgba(0,0,0,0.3)`,
          }}
          data-testid="text-launcher-bubble"
        >
          {bubbleText}
          <button
            onClick={(e) => { e.stopPropagation(); setShowBubble(false); }}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white/80 text-[8px]"
            data-testid="button-close-bubble"
          >
            ×
          </button>
        </div>
      )}
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
    </div>
  );
}
