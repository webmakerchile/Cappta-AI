import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Send, Wifi, WifiOff, Headphones, UserRound, X, Search, ImagePlus, Loader2, ExternalLink, LogOut, ShoppingBag, Star, CheckCircle, Ticket, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Message, Session } from "@shared/schema";
import { useUpload } from "@/hooks/use-upload";
import { ProductSelector } from "@/components/ProductSelector";

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface BrowseProduct {
  id: number;
  name: string;
  price: string | null;
  platform: string;
  category: string;
  availability: string;
  badgeLabel: string | null;
}

const getPlatformBadge = (platform: string): string => {
  const platformMap: Record<string, string> = {
    ps5: "PS5",
    ps4: "PS4",
    xbox_series: "Xbox Series",
    xbox_one: "Xbox One",
    nintendo: "Nintendo",
    pc: "PC",
    all: "",
  };
  return platform in platformMap ? platformMap[platform] : platform;
};


interface QuickReplyButton {
  label: string;
  value?: string;
  url?: string;
}

interface ChatWindowProps {
  messages: Message[];
  sessions: Session[];
  onSend: (content: string, imageUrl?: string, quickReplyValue?: string) => void;
  onContactExecutive: () => void;
  isConnected: boolean;
  isSending?: boolean;
  isBotTyping?: boolean;
  userName: string;
  userEmail: string;
  contactRequested: boolean;
  onClose: () => void;
  onExitChat: () => void;
  sessionId: string;
  onRatingComplete?: () => void;
  onStartNewSession?: (problemType: string, gameName: string) => void;
  brandColor?: string;
  brandName?: string;
  brandLogo?: string;
  brandLogoScale?: number;
  tenantId?: number;
  headerTextColor?: string;
  botBubbleColor?: string;
  botTextColor?: string;
  userTextColor?: string;
  botIconUrl?: string;
  botIconScale?: number;
  labelContactButton?: string;
  labelTicketButton?: string;
  labelFinalizeButton?: string;
}

function formatTime(timestamp: string | Date) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function linkifyText(text: string): (string | JSX.Element)[] {
  const urlRegex = /(https?:\/\/[^\s<>\])"]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      urlRegex.lastIndex = 0;
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          data-testid={`message-link-${i}`}
          className="underline break-all"
          style={{ color: "rgba(255,255,255,0.7)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

function renderTextWithLinks(text: string) {
  return <>{linkifyText(text)}</>;
}

function highlightText(text: string, query: string, brandColor: string) {
  if (!query || query.length < 2) return renderTextWithLinks(text);
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="text-white rounded-sm px-0.5" style={{ backgroundColor: hexToRgba(brandColor, 0.5) }}>{part}</mark>
        ) : (
          <span key={i}>{linkifyText(part)}</span>
        )
      )}
    </>
  );
}

function parseQuickReplies(content: string): { text: string; buttons: QuickReplyButton[] } {
  const marker = "{{QUICK_REPLIES:";
  const idx = content.indexOf(marker);
  if (idx !== -1) {
    const text = content.substring(0, idx).trim();
    const jsonStart = idx + marker.length;
    const jsonEnd = content.indexOf("}}", jsonStart);
    if (jsonEnd !== -1) {
      try {
        const buttons = JSON.parse(content.substring(jsonStart, jsonEnd));
        if (Array.isArray(buttons)) return { text, buttons };
      } catch {}
    }
  }

  const btnRegex = /\[BTN:([^|]+)\|URL:([^\]]+)\]/g;
  let match;
  const buttons: QuickReplyButton[] = [];
  while ((match = btnRegex.exec(content)) !== null) {
    buttons.push({ label: match[1], url: match[2] });
  }
  if (buttons.length > 0) {
    const text = content.replace(btnRegex, "").trim();
    return { text, buttons };
  }

  return { text: content, buttons: [] };
}

function RatingCard({ sessionId, userEmail, userName, onRatingComplete, brandColor = "#10b981" }: { sessionId: string; userEmail: string; userName: string; onRatingComplete?: () => void; brandColor?: string }) {
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finalRating, setFinalRating] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("rated_session_" + sessionId);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSubmitted(true);
        setFinalRating(parsed.rating || 0);
      }
    } catch {}
  }, [sessionId]);

  const handleSubmit = async () => {
    if (selectedRating < 1 || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          userEmail,
          userName,
          rating: selectedRating,
          comment: comment.trim() || null,
        }),
      });
      if (res.ok || res.status === 409) {
        setSubmitted(true);
        setFinalRating(selectedRating);
        try {
          localStorage.setItem("rated_session_" + sessionId, JSON.stringify({ rating: selectedRating }));
        } catch {}
        if (onRatingComplete) {
          setTimeout(() => onRatingComplete(), 2500);
        }
      }
    } catch {} finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div data-testid="rating-submitted" className="p-4 rounded-md bg-[#1e1e1e]" style={{ borderWidth: 1, borderStyle: "solid", borderColor: hexToRgba(brandColor, 0.3) }}>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-sm font-medium text-white">Gracias por tu calificación</span>
        </div>
        <div className="flex items-center gap-0.5 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-5 h-5 ${star <= finalRating ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`}
            />
          ))}
        </div>
        {onRatingComplete && (
          <p className="text-xs text-white/40">Cerrando chat...</p>
        )}
      </div>
    );
  }

  const displayRating = hoveredRating || selectedRating;

  return (
    <div data-testid="rating-card" className="p-4 rounded-md bg-[#1e1e1e]" style={{ borderWidth: 1, borderStyle: "solid", borderColor: hexToRgba(brandColor, 0.3) }}>
      <p className="text-sm font-medium text-white mb-3">¿Cómo fue tu experiencia?</p>
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            data-testid={`rating-star-${star}`}
            type="button"
            onClick={() => setSelectedRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                star <= displayRating ? "text-yellow-400 fill-yellow-400" : "text-white/20"
              }`}
            />
          </button>
        ))}
      </div>
      <textarea
        data-testid="rating-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Deja un comentario (opcional)"
        rows={2}
        className="w-full rounded-md bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 p-2.5 mb-3 resize-none focus:outline-none focus:ring-1"
        style={{ "--tw-ring-color": brandColor, borderColor: undefined } as any}
        onFocus={(e) => { e.currentTarget.style.borderColor = brandColor; (e.currentTarget.style as any)["--tw-ring-color"] = brandColor; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = ""; }}
      />
      <Button
        data-testid="button-submit-rating"
        onClick={handleSubmit}
        disabled={selectedRating < 1 || submitting}
        className="w-full text-white text-sm"
        style={{ backgroundColor: brandColor }}
      >
        {submitting ? "Enviando..." : "Enviar calificación"}
      </Button>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  searchQuery: string;
  isLastSupport: boolean;
  onQuickReply: (btn: QuickReplyButton) => void;
  onRatingComplete?: () => void;
  onImageClick?: (url: string) => void;
  brandColor?: string;
  botBubbleColor?: string;
  botTextColor?: string;
  userTextColor?: string;
  botIconUrl?: string;
  botIconScale?: number;
}

const MessageBubble = memo(function MessageBubble({ message, searchQuery, isLastSupport, onQuickReply, onRatingComplete, onImageClick, brandColor = "#10b981", botBubbleColor, botTextColor, userTextColor, botIconUrl, botIconScale = 100 }: MessageBubbleProps) {
  const isUser = message.sender === "user";
  const hasImage = !!(message as any).imageUrl;
  const imageUrl = (message as any).imageUrl;
  const isImageOnly = hasImage && (!message.content || message.content === "Imagen enviada" || message.content === "Video enviado");

  const isRatingMessage = !isUser && message.content.includes("{{SHOW_RATING}}");

  if (isRatingMessage) {
    let sessionId = message.sessionId;
    let userEmail = message.userEmail || "";
    let uName = message.userName || "";
    try {
      const stored = localStorage.getItem("chat_thread_user") || localStorage.getItem("chat_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.activeSessionId) sessionId = parsed.activeSessionId;
        else if (parsed.sessionId) sessionId = parsed.sessionId;
        if (parsed.email) userEmail = parsed.email;
        if (parsed.name) uName = parsed.name;
      }
    } catch {}

    return (
      <div
        data-testid={`message-bubble-${message.id}`}
        className="flex items-end gap-2 animate-fade-in flex-row"
      >
        <div className="rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ width: `${Math.round(28 * botIconScale / 100)}px`, height: `${Math.round(28 * botIconScale / 100)}px`, aspectRatio: "1 / 1", backgroundColor: botIconUrl ? "transparent" : hexToRgba(brandColor, 0.2), border: botIconUrl ? "none" : `1px solid ${hexToRgba(brandColor, 0.3)}` }}>
          {botIconUrl ? (
            <img src={botIconUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <Headphones className="w-3.5 h-3.5" style={{ color: brandColor }} />
          )}
        </div>
        <div className="flex flex-col gap-1.5 max-w-[80%]">
          <RatingCard sessionId={sessionId} userEmail={userEmail} userName={uName} onRatingComplete={onRatingComplete} brandColor={brandColor} />
          <span className="text-[10px] text-white/30 text-left">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    );
  }

  const { text: displayText, buttons } = isUser
    ? { text: message.content, buttons: [] }
    : parseQuickReplies(message.content);

  const showButtons = !isUser && isLastSupport && buttons.length > 0;

  const msgAdminName = (message as any).adminName;
  const msgAdminColor = (message as any).adminColor || "#6200EA";
  const isAdmin = !isUser && !!msgAdminName;
  const alignRight = isUser || isAdmin;

  return (
    <div data-testid={`message-bubble-${message.id}`} className="animate-fade-in">
      {isAdmin && (
        <div className="flex items-center gap-1 justify-end mr-9 mb-0.5">
          <span className="text-[10px] font-semibold" style={{ color: msgAdminColor }}>
            {msgAdminName}
          </span>
        </div>
      )}
      <div className={`flex items-end gap-2 ${alignRight ? "flex-row-reverse" : "flex-row"}`}>
        {!alignRight && (
          <div
            className="rounded-full flex items-center justify-center flex-shrink-0 border overflow-hidden"
            style={{
              width: `${Math.round(28 * botIconScale / 100)}px`,
              height: `${Math.round(28 * botIconScale / 100)}px`,
              aspectRatio: "1 / 1",
              backgroundColor: botIconUrl ? "transparent" : hexToRgba(brandColor, 0.12),
              borderColor: botIconUrl ? "transparent" : hexToRgba(brandColor, 0.19),
            }}
          >
            {botIconUrl ? (
              <img src={botIconUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <Headphones className="w-3.5 h-3.5" style={{ color: brandColor }} />
            )}
          </div>
        )}
        {isAdmin && (
          <div
            className="rounded-full flex items-center justify-center flex-shrink-0 border overflow-hidden"
            style={{
              width: `${Math.round(28 * botIconScale / 100)}px`,
              height: `${Math.round(28 * botIconScale / 100)}px`,
              aspectRatio: "1 / 1",
              backgroundColor: hexToRgba(msgAdminColor, 0.15),
              borderColor: hexToRgba(msgAdminColor, 0.25),
            }}
          >
            <Headphones className="w-3.5 h-3.5" style={{ color: msgAdminColor }} />
          </div>
        )}
        <div className="flex flex-col gap-1.5 max-w-[80%]">
          <div
            className={`
              rounded-md overflow-hidden
              ${alignRight
                ? "rounded-br-none"
                : "rounded-bl-none"
              }
            `}
            style={isUser
              ? { backgroundColor: brandColor, color: userTextColor || "#ffffff" }
              : isAdmin
                ? {
                    backgroundColor: hexToRgba(msgAdminColor, 0.15),
                    border: `1px solid ${hexToRgba(msgAdminColor, 0.3)}`,
                    color: "rgba(255,255,255,0.9)",
                  }
                : {
                    backgroundColor: botBubbleColor || "rgba(255,255,255,0.05)",
                    border: botBubbleColor ? `1px solid ${botBubbleColor}` : "1px solid rgba(255,255,255,0.1)",
                    color: botTextColor || "rgba(255,255,255,0.9)",
                  }
            }
          >
            {hasImage && (
              (() => {
                const isVideo = /\.(mp4|webm|mov|avi|mkv)$/i.test(imageUrl || "");
                if (isVideo) {
                  return (
                    <div className="p-1.5">
                      <video
                        src={imageUrl}
                        controls
                        data-testid={`message-video-${message.id}`}
                        className="max-w-full max-h-52 rounded-md"
                        preload="metadata"
                      />
                    </div>
                  );
                }
                return (
                  <div className="block p-1.5 cursor-pointer" onClick={() => onImageClick?.(imageUrl)}>
                    <img
                      src={imageUrl}
                      alt="Imagen compartida"
                      data-testid={`message-image-${message.id}`}
                      className="max-w-full max-h-52 object-contain cursor-pointer rounded-md"
                      loading="lazy"
                    />
                  </div>
                );
              })()
            )}
            {!isImageOnly && (
              <div className="px-3.5 py-2.5 text-sm leading-relaxed break-words whitespace-pre-line">
                {searchQuery ? highlightText(displayText, searchQuery, brandColor) : renderTextWithLinks(displayText)}
              </div>
            )}
          </div>
          {showButtons && (
            <div data-testid="quick-reply-buttons" className="flex flex-wrap gap-1.5 pl-0.5">
              {buttons.map((btn, i) => (
                btn.url ? (
                  <a
                    key={i}
                    href={btn.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`quick-reply-link-${i}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border-2 text-white transition-opacity hover:opacity-90 cursor-pointer"
                    style={{ backgroundColor: brandColor, borderColor: brandColor, boxShadow: `0 0 8px ${hexToRgba(brandColor, 0.4)}` }}
                  >
                    <ExternalLink className="w-3 h-3" />
                    {btn.label}
                  </a>
                ) : (
                  <button
                    key={i}
                    data-testid={`quick-reply-btn-${i}`}
                    onClick={() => onQuickReply(btn)}
                    className="px-3 py-2 text-xs font-semibold rounded-md border-2 transition-opacity hover:opacity-80 cursor-pointer"
                    style={{ borderColor: hexToRgba(brandColor, 0.6), backgroundColor: hexToRgba(brandColor, 0.2), color: "rgba(255,255,255,0.7)" }}
                  >
                    {btn.label}
                  </button>
                )
              ))}
            </div>
          )}
          <span
            className={`text-[10px] text-white/30 ${alignRight ? "text-right" : "text-left"}`}
          >
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
});

function FinalizeRateButton({ sessionId, labelFinalizeButton }: { sessionId: string; labelFinalizeButton?: string }) {
  const [confirmState, setConfirmState] = useState<"idle" | "confirming" | "sent">("idle");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("rated_session_" + sessionId);
      if (stored) {
        setConfirmState("sent");
      } else {
        setConfirmState("idle");
      }
    } catch {}
  }, [sessionId]);

  const handleClick = async () => {
    if (confirmState === "sent" || sending) return;
    if (confirmState === "idle") {
      setConfirmState("confirming");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/request-rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setConfirmState("sent");
      }
    } catch {} finally {
      setSending(false);
    }
  };

  const isDisabled = confirmState === "sent" || sending;

  return (
    <Button
      data-testid="button-finalize-rate"
      variant="outline"
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        w-full mb-2 font-semibold text-sm
        ${confirmState === "sent"
          ? "opacity-50 cursor-not-allowed bg-amber-500/10 border-amber-500/30 text-white/50"
          : confirmState === "confirming"
            ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
            : "bg-amber-500/90 border-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.35)]"
        }
      `}
    >
      {confirmState === "sent" ? (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Encuesta enviada
        </>
      ) : confirmState === "confirming" ? (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          {sending ? "Enviando..." : "¿Confirmar finalizar?"}
        </>
      ) : (
        <>
          <Star className="w-4 h-4 mr-2" />
          {labelFinalizeButton || "Finalizar y Valorar"}
        </>
      )}
    </Button>
  );
}

const PROBLEM_TYPES = [
  { value: "compra", label: "Quiero comprar un producto" },
  { value: "codigo_verificacion", label: "Necesito un nuevo código de verificación" },
  { value: "candado_juego", label: "Me aparece un candado en mi juego" },
  { value: "estado_pedido", label: "Quiero saber el estado de mi pedido" },
  { value: "problema_plus", label: "Tengo problemas con mi plus" },
  { value: "otro", label: "Otro" },
];

function NewConsultationPicker({ onSelect, brandColor = "#10b981" }: { onSelect: (problemType: string, gameName: string) => void; brandColor?: string }) {
  const [selectedType, setSelectedType] = useState("");
  const [gameName, setGameName] = useState("");
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <div className="flex justify-center my-4">
        <button
          data-testid="button-new-consultation"
          onClick={() => setExpanded(true)}
          className="px-4 py-2.5 rounded-md text-white text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: brandColor, boxShadow: `0 0 12px ${hexToRgba(brandColor, 0.3)}` }}
        >
          Comenzar nueva consulta
        </button>
      </div>
    );
  }

  const handleSubmit = () => {
    if (selectedType && gameName.trim()) {
      onSelect(selectedType, gameName.trim());
      setExpanded(false);
      setSelectedType("");
      setGameName("");
    }
  };

  return (
    <div data-testid="new-consultation-form" className="mx-2 my-3 p-3 rounded-md bg-[#1e1e1e]" style={{ borderWidth: 1, borderStyle: "solid", borderColor: hexToRgba(brandColor, 0.3) }}>
      <p className="text-sm font-medium text-white mb-3">Nueva consulta</p>
      <div className="flex flex-col gap-2">
        <select
          data-testid="select-new-problem-type"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full rounded-md bg-white/5 border border-white/10 text-white text-sm p-2 focus:outline-none focus:ring-1"
          style={{ "--tw-ring-color": brandColor } as any}
        >
          <option value="" disabled>Tipo de consulta</option>
          {PROBLEM_TYPES.map(t => (
            <option key={t.value} value={t.value} className="bg-[#1e1e1e]">{t.label}</option>
          ))}
        </select>
        <ProductSelector
          value={gameName}
          onChange={setGameName}
          placeholder="Buscar juego o producto..."
          dataTestId="input-new-game-name"
          tenantId={tenantId}
        />
        <button
          data-testid="button-submit-new-consultation"
          onClick={handleSubmit}
          disabled={!selectedType || !gameName.trim()}
          className="w-full py-2 rounded-md text-white text-sm font-semibold disabled:opacity-40 transition-opacity hover:opacity-90"
          style={{ backgroundColor: brandColor }}
        >
          Iniciar consulta
        </button>
      </div>
    </div>
  );
}

function SessionDivider({ session, brandColor = "#10b981" }: { session: Session; brandColor?: string }) {
  const problemLabels: Record<string, string> = {
    compra: "Compra",
    codigo_verificacion: "Código verificación",
    candado_juego: "Candado en juego",
    estado_pedido: "Estado de pedido",
    problema_plus: "Problema Plus",
    otro: "Otro",
  };

  return (
    <div data-testid={`session-divider-${session.sessionId}`} className="flex items-center gap-3 my-4 px-2">
      <div className="flex-1 h-px bg-white/10" />
      <div className="flex items-center gap-1.5 text-[10px] text-white/30">
        <span>{session.status === "closed" ? "Consulta finalizada" : "Nueva consulta"}</span>
        {session.problemType && (
          <span style={{ color: hexToRgba(brandColor, 0.6) }}>({problemLabels[session.problemType] || session.problemType})</span>
        )}
      </div>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}

export function ChatWindow({ messages, sessions, onSend, onContactExecutive, isConnected, isSending, isBotTyping, userName, userEmail, contactRequested, onClose, onExitChat, sessionId, onRatingComplete, onStartNewSession, brandColor, brandName, brandLogo, brandLogoScale, tenantId, headerTextColor, botBubbleColor, botTextColor, userTextColor, botIconUrl, botIconScale, labelContactButton, labelTicketButton, labelFinalizeButton }: ChatWindowProps) {
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchIndex, setSearchIndex] = useState(0);
  const [showProductBrowser, setShowProductBrowser] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isOfflineHours, setIsOfflineHours] = useState(false);
  const [ticketUrl, setTicketUrl] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [browseProducts, setBrowseProducts] = useState<BrowseProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productBrowserRef = useRef<HTMLDivElement>(null);
  const productSearchInputRef = useRef<HTMLInputElement>(null);
  const productDebounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const checkBusinessHours = async () => {
      try {
        const res = await fetch("/api/business-hours-status");
        const data = await res.json();
        setIsOfflineHours(data.isOffline);
        setTicketUrl(data.ticketUrl);
      } catch {}
    };
    checkBusinessHours();
    const interval = setInterval(checkBusinessHours, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      onSend("", response.objectPath);
    },
  });

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return;
    if (file.size > 50 * 1024 * 1024) return;
    await uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [uploadFile]);

  const fetchBrowseProducts = useCallback(async (query: string) => {
    try {
      setIsLoadingProducts(true);
      const tenantParam = tenantId ? `&tenantId=${tenantId}` : "";
      const url = query.length >= 2
        ? `/api/products/browse?q=${encodeURIComponent(query)}&limit=20${tenantParam}`
        : `/api/products/browse?limit=20${tenantParam}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Error fetching products");
      const data = await response.json();
      setBrowseProducts(data.products || []);
    } catch {
      setBrowseProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [tenantId]);

  const handleProductSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setProductSearchQuery(val);
    if (productDebounceRef.current) clearTimeout(productDebounceRef.current);
    productDebounceRef.current = setTimeout(() => {
      fetchBrowseProducts(val);
    }, 300);
  }, [fetchBrowseProducts]);

  const handleProductSelect = useCallback((product: BrowseProduct) => {
    onSend(product.name);
    setShowProductBrowser(false);
    setProductSearchQuery("");
    setBrowseProducts([]);
    inputRef.current?.focus();
  }, [onSend]);

  const toggleProductBrowser = useCallback(() => {
    const nextState = !showProductBrowser;
    setShowProductBrowser(nextState);
    if (nextState) {
      fetchBrowseProducts("");
      setTimeout(() => productSearchInputRef.current?.focus(), 50);
    } else {
      setProductSearchQuery("");
      setBrowseProducts([]);
    }
  }, [showProductBrowser, fetchBrowseProducts]);

  useEffect(() => {
    if (!showProductBrowser) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (productBrowserRef.current && !productBrowserRef.current.contains(e.target as Node)) {
        setShowProductBrowser(false);
        setProductSearchQuery("");
        setBrowseProducts([]);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowProductBrowser(false);
        setProductSearchQuery("");
        setBrowseProducts([]);
        inputRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showProductBrowser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages, isSending, isBotTyping]);

  useEffect(() => {
    if (!showSearch) {
      inputRef.current?.focus();
    }
  }, [showSearch]);

  useEffect(() => {
    if (showSearch) {
      searchInputRef.current?.focus();
    }
  }, [showSearch]);

  useEffect(() => {
    setSearchIndex(0);
    if (searchQuery.length >= 2) {
      setTimeout(() => {
        const indices = messages.reduce<number[]>((acc, m, idx) => {
          const { text } = parseQuickReplies(m.content);
          if (text.toLowerCase().includes(searchQuery.toLowerCase())) acc.push(idx);
          return acc;
        }, []);
        if (indices.length > 0) {
          const msgId = messages[indices[0]]?.id;
          if (msgId) {
            const el = document.querySelector(`[data-testid="message-bubble-${msgId}"]`);
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }, 100);
    }
  }, [searchQuery]);

  const scrollToMatch = useCallback((index: number) => {
    if (searchMatchIndices.length === 0) return;
    const clampedIndex = ((index % searchMatchIndices.length) + searchMatchIndices.length) % searchMatchIndices.length;
    setSearchIndex(clampedIndex);
    const msgIdx = searchMatchIndices[clampedIndex];
    const msgId = messages[msgIdx]?.id;
    if (msgId) {
      const el = document.querySelector(`[data-testid="message-bubble-${msgId}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [searchMatchIndices, messages]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      scrollToMatch(e.shiftKey ? searchIndex - 1 : searchIndex + 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      scrollToMatch(searchIndex + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      scrollToMatch(searchIndex - 1);
    }
  }, [scrollToMatch, searchIndex]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  };

  const handleQuickReply = useCallback((btn: QuickReplyButton) => {
    if (btn.url) {
      window.open(btn.url, "_blank");
      return;
    }
    const value = btn.value || btn.label;
    if (value === "__qr:browse") {
      toggleProductBrowser();
      return;
    }
    if (value.startsWith("__qr:")) {
      onSend(btn.label, undefined, value);
    } else {
      onSend(value);
    }
  }, [onSend, toggleProductBrowser]);

  const searchMatchIndices = searchQuery.length >= 2
    ? messages.reduce<number[]>((acc, m, idx) => {
        const { text } = parseQuickReplies(m.content);
        if (text.toLowerCase().includes(searchQuery.toLowerCase())) acc.push(idx);
        return acc;
      }, [])
    : [];

  const matchCount = searchMatchIndices.length;
  const filteredMessages = messages;

  const lastSupportIdx = (() => {
    for (let i = filteredMessages.length - 1; i >= 0; i--) {
      if (filteredMessages[i].sender === "support") return i;
    }
    return -1;
  })();

  const latestSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
  const isSessionClosed = latestSession?.status === "closed";

  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [viewportOffset, setViewportOffset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handleResize = () => {
      setViewportHeight(vv.height);
      setViewportOffset(vv.offsetTop);
    };
    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleResize);
    handleResize();
    return () => {
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleResize);
    };
  }, []);

  return (
    <div
      className="flex flex-col"
      style={viewportHeight ? {
        height: `${viewportHeight}px`,
        transform: `translateY(${viewportOffset}px)`,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#1a1a1a',
      } : { height: '100%' }}
    >
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3" style={{ background: brandColor || "#10b981" }}>
        {brandLogo ? (
          <img src={brandLogo} alt={brandName || "Logo"} className="rounded-full object-cover bg-white/15" style={{ width: `${Math.round(36 * (brandLogoScale || 100) / 100)}px`, height: `${Math.round(36 * (brandLogoScale || 100) / 100)}px`, aspectRatio: "1 / 1" }} data-testid="img-brand-logo" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
            <Headphones className="w-4 h-4" style={{ color: headerTextColor || "#ffffff" }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 data-testid="text-header-title" className="text-sm font-semibold truncate" style={{ color: headerTextColor || "#ffffff" }}>{brandName || "Equipo de Soporte"}</h3>
          <div className="flex items-center gap-1.5">
            {isConnected ? (
              <Wifi className="w-3 h-3 text-green-300" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-300" />
            )}
            <span data-testid="text-connection-status" className={`text-[11px] ${isConnected ? "text-green-200" : "text-red-200"}`}>
              {isConnected ? "En l\u00ednea" : "Conectando..."}
            </span>
          </div>
        </div>
        <button
          data-testid="button-search-toggle"
          onClick={() => { setShowSearch(!showSearch); setSearchQuery(""); }}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showSearch ? "bg-white/30" : "bg-white/15 hover:bg-white/25"}`}
          title="Buscar"
        >
          <Search className="w-4 h-4" style={{ color: headerTextColor || "#ffffff" }} />
        </button>
        <button
          data-testid="button-exit-chat"
          onClick={onExitChat}
          className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center transition-colors hover:bg-white/25"
          title="Salir del chat"
        >
          <LogOut className="w-4 h-4" style={{ color: headerTextColor || "#ffffff" }} />
        </button>
        <button
          data-testid="button-close-chat"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center transition-colors hover:bg-white/25"
          title="Minimizar"
        >
          <X className="w-4 h-4" style={{ color: headerTextColor || "#ffffff" }} />
        </button>
      </div>

      {showSearch && (
        <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2 bg-white/[0.03]">
          <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
          <input
            ref={searchInputRef}
            data-testid="input-chat-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Buscar en la conversación..."
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 focus:outline-none"
          />
          {searchQuery.length >= 2 && matchCount > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-[11px] text-white/30">
                {searchIndex + 1}/{matchCount}
              </span>
              <button
                data-testid="button-search-prev"
                onClick={() => scrollToMatch(searchIndex - 1)}
                className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors"
                title="Anterior"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                data-testid="button-search-next"
                onClick={() => scrollToMatch(searchIndex + 1)}
                className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors"
                title="Siguiente"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {searchQuery.length >= 2 && matchCount === 0 && (
            <span className="text-[11px] text-white/30 flex-shrink-0">0 resultados</span>
          )}
          <button
            data-testid="button-close-search"
            onClick={() => { setShowSearch(false); setSearchQuery(""); setSearchIndex(0); }}
            className="text-white/30 hover:text-white/60"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 chat-scrollbar" style={{ contain: "content", WebkitOverflowScrolling: "touch" } as any}>
        {filteredMessages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: hexToRgba(brandColor || "#10b981", 0.1), border: `1px solid ${hexToRgba(brandColor || "#10b981", 0.2)}` }}>
              <Headphones className="w-7 h-7" style={{ color: hexToRgba(brandColor || "#10b981", 0.6) }} />
            </div>
            <p className="text-sm text-white/40 mb-1">Sin mensajes aun</p>
            <p className="text-xs text-white/25">
              Envia un mensaje para iniciar la conversación
            </p>
          </div>
        ) : (
          (() => {
            const items: React.ReactNode[] = [];
            let currentSessionId = "";
            const sessionMap = new Map(sessions.map(s => [s.sessionId, s]));

            filteredMessages.forEach((msg, idx) => {
              if (msg.sessionId !== currentSessionId && currentSessionId !== "") {
                const newSession = sessionMap.get(msg.sessionId);
                if (newSession) {
                  items.push(<SessionDivider key={`divider-${msg.sessionId}`} session={newSession} brandColor={brandColor} />);
                }
              }
              currentSessionId = msg.sessionId;

              items.push(
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  searchQuery={searchQuery}
                  isLastSupport={idx === lastSupportIdx}
                  onQuickReply={handleQuickReply}
                  onRatingComplete={onRatingComplete}
                  onImageClick={setLightboxImage}
                  brandColor={brandColor}
                  botBubbleColor={botBubbleColor}
                  botTextColor={botTextColor}
                  userTextColor={userTextColor}
                  botIconUrl={botIconUrl}
                  botIconScale={botIconScale}
                />
              );
            });

            const latestSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
            if (latestSession && latestSession.status === "closed" && onStartNewSession) {
              items.push(
                <SessionDivider key={`divider-closed-${latestSession.sessionId}`} session={latestSession} brandColor={brandColor} />
              );
              items.push(
                <NewConsultationPicker key="new-consultation" onSelect={onStartNewSession} brandColor={brandColor} />
              );
            }

            return items;
          })()
        )}
        {(isSending || isBotTyping) && (
          <div className="flex items-end gap-2 animate-fade-in" data-testid="typing-indicator">
            <div
              className="rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border"
              style={{
                width: `${Math.round(24 * (botIconScale || 100) / 100)}px`,
                height: `${Math.round(24 * (botIconScale || 100) / 100)}px`,
                aspectRatio: "1 / 1",
                backgroundColor: botIconUrl ? "transparent" : `${brandColor || "#10b981"}20`,
                borderColor: botIconUrl ? "transparent" : `${brandColor || "#10b981"}30`,
              }}
            >
              {botIconUrl ? (
                <img src={botIconUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <Headphones className="w-3 h-3" style={{ color: brandColor || "#10b981" }} />
              )}
            </div>
            <div
              className="px-4 py-3 rounded-2xl rounded-bl-md max-w-[85%]"
              style={{ backgroundColor: botBubbleColor || "#2a2a2a" }}
            >
              <div className="flex items-center gap-1.5">
                {isSending ? (
                  <span className="text-xs flex items-center gap-1.5" style={{ color: `${botTextColor || "#e0e0e0"}99` }}>
                    <Send className="w-3 h-3 animate-pulse" />
                    Enviando...
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-[3px]">
                      <span className="w-[6px] h-[6px] rounded-full animate-bounce" style={{ backgroundColor: brandColor || "#10b981", animationDelay: "0ms", animationDuration: "1s" }} />
                      <span className="w-[6px] h-[6px] rounded-full animate-bounce" style={{ backgroundColor: brandColor || "#10b981", animationDelay: "150ms", animationDuration: "1s" }} />
                      <span className="w-[6px] h-[6px] rounded-full animate-bounce" style={{ backgroundColor: brandColor || "#10b981", animationDelay: "300ms", animationDuration: "1s" }} />
                    </div>
                    <span className="text-xs ml-1" style={{ color: `${botTextColor || "#e0e0e0"}99` }}>
                      Pensando...
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-3 pt-2 pb-1 border-t border-white/10">
        {isOfflineHours ? (
          <a
            href={ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="button-create-ticket"
            className="w-full mb-2 font-semibold text-sm flex items-center justify-center gap-2 rounded-md px-4 py-2 text-white"
            style={{ backgroundColor: brandColor || "#10b981", borderWidth: 1, borderStyle: "solid", borderColor: brandColor || "#10b981", boxShadow: `0 0 12px ${hexToRgba(brandColor || "#10b981", 0.4)}` }}
          >
            <Ticket className="w-4 h-4" />
            {labelTicketButton || "Contactar un ejecutivo"}
          </a>
        ) : (
          <Button
            data-testid="button-contact-executive"
            variant="outline"
            onClick={onContactExecutive}
            disabled={contactRequested}
            className={`
              w-full mb-2 font-semibold text-sm
              ${contactRequested
                ? "opacity-50 cursor-not-allowed text-white/50"
                : "text-white"
              }
            `}
            style={contactRequested
              ? { backgroundColor: hexToRgba(brandColor || "#10b981", 0.1), borderWidth: 1, borderStyle: "solid", borderColor: hexToRgba(brandColor || "#10b981", 0.3) }
              : { backgroundColor: brandColor || "#10b981", borderWidth: 1, borderStyle: "solid", borderColor: brandColor || "#10b981", boxShadow: `0 0 12px ${hexToRgba(brandColor || "#10b981", 0.4)}` }
            }
          >
            <UserRound className="w-4 h-4 mr-2" />
            {contactRequested ? "Solicitud enviada" : (labelContactButton || "Contactar un ejecutivo")}
          </Button>
        )}
        <FinalizeRateButton sessionId={latestSession?.sessionId || sessionId} labelFinalizeButton={labelFinalizeButton} />
      </div>

      <div className="relative px-3 pb-3">
        {showProductBrowser && (
          <div
            ref={productBrowserRef}
            data-testid="product-browser-overlay"
            className="absolute bottom-full left-0 right-0 mx-1 sm:left-3 sm:right-3 sm:mx-0 mb-1 bg-[#1e1e1e] border border-white/10 rounded-md shadow-lg z-50 flex flex-col max-h-60 sm:max-h-72"
          >
            <div className="px-3 py-2 border-b border-white/[0.06] flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" style={{ color: brandColor || "#10b981" }} />
              <span className="text-[11px] text-white/30">Catálogo de productos</span>
              <Button
                data-testid="button-close-product-browser"
                size="icon"
                variant="ghost"
                onClick={() => { setShowProductBrowser(false); setProductSearchQuery(""); setBrowseProducts([]); }}
                className="ml-auto text-white/30 w-6 h-6 min-h-0"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="px-3 py-2 border-b border-white/[0.06]">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input
                  ref={productSearchInputRef}
                  data-testid="input-product-browser-search"
                  type="text"
                  value={productSearchQuery}
                  onChange={handleProductSearchChange}
                  placeholder="Buscar producto..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-1"
                  style={{ "--tw-ring-color": brandColor || "#10b981" } as any}
                  onFocus={(e) => { e.currentTarget.style.borderColor = brandColor || "#10b981"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = ""; }}
                  autoComplete="off"
                />
                {isLoadingProducts && (
                  <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/50 animate-spin" />
                )}
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {isLoadingProducts && browseProducts.length === 0 ? (
                <div className="p-3 text-center text-white/40 text-sm">Cargando...</div>
              ) : browseProducts.length === 0 ? (
                <div className="p-3 text-center text-white/40 text-sm">No se encontraron productos</div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {browseProducts.map((product) => {
                    const platformBadge = getPlatformBadge(product.platform);
                    const displayBadge = product.badgeLabel || platformBadge;
                    return (
                      <li key={product.id} data-testid={`browse-product-item-${product.id}`}>
                        <button
                          type="button"
                          data-testid={`browse-product-select-${product.id}`}
                          onClick={() => handleProductSelect(product)}
                          className="w-full px-3 py-2 text-left transition-colors text-sm"
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hexToRgba(brandColor || "#10b981", 0.2); }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ""; }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-white truncate">{product.name}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {product.price && (
                                  <span className="text-xs text-white/60">{product.price}</span>
                                )}
                                {displayBadge && (
                                  <span className="inline-block px-2 py-0.5 text-white/80 text-xs rounded" style={{ backgroundColor: hexToRgba(brandColor || "#10b981", 0.3) }}>{displayBadge}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleImageSelect}
          className="hidden"
          data-testid="input-image-file"
        />
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2"
        >
          <Button
            data-testid="button-attach-image"
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-white/40 flex-shrink-0"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: brandColor || "#10b981" }} />
            ) : (
              <ImagePlus className="w-4 h-4" />
            )}
          </Button>
          <Button
            data-testid="button-browse-catalog"
            type="button"
            size="icon"
            variant="ghost"
            onClick={toggleProductBrowser}
            className="flex-shrink-0"
            style={{ color: showProductBrowser ? (brandColor || "#10b981") : "rgba(255,255,255,0.4)" }}
          >
            <ShoppingBag className="w-4 h-4" />
          </Button>
          <textarea
            ref={inputRef}
            data-testid="input-message"
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) {
                  onSend(input);
                  setInput("");
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                }
              }
            }}
            placeholder={isSessionClosed ? "Inicia una nueva consulta para escribir..." : "Escribe un mensaje..."}
            disabled={isSessionClosed}
            rows={1}
            className="
              flex-1 py-2.5 px-3.5 rounded-md
              bg-white/5 border border-white/10
              text-white text-sm placeholder:text-white/25
              focus:outline-none focus:ring-1
              transition-colors disabled:opacity-50
              resize-none overflow-y-auto
            "
            style={{ maxHeight: "120px", "--tw-ring-color": brandColor || "#10b981" } as any}
            onFocus={(e) => { e.currentTarget.style.borderColor = brandColor || "#10b981"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = ""; }}
          />
          <Button
            data-testid="button-send"
            type="submit"
            size="icon"
            disabled={!input.trim() || isSessionClosed || isSending}
            className="text-white flex-shrink-0 transition-all"
            style={{ backgroundColor: brandColor || "#10b981" }}
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>

      <div className="flex-shrink-0 py-1.5 px-3 border-t border-white/[0.04]">
        <a
          href="https://www.foxbot.cl"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 text-[10px] text-white/20 hover:text-white/35 transition-colors"
          data-testid="link-copyright"
        >
          <span>Potenciado por</span>
          <span className="font-medium">foxbot.cl</span>
        </a>
      </div>

      {lightboxImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
          data-testid="image-lightbox-overlay"
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxImage(null); }}
            className="absolute top-4 right-4 z-[10000] w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            data-testid="button-close-lightbox"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Imagen ampliada"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
            data-testid="lightbox-image"
          />
        </div>
      )}
    </div>
  );
}
