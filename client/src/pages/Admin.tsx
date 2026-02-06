import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MessageSquare, Mail, Clock, User, Headphones, ArrowLeft, X, Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Message } from "@shared/schema";

interface SessionSummary {
  sessionId: string;
  userName: string;
  userEmail: string;
  messageCount: number;
  lastMessage: string | null;
  firstMessage: string | null;
}

interface SearchResult {
  sessionId: string;
  userName: string;
  userEmail: string;
  messages: Message[];
}

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
        <div className="w-7 h-7 rounded-full bg-[#6200EA]/20 flex items-center justify-center flex-shrink-0">
          <User className="w-3.5 h-3.5 text-[#6200EA]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{session.userName || "Sin nombre"}</p>
          <p className="text-[11px] text-white/40 truncate">{session.userEmail || "Sin correo"}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-white/30 pl-9">
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          {session.messageCount}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDateTime(session.lastMessage)}
        </span>
      </div>
    </button>
  );
}

function ChatViewer({ sessionId, searchQuery }: { sessionId: string; searchQuery: string }) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [localSearch, setLocalSearch] = useState("");
  const [showLocalSearch, setShowLocalSearch] = useState(false);

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/admin/sessions", sessionId, "messages"],
    queryFn: async () => {
      const res = await adminFetch(`/api/admin/sessions/${sessionId}/messages`);
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    enabled: !!sessionId,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeSearch = showLocalSearch ? localSearch : searchQuery;

  const filteredMessages = activeSearch && activeSearch.length >= 2
    ? messages.filter(m => m.content.toLowerCase().includes(activeSearch.toLowerCase()))
    : messages;

  const userName = messages.find(m => m.sender === "user")?.userName || "";
  const userEmail = messages.find(m => m.sender === "user")?.userEmail || "";

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#6200EA] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#6200EA]/20 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-[#6200EA]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{userName || "Usuario"}</p>
            <p className="text-[11px] text-white/40 truncate">{userEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
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

      <div className="px-4 py-2 border-t border-white/[0.06] text-[11px] text-white/25 text-center">
        {messages.length} mensaje{messages.length !== 1 ? "s" : ""} en esta conversacion
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
    queryKey: ["/api/admin/sessions"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/sessions");
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
            <ChatViewer sessionId={selectedSession} searchQuery={debouncedSearch} />
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
    </div>
  );
}
