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
        width: type === "open_chat" ? 400 : 70,
        height: type === "open_chat" ? 620 : 70,
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
    <div
      className="w-full h-full flex items-end justify-end"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {isOpen ? (
        <div
          data-testid="chat-widget-container"
          className="w-full h-full flex flex-col overflow-hidden animate-slide-up"
          style={{
            background: "#1a1a1a",
          }}
        >
          <div className="flex-1 flex flex-col min-h-0">
            {user ? (
              <ChatWindow
                messages={messages}
                onSend={sendMessage}
                onContactExecutive={requestContact}
                isConnected={isConnected}
                userName={user.name}
                contactRequested={contactRequested}
                onClose={toggleChat}
              />
            ) : (
              <WelcomeForm onSubmit={(email, name) => login(email, name)} onClose={toggleChat} />
            )}
          </div>
        </div>
      ) : (
        <div className="p-2">
          <Launcher isOpen={isOpen} onClick={toggleChat} hasUnread={hasUnread} />
        </div>
      )}
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
