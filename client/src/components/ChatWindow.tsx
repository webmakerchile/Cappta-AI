import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Send, Wifi, WifiOff, Headphones, UserRound, X, Search, Zap, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Message } from "@shared/schema";
import { useUpload } from "@/hooks/use-upload";

interface CannedResponse {
  id: number;
  shortcut: string;
  content: string;
}

interface ChatWindowProps {
  messages: Message[];
  onSend: (content: string, imageUrl?: string) => void;
  onContactExecutive: () => void;
  isConnected: boolean;
  userName: string;
  contactRequested: boolean;
  onClose: () => void;
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

function MessageBubble({ message, searchQuery }: { message: Message; searchQuery: string }) {
  const isUser = message.sender === "user";
  const hasImage = !!(message as any).imageUrl;
  const imageUrl = (message as any).imageUrl;
  const isImageOnly = hasImage && (!message.content || message.content === "Imagen enviada");

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
      <div className="flex flex-col gap-1 max-w-[75%]">
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
              {searchQuery ? highlightText(message.content, searchQuery) : message.content}
            </div>
          )}
        </div>
        <span
          className={`text-[10px] text-white/30 ${isUser ? "text-right" : "text-left"}`}
        >
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

export function ChatWindow({ messages, onSend, onContactExecutive, isConnected, userName, contactRequested, onClose }: ChatWindowProps) {
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const { data: cannedResponses = [] } = useQuery<CannedResponse[]>({
    queryKey: ["/api/canned-responses"],
    queryFn: async () => {
      const res = await fetch("/api/canned-responses");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30000,
  });

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

  const filteredCanned = cannedResponses.filter(r => {
    if (!slashFilter) return true;
    return r.shortcut.toLowerCase().includes(slashFilter.toLowerCase()) ||
           r.content.toLowerCase().includes(slashFilter.toLowerCase());
  });

  useEffect(() => {
    setSelectedSlashIndex(0);
  }, [slashFilter]);

  const selectCannedResponse = useCallback((response: CannedResponse) => {
    setInput(response.content);
    setShowSlashMenu(false);
    setSlashFilter("");
    inputRef.current?.focus();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    if (val.startsWith("/")) {
      setShowSlashMenu(true);
      setSlashFilter(val.slice(1));
    } else {
      setShowSlashMenu(false);
      setSlashFilter("");
    }
  }, []);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSlashMenu || filteredCanned.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSlashIndex(prev => (prev + 1) % filteredCanned.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSlashIndex(prev => (prev - 1 + filteredCanned.length) % filteredCanned.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      selectCannedResponse(filteredCanned[selectedSlashIndex]);
    } else if (e.key === "Escape") {
      setShowSlashMenu(false);
      setSlashFilter("");
    }
  }, [showSlashMenu, filteredCanned, selectedSlashIndex, selectCannedResponse]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showSlashMenu) {
      setShowSlashMenu(false);
      return;
    }
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  };

  const filteredMessages = searchQuery.length >= 2
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const matchCount = searchQuery.length >= 2 ? filteredMessages.length : 0;

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
        >
          <Search className="w-4 h-4 text-white" />
        </button>
        <button
          data-testid="button-close-chat"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center transition-colors hover:bg-white/25"
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
          filteredMessages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} searchQuery={searchQuery} />
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
      </div>

      <div className="relative px-3 pb-3">
        {showSlashMenu && filteredCanned.length > 0 && (
          <div
            ref={slashMenuRef}
            data-testid="slash-command-menu"
            className="absolute bottom-full left-3 right-3 mb-1 bg-[#1e1e1e] border border-white/10 rounded-md shadow-lg max-h-48 overflow-y-auto z-50"
          >
            <div className="px-3 py-1.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-[11px] text-white/30">
                <Zap className="w-3 h-3" />
                Respuestas rapidas
              </div>
            </div>
            {filteredCanned.map((response, idx) => (
              <button
                key={response.id}
                data-testid={`slash-option-${response.shortcut}`}
                className={`w-full text-left px-3 py-2 flex flex-col gap-0.5 transition-colors ${
                  idx === selectedSlashIndex
                    ? "bg-[#6200EA]/20"
                    : "hover:bg-white/[0.05]"
                }`}
                onMouseEnter={() => setSelectedSlashIndex(idx)}
                onClick={() => selectCannedResponse(response)}
              >
                <span className="text-sm font-medium text-[#6200EA]">/{response.shortcut}</span>
                <span className="text-xs text-white/40 line-clamp-1">{response.content}</span>
              </button>
            ))}
          </div>
        )}

        {showSlashMenu && filteredCanned.length === 0 && input.startsWith("/") && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-[#1e1e1e] border border-white/10 rounded-md p-3 z-50">
            <p className="text-xs text-white/30 text-center">No hay respuestas rapidas disponibles</p>
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
          <input
            ref={inputRef}
            data-testid="input-message"
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder='Escribe un mensaje... (usa "/" para atajos)'
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
            disabled={!input.trim() || showSlashMenu}
            className="bg-[#6200EA] text-white flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
