import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import type { Message } from "@shared/schema";

interface ChatUser {
  email: string;
  name: string;
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
      setUser({ email: email!, name: name! });
      localStorage.setItem("chat_user", JSON.stringify({ email, name }));
    } else {
      const stored = localStorage.getItem("chat_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.email && parsed.name) {
            setUser(parsed);
          }
        } catch {}
      }
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
    queryKey: ["/api/messages", user?.email],
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const socket = connectSocket(user.email, user.name);

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("page_info", pageInfo);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("chat_history", (history: Message[]) => {
      queryClient.setQueryData(["/api/messages", user.email], history);
    });

    socket.on("new_message", (msg: Message) => {
      queryClient.setQueryData(
        ["/api/messages", user.email],
        (old: Message[] | undefined) => [...(old || []), msg],
      );
    });

    socket.on("contact_confirmed", () => {
      setContactRequested(true);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("chat_history");
      socket.off("new_message");
      socket.off("contact_confirmed");
      disconnectSocket();
    };
  }, [user]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!user || !content.trim()) return;
      const socket = getSocket();
      socket.emit("send_message", {
        content: content.trim(),
        userEmail: user.email,
        userName: user.name,
        sender: "user",
      });
    },
    [user],
  );

  const requestContact = useCallback(() => {
    if (!user || contactRequested) return;
    const socket = getSocket();
    socket.emit("contact_executive", {
      userEmail: user.email,
      userName: user.name,
      pageUrl: pageInfo.url,
      pageTitle: pageInfo.title,
    });
  }, [user, contactRequested, pageInfo]);

  const login = useCallback((email: string, name: string) => {
    const userData = { email, name };
    localStorage.setItem("chat_user", JSON.stringify(userData));
    setUser(userData);
  }, []);

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
