import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Wifi, WifiOff, Headphones, UserRound, X, Search, ImagePlus, Loader2, ExternalLink, LogOut, ShoppingBag, Star, CheckCircle, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Message, Session } from "@shared/schema";
import { useUpload } from "@/hooks/use-upload";
import { ProductSelector } from "@/components/ProductSelector";

interface BrowseProduct {
  id: number;
  name: string;
  price: string | null;
  platform: string;
  category: string;
  availability: string;
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
  return platformMap[platform] || platform;
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
  userName: string;
  userEmail: string;
  contactRequested: boolean;
  onClose: () => void;
  onExitChat: () => void;
  sessionId: string;
  onRatingComplete?: () => void;
  onStartNewSession?: (problemType: string, gameName: string) => void;
}

function formatTime(timestamp: string | Date) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function highlightText(text: string, query: string) {
  if (!query || query.length < 2) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-[#6200EA]/50 text-white rounded-sm px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
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

function RatingCard({ sessionId, userEmail, userName, onRatingComplete }: { sessionId: string; userEmail: string; userName: string; onRatingComplete?: () => void }) {
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
      <div data-testid="rating-submitted" className="p-4 rounded-md bg-[#1e1e1e] border border-[#6200EA]/30">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-sm font-medium text-white">Gracias por tu calificacion</span>
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
    <div data-testid="rating-card" className="p-4 rounded-md bg-[#1e1e1e] border border-[#6200EA]/30">
      <p className="text-sm font-medium text-white mb-3">¿Como fue tu experiencia?</p>
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
        className="w-full rounded-md bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 p-2.5 mb-3 resize-none focus:outline-none focus:ring-1 focus:ring-[#6200EA] focus:border-[#6200EA]"
      />
      <Button
        data-testid="button-submit-rating"
        onClick={handleSubmit}
        disabled={selectedRating < 1 || submitting}
        className="w-full bg-[#6200EA] text-white text-sm"
      >
        {submitting ? "Enviando..." : "Enviar calificacion"}
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
}

function MessageBubble({ message, searchQuery, isLastSupport, onQuickReply, onRatingComplete }: MessageBubbleProps) {
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
        <div className="w-7 h-7 rounded-full bg-[#6200EA]/20 border border-[#6200EA]/30 flex items-center justify-center flex-shrink-0">
          <Headphones className="w-3.5 h-3.5 text-[#6200EA]" />
        </div>
        <div className="flex flex-col gap-1.5 max-w-[80%]">
          <RatingCard sessionId={sessionId} userEmail={userEmail} userName={uName} onRatingComplete={onRatingComplete} />
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

  return (
    <div data-testid={`message-bubble-${message.id}`} className="animate-fade-in">
      {!isUser && msgAdminName && (
        <div className="flex items-center gap-1 ml-9 mb-0.5">
          <span className="text-[10px] font-semibold" style={{ color: msgAdminColor }}>
            {msgAdminName}
          </span>
        </div>
      )}
      <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {!isUser && (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border"
            style={{
              backgroundColor: `${msgAdminName ? msgAdminColor : '#6200EA'}20`,
              borderColor: `${msgAdminName ? msgAdminColor : '#6200EA'}30`,
            }}
          >
            <Headphones className="w-3.5 h-3.5" style={{ color: msgAdminName ? msgAdminColor : '#6200EA' }} />
          </div>
        )}
        <div className="flex flex-col gap-1.5 max-w-[80%]">
          <div
            className={`
              rounded-md overflow-hidden
              ${isUser
                ? "bg-[#6200EA] text-white rounded-br-none"
                : "bg-white/5 border border-white/10 text-white/90 rounded-bl-none"
              }
            `}
            style={!isUser && msgAdminName ? { boxShadow: `inset 3px 0 0 ${msgAdminColor}60` } : undefined}
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
                  <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block p-1.5">
                    <img
                      src={imageUrl}
                      alt="Imagen compartida"
                      data-testid={`message-image-${message.id}`}
                      className="max-w-full max-h-52 object-contain cursor-pointer rounded-md"
                      loading="lazy"
                    />
                  </a>
                );
              })()
            )}
            {!isImageOnly && (
              <div className="px-3.5 py-2.5 text-sm leading-relaxed break-words whitespace-pre-line">
                {searchQuery ? highlightText(displayText, searchQuery) : displayText}
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
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border-2 border-[#7C4DFF] bg-[#6200EA] text-white shadow-[0_0_8px_rgba(98,0,234,0.4)] transition-opacity hover:opacity-90 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {btn.label}
                  </a>
                ) : (
                  <button
                    key={i}
                    data-testid={`quick-reply-btn-${i}`}
                    onClick={() => onQuickReply(btn)}
                    className="px-3 py-2 text-xs font-semibold rounded-md border-2 border-[#7C4DFF]/60 bg-[#6200EA]/20 text-[#E0B0FF] transition-opacity hover:opacity-80 cursor-pointer"
                  >
                    {btn.label}
                  </button>
                )
              ))}
            </div>
          )}
          <span
            className={`text-[10px] text-white/30 ${isUser ? "text-right" : "text-left"}`}
          >
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}

function FinalizeRateButton({ sessionId }: { sessionId: string }) {
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
          Finalizar y Valorar
        </>
      )}
    </Button>
  );
}

const PROBLEM_TYPES = [
  { value: "compra", label: "Quiero comprar un producto" },
  { value: "codigo_verificacion", label: "Necesito un nuevo codigo de verificacion" },
  { value: "candado_juego", label: "Me aparece un candado en mi juego" },
  { value: "estado_pedido", label: "Quiero saber el estado de mi pedido" },
  { value: "problema_plus", label: "Tengo problemas con mi plus" },
  { value: "otro", label: "Otro" },
];

function NewConsultationPicker({ onSelect }: { onSelect: (problemType: string, gameName: string) => void }) {
  const [selectedType, setSelectedType] = useState("");
  const [gameName, setGameName] = useState("");
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <div className="flex justify-center my-4">
        <button
          data-testid="button-new-consultation"
          onClick={() => setExpanded(true)}
          className="px-4 py-2.5 rounded-md bg-[#6200EA] text-white text-sm font-semibold shadow-[0_0_12px_rgba(98,0,234,0.3)] transition-opacity hover:opacity-90"
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
    <div data-testid="new-consultation-form" className="mx-2 my-3 p-3 rounded-md bg-[#1e1e1e] border border-[#6200EA]/30">
      <p className="text-sm font-medium text-white mb-3">Nueva consulta</p>
      <div className="flex flex-col gap-2">
        <select
          data-testid="select-new-problem-type"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full rounded-md bg-white/5 border border-white/10 text-white text-sm p-2 focus:outline-none focus:ring-1 focus:ring-[#6200EA]"
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
        />
        <button
          data-testid="button-submit-new-consultation"
          onClick={handleSubmit}
          disabled={!selectedType || !gameName.trim()}
          className="w-full py-2 rounded-md bg-[#6200EA] text-white text-sm font-semibold disabled:opacity-40 transition-opacity hover:opacity-90"
        >
          Iniciar consulta
        </button>
      </div>
    </div>
  );
}

function SessionDivider({ session }: { session: Session }) {
  const problemLabels: Record<string, string> = {
    compra: "Compra",
    codigo_verificacion: "Codigo verificacion",
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
          <span className="text-[#6200EA]/60">({problemLabels[session.problemType] || session.problemType})</span>
        )}
      </div>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}

export function ChatWindow({ messages, sessions, onSend, onContactExecutive, isConnected, userName, userEmail, contactRequested, onClose, onExitChat, sessionId, onRatingComplete, onStartNewSession }: ChatWindowProps) {
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showProductBrowser, setShowProductBrowser] = useState(false);
  const [isOfflineHours, setIsOfflineHours] = useState(false);
  const [ticketUrl, setTicketUrl] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [browseProducts, setBrowseProducts] = useState<BrowseProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
      const url = query.length >= 2
        ? `/api/products/browse?q=${encodeURIComponent(query)}&limit=20`
        : `/api/products/browse?limit=20`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Error fetching products");
      const data = await response.json();
      setBrowseProducts(data.products || []);
    } catch {
      setBrowseProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
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

  const filteredMessages = searchQuery.length >= 2
    ? messages.filter(m => {
        const { text } = parseQuickReplies(m.content);
        return text.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : messages;

  const matchCount = searchQuery.length >= 2 ? filteredMessages.length : 0;

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
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3" style={{ background: "#6200EA" }}>
        <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
          <Headphones className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 data-testid="text-header-title" className="text-sm font-semibold text-white truncate">Equipo de Soporte</h3>
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
          <Search className="w-4 h-4 text-white" />
        </button>
        <button
          data-testid="button-exit-chat"
          onClick={onExitChat}
          className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center transition-colors hover:bg-white/25"
          title="Salir del chat"
        >
          <LogOut className="w-4 h-4 text-white" />
        </button>
        <button
          data-testid="button-close-chat"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center transition-colors hover:bg-white/25"
          title="Minimizar"
        >
          <X className="w-4 h-4 text-white" />
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
            placeholder="Buscar en la conversacion..."
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 focus:outline-none"
          />
          {searchQuery.length >= 2 && (
            <span className="text-[11px] text-white/30 flex-shrink-0">
              {matchCount} resultado{matchCount !== 1 ? "s" : ""}
            </span>
          )}
          <button
            data-testid="button-close-search"
            onClick={() => { setShowSearch(false); setSearchQuery(""); }}
            className="text-white/30 hover:text-white/60"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 chat-scrollbar">
        {filteredMessages.length === 0 && searchQuery.length >= 2 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <p className="text-sm text-white/40">No se encontraron mensajes con "{searchQuery}"</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-14 h-14 rounded-full bg-[#6200EA]/10 border border-[#6200EA]/20 flex items-center justify-center mb-4">
              <Headphones className="w-7 h-7 text-[#6200EA]/60" />
            </div>
            <p className="text-sm text-white/40 mb-1">Sin mensajes aun</p>
            <p className="text-xs text-white/25">
              Envia un mensaje para iniciar la conversacion
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
                  items.push(<SessionDivider key={`divider-${msg.sessionId}`} session={newSession} />);
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
                />
              );
            });

            const latestSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
            if (latestSession && latestSession.status === "closed" && onStartNewSession) {
              items.push(
                <SessionDivider key={`divider-closed-${latestSession.sessionId}`} session={latestSession} />
              );
              items.push(
                <NewConsultationPicker key="new-consultation" onSelect={onStartNewSession} />
              );
            }

            return items;
          })()
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
            className="w-full mb-2 font-semibold text-sm flex items-center justify-center gap-2 rounded-md px-4 py-2 bg-[#6200EA] border border-[#6200EA] text-white shadow-[0_0_12px_rgba(98,0,234,0.4)]"
          >
            <Ticket className="w-4 h-4" />
            Crear ticket de soporte
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
                ? "opacity-50 cursor-not-allowed bg-[#6200EA]/10 border-[#6200EA]/30 text-white/50"
                : "bg-[#6200EA] border-[#6200EA] text-white shadow-[0_0_12px_rgba(98,0,234,0.4)]"
              }
            `}
          >
            <UserRound className="w-4 h-4 mr-2" />
            {contactRequested ? "Solicitud enviada" : "Contactar un Ejecutivo"}
          </Button>
        )}
        <FinalizeRateButton sessionId={latestSession?.sessionId || sessionId} />
      </div>

      <div className="relative px-3 pb-3">
        {showProductBrowser && (
          <div
            ref={productBrowserRef}
            data-testid="product-browser-overlay"
            className="absolute bottom-full left-0 right-0 mx-1 sm:left-3 sm:right-3 sm:mx-0 mb-1 bg-[#1e1e1e] border border-white/10 rounded-md shadow-lg z-50 flex flex-col max-h-60 sm:max-h-72"
          >
            <div className="px-3 py-2 border-b border-white/[0.06] flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 text-[#6200EA] flex-shrink-0" />
              <span className="text-[11px] text-white/30">Catalogo de productos</span>
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
                  className="w-full pl-8 pr-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-[#6200EA] focus:border-[#6200EA]"
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
                    const badge = getPlatformBadge(product.platform);
                    return (
                      <li key={product.id} data-testid={`browse-product-item-${product.id}`}>
                        <button
                          type="button"
                          data-testid={`browse-product-select-${product.id}`}
                          onClick={() => handleProductSelect(product)}
                          className="w-full px-3 py-2 text-left hover:bg-[#6200EA]/20 transition-colors text-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-white truncate">{product.name}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {product.price && (
                                  <span className="text-xs text-white/60">{product.price}</span>
                                )}
                                {badge && (
                                  <span className="inline-block px-2 py-0.5 bg-[#6200EA]/30 text-white/80 text-xs rounded">{badge}</span>
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
          className="flex items-center gap-2"
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
              <Loader2 className="w-4 h-4 animate-spin text-[#6200EA]" />
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
            className={`flex-shrink-0 ${showProductBrowser ? "text-[#6200EA]" : "text-white/40"}`}
          >
            <ShoppingBag className="w-4 h-4" />
          </Button>
          <input
            ref={inputRef}
            data-testid="input-message"
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder={isSessionClosed ? "Inicia una nueva consulta para escribir..." : "Escribe un mensaje..."}
            disabled={isSessionClosed}
            className="
              flex-1 py-2.5 px-3.5 rounded-md
              bg-white/5 border border-white/10
              text-white text-sm placeholder:text-white/25
              focus:outline-none focus:ring-1 focus:ring-[#6200EA] focus:border-[#6200EA]
              transition-colors disabled:opacity-50
            "
          />
          <Button
            data-testid="button-send"
            type="submit"
            size="icon"
            disabled={!input.trim() || isSessionClosed}
            className="bg-[#6200EA] text-white flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      <div className="flex-shrink-0 py-1.5 px-3 border-t border-white/[0.04]">
        <a
          href="https://www.webmakerchile.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 text-[10px] text-white/20 hover:text-white/35 transition-colors"
          data-testid="link-copyright"
        >
          <span>Powered by</span>
          <span className="font-medium">webmakerchile.com</span>
        </a>
      </div>
    </div>
  );
}
