import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import type { Message } from "@shared/schema";

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

function isValidParam(value: string | null): boolean {
  if (!value) return false;
  if (value.includes("<?php") || value.includes("<%") || value.trim() === "") return false;
  return true;
}

export function useChat() {
  const [user, setUser] = useState<ChatUser | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [contactRequested, setContactRequested] = useState(false);
  const [pageInfo, setPageInfo] = useState<PageInfo>({ url: "", title: "" });
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    const name = params.get("name");
    const pageUrl = params.get("page_url") || document.referrer || "";
    const pageTitle = params.get("page_title") || "";

    setPageInfo({
      url: isValidParam(pageUrl) ? pageUrl : "",
      title: isValidParam(pageTitle) ? pageTitle : "",
    });

    if (isValidParam(email) && isValidParam(name)) {
      const sessionId = generateSessionId();
      setUser({ email: email!, name: name!, sessionId });
      try { localStorage.setItem("chat_user", JSON.stringify({ email, name, sessionId })); } catch {}
    } else {
      try {
        const stored = localStorage.getItem("chat_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.email && parsed.name && parsed.sessionId) {
            setUser(parsed);
          }
        }
      } catch {}
    }
    setIsLoading(false);
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
    queryKey: ["/api/messages", user?.sessionId],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/messages/session/${user.sessionId}`);
      if (!res.ok) throw new Error("Error loading messages");
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 4000,
    staleTime: 2000,
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
        queryClient.setQueryData(["/api/messages", user.sessionId], history);
      });

      socket.on("new_message", (msg: Message) => {
        queryClient.setQueryData(
          ["/api/messages", user.sessionId],
          (old: Message[] | undefined) => {
            const existing = old || [];
            if (existing.some(m => m.id === msg.id)) return existing;
            return [...existing, msg];
          },
        );
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
    async (content: string) => {
      if (!user || !content.trim()) return;

      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: content.trim(),
            sessionId: user.sessionId,
            userEmail: user.email,
            userName: user.name,
            sender: "user",
            pageUrl: pageInfo.url,
            pageTitle: pageInfo.title,
          }),
        });

        if (res.ok) {
          const msg = await res.json();
          queryClient.setQueryData(
            ["/api/messages", user.sessionId],
            (old: Message[] | undefined) => {
              const existing = old || [];
              if (existing.some(m => m.id === msg.id)) return existing;
              return [...existing, msg];
            },
          );

          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["/api/messages", user.sessionId] });
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
    [user, pageInfo],
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
          queryClient.invalidateQueries({ queryKey: ["/api/messages", user.sessionId] });
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

  const login = useCallback((email: string, name: string, problemType?: string, gameName?: string) => {
    const sessionId = generateSessionId();
    const userData: ChatUser = { email, name, sessionId, problemType, gameName };
    try { localStorage.setItem("chat_user", JSON.stringify(userData)); } catch {}
    setUser(userData);

    if (problemType && gameName) {
      const problemLabels: Record<string, string> = {
        compra: "Quiero comprar un producto",
        problema_cuenta: "Problema con mi cuenta",
        entrega: "No he recibido mi producto",
        devolucion: "Solicitar devolucion o cambio",
        info_producto: "Informacion sobre un producto",
        precio: "Consulta de precios",
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
            }),
          });
          if (res.ok) {
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ["/api/messages", sessionId] });
            }, 2500);
          }
        } catch {}
      }, 500);
    }
  }, [pageInfo]);

  return {
    user,
    messages,
    isConnected,
    isLoading,
    contactRequested,
    sendMessage,
    requestContact,
    login,
  };
}
