import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";

interface LauncherProps {
  isOpen: boolean;
  onClick: () => void;
  hasUnread: boolean;
  color?: string;
  launcherImage?: string;
  launcherScale?: number;
  bubbleText?: string;
  position?: string;
  onBubbleChange?: (visible: boolean) => void;
}

export function Launcher({ isOpen, onClick, hasUnread, color, launcherImage, launcherScale = 100, bubbleText, position = "right", onBubbleChange }: LauncherProps) {
  const bgColor = color || "#10b981";
  const [showBubble, setShowBubble] = useState(!!bubbleText);
  const isLeft = position === "left";
  const [imageReady, setImageReady] = useState(!launcherImage);

  const sizePx = Math.round(56 * launcherScale / 100);
  const badgeSize = Math.max(10, Math.round(16 * launcherScale / 100));
  const badgeOffset = Math.round(badgeSize * -0.15);

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
    const fallback = setTimeout(() => setImageReady(true), 3000);
    return () => clearTimeout(fallback);
  }, [launcherImage]);

  useEffect(() => {
    if (!bubbleText) return;
    setShowBubble(true);
    onBubbleChange?.(true);
  }, [bubbleText]);

  if (!imageReady) return null;

  const handleCloseBubble = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBubble(false);
    onBubbleChange?.(false);
  };

  return (
    <div className={`relative flex items-center gap-2 ${isLeft ? "flex-row-reverse" : "flex-row"}`}>
      {showBubble && bubbleText && !isOpen && (
        <div
          className={`absolute max-w-[200px] px-3 py-2 rounded-xl text-xs font-medium animate-in fade-in duration-300 whitespace-pre-wrap ${
            isLeft ? "left-full ml-2 rounded-bl-sm slide-in-from-left-2" : "right-full mr-2 rounded-br-sm slide-in-from-right-2"
          }`}
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
            onClick={handleCloseBubble}
            className={`absolute -top-1 w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white/80 text-[8px] ${
              isLeft ? "-right-1" : "-right-1"
            }`}
            data-testid="button-close-bubble"
          >
            ×
          </button>
        </div>
      )}
      <div
        className="relative"
        style={{ width: `${sizePx}px`, height: `${sizePx}px` }}
      >
        <button
          data-testid="button-launcher"
          onClick={() => { if (showBubble) { setShowBubble(false); onBubbleChange?.(false); } onClick(); }}
          className="
            w-full h-full rounded-full
            flex items-center justify-center
            transition-transform duration-200 ease-out
            hover:scale-105 active:scale-95
            focus:outline-none
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
              className="w-full h-full rounded-full object-cover block"
              data-testid="img-launcher-custom"
            />
          ) : (
            <MessageCircle className="w-6 h-6 text-white" />
          )}
        </button>
        {hasUnread && (
          <span
            data-testid="badge-unread"
            className="absolute rounded-full bg-red-500 border-2 border-[#1a1a1a] pointer-events-none"
            style={{
              width: `${badgeSize}px`,
              height: `${badgeSize}px`,
              top: `${badgeOffset}px`,
              right: `${badgeOffset}px`,
            }}
          />
        )}
      </div>
    </div>
  );
}
