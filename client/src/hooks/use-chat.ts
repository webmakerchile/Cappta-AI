import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import type { Message } from "@shared/schema";

interface ChatUser {
  email: string;
  name: string;
}

export function useChat() {
  const [user, setUser] = useState<ChatUser | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    const name = params.get("name");

    if (email && name) {
      setUser({ email, name });
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

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages", user?.email],
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const socket = connectSocket(user.email, user.name);

    socket.on("connect", () => {
      setIsConnected(true);
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

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("chat_history");
      socket.off("new_message");
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
    sendMessage,
    login,
  };
}
