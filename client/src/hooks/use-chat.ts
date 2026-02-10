import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import type { Message, Session } from "@shared/schema";

function playUserNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch {}
}

interface ChatUser {
  email: string;
  name: string;
  sessionId: string;
  problemType?: string;
  gameName?: string;
}

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

interface PageInfo {
  url: string;
  title: string;
}

interface ProductContext {
  name: string;
  price?: string;
  url?: string;
  image?: string;
}

function isValidParam(value: string | null): boolean {
  if (!value) return false;
  if (value.includes("<?php") || value.includes("<%") || value.trim() === "") return false;
  return true;
}

const STORAGE_KEY = "chat_thread_user";
const OLD_STORAGE_KEY = "chat_user";

function loadStoredUser(): { email: string; name: string; activeSessionId: string } | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.email && parsed.name && parsed.activeSessionId) {
        return parsed;
      }
    }
    const oldStored = localStorage.getItem(OLD_STORAGE_KEY);
    if (oldStored) {
      const parsed = JSON.parse(oldStored);
      if (parsed.email && parsed.name && parsed.sessionId) {
        const migrated = { email: parsed.email, name: parsed.name, activeSessionId: parsed.sessionId };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        localStorage.removeItem(OLD_STORAGE_KEY);
        return migrated;
      }
    }
  } catch {}
  return null;
}

function saveStoredUser(email: string, name: string, activeSessionId: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, name, activeSessionId }));
  } catch {}
}

export function useChat() {
  const [user, setUser] = useState<ChatUser | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [contactRequested, setContactRequested] = useState(false);
  const [pageInfo, setPageInfo] = useState<PageInfo>({ url: "", title: "" });
  const [productContext, setProductContext] = useState<ProductContext | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    const name = params.get("name");
    const pageUrl = params.get("page_url") || document.referrer || "";
    const pageTitle = params.get("page_title") || "";

    const productName = params.get("product_name");
    const productPrice = params.get("product_price");
    const productUrl = params.get("product_url");
    const productImage = params.get("product_image");

    if (isValidParam(productName)) {
      setProductContext({
        name: productName!,
        price: isValidParam(productPrice) ? productPrice! : undefined,
        url: isValidParam(productUrl) ? productUrl! : undefined,
        image: isValidParam(productImage) ? productImage! : undefined,
      });
    }

    setPageInfo({
      url: isValidParam(pageUrl) ? pageUrl : "",
      title: isValidParam(pageTitle) ? pageTitle : "",
    });

    if (isValidParam(email) && isValidParam(name)) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      fetch(`/api/session/resolve/${encodeURIComponent(email!.toLowerCase())}`, { signal: controller.signal })
        .then(r => r.json())
        .then(data => {
          const sessionId = data.sessionId || generateSessionId();
          const userData: ChatUser = { email: email!, name: name!, sessionId };
          setUser(userData);
          saveStoredUser(email!, name!, sessionId);
        })
        .catch(() => {
          const sessionId = generateSessionId();
          const userData: ChatUser = { email: email!, name: name!, sessionId };
          setUser(userData);
          saveStoredUser(email!, name!, sessionId);
        })
        .finally(() => {
          clearTimeout(timeout);
          setIsLoading(false);
        });
    } else {
      const stored = loadStoredUser();
      if (stored) {
        setUser({ email: stored.email, name: stored.name, sessionId: stored.activeSessionId });
      }
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === "object") {
        if (event.data.type === "page_info") {
          setPageInfo({
            url: event.data.url || pageInfo.url,
            title: event.data.title || pageInfo.title,
          });
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [pageInfo]);

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages/thread", user?.email],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/messages/thread/${encodeURIComponent(user.email)}`);
      if (!res.ok) throw new Error("Error loading messages");
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 2000,
    staleTime: 2000,
  });

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["/api/sessions/by-email", user?.email],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/sessions/by-email/${encodeURIComponent(user.email)}`);
      if (!res.ok) throw new Error("Error loading sessions");
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 8000,
    staleTime: 4000,
  });

  useEffect(() => {
    if (!user) return;

    let socketConnected = false;

    try {
      const socket = connectSocket(user.email, user.name, user.sessionId);

      socket.on("connect", () => {
        socketConnected = true;
        setIsConnected(true);
        socket.emit("page_info", pageInfo);
      });

      socket.on("disconnect", () => {
        socketConnected = false;
        setIsConnected(false);
      });

      socket.on("chat_history", (history: Message[]) => {
        queryClient.setQueryData(["/api/messages/thread", user.email], history);
      });

      socket.on("new_message", (msg: Message) => {
        queryClient.setQueryData(
          ["/api/messages/thread", user.email],
          (old: Message[] | undefined) => {
            const existing = old || [];
            if (existing.some(m => m.id === msg.id)) return existing;
            return [...existing, msg];
          },
        );
        if (msg.sender !== "user") {
          playUserNotificationSound();
        }
      });

      socket.on("contact_confirmed", () => {
        setContactRequested(true);
      });

      setTimeout(() => {
        if (!socketConnected) {
          setIsConnected(true);
        }
      }, 3000);
    } catch {
      setIsConnected(true);
    }

    return () => {
      try {
        const socket = getSocket();
        socket.off("connect");
        socket.off("disconnect");
        socket.off("chat_history");
        socket.off("new_message");
        socket.off("contact_confirmed");
        disconnectSocket();
      } catch {}
    };
  }, [user]);

  const sendMessage = useCallback(
    async (content: string, imageUrl?: string, quickReplyValue?: string) => {
      if (!user) return;
      if (!content.trim() && !imageUrl) return;

      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: content.trim() || (imageUrl ? (/\.(mp4|webm|mov|avi|mkv)$/i.test(imageUrl) ? "Video enviado" : "Imagen enviada") : ""),
            sessionId: user.sessionId,
            userEmail: user.email,
            userName: user.name,
            sender: "user",
            pageUrl: pageInfo.url,
            pageTitle: pageInfo.title,
            imageUrl: imageUrl || undefined,
            productName: productContext?.name || undefined,
            productPrice: productContext?.price || undefined,
            productUrl: productContext?.url || undefined,
            quickReplyValue: quickReplyValue || undefined,
          }),
        });

        if (res.ok) {
          const msg = await res.json();
          queryClient.setQueryData(
            ["/api/messages/thread", user.email],
            (old: Message[] | undefined) => {
              const existing = old || [];
              if (existing.some(m => m.id === msg.id)) return existing;
              return [...existing, msg];
            },
          );

          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["/api/messages/thread", user.email] });
          }, 2500);
        }
      } catch {
        try {
          const socket = getSocket();
          if (socket.connected) {
            socket.emit("send_message", {
              content: content.trim(),
              sessionId: user.sessionId,
              userEmail: user.email,
              userName: user.name,
              sender: "user",
            });
          }
        } catch {}
      }
    },
    [user, pageInfo, productContext],
  );

  const requestContact = useCallback(async () => {
    if (!user || contactRequested) return;

    try {
      const res = await fetch("/api/contact-executive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: user.sessionId,
          userEmail: user.email,
          userName: user.name,
          pageUrl: pageInfo.url,
          pageTitle: pageInfo.title,
          problemType: user.problemType,
          gameName: user.gameName,
        }),
      });

      if (res.ok) {
        setContactRequested(true);
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/messages/thread", user.email] });
        }, 1500);
      }
    } catch {
      try {
        const socket = getSocket();
        if (socket.connected) {
          socket.emit("contact_executive", {
            sessionId: user.sessionId,
            userEmail: user.email,
            userName: user.name,
            pageUrl: pageInfo.url,
            pageTitle: pageInfo.title,
            problemType: user.problemType,
            gameName: user.gameName,
          });
        }
      } catch {}
    }
  }, [user, contactRequested, pageInfo]);

  const login = useCallback(async (email: string, name: string, problemType?: string, gameName?: string) => {
    let sessionId: string;
    try {
      const res = await fetch(`/api/session/resolve/${encodeURIComponent(email.toLowerCase())}`);
      const data = await res.json();
      sessionId = data.sessionId || generateSessionId();
    } catch {
      sessionId = generateSessionId();
    }
    const userData: ChatUser = { email, name, sessionId, problemType, gameName };
    saveStoredUser(email, name, sessionId);
    setUser(userData);

    if (problemType && gameName) {
      const problemLabels: Record<string, string> = {
        compra: "Quiero comprar un producto",
        codigo_verificacion: "Necesito un nuevo codigo de verificacion",
        candado_juego: "Me aparece un candado en mi juego",
        estado_pedido: "Quiero saber el estado de mi pedido",
        problema_plus: "Tengo problemas con mi plus",
        otro: "Otro",
      };
      const label = problemLabels[problemType] || problemType;
      const introMessage = `Hola, mi consulta es: ${label}. Producto/Juego: ${gameName}`;

      setTimeout(async () => {
        try {
          const res = await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: introMessage,
              sessionId,
              userEmail: email,
              userName: name,
              sender: "user",
              pageUrl: pageInfo.url,
              pageTitle: pageInfo.title,
              problemType,
              gameName,
            }),
          });
          if (res.ok) {
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ["/api/messages/thread", email] });
            }, 2500);
          }
        } catch {}
      }, 500);
    }
  }, [pageInfo]);

  const startNewSession = useCallback((problemType: string, gameName: string) => {
    if (!user) return;
    const updatedUser: ChatUser = { ...user, problemType, gameName };
    setUser(updatedUser);

    const problemLabels: Record<string, string> = {
      compra: "Quiero comprar un producto",
      codigo_verificacion: "Necesito un nuevo codigo de verificacion",
      candado_juego: "Me aparece un candado en mi juego",
      estado_pedido: "Quiero saber el estado de mi pedido",
      problema_plus: "Tengo problemas con mi plus",
      otro: "Otro",
    };
    const label = problemLabels[problemType] || problemType;
    const introMessage = `Hola, mi consulta es: ${label}. Producto/Juego: ${gameName}`;

    setTimeout(async () => {
      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: introMessage,
            sessionId: user.sessionId,
            userEmail: user.email,
            userName: user.name,
            sender: "user",
            pageUrl: pageInfo.url,
            pageTitle: pageInfo.title,
            problemType,
            gameName,
          }),
        });
        if (res.ok) {
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["/api/messages/thread", user.email] });
            queryClient.invalidateQueries({ queryKey: ["/api/sessions/by-email", user.email] });
          }, 2500);
        }
      } catch {}
    }, 500);
  }, [user, pageInfo]);

  const logout = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    try { localStorage.removeItem(OLD_STORAGE_KEY); } catch {}
    setUser(null);
    setContactRequested(false);
    try { disconnectSocket(); } catch {}
  }, []);

  return {
    user,
    messages,
    sessions,
    isConnected,
    isLoading,
    contactRequested,
    sendMessage,
    requestContact,
    login,
    startNewSession,
    logout,
  };
}
