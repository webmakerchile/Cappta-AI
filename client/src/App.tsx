import { useState, useEffect, useCallback } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Launcher } from "@/components/Launcher";
import { ChatWindow } from "@/components/ChatWindow";
import { WelcomeForm } from "@/components/WelcomeForm";
import { useChat } from "@/hooks/use-chat";

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const {
    user,
    messages,
    isConnected,
    isLoading,
    contactRequested,
    sendMessage,
    requestContact,
    login,
  } = useChat();

  const postMessageToParent = useCallback((type: string) => {
    try {
      const payload = {
        type,
        width: type === "open_chat" ? 390 : 70,
        height: type === "open_chat" ? 600 : 70,
      };
      window.parent.postMessage(payload, "*");
    } catch {}
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      postMessageToParent(next ? "open_chat" : "close_chat");
      if (next) setHasUnread(false);
      return next;
    });
  }, [postMessageToParent]);

  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.sender === "support") {
        setHasUnread(true);
      }
    }
  }, [messages, isOpen]);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {isOpen && (
        <div
          data-testid="chat-widget-container"
          className="
            pointer-events-auto
            fixed bottom-24 right-5
            w-[370px] h-[520px]
            rounded-md overflow-hidden
            animate-slide-up
            flex flex-col
          "
          style={{
            background: "linear-gradient(180deg, #1e1e1e 0%, #1a1a1a 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(98,0,234,0.15)",
          }}
        >
          {user ? (
            <ChatWindow
              messages={messages}
              onSend={sendMessage}
              onContactExecutive={requestContact}
              isConnected={isConnected}
              userName={user.name}
              contactRequested={contactRequested}
            />
          ) : (
            <WelcomeForm onSubmit={(email, name) => login(email, name)} />
          )}
        </div>
      )}

      <div className="pointer-events-auto">
        <Launcher isOpen={isOpen} onClick={toggleChat} hasUnread={hasUnread} />
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatWidget />
    </QueryClientProvider>
  );
}

export default App;
