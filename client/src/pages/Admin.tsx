import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Search, MessageSquare, Mail, Clock, User, Headphones, ArrowLeft, X, Lock, LogOut,
  Plus, Tag, CheckCircle, Circle, Pencil, Trash2, Zap, Save, XCircle, Gamepad2,
  Send, ShieldCheck, ShieldOff, ImagePlus, Loader2, Package, Star, Users, Bell, BellOff, Key
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Message } from "@shared/schema";
import { useUpload } from "@/hooks/use-upload";

interface SessionSummary {
  sessionId: string;
  userName: string;
  userEmail: string;
  messageCount: number;
  lastMessage: string | null;
  firstMessage: string | null;
  status: string;
  tags: string[];
  problemType: string | null;
  gameName: string | null;
  adminActive: boolean;
  contactRequested?: boolean;
}

interface BrowseProduct {
  id: number;
  name: string;
  platform: string;
  price: string | null;
  productUrl: string | null;
  imageUrl: string | null;
  availability: string;
  description: string | null;
  category: string;
}

interface SearchResult {
  sessionId: string;
  userName: string;
  userEmail: string;
  messages: Message[];
}

interface CannedResponse {
  id: number;
  shortcut: string;
  content: string;
}

interface RatingData {
  id: number;
  sessionId: string;
  userEmail: string;
  userName: string;
  rating: number;
  comment: string | null;
  timestamp: string;
}

const PREDEFINED_TAGS = ["Venta", "Soporte", "Urgente", "Resuelto", "Pendiente"];

function getAuthToken(): string {
  try { return localStorage.getItem("admin_token") || ""; } catch { return ""; }
}

function setAuthToken(token: string) {
  try { localStorage.setItem("admin_token", token); } catch {}
}

function clearAuthToken() {
  try { localStorage.removeItem("admin_token"); localStorage.removeItem("admin_user"); } catch {}
}

function getStoredUser(): { id: number; email: string; role: string; displayName: string } | null {
  try {
    const stored = localStorage.getItem("admin_user");
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

function setStoredUser(user: { id: number; email: string; role: string; displayName: string }) {
  try { localStorage.setItem("admin_user", JSON.stringify(user)); } catch {}
}

function adminFetch(url: string, options?: RequestInit) {
  const token = getAuthToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

function formatDate(date: string | Date | null) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(date: string | Date | null) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(date: string | Date | null) {
  if (!date) return "";
  return `${formatDate(date)} ${formatTime(date)}`;
}

function highlightText(text: string, query: string) {
  if (!query || query.length < 2) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-[#6200EA]/40 text-white rounded-sm px-0.5">{part}</mark>
    ) : (
      part
    )
  );
}

function AdminLogin({ onLogin }: { onLogin: (user: { id: number; email: string; role: string; displayName: string }) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setAuthToken(data.token);
        setStoredUser(data.user);
        onLogin(data.user);
      } else {
        setError(data.message || "Credenciales incorrectas");
      }
    } catch {
      setError("Error de conexion");
    }
    setLoading(false);
  };

  return (
    <div className="h-screen flex items-center justify-center" style={{ background: "#111", fontFamily: "'DM Sans', sans-serif" }}>
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-6">
          <img src="/logo-192.webp" alt="CJM Digitales" className="w-20 h-20 mx-auto mb-4 rounded-2xl" />
          <h1 className="text-xl font-bold text-white mb-1">Soporte CJM DIGITALES</h1>
          <p className="text-sm text-white/40">Inicia sesion para acceder al panel</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            data-testid="input-admin-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="Correo electronico"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-[#6200EA] focus-visible:border-[#6200EA]"
            autoFocus
          />
          <Input
            data-testid="input-admin-password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="Contraseña"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-[#6200EA] focus-visible:border-[#6200EA]"
          />
          {error && (
            <p data-testid="text-login-error" className="text-sm text-red-400">{error}</p>
          )}
          <Button
            data-testid="button-admin-login"
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full bg-[#6200EA] border-[#6200EA] text-white"
          >
            {loading ? "Verificando..." : "Ingresar"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function SessionCard({ session, onClick, isSelected, rating }: { session: SessionSummary; onClick: () => void; isSelected: boolean; rating?: RatingData }) {
  return (
    <button
      data-testid={`session-card-${session.sessionId}`}
      onClick={onClick}
      className={`w-full text-left p-3 rounded-md border transition-colors ${
        isSelected
          ? "bg-[#6200EA]/15 border-[#6200EA]/40"
          : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div className="relative w-7 h-7 rounded-full bg-[#6200EA]/20 flex items-center justify-center flex-shrink-0">
          <User className="w-3.5 h-3.5 text-[#6200EA]" />
          <span
            data-testid={`status-dot-${session.sessionId}`}
            className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#111] ${
              session.status === "active" ? "bg-green-500" : "bg-white/30"
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{session.userName || "Sin nombre"}</p>
          <p className="text-[11px] text-white/40 truncate">{session.userEmail || "Sin correo"}</p>
        </div>
      </div>
      {(session.problemType || session.gameName) && (
        <div className="flex items-center gap-2 pl-9 mb-1 flex-wrap">
          {session.problemType && (
            <span className="text-[10px] text-[#6200EA] bg-[#6200EA]/10 px-1.5 py-0.5 rounded">{session.problemType}</span>
          )}
          {session.gameName && (
            <span className="flex items-center gap-0.5 text-[10px] text-white/40">
              <Gamepad2 className="w-2.5 h-2.5" />
              {session.gameName}
            </span>
          )}
        </div>
      )}
      {session.tags && session.tags.length > 0 && (
        <div className="flex items-center gap-1 pl-9 mb-1 flex-wrap">
          {session.tags.map((tag) => (
            <span key={tag} className="text-[10px] bg-white/[0.06] text-white/50 px-1.5 py-0.5 rounded">{tag}</span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 text-[11px] text-white/30 pl-9 flex-wrap">
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          {session.messageCount}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDateTime(session.lastMessage)}
        </span>
        {session.adminActive ? (
          <span data-testid={`badge-ejecutivo-${session.sessionId}`} className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Ejecutivo
          </span>
        ) : session.contactRequested ? (
          <span data-testid={`badge-solicita-${session.sessionId}`} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Solicita Ejecutivo
          </span>
        ) : (
          <span data-testid={`badge-bot-${session.sessionId}`} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
            Bot
          </span>
        )}
        {rating && (
          <span data-testid={`session-rating-${session.sessionId}`} className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`w-2.5 h-2.5 ${s <= rating.rating ? "text-yellow-400 fill-yellow-400" : "text-white/15"}`} />
            ))}
          </span>
        )}
      </div>
    </button>
  );
}

function TagsEditor({ sessionId, tags }: { sessionId: string; tags: string[] }) {
  const [showInput, setShowInput] = useState(false);
  const [customTag, setCustomTag] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const tagsMutation = useMutation({
    mutationFn: async (newTags: string[]) => {
      const res = await fetch(`/api/admin/sessions/${sessionId}/tags`, {
        method: "PATCH",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
        body: JSON.stringify({ tags: newTags }),
      });
      if (!res.ok) throw new Error("Error al actualizar tags");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
    },
  });

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    tagsMutation.mutate([...tags, trimmed]);
    setCustomTag("");
    setShowInput(false);
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    tagsMutation.mutate(tags.filter((t) => t !== tag));
  };

  const availableSuggestions = PREDEFINED_TAGS.filter((t) => !tags.includes(t));

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {tags.map((tag) => (
        <span
          key={tag}
          data-testid={`tag-badge-${tag}`}
          className="inline-flex items-center gap-0.5 text-[10px] bg-[#6200EA]/15 text-[#6200EA] px-1.5 py-0.5 rounded"
        >
          {tag}
          <button
            data-testid={`button-remove-tag-${tag}`}
            onClick={() => removeTag(tag)}
            className="text-[#6200EA]/50 hover:text-[#6200EA] ml-0.5"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}
      {showInput ? (
        <div className="relative">
          <div className="flex items-center gap-1">
            <Input
              data-testid="input-add-tag"
              value={customTag}
              onChange={(e) => { setCustomTag(e.target.value); setShowSuggestions(true); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customTag.trim()) { addTag(customTag); }
                if (e.key === "Escape") { setShowInput(false); setCustomTag(""); setShowSuggestions(false); }
              }}
              placeholder="Etiqueta..."
              className="h-6 w-24 text-[11px] bg-white/5 border-white/10 text-white placeholder:text-white/25 px-1.5 focus-visible:ring-[#6200EA]"
              autoFocus
              onFocus={() => setShowSuggestions(true)}
            />
            <button
              data-testid="button-cancel-tag"
              onClick={() => { setShowInput(false); setCustomTag(""); setShowSuggestions(false); }}
              className="text-white/30 hover:text-white/60"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          {showSuggestions && availableSuggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-md py-1 z-50 min-w-[120px]">
              {availableSuggestions
                .filter((s) => !customTag || s.toLowerCase().includes(customTag.toLowerCase()))
                .map((suggestion) => (
                  <button
                    key={suggestion}
                    data-testid={`button-suggestion-${suggestion}`}
                    onClick={() => addTag(suggestion)}
                    className="w-full text-left text-[11px] text-white/60 hover:bg-white/[0.06] px-2 py-1"
                  >
                    {suggestion}
                  </button>
                ))}
            </div>
          )}
        </div>
      ) : (
        <button
          data-testid="button-add-tag"
          onClick={() => setShowInput(true)}
          className="w-5 h-5 rounded bg-white/[0.06] flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.1]"
        >
          <Plus className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function ChatViewer({ sessionId, searchQuery, sessions }: { sessionId: string; searchQuery: string; sessions: SessionSummary[] }) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [localSearch, setLocalSearch] = useState("");
  const [showLocalSearch, setShowLocalSearch] = useState(false);
  const [replyText, setReplyText] = useState("");
  const replyInputRef = useRef<HTMLInputElement>(null);
  const adminFileInputRef = useRef<HTMLInputElement>(null);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [debouncedProductQuery, setDebouncedProductQuery] = useState("");

  const currentSession = sessions.find((s) => s.sessionId === sessionId);
  const isAdminActive = currentSession?.adminActive ?? false;

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/admin/sessions", sessionId, "messages"],
    queryFn: async () => {
      const res = await adminFetch(`/api/admin/sessions/${sessionId}/messages`);
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    enabled: !!sessionId,
    refetchInterval: isAdminActive ? 3000 : false,
  });

  const { data: sessionRating } = useQuery<RatingData>({
    queryKey: ["/api/admin/sessions", sessionId, "rating"],
    queryFn: async () => {
      const res = await adminFetch(`/api/admin/sessions/${sessionId}/rating`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!sessionId,
  });

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`/api/admin/sessions/${sessionId}/status`, {
        method: "PATCH",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Error al actualizar estado");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
    },
  });

  const adminActiveMutation = useMutation({
    mutationFn: async (adminActive: boolean) => {
      const res = await fetch(`/api/admin/sessions/${sessionId}/admin-active`, {
        method: "PATCH",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
        body: JSON.stringify({ adminActive }),
      });
      if (!res.ok) throw new Error("Error al cambiar modo admin");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions", sessionId, "messages"] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async (data: { content?: string; imageUrl?: string }) => {
      const res = await fetch(`/api/admin/sessions/${sessionId}/reply`, {
        method: "POST",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al enviar respuesta");
      return res.json();
    },
    onSuccess: () => {
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions", sessionId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
      setTimeout(() => replyInputRef.current?.focus(), 100);
    },
  });

  const { uploadFile: adminUploadFile, isUploading: adminIsUploading } = useUpload({
    onSuccess: (response) => {
      replyMutation.mutate({ imageUrl: response.objectPath });
    },
  });

  const handleAdminImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return;
    await adminUploadFile(file);
    if (adminFileInputRef.current) adminFileInputRef.current.value = "";
  }, [adminUploadFile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedProductQuery(productQuery), 300);
    return () => clearTimeout(timer);
  }, [productQuery]);

  const { data: browseProducts = [] } = useQuery<BrowseProduct[]>({
    queryKey: ["/api/products/browse", debouncedProductQuery],
    queryFn: async () => {
      if (!debouncedProductQuery || debouncedProductQuery.length < 2) return [];
      const res = await fetch(`/api/products/browse?q=${encodeURIComponent(debouncedProductQuery)}&limit=20`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.products || data;
    },
    enabled: showProductSearch && debouncedProductQuery.length >= 2,
  });

  const handleProductSend = (product: BrowseProduct) => {
    const content = `Te recomiendo este producto: ${product.name}. Precio: ${product.price || "Consultar"}. Entrega digital inmediata a tu correo.${product.productUrl ? ` [BTN:Ir a comprar|URL:${product.productUrl}]` : ""}`;
    replyMutation.mutate({ content }, {
      onSuccess: () => {
        setShowProductSearch(false);
        setProductQuery("");
        setDebouncedProductQuery("");
      },
    });
  };

  const handleReplySend = () => {
    if (!replyText.trim() || replyMutation.isPending) return;
    replyMutation.mutate({ content: replyText.trim() });
  };

  const activeSearch = showLocalSearch ? localSearch : searchQuery;

  const filteredMessages = activeSearch && activeSearch.length >= 2
    ? messages.filter(m => m.content.toLowerCase().includes(activeSearch.toLowerCase()))
    : messages;

  const userName = currentSession?.userName || messages.find(m => m.sender === "user")?.userName || "";
  const userEmail = currentSession?.userEmail || messages.find(m => m.sender === "user")?.userEmail || "";
  const sessionStatus = currentSession?.status || "active";
  const sessionTags = currentSession?.tags || [];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#6200EA] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-9 h-9 rounded-full bg-[#6200EA]/20 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-[#6200EA]" />
              <span
                className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#111] ${
                  sessionStatus === "active" ? "bg-green-500" : "bg-white/30"
                }`}
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{userName || "Usuario"}</p>
              <p className="text-[11px] text-white/40 truncate">{userEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 flex-wrap">
            <Button
              data-testid="button-admin-takeover"
              variant="ghost"
              size="sm"
              onClick={() => adminActiveMutation.mutate(!isAdminActive)}
              disabled={adminActiveMutation.isPending}
              className={`text-xs ${
                isAdminActive
                  ? "text-orange-400"
                  : "text-emerald-400"
              }`}
            >
              {isAdminActive ? <ShieldOff className="w-3.5 h-3.5 mr-1" /> : <ShieldCheck className="w-3.5 h-3.5 mr-1" />}
              {adminActiveMutation.isPending ? "..." : isAdminActive ? "Salir del Chat" : "Entrar al Chat"}
            </Button>
            <Button
              data-testid="button-toggle-session-status"
              variant="ghost"
              size="sm"
              onClick={() => statusMutation.mutate(sessionStatus === "active" ? "closed" : "active")}
              disabled={statusMutation.isPending}
              className={`text-xs ${
                sessionStatus === "active"
                  ? "text-red-400"
                  : "text-green-400"
              }`}
            >
              {statusMutation.isPending ? "..." : sessionStatus === "active" ? "Finalizar" : "Reabrir"}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              data-testid="button-toggle-chat-search"
              onClick={() => { setShowLocalSearch(!showLocalSearch); setLocalSearch(""); }}
              className={showLocalSearch ? "text-[#6200EA]" : "text-white/40"}
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isAdminActive && (
          <div className="mt-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="text-[11px] text-emerald-300">Modo administrador activo — El bot esta pausado. Tus respuestas se envian directamente al usuario.</span>
          </div>
        )}

        <div className="mt-2 pl-12">
          <TagsEditor sessionId={sessionId} tags={sessionTags} />
        </div>
        {sessionRating && (
          <div data-testid="session-rating-display" className="mt-2 px-4 py-2 bg-yellow-500/5 border-t border-yellow-500/10 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-white/40">Calificacion:</span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-3.5 h-3.5 ${s <= sessionRating.rating ? "text-yellow-400 fill-yellow-400" : "text-white/15"}`} />
              ))}
            </div>
            {sessionRating.comment && (
              <span className="text-[11px] text-white/50 italic truncate max-w-[200px]">"{sessionRating.comment}"</span>
            )}
          </div>
        )}
      </div>

      {showLocalSearch && (
        <div className="px-4 py-2 border-b border-white/[0.06] flex items-center gap-2">
          <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
          <Input
            data-testid="input-admin-chat-search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Buscar en esta conversacion..."
            className="bg-transparent border-0 text-white text-sm placeholder:text-white/25 focus-visible:ring-0 p-0 h-auto"
            autoFocus
          />
          {localSearch && (
            <span className="text-[11px] text-white/30 flex-shrink-0">
              {filteredMessages.length} resultado{filteredMessages.length !== 1 ? "s" : ""}
            </span>
          )}
          <button onClick={() => { setShowLocalSearch(false); setLocalSearch(""); }} className="text-white/30 hover:text-white/60">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {filteredMessages.length === 0 && activeSearch ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-white/30">No se encontraron mensajes con "{activeSearch}"</p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isUser = msg.sender === "user";
            const hasImage = !!(msg as any).imageUrl;
            const imageUrl = (msg as any).imageUrl;
            const isImageOnly = hasImage && (!msg.content || msg.content === "Imagen enviada");
            return (
              <div
                key={msg.id}
                data-testid={`admin-message-${msg.id}`}
                className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded-full bg-[#6200EA]/20 border border-[#6200EA]/30 flex items-center justify-center flex-shrink-0">
                    <Headphones className="w-3 h-3 text-[#6200EA]" />
                  </div>
                )}
                {isUser && (
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3 text-white/50" />
                  </div>
                )}
                <div className="flex flex-col gap-0.5 max-w-[75%]">
                  <div
                    className={`rounded-md overflow-hidden ${
                      isUser
                        ? "bg-[#6200EA] text-white rounded-br-none"
                        : "bg-white/5 border border-white/10 text-white/90 rounded-bl-none"
                    }`}
                  >
                    {hasImage && (
                      <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block p-1.5">
                        <img
                          src={imageUrl}
                          alt="Imagen compartida"
                          data-testid={`admin-message-image-${msg.id}`}
                          className="max-w-full max-h-48 object-contain cursor-pointer rounded-md"
                          loading="lazy"
                        />
                      </a>
                    )}
                    {!isImageOnly && (
                      <div className="px-3 py-2 text-sm leading-relaxed break-words">
                        {activeSearch ? highlightText(msg.content, activeSearch) : msg.content}
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] text-white/25 ${isUser ? "text-right" : "text-left"}`}>
                    {formatDateTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {isAdminActive ? (
        <div className="relative">
          {showProductSearch && (
            <div data-testid="product-search-panel" className="absolute bottom-full left-0 right-0 bg-[#1a1a2e] border border-white/10 rounded-t-md max-h-72 flex flex-col z-10">
              <div className="p-2 border-b border-white/[0.06] flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                <input
                  data-testid="input-product-search-chat"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Buscar producto..."
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none"
                  autoFocus
                />
                <button
                  data-testid="button-close-product-search"
                  onClick={() => { setShowProductSearch(false); setProductQuery(""); setDebouncedProductQuery(""); }}
                  className="text-white/30 hover:text-white/60"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {debouncedProductQuery.length < 2 ? (
                  <div className="p-4 text-center text-xs text-white/30">Escribe al menos 2 caracteres para buscar</div>
                ) : browseProducts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-white/30">No se encontraron productos</div>
                ) : (
                  browseProducts.map((p) => (
                    <button
                      key={p.id}
                      data-testid={`product-send-${p.id}`}
                      onClick={() => handleProductSend(p)}
                      disabled={replyMutation.isPending}
                      className="w-full text-left px-3 py-2 hover:bg-white/[0.06] transition-colors border-b border-white/[0.04] last:border-0"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-white truncate">{p.name}</span>
                        <span className="text-[10px] bg-[#6200EA]/15 text-[#6200EA] px-1.5 py-0.5 rounded flex-shrink-0">{getPlatformLabel(p.platform)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {p.price && <span className="text-xs text-green-400">{p.price}</span>}
                        <span className={`text-[10px] ${p.availability === "available" ? "text-green-400/60" : "text-red-400/60"}`}>
                          {getAvailabilityLabel(p.availability)}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
          <div className="px-3 py-2 border-t border-white/[0.06] flex items-center gap-2">
            <input
              ref={adminFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAdminImageSelect}
              className="hidden"
              data-testid="input-admin-image-file"
            />
            <Button
              data-testid="button-admin-attach-image"
              size="icon"
              variant="ghost"
              onClick={() => adminFileInputRef.current?.click()}
              disabled={adminIsUploading}
              className="text-white/40 flex-shrink-0"
            >
              {adminIsUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#6200EA]" />
              ) : (
                <ImagePlus className="w-4 h-4" />
              )}
            </Button>
            <Button
              data-testid="button-admin-product-search"
              size="icon"
              variant="ghost"
              onClick={() => setShowProductSearch(!showProductSearch)}
              className={`flex-shrink-0 ${showProductSearch ? "text-[#6200EA]" : "text-white/40"}`}
            >
              <Package className="w-4 h-4" />
            </Button>
            <Input
              ref={replyInputRef}
              data-testid="input-admin-reply"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReplySend(); } }}
              placeholder="Escribe tu respuesta..."
              className="flex-1 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30 focus-visible:ring-[#6200EA]/30"
              autoFocus
            />
            <Button
              data-testid="button-admin-send"
              size="icon"
              onClick={handleReplySend}
              disabled={!replyText.trim() || replyMutation.isPending}
              className="bg-[#6200EA] text-white flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-4 py-2 border-t border-white/[0.06] text-[11px] text-white/25 text-center">
          {messages.length} mensaje{messages.length !== 1 ? "s" : ""} en esta conversacion
        </div>
      )}
    </div>
  );
}

interface AdminProduct {
  id: number;
  wcProductId: number | null;
  name: string;
  searchAliases: string[];
  platform: string;
  price: string | null;
  productUrl: string | null;
  imageUrl: string | null;
  availability: string;
  description: string | null;
  category: string;
  wcLastSync: string | null;
}

interface WCSyncStatus {
  lastSync: string | null;
  productCount: number;
  wcProductCount: number;
  storeUrl: string;
  configured: boolean;
}

interface WCSyncResult {
  total: number;
  created: number;
  updated: number;
  errors: number;
  skipped: number;
  details: string[];
}

const PLATFORM_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "ps4", label: "PS4" },
  { value: "ps5", label: "PS5" },
  { value: "xbox_one", label: "Xbox One" },
  { value: "xbox_series", label: "Xbox Series" },
  { value: "pc", label: "PC" },
  { value: "nintendo", label: "Nintendo" },
];

const CATEGORY_OPTIONS = [
  { value: "game", label: "Juego" },
  { value: "subscription", label: "Suscripcion" },
  { value: "card", label: "Tarjeta" },
  { value: "bundle", label: "Bundle" },
  { value: "console", label: "Consola" },
  { value: "accessory", label: "Accesorio" },
  { value: "other", label: "Otro" },
];

const AVAILABILITY_OPTIONS = [
  { value: "available", label: "Disponible" },
  { value: "out_of_stock", label: "Agotado" },
  { value: "preorder", label: "Pre-orden" },
];

function getAvailabilityColor(avail: string) {
  if (avail === "available") return "bg-green-500/15 text-green-400 border-green-500/30";
  if (avail === "out_of_stock") return "bg-red-500/15 text-red-400 border-red-500/30";
  return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
}

function getAvailabilityLabel(avail: string) {
  const opt = AVAILABILITY_OPTIONS.find(o => o.value === avail);
  return opt?.label || avail;
}

function getPlatformLabel(platform: string) {
  const opt = PLATFORM_OPTIONS.find(o => o.value === platform);
  return opt?.label || platform;
}

function getCategoryLabel(category: string) {
  const opt = CATEGORY_OPTIONS.find(o => o.value === category);
  return opt?.label || category;
}

function WCSyncSection() {
  const [syncResult, setSyncResult] = useState<WCSyncResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const { data: wcStatus } = useQuery<WCSyncStatus>({
    queryKey: ["/api/admin/wc/status"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/wc/status");
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/wc/sync", {
        method: "POST",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error en sincronizacion");
      }
      return res.json() as Promise<WCSyncResult>;
    },
    onSuccess: (data) => {
      setSyncResult(data);
      setShowDetails(true);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wc/status"] });
    },
    onError: (err: Error) => {
      setSyncResult({ total: 0, created: 0, updated: 0, errors: 1, skipped: 0, details: [err.message] });
      setShowDetails(true);
    },
  });

  if (!wcStatus?.configured) return null;

  return (
    <div className="flex items-center gap-2">
      {syncResult && showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowDetails(false)}>
          <div
            data-testid="wc-sync-results"
            className="bg-[#1a1a2e] border border-white/10 rounded-md p-4 max-w-md w-full mx-4 max-h-[70vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-semibold text-white">Resultado de Sincronizacion</h3>
              <button data-testid="button-close-sync-result" onClick={() => setShowDetails(false)} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div className="bg-white/5 rounded p-2">
                <span className="text-white/40">Total WC:</span>
                <span className="text-white ml-1 font-medium">{syncResult.total}</span>
              </div>
              <div className="bg-green-500/10 rounded p-2">
                <span className="text-green-400/60">Creados:</span>
                <span className="text-green-400 ml-1 font-medium">{syncResult.created}</span>
              </div>
              <div className="bg-blue-500/10 rounded p-2">
                <span className="text-blue-400/60">Actualizados:</span>
                <span className="text-blue-400 ml-1 font-medium">{syncResult.updated}</span>
              </div>
              <div className="bg-red-500/10 rounded p-2">
                <span className="text-red-400/60">Errores:</span>
                <span className="text-red-400 ml-1 font-medium">{syncResult.errors}</span>
              </div>
            </div>
            {syncResult.details.length > 0 && (
              <div className="text-xs text-white/50 space-y-1 max-h-48 overflow-y-auto">
                {syncResult.details.map((d, i) => (
                  <div key={i} className={`${d.startsWith("Error") ? "text-red-400/70" : "text-white/40"}`}>{d}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {wcStatus.wcProductCount > 0 && (
        <span className="text-[10px] text-white/30 hidden sm:inline">
          WC: {wcStatus.wcProductCount}/{wcStatus.productCount}
        </span>
      )}
      <Button
        data-testid="button-wc-sync"
        size="sm"
        variant="outline"
        onClick={() => syncMutation.mutate()}
        disabled={syncMutation.isPending}
        className="text-xs border-[#6200EA]/40 text-[#B388FF]"
      >
        {syncMutation.isPending ? (
          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
        ) : (
          <Package className="w-3.5 h-3.5 mr-1" />
        )}
        {syncMutation.isPending ? "Sincronizando..." : "Sync WooCommerce"}
      </Button>
    </div>
  );
}

function ProductsPanel() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    searchAliases: "",
    platform: "all",
    price: "",
    productUrl: "",
    imageUrl: "",
    description: "",
    category: "game",
    availability: "available",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      searchAliases: "",
      platform: "all",
      price: "",
      productUrl: "",
      imageUrl: "",
      description: "",
      category: "game",
      availability: "available",
    });
  };

  const { data: productsList = [], isLoading } = useQuery<AdminProduct[]>({
    queryKey: ["/api/admin/products"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/products");
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al crear producto");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      setIsAdding(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      setEditingId(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Error al eliminar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
    },
  });

  const startEdit = (p: AdminProduct) => {
    setEditingId(p.id);
    setFormData({
      name: p.name,
      searchAliases: (p.searchAliases || []).join(", "),
      platform: p.platform,
      price: p.price || "",
      productUrl: p.productUrl || "",
      imageUrl: p.imageUrl || "",
      description: p.description || "",
      category: p.category,
      availability: p.availability,
    });
  };

  const buildPayload = () => ({
    name: formData.name.trim(),
    searchAliases: formData.searchAliases.split(",").map(s => s.trim()).filter(Boolean),
    platform: formData.platform,
    price: formData.price.trim() || null,
    productUrl: formData.productUrl.trim() || null,
    imageUrl: formData.imageUrl.trim() || null,
    description: formData.description.trim() || null,
    category: formData.category,
    availability: formData.availability,
  });

  const handleSubmitNew = () => {
    if (!formData.name.trim()) return;
    createMutation.mutate(buildPayload());
  };

  const handleSubmitEdit = (id: number) => {
    if (!formData.name.trim()) return;
    updateMutation.mutate({ id, data: buildPayload() });
  };

  const renderForm = (onSubmit: () => void, isPending: boolean, submitLabel: string) => (
    <div className="flex flex-col gap-2">
      <Input
        data-testid="input-product-name"
        value={formData.name}
        onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
        placeholder="Nombre del producto"
        className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
        autoFocus
      />
      <Input
        data-testid="input-product-aliases"
        value={formData.searchAliases}
        onChange={(e) => setFormData(f => ({ ...f, searchAliases: e.target.value }))}
        placeholder="Aliases de busqueda (separados por coma)"
        className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
      />
      <div className="grid grid-cols-2 gap-2">
        <Select value={formData.platform} onValueChange={(v) => setFormData(f => ({ ...f, platform: v }))}>
          <SelectTrigger data-testid="select-product-platform" className="bg-white/5 border-white/10 text-white text-sm">
            <SelectValue placeholder="Plataforma" />
          </SelectTrigger>
          <SelectContent>
            {PLATFORM_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={formData.category} onValueChange={(v) => setFormData(f => ({ ...f, category: v }))}>
          <SelectTrigger data-testid="select-product-category" className="bg-white/5 border-white/10 text-white text-sm">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          data-testid="input-product-price"
          value={formData.price}
          onChange={(e) => setFormData(f => ({ ...f, price: e.target.value }))}
          placeholder="Precio (ej: $29.99 USD)"
          className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
        />
        <Select value={formData.availability} onValueChange={(v) => setFormData(f => ({ ...f, availability: v }))}>
          <SelectTrigger data-testid="select-product-availability" className="bg-white/5 border-white/10 text-white text-sm">
            <SelectValue placeholder="Disponibilidad" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABILITY_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Input
        data-testid="input-product-url"
        value={formData.productUrl}
        onChange={(e) => setFormData(f => ({ ...f, productUrl: e.target.value }))}
        placeholder="URL del producto"
        className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
      />
      <Input
        data-testid="input-product-description"
        value={formData.description}
        onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
        placeholder="Descripcion corta"
        className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
      />
      <div className="flex items-center gap-1 justify-end flex-wrap">
        <Button
          data-testid="button-cancel-product"
          variant="ghost"
          size="sm"
          onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }}
          className="text-white/40 text-xs"
        >
          Cancelar
        </Button>
        <Button
          data-testid="button-save-product"
          size="sm"
          onClick={onSubmit}
          disabled={!formData.name.trim() || isPending}
          className="bg-[#6200EA] text-white text-xs"
        >
          {isPending ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#6200EA] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-3 border-b border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-sm font-semibold text-white">Catalogo de Productos</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <WCSyncSection />
          <Button
            data-testid="button-add-product"
            size="sm"
            onClick={() => { setIsAdding(true); setEditingId(null); resetForm(); }}
            className="bg-[#6200EA] text-white text-xs"
            disabled={isAdding}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Agregar Producto
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {isAdding && (
          <div className="p-3 rounded-md border border-[#6200EA]/30 bg-[#6200EA]/5">
            {renderForm(handleSubmitNew, createMutation.isPending, "Crear Producto")}
          </div>
        )}

        {productsList.length === 0 && !isAdding ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <Package className="w-10 h-10 text-white/10 mb-3" />
            <p className="text-sm text-white/30">No hay productos en el catalogo</p>
            <p className="text-xs text-white/20 mt-1">Agrega productos para que el bot responda con precios y links</p>
          </div>
        ) : (
          productsList.map((p) => (
            <div
              key={p.id}
              data-testid={`product-card-${p.id}`}
              className="p-3 rounded-md border border-white/[0.06] bg-white/[0.03]"
            >
              {editingId === p.id ? (
                renderForm(() => handleSubmitEdit(p.id), updateMutation.isPending, "Guardar")
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span data-testid={`text-product-name-${p.id}`} className="text-sm font-medium text-white">{p.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getAvailabilityColor(p.availability)}`}>
                        {getAvailabilityLabel(p.availability)}
                      </span>
                      {p.wcProductId && (
                        <span className="text-[9px] bg-blue-500/10 text-blue-400/60 px-1 py-0.5 rounded border border-blue-500/20">WC</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] bg-[#6200EA]/15 text-[#6200EA] px-1.5 py-0.5 rounded">
                        {getPlatformLabel(p.platform)}
                      </span>
                      <span className="text-[10px] bg-white/[0.06] text-white/50 px-1.5 py-0.5 rounded">
                        {getCategoryLabel(p.category)}
                      </span>
                      {p.price && (
                        <span data-testid={`text-product-price-${p.id}`} className="text-xs text-green-400 font-medium">{p.price}</span>
                      )}
                    </div>
                    {p.description && (
                      <p className="text-xs text-white/40 mb-1 truncate">{p.description}</p>
                    )}
                    {p.productUrl && (
                      <a
                        data-testid={`link-product-url-${p.id}`}
                        href={p.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[#6200EA] hover:underline truncate block"
                      >
                        {p.productUrl}
                      </a>
                    )}
                    {p.searchAliases && p.searchAliases.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span className="text-[10px] text-white/25">Aliases:</span>
                        {p.searchAliases.map((alias, i) => (
                          <span key={i} className="text-[10px] text-white/30 bg-white/[0.04] px-1 py-0.5 rounded">{alias}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Button
                      data-testid={`button-edit-product-${p.id}`}
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(p)}
                      className="text-white/30"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      data-testid={`button-delete-product-${p.id}`}
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`¿Eliminar "${p.name}"?`)) {
                          deleteMutation.mutate(p.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="text-white/30 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CannedResponsesPanel() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editShortcut, setEditShortcut] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newShortcut, setNewShortcut] = useState("");
  const [newContent, setNewContent] = useState("");

  const { data: responses = [], isLoading } = useQuery<CannedResponse[]>({
    queryKey: ["/api/admin/canned-responses"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/canned-responses");
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { shortcut: string; content: string }) => {
      const res = await fetch("/api/admin/canned-responses", {
        method: "POST",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al crear");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/canned-responses"] });
      setIsAdding(false);
      setNewShortcut("");
      setNewContent("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { shortcut?: string; content?: string } }) => {
      const res = await fetch(`/api/admin/canned-responses/${id}`, {
        method: "PATCH",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/canned-responses"] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/canned-responses/${id}`, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + getAuthToken(), "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Error al eliminar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/canned-responses"] });
    },
  });

  const startEdit = (r: CannedResponse) => {
    setEditingId(r.id);
    setEditShortcut(r.shortcut);
    setEditContent(r.content);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#6200EA] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-3 border-b border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-sm font-semibold text-white">Respuestas Rapidas</h2>
        <Button
          data-testid="button-add-canned-response"
          size="sm"
          onClick={() => { setIsAdding(true); setEditingId(null); }}
          className="bg-[#6200EA] text-white text-xs"
          disabled={isAdding}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Agregar
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {isAdding && (
          <div className="p-3 rounded-md border border-[#6200EA]/30 bg-[#6200EA]/5">
            <div className="flex flex-col gap-2">
              <Input
                data-testid="input-new-shortcut"
                value={newShortcut}
                onChange={(e) => setNewShortcut(e.target.value)}
                placeholder="Atajo (ej: saludo)"
                className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
                autoFocus
              />
              <Input
                data-testid="input-new-content"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Contenido del mensaje..."
                className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
              />
              <div className="flex items-center gap-1 justify-end flex-wrap">
                <Button
                  data-testid="button-cancel-add"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setIsAdding(false); setNewShortcut(""); setNewContent(""); }}
                  className="text-white/40 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  data-testid="button-save-new-canned"
                  size="sm"
                  onClick={() => createMutation.mutate({ shortcut: newShortcut.trim(), content: newContent.trim() })}
                  disabled={!newShortcut.trim() || !newContent.trim() || createMutation.isPending}
                  className="bg-[#6200EA] text-white text-xs"
                >
                  {createMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {responses.length === 0 && !isAdding ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <Zap className="w-10 h-10 text-white/10 mb-3" />
            <p className="text-sm text-white/30">No hay respuestas rapidas</p>
            <p className="text-xs text-white/20 mt-1">Crea atajos para responder mas rapido</p>
          </div>
        ) : (
          responses.map((r) => (
            <div
              key={r.id}
              data-testid={`canned-response-${r.id}`}
              className="p-3 rounded-md border border-white/[0.06] bg-white/[0.03]"
            >
              {editingId === r.id ? (
                <div className="flex flex-col gap-2">
                  <Input
                    data-testid="input-edit-shortcut"
                    value={editShortcut}
                    onChange={(e) => setEditShortcut(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-sm focus-visible:ring-[#6200EA]"
                  />
                  <Input
                    data-testid="input-edit-content"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-sm focus-visible:ring-[#6200EA]"
                  />
                  <div className="flex items-center gap-1 justify-end flex-wrap">
                    <Button
                      data-testid="button-cancel-edit"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(null)}
                      className="text-white/40 text-xs"
                    >
                      Cancelar
                    </Button>
                    <Button
                      data-testid="button-save-edit"
                      size="sm"
                      onClick={() => updateMutation.mutate({ id: r.id, data: { shortcut: editShortcut.trim(), content: editContent.trim() } })}
                      disabled={!editShortcut.trim() || !editContent.trim() || updateMutation.isPending}
                      className="bg-[#6200EA] text-white text-xs"
                    >
                      {updateMutation.isPending ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-[#6200EA] bg-[#6200EA]/10 px-1.5 py-0.5 rounded">/{r.shortcut}</span>
                    </div>
                    <p className="text-sm text-white/60 truncate">{r.content}</p>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Button
                      data-testid={`button-edit-canned-${r.id}`}
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(r)}
                      className="text-white/30"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      data-testid={`button-delete-canned-${r.id}`}
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(r.id)}
                      disabled={deleteMutation.isPending}
                      className="text-white/30 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
  } catch {}
}

function UsersPanel() {
  const [isAdding, setIsAdding] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");

  const { data: users = [], isLoading } = useQuery<{ id: number; email: string; displayName: string; role: string; createdAt: string }[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/users");
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; displayName: string }) => {
      const res = await adminFetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al crear usuario");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsAdding(false);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await adminFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al eliminar");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#6200EA] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-3 border-b border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-sm font-semibold text-white">Gestion de Usuarios</h2>
        <Button
          data-testid="button-add-user"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="bg-[#6200EA] text-white text-xs"
          disabled={isAdding}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Crear Usuario
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {isAdding && (
          <div className="p-3 rounded-md border border-[#6200EA]/30 bg-[#6200EA]/5">
            <div className="flex flex-col gap-2">
              <Input
                data-testid="input-new-user-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre del usuario"
                className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
                autoFocus
              />
              <Input
                data-testid="input-new-user-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Correo electronico"
                className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
              />
              <Input
                data-testid="input-new-user-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Contraseña (min. 6 caracteres)"
                className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
              />
              {createMutation.isError && (
                <p className="text-xs text-red-400">{(createMutation.error as Error).message}</p>
              )}
              <div className="flex items-center gap-1 justify-end flex-wrap">
                <Button
                  data-testid="button-cancel-user"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setIsAdding(false); setNewEmail(""); setNewPassword(""); setNewName(""); }}
                  className="text-white/40 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  data-testid="button-save-user"
                  size="sm"
                  onClick={() => createMutation.mutate({ email: newEmail.trim(), password: newPassword, displayName: newName.trim() })}
                  disabled={!newEmail.trim() || !newPassword.trim() || newPassword.length < 6 || !newName.trim() || createMutation.isPending}
                  className="bg-[#6200EA] text-white text-xs"
                >
                  {createMutation.isPending ? "Creando..." : "Crear Usuario"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {users.map((u) => (
          <div
            key={u.id}
            data-testid={`user-card-${u.id}`}
            className="p-3 rounded-md border border-white/[0.06] bg-white/[0.03] flex items-center justify-between gap-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-sm font-medium text-white">{u.displayName}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  u.role === "superadmin" ? "bg-[#6200EA]/15 text-[#6200EA]" : "bg-white/[0.06] text-white/50"
                }`}>
                  {u.role === "superadmin" ? "Superadmin" : "Admin"}
                </span>
              </div>
              <p className="text-xs text-white/40">{u.email}</p>
            </div>
            {u.role !== "superadmin" && (
              <Button
                data-testid={`button-delete-user-${u.id}`}
                size="icon"
                variant="ghost"
                onClick={() => {
                  if (confirm(`¿Eliminar usuario "${u.displayName}"?`)) {
                    deleteMutation.mutate(u.id);
                  }
                }}
                disabled={deleteMutation.isPending}
                className="text-white/30 hover:text-red-400 flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PasswordChangeModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const changeMutation = useMutation({
    mutationFn: async () => {
      const res = await adminFetch("/api/admin/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al cambiar contraseña");
      return data;
    },
    onSuccess: (data) => {
      if (data.token) setAuthToken(data.token);
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    changeMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-[#1a1a2e] border border-white/10 rounded-md p-4 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-sm font-semibold text-white">Cambiar Contraseña</h3>
          <button data-testid="button-close-password-modal" onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        {success ? (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm">Contraseña actualizada correctamente</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input
              data-testid="input-current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setError(""); }}
              placeholder="Contraseña actual"
              className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
              autoFocus
            />
            <Input
              data-testid="input-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
              placeholder="Nueva contraseña (min. 6 caracteres)"
              className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
            />
            <Input
              data-testid="input-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
              placeholder="Confirmar nueva contraseña"
              className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA]"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <Button
              data-testid="button-change-password"
              type="submit"
              disabled={!currentPassword || !newPassword || !confirmPassword || changeMutation.isPending}
              className="w-full bg-[#6200EA] text-white text-sm"
            >
              {changeMutation.isPending ? "Cambiando..." : "Cambiar Contraseña"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState<{ id: number; email: string; role: string; displayName: string } | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">("all");
  const [agentFilter, setAgentFilter] = useState<"all" | "bot" | "ejecutivo" | "solicita">("all");
  const [adminTab, setAdminTab] = useState<"conversations" | "canned" | "products" | "users" | "settings">("conversations");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try { return localStorage.getItem("admin_sound") !== "false"; } catch { return true; }
  });
  const previousSessionCountRef = useRef<number>(0);

  useEffect(() => {
    const token = getAuthToken();
    const user = getStoredUser();
    if (token && user) {
      fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error("Invalid");
        })
        .then(data => {
          setAdminUser(data);
          setAuthenticated(true);
        })
        .catch(() => { clearAuthToken(); });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(globalSearch), 300);
    return () => clearTimeout(timer);
  }, [globalSearch]);

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<SessionSummary[]>({
    queryKey: ["/api/admin/sessions", statusFilter],
    queryFn: async () => {
      const res = await adminFetch(`/api/admin/sessions?status=${statusFilter}`);
      if (!res.ok) throw new Error("No autorizado");
      return res.json();
    },
    enabled: authenticated,
    refetchInterval: 10000,
  });

  const { data: searchResults = [], isLoading: searchLoading } = useQuery<SearchResult[]>({
    queryKey: ["/api/admin/search", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return [];
      const res = await adminFetch(`/api/admin/search?q=${encodeURIComponent(debouncedSearch)}`);
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    enabled: authenticated && debouncedSearch.length >= 2,
  });

  const { data: allRatings = [] } = useQuery<RatingData[]>({
    queryKey: ["/api/admin/ratings"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/ratings");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: authenticated,
    refetchInterval: 30000,
  });

  const ratingsMap = new Map(allRatings.map(r => [r.sessionId, r]));
  const avgRating = allRatings.length > 0 ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length : 0;

  useEffect(() => {
    if (!authenticated || !soundEnabled) return;
    if (sessions.length > previousSessionCountRef.current && previousSessionCountRef.current > 0) {
      playNotificationSound();
    }
    previousSessionCountRef.current = sessions.length;
  }, [sessions.length, authenticated, soundEnabled]);

  useEffect(() => {
    if (!authenticated) return;
    async function subscribePush() {
      try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        const res = await fetch("/api/push/vapid-public-key");
        const { key } = await res.json();
        if (!key) return;
        const existing = await reg.pushManager.getSubscription();
        if (existing) return;
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
        function urlBase64ToUint8Array(base64String: string) {
          const padding = '='.repeat((4 - base64String.length % 4) % 4);
          const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          return outputArray;
        }

        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });
        const subJson = subscription.toJSON();
        await adminFetch("/api/admin/push-subscribe", {
          method: "POST",
          body: JSON.stringify({
            endpoint: subJson.endpoint,
            keys: subJson.keys,
          }),
        });
      } catch (e) {
        console.log("Push subscription failed:", e);
      }
    }
    subscribePush();
  }, [authenticated]);

  const isSearching = debouncedSearch.length >= 2;
  const baseSessions = isSearching
    ? searchResults.map((r) => ({
        sessionId: r.sessionId,
        userName: r.userName,
        userEmail: r.userEmail,
        messageCount: r.messages.length,
        lastMessage: r.messages[0]?.timestamp ? String(r.messages[0].timestamp) : null,
        firstMessage: null,
        status: "active",
        tags: [],
        problemType: null,
        gameName: null,
        adminActive: false,
        contactRequested: false,
      }))
    : sessions;

  const displaySessions = agentFilter === "all"
    ? baseSessions
    : baseSessions.filter((s) => {
        if (agentFilter === "ejecutivo") return s.adminActive;
        if (agentFilter === "solicita") return !s.adminActive && s.contactRequested;
        if (agentFilter === "bot") return !s.adminActive && !s.contactRequested;
        return true;
      });

  const selectSession = useCallback((sid: string) => {
    setSelectedSession(sid);
    setMobileView("chat");
  }, []);

  const handleLogout = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await adminFetch("/api/admin/push-subscribe", { method: "DELETE", body: JSON.stringify({ endpoint: sub.endpoint }) });
          await sub.unsubscribe();
        }
      }
    } catch {}
    clearAuthToken();
    setAuthenticated(false);
    setAdminUser(null);
    setSelectedSession(null);
  };

  if (!authenticated) {
    return <AdminLogin onLogin={(user) => { setAdminUser(user); setAuthenticated(true); }} />;
  }

  const statusTabs = [
    { key: "all" as const, label: "Todos" },
    { key: "active" as const, label: "Activos" },
    { key: "closed" as const, label: "Cerrados" },
  ];

  return (
    <div className="h-screen flex flex-col" style={{ background: "#111", fontFamily: "'DM Sans', sans-serif" }}>
      <header className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between gap-3" style={{ background: "#6200EA" }}>
        <div className="flex items-center gap-3">
          {mobileView === "chat" && (
            <button
              data-testid="button-back-to-list"
              onClick={() => setMobileView("list")}
              className="md:hidden w-8 h-8 rounded-full bg-white/15 flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
          )}
          <img src="/logo-192.webp" alt="CJM" className="w-8 h-8 rounded-lg" />
          <div>
            <h1 data-testid="text-admin-title" className="text-base font-bold text-white leading-tight">Soporte CJM DIGITALES</h1>
            {adminUser && (
              <p className="text-[11px] text-white/60">{adminUser.displayName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allRatings.length > 0 && (
            <span data-testid="text-avg-rating" className="text-sm text-white/70 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span>{avgRating.toFixed(1)}</span>
              <span className="text-white/40">({allRatings.length})</span>
            </span>
          )}
          <span className="text-sm text-white/70 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            <span data-testid="text-session-count">{sessions.length}</span>
          </span>
          <Button
            size="icon"
            variant="ghost"
            data-testid="button-toggle-sound"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              try { localStorage.setItem("admin_sound", String(next)); } catch {}
            }}
            className="text-white/60 hover:text-white"
            title={soundEnabled ? "Silenciar notificaciones" : "Activar sonido"}
          >
            {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            data-testid="button-change-password-trigger"
            onClick={() => setShowPasswordChange(true)}
            className="text-white/60 hover:text-white"
            title="Cambiar contraseña"
          >
            <Lock className="w-4 h-4" />
          </Button>
          <button
            data-testid="button-admin-logout"
            onClick={handleLogout}
            className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
            title="Cerrar sesion"
          >
            <LogOut className="w-4 h-4 text-white" />
          </button>
        </div>
      </header>

      {showPasswordChange && <PasswordChangeModal onClose={() => setShowPasswordChange(false)} />}

      <div className="border-b border-white/[0.06] flex items-center gap-0 px-2">
        <button
          data-testid="tab-conversations"
          onClick={() => setAdminTab("conversations")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
            adminTab === "conversations" ? "text-[#6200EA]" : "text-white/40 hover:text-white/60"
          }`}
        >
          Conversaciones
          {adminTab === "conversations" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6200EA]" />
          )}
        </button>
        <button
          data-testid="tab-canned-responses"
          onClick={() => setAdminTab("canned")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
            adminTab === "canned" ? "text-[#6200EA]" : "text-white/40 hover:text-white/60"
          }`}
        >
          Respuestas Rapidas
          {adminTab === "canned" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6200EA]" />
          )}
        </button>
        <button
          data-testid="tab-products"
          onClick={() => setAdminTab("products")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors relative flex items-center gap-1.5 ${
            adminTab === "products" ? "text-[#6200EA]" : "text-white/40 hover:text-white/60"
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Productos
          {adminTab === "products" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6200EA]" />
          )}
        </button>
        {adminUser?.role === "superadmin" && (
          <button
            data-testid="tab-users"
            onClick={() => setAdminTab("users")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative flex items-center gap-1.5 ${
              adminTab === "users" ? "text-[#6200EA]" : "text-white/40 hover:text-white/60"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Usuarios
            {adminTab === "users" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6200EA]" />
            )}
          </button>
        )}
      </div>

      {adminTab === "users" ? (
        <UsersPanel />
      ) : adminTab === "products" ? (
        <ProductsPanel />
      ) : adminTab === "canned" ? (
        <CannedResponsesPanel />
      ) : (
        <div className="flex-1 flex min-h-0">
          <div className={`w-full md:w-80 lg:w-96 border-r border-white/[0.06] flex flex-col ${mobileView === "chat" ? "hidden md:flex" : "flex"}`}>
            <div className="p-3 border-b border-white/[0.06]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  data-testid="input-global-search"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Buscar en todos los chats..."
                  className="pl-10 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/25 focus-visible:ring-[#6200EA] focus-visible:border-[#6200EA]"
                />
                {globalSearch && (
                  <button
                    onClick={() => setGlobalSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {isSearching && (
                <p className="text-[11px] text-white/30 mt-2 px-1">
                  {searchLoading ? "Buscando..." : `${searchResults.length} conversacion${searchResults.length !== 1 ? "es" : ""} encontrada${searchResults.length !== 1 ? "s" : ""}`}
                </p>
              )}
            </div>

            {!isSearching && (
              <div className="border-b border-white/[0.06] px-3 py-2 flex flex-col gap-1.5">
                <div className="flex items-center gap-1">
                  {statusTabs.map((tab) => (
                    <button
                      key={tab.key}
                      data-testid={`tab-filter-${tab.key}`}
                      onClick={() => setStatusFilter(tab.key)}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        statusFilter === tab.key
                          ? "bg-[#6200EA] text-white"
                          : "text-white/40 hover:text-white/60 bg-white/[0.03]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  {([
                    { key: "all" as const, label: "Todos" },
                    { key: "bot" as const, label: "Bot" },
                    { key: "ejecutivo" as const, label: "Ejecutivo" },
                    { key: "solicita" as const, label: "Solicita Ejecutivo" },
                  ]).map((tab) => (
                    <button
                      key={tab.key}
                      data-testid={`tab-agent-${tab.key}`}
                      onClick={() => setAgentFilter(tab.key)}
                      className={`px-2 py-0.5 text-[10px] rounded-md transition-colors ${
                        agentFilter === tab.key
                          ? tab.key === "bot" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : tab.key === "ejecutivo" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : tab.key === "solicita" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-[#6200EA] text-white border border-transparent"
                          : "text-white/30 hover:text-white/50 bg-white/[0.03] border border-transparent"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
              {sessionsLoading && !isSearching ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[#6200EA] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : displaySessions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                  <MessageSquare className="w-10 h-10 text-white/10 mb-3" />
                  <p className="text-sm text-white/30">
                    {isSearching ? "No se encontraron resultados" : "No hay conversaciones aun"}
                  </p>
                </div>
              ) : (
                displaySessions.map((session) => (
                  <SessionCard
                    key={session.sessionId}
                    session={session}
                    onClick={() => selectSession(session.sessionId)}
                    isSelected={selectedSession === session.sessionId}
                    rating={ratingsMap.get(session.sessionId)}
                  />
                ))
              )}
            </div>
          </div>

          <div className={`flex-1 flex flex-col ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
            {selectedSession ? (
              <ChatViewer sessionId={selectedSession} searchQuery={debouncedSearch} sessions={sessions} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 rounded-full bg-[#6200EA]/10 border border-[#6200EA]/20 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-[#6200EA]/40" />
                </div>
                <p className="text-sm text-white/30 mb-1">Selecciona una conversacion</p>
                <p className="text-xs text-white/20">Haz clic en una sesion para ver el historial de chat</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
