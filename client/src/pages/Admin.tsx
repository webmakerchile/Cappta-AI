import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Search, MessageSquare, Mail, Clock, User, Headphones, ArrowLeft, X, Lock, LogOut,
  Plus, Tag, CheckCircle, Circle, Pencil, Trash2, Zap, Save, XCircle, Gamepad2,
  Send, ShieldCheck, ShieldOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Message } from "@shared/schema";

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

const PREDEFINED_TAGS = ["Venta", "Soporte", "Urgente", "Resuelto", "Pendiente"];

function getAdminKey(): string {
  try { return localStorage.getItem("admin_key") || ""; } catch { return ""; }
}

function setAdminKey(key: string) {
  try { localStorage.setItem("admin_key", key); } catch {}
}

function clearAdminKey() {
  try { localStorage.removeItem("admin_key"); } catch {}
}

function adminFetch(url: string) {
  const key = getAdminKey();
  return fetch(url, { headers: { "x-admin-key": key } });
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

function AdminLogin({ onLogin }: { onLogin: (key: string) => void }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/sessions", { headers: { "x-admin-key": key.trim() } });
      if (res.ok) {
        setAdminKey(key.trim());
        onLogin(key.trim());
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  return (
    <div className="h-screen flex items-center justify-center" style={{ background: "#111", fontFamily: "'DM Sans', sans-serif" }}>
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#6200EA]/15 border border-[#6200EA]/30 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-[#6200EA]" />
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Panel de Administracion</h1>
          <p className="text-sm text-white/40">Ingresa la clave de acceso</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            data-testid="input-admin-key"
            type="password"
            value={key}
            onChange={(e) => { setKey(e.target.value); setError(false); }}
            placeholder="Clave de administracion"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-[#6200EA] focus-visible:border-[#6200EA]"
            autoFocus
          />
          {error && (
            <p data-testid="text-login-error" className="text-sm text-red-400">Clave incorrecta</p>
          )}
          <Button
            data-testid="button-admin-login"
            type="submit"
            disabled={loading || !key.trim()}
            className="w-full bg-[#6200EA] border-[#6200EA] text-white"
          >
            {loading ? "Verificando..." : "Ingresar"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function SessionCard({ session, onClick, isSelected }: { session: SessionSummary; onClick: () => void; isSelected: boolean }) {
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
      <div className="flex items-center gap-3 text-[11px] text-white/30 pl-9">
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          {session.messageCount}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDateTime(session.lastMessage)}
        </span>
        {session.adminActive && (
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            Admin
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
        headers: { "x-admin-key": getAdminKey(), "Content-Type": "application/json" },
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

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`/api/admin/sessions/${sessionId}/status`, {
        method: "PATCH",
        headers: { "x-admin-key": getAdminKey(), "Content-Type": "application/json" },
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
        headers: { "x-admin-key": getAdminKey(), "Content-Type": "application/json" },
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
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/admin/sessions/${sessionId}/reply`, {
        method: "POST",
        headers: { "x-admin-key": getAdminKey(), "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleReplySend = () => {
    if (!replyText.trim() || replyMutation.isPending) return;
    replyMutation.mutate(replyText.trim());
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
                    className={`px-3 py-2 rounded-md text-sm leading-relaxed break-words ${
                      isUser
                        ? "bg-[#6200EA] text-white rounded-br-none"
                        : "bg-white/5 border border-white/10 text-white/90 rounded-bl-none"
                    }`}
                  >
                    {activeSearch ? highlightText(msg.content, activeSearch) : msg.content}
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
        <div className="px-3 py-2 border-t border-white/[0.06] flex items-center gap-2">
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
      ) : (
        <div className="px-4 py-2 border-t border-white/[0.06] text-[11px] text-white/25 text-center">
          {messages.length} mensaje{messages.length !== 1 ? "s" : ""} en esta conversacion
        </div>
      )}
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
        headers: { "x-admin-key": getAdminKey(), "Content-Type": "application/json" },
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
        headers: { "x-admin-key": getAdminKey(), "Content-Type": "application/json" },
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
        headers: { "x-admin-key": getAdminKey(), "Content-Type": "application/json" },
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

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">("all");
  const [adminTab, setAdminTab] = useState<"conversations" | "canned">("conversations");

  useEffect(() => {
    const stored = getAdminKey();
    if (stored) {
      adminFetch("/api/admin/sessions").then(res => {
        if (res.ok) setAuthenticated(true);
        else clearAdminKey();
      }).catch(() => clearAdminKey());
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

  const isSearching = debouncedSearch.length >= 2;
  const displaySessions = isSearching
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
      }))
    : sessions;

  const selectSession = useCallback((sid: string) => {
    setSelectedSession(sid);
    setMobileView("chat");
  }, []);

  const handleLogout = () => {
    clearAdminKey();
    setAuthenticated(false);
    setSelectedSession(null);
  };

  if (!authenticated) {
    return <AdminLogin onLogin={() => setAuthenticated(true)} />;
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
          <Headphones className="w-5 h-5 text-white" />
          <h1 data-testid="text-admin-title" className="text-base font-bold text-white">Panel de Administracion</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/70 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            <span data-testid="text-session-count">{sessions.length}</span>
          </span>
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
      </div>

      {adminTab === "canned" ? (
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
              <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.06]">
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
