import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Wifi, WifiOff, Headphones, UserRound, X, Search, ImagePlus, Loader2, ExternalLink, LogOut, ShoppingBag, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Message } from "@shared/schema";
import { useUpload } from "@/hooks/use-upload";

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
  onSend: (content: string, imageUrl?: string, quickReplyValue?: string) => void;
  onContactExecutive: () => void;
  isConnected: boolean;
  userName: string;
  contactRequested: boolean;
  onClose: () => void;
  onExitChat: () => void;
  sessionId: string;
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
  if (idx === -1) return { text: content, buttons: [] };

  const text = content.substring(0, idx).trim();
  const jsonStart = idx + marker.length;
  const jsonEnd = content.indexOf("}}", jsonStart);
  if (jsonEnd === -1) return { text: content, buttons: [] };

  try {
    const buttons = JSON.parse(content.substring(jsonStart, jsonEnd));
    if (Array.isArray(buttons)) return { text, buttons };
  } catch {}
  return { text: content, buttons: [] };
}

function RatingCard({ sessionId, userEmail, userName }: { sessionId: string; userEmail: string; userName: string }) {
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
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-5 h-5 ${star <= finalRating ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`}
            />
          ))}
        </div>
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
}

function MessageBubble({ message, searchQuery, isLastSupport, onQuickReply }: MessageBubbleProps) {
  const isUser = message.sender === "user";
  const hasImage = !!(message as any).imageUrl;
  const imageUrl = (message as any).imageUrl;
  const isImageOnly = hasImage && (!message.content || message.content === "Imagen enviada");

  const isRatingMessage = !isUser && message.content.includes("{{SHOW_RATING}}");

  if (isRatingMessage) {
    let sessionId = message.sessionId;
    let userEmail = message.userEmail || "";
    let uName = message.userName || "";
    try {
      const stored = localStorage.getItem("chat_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.sessionId) sessionId = parsed.sessionId;
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
          <RatingCard sessionId={sessionId} userEmail={userEmail} userName={uName} />
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
      <div className="flex flex-col gap-1.5 max-w-[80%]">
        <div
          className={`
            rounded-md overflow-hidden
            ${isUser
              ? "bg-[#6200EA] text-white rounded-br-none"
              : "bg-white/5 border border-white/10 text-white/90 rounded-bl-none"
            }
          `}
        >
          {hasImage && (
            <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block p-1.5">
              <img
                src={imageUrl}
                alt="Imagen compartida"
                data-testid={`message-image-${message.id}`}
                className="max-w-full max-h-52 object-contain cursor-pointer rounded-md"
                loading="lazy"
              />
            </a>
          )}
          {!isImageOnly && (
            <div className="px-3.5 py-2.5 text-sm leading-relaxed break-words">
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
  );
}

function FinalizeRateButton({ sessionId }: { sessionId: string }) {
  const [confirmState, setConfirmState] = useState<"idle" | "confirming" | "sent">("idle");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("rated_session_" + sessionId);
      if (stored) setConfirmState("sent");
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
        w-full mb-2 border-yellow-500/30 text-white/70
        ${confirmState === "sent"
          ? "opacity-50 cursor-not-allowed bg-yellow-500/10"
          : confirmState === "confirming"
            ? "bg-yellow-500/10 border-yellow-500/50"
            : "bg-transparent"
        }
      `}
    >
      {confirmState === "sent" ? (
        <>
          <CheckCircle className="w-4 h-4 mr-2 text-yellow-400" />
          Encuesta enviada
        </>
      ) : confirmState === "confirming" ? (
        <>
          <CheckCircle className="w-4 h-4 mr-2 text-yellow-400" />
          {sending ? "Enviando..." : "¿Confirmar finalizar?"}
        </>
      ) : (
        <>
          <Star className="w-4 h-4 mr-2 text-yellow-400" />
          Finalizar y Valorar
        </>
      )}
    </Button>
  );
}

export function ChatWindow({ messages, onSend, onContactExecutive, isConnected, userName, contactRequested, onClose, onExitChat, sessionId }: ChatWindowProps) {
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showProductBrowser, setShowProductBrowser] = useState(false);
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

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      onSend("", response.objectPath);
    },
  });

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return;
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
    if (value.startsWith("__qr:")) {
      onSend(btn.label, undefined, value);
    } else {
      onSend(value);
    }
  }, [onSend]);

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

  return (
    <div className="flex flex-col h-full">
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
          filteredMessages.map((msg, idx) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              searchQuery={searchQuery}
              isLastSupport={idx === lastSupportIdx}
              onQuickReply={handleQuickReply}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-3 pt-2 pb-1 border-t border-white/10">
        <Button
          data-testid="button-contact-executive"
          variant="outline"
          onClick={onContactExecutive}
          disabled={contactRequested}
          className={`
            w-full mb-2 border-[#6200EA]/30 text-white/70
            ${contactRequested
              ? "opacity-50 cursor-not-allowed bg-[#6200EA]/10"
              : "bg-transparent"
            }
          `}
        >
          <UserRound className="w-4 h-4 mr-2 text-[#6200EA]" />
          {contactRequested ? "Solicitud enviada" : "Contactar un Ejecutivo"}
        </Button>
        <FinalizeRateButton sessionId={sessionId} />
      </div>

      <div className="relative px-3 pb-3">
        {showProductBrowser && (
          <div
            ref={productBrowserRef}
            data-testid="product-browser-overlay"
            className="absolute bottom-full left-3 right-3 mb-1 bg-[#1e1e1e] border border-white/10 rounded-md shadow-lg z-50 flex flex-col max-h-72"
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
          accept="image/*"
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
            placeholder='Escribe un mensaje...'
            className="
              flex-1 py-2.5 px-3.5 rounded-md
              bg-white/5 border border-white/10
              text-white text-sm placeholder:text-white/25
              focus:outline-none focus:ring-1 focus:ring-[#6200EA] focus:border-[#6200EA]
              transition-colors
            "
          />
          <Button
            data-testid="button-send"
            type="submit"
            size="icon"
            disabled={!input.trim()}
            className="bg-[#6200EA] text-white flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
