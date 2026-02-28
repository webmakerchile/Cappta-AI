import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Launcher } from "@/components/Launcher";
import { ChatWindow } from "@/components/ChatWindow";
import { WelcomeForm } from "@/components/WelcomeForm";
import { useChat } from "@/hooks/use-chat";
import { MessageCircle, ArrowLeft, Headphones, Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

const AdminPage = lazy(() => import("@/pages/Admin"));
const LandingPage = lazy(() => import("@/pages/Landing"));
const RegisterPage = lazy(() => import("@/pages/Register"));
const LoginPage = lazy(() => import("@/pages/Login"));
const DashboardPage = lazy(() => import("@/pages/Dashboard"));
const DemoPage = lazy(() => import("@/pages/Demo"));
const GuidesPage = lazy(() => import("@/pages/Guides"));
const TenantPanelPage = lazy(() => import("@/pages/TenantPanel"));

function FullScreenChat() {
  const {
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
  } = useChat();

  const [paramsValid, setParamsValid] = useState<boolean | null>(null);
  const [autoLoginDone, setAutoLoginDone] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    if (autoLoginDone) return;
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    const name = params.get("name") || "Usuario";

    if (email && email.includes("@")) {
      setParamsValid(true);
      if (!user) {
        login(email, name);
      }
      setAutoLoginDone(true);
    } else if (user) {
      setParamsValid(true);
      setAutoLoginDone(true);
    } else {
      setParamsValid(false);
      setAutoLoginDone(true);
    }
  }, [user, login, autoLoginDone]);

  const handleRatingComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/sessions/by-email", user?.email] });
    queryClient.invalidateQueries({ queryKey: ["/api/messages/thread", user?.email] });
  }, [user?.email]);

  if (isLoading || paramsValid === null) {
    return (
      <div
        className="w-full h-screen flex items-center justify-center"
        style={{ background: "#1a1a1a", fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#6200EA]/20 flex items-center justify-center border border-[#6200EA]/30">
            <Headphones className="w-8 h-8 text-[#6200EA]" />
          </div>
          <Loader2 className="w-6 h-6 text-[#6200EA] animate-spin" />
          <p className="text-white/50 text-sm" data-testid="text-loading">Conectando al chat...</p>
        </div>
      </div>
    );
  }

  if (paramsValid === false) {
    return (
      <div
        className="w-full h-screen flex items-center justify-center"
        style={{ background: "#1a1a1a", fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="flex flex-col items-center gap-6 max-w-md px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-[#6200EA]/20 flex items-center justify-center border border-[#6200EA]/30">
            <Headphones className="w-10 h-10 text-[#6200EA]" />
          </div>
          <h1 data-testid="text-invalid-access-title" className="text-xl font-bold text-white">Acceso al Chat</h1>
          <p data-testid="text-invalid-access-message" className="text-white/60 text-sm leading-relaxed">
            Para acceder al chat, utiliza el enlace que recibiste en tu correo electronico. El enlace contiene tus datos de acceso.
          </p>
          <a
            href="https://cjmdigitales.cl/"
            data-testid="link-back-to-store-invalid"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#6200EA] text-white text-sm font-semibold transition-opacity hover:opacity-90"
          >
            <ArrowLeft className="w-4 h-4" />
            Ir a CJM Digitales
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-screen flex flex-col"
      style={{ background: "#1a1a1a", fontFamily: "'DM Sans', sans-serif" }}
      data-testid="fullscreen-chat-container"
    >
      <div
        className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
        style={{ background: "#111111", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-3">
          <img
            src="/cjm-logo.webp"
            alt="CJM Digitales"
            className="w-8 h-8 rounded-full object-cover"
            data-testid="img-cjm-logo"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <span className="text-white font-semibold text-sm" data-testid="text-brand-name">CJM Digitales</span>
        </div>
        <a
          href="https://cjmdigitales.cl/"
          data-testid="link-back-to-store"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#6200EA]/20 border border-[#6200EA]/30 text-[#BB86FC] text-xs font-semibold transition-opacity hover:opacity-80"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Volver a CJM Digitales</span>
          <span className="sm:hidden">Volver</span>
        </a>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {user ? (
          <ChatWindow
            messages={messages}
            sessions={sessions}
            onSend={sendMessage}
            onContactExecutive={requestContact}
            isConnected={isConnected}
            userName={user.name}
            userEmail={user.email}
            contactRequested={contactRequested}
            onClose={() => { window.location.href = "https://cjmdigitales.cl/"; }}
            onExitChat={() => {
              logout();
              window.location.href = "https://cjmdigitales.cl/";
            }}
            sessionId={user.sessionId}
            onRatingComplete={handleRatingComplete}
            onStartNewSession={startNewSession}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#6200EA] animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

function ContactChat() {
  const {
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
  } = useChat();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const handleRatingComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/sessions/by-email", user?.email] });
    queryClient.invalidateQueries({ queryKey: ["/api/messages/thread", user?.email] });
  }, [user?.email]);

  if (isLoading) {
    return (
      <div
        className="w-full h-screen flex items-center justify-center"
        style={{ background: "#1a1a1a", fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#6200EA]/20 flex items-center justify-center border border-[#6200EA]/30">
            <Headphones className="w-8 h-8 text-[#6200EA]" />
          </div>
          <Loader2 className="w-6 h-6 text-[#6200EA] animate-spin" />
          <p className="text-white/50 text-sm">Conectando al chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-screen flex flex-col"
      style={{ background: "#1a1a1a", fontFamily: "'DM Sans', sans-serif" }}
      data-testid="contact-chat-container"
    >
      <div
        className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
        style={{ background: "#111111", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-3">
          <img
            src="/cjm-logo.webp"
            alt="CJM Digitales"
            className="w-8 h-8 rounded-full object-cover"
            data-testid="img-contact-logo"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <span className="text-white font-semibold text-sm" data-testid="text-contact-brand">CJM Digitales - Contacto</span>
        </div>
        <a
          href="https://cjmdigitales.cl/"
          data-testid="link-contact-back"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#6200EA]/20 border border-[#6200EA]/30 text-[#BB86FC] text-xs font-semibold transition-opacity hover:opacity-80"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Volver a CJM Digitales</span>
          <span className="sm:hidden">Volver</span>
        </a>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {user ? (
          <ChatWindow
            messages={messages}
            sessions={sessions}
            onSend={sendMessage}
            onContactExecutive={requestContact}
            isConnected={isConnected}
            userName={user.name}
            userEmail={user.email}
            contactRequested={contactRequested}
            onClose={() => { window.location.href = "https://cjmdigitales.cl/"; }}
            onExitChat={() => {
              logout();
              window.location.href = "https://cjmdigitales.cl/";
            }}
            sessionId={user.sessionId}
            onRatingComplete={handleRatingComplete}
            onStartNewSession={startNewSession}
          />
        ) : (
          <div className="flex-1 flex flex-col">
            <WelcomeForm
              onSubmit={(email, name, problemType, gameName) => login(email, name, problemType, gameName)}
              onClose={() => { window.location.href = "https://cjmdigitales.cl/"; }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface TenantConfig {
  id: number;
  companyName: string;
  widgetColor: string;
  headerTextColor: string;
  botBubbleColor: string;
  botTextColor: string;
  userTextColor: string;
  welcomeMessage: string;
  welcomeSubtitle: string;
  logoUrl: string | null;
  formFields: string | null;
  consultationOptions: string | null;
  showProductSearch: number;
  productSearchLabel: string;
}

function ChatWidget() {
  const params0 = new URLSearchParams(window.location.search);
  const isInlineEmbed = params0.get("embedded") === "inline";
  const [isOpen, setIsOpen] = useState(isInlineEmbed);
  const [hasUnread, setHasUnread] = useState(false);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);

  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tid = params.get("tenantId");
    if (tid) {
      const parsed = parseInt(tid, 10);
      if (!isNaN(parsed)) {
        setTenantId(parsed);
        fetch(`/api/tenants/${parsed}/config`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data) setTenantConfig(data);
            setConfigLoaded(true);
          })
          .catch(() => { setConfigLoaded(true); });
      } else {
        setConfigLoaded(true);
      }
    } else {
      setConfigLoaded(true);
    }
  }, []);

  const {
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
  } = useChat(tenantId);

  const widgetColor = tenantConfig?.widgetColor || undefined;
  const widgetName = tenantConfig?.companyName || undefined;
  const widgetWelcome = tenantConfig?.welcomeMessage || undefined;
  const widgetLogo = tenantConfig?.logoUrl || undefined;
  const widgetSubtitle = tenantConfig?.welcomeSubtitle || undefined;
  const widgetConsultationOptions = tenantConfig?.consultationOptions || undefined;
  const widgetShowProductSearch = tenantConfig?.showProductSearch || 0;
  const widgetProductSearchLabel = tenantConfig?.productSearchLabel || undefined;
  const widgetHeaderTextColor = tenantConfig?.headerTextColor || undefined;
  const widgetBotBubbleColor = tenantConfig?.botBubbleColor || undefined;
  const widgetBotTextColor = tenantConfig?.botTextColor || undefined;
  const widgetUserTextColor = tenantConfig?.userTextColor || undefined;

  const postMessageToParent = useCallback((type: string) => {
    try {
      const isMobile = window.innerWidth <= 480;
      const payload = {
        type,
        width: type === "open_chat" ? (isMobile ? "100%" : 400) : 80,
        height: type === "open_chat" ? (isMobile ? "100%" : 620) : 80,
      };
      window.parent.postMessage(payload, "*");
    } catch {}
  }, []);

  const toggleChat = useCallback(() => {
    if (isInlineEmbed) {
      try { window.parent.postMessage({ type: "foxbot-close" }, window.location.origin); } catch {}
      return;
    }
    setIsOpen((prev) => {
      const next = !prev;
      postMessageToParent(next ? "open_chat" : "close_chat");
      if (next) setHasUnread(false);
      return next;
    });
  }, [postMessageToParent, isInlineEmbed]);

  const handleExitChat = useCallback(() => {
    logout();
  }, [logout]);

  const handleRatingComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/sessions/by-email", user?.email] });
    queryClient.invalidateQueries({ queryKey: ["/api/messages/thread", user?.email] });
  }, [user?.email]);

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

  if (!configLoaded || isLoading) {
    if (!configLoaded) return null;
    return (
      <div className="w-full h-full flex items-end justify-end">
        <div className="p-2">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: widgetColor || "#10b981" }}>
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    );
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
            position: "absolute",
            inset: 0,
            zIndex: 10,
          }}
        >
          <div className="flex-1 flex flex-col min-h-0">
            {user ? (
              <ChatWindow
                messages={messages}
                sessions={sessions}
                onSend={sendMessage}
                onContactExecutive={requestContact}
                isConnected={isConnected}
                userName={user.name}
                userEmail={user.email}
                contactRequested={contactRequested}
                onClose={toggleChat}
                onExitChat={handleExitChat}
                sessionId={user.sessionId}
                onRatingComplete={handleRatingComplete}
                onStartNewSession={startNewSession}
                brandColor={widgetColor}
                brandName={widgetName}
                brandLogo={widgetLogo}
                tenantId={tenantId ?? undefined}
                headerTextColor={widgetHeaderTextColor}
                botBubbleColor={widgetBotBubbleColor}
                botTextColor={widgetBotTextColor}
                userTextColor={widgetUserTextColor}
              />
            ) : (
              <WelcomeForm
                onSubmit={(email, name, problemType, gameName) => login(email, name, problemType, gameName)}
                onClose={toggleChat}
                brandColor={widgetColor}
                brandName={widgetName}
                welcomeMessage={widgetWelcome}
                welcomeSubtitle={widgetSubtitle}
                consultationOptions={widgetConsultationOptions}
                showProductSearch={widgetShowProductSearch}
                productSearchLabel={widgetProductSearchLabel}
                tenantId={tenantId ?? undefined}
                headerTextColor={widgetHeaderTextColor}
              />
            )}
          </div>
        </div>
      ) : isInlineEmbed ? (
        <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a] text-white/40 text-sm">
          Cargando...
        </div>
      ) : (
        <div className="p-1.5">
          <Launcher isOpen={isOpen} onClick={toggleChat} hasUnread={hasUnread} color={widgetColor} />
        </div>
      )}
    </div>
  );
}

const SuspenseLoader = () => (
  <div className="h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  const pathname = window.location.pathname;
  const isAdmin = pathname === "/admin";
  const isChat = pathname === "/chat";
  const isContactChat = pathname === "/chat/contacto";
  const isWidget = pathname === "/widget";
  const isLanding = pathname === "/";
  const isRegister = pathname === "/register";
  const isLogin = pathname === "/login";
  const isDashboard = pathname === "/dashboard";
  const isDemo = pathname === "/demo";
  const isGuides = pathname === "/guias";
  const isPanel = pathname === "/panel";

  const isSaasPage = isLanding || isRegister || isLogin || isDashboard || isDemo || isGuides || isPanel;

  const isFixedLayout = isDashboard || isPanel;

  useEffect(() => {
    if (isSaasPage) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("saas-page");
    } else {
      document.body.classList.remove("saas-page");
    }
    if (isFixedLayout) {
      document.body.classList.add("saas-fixed");
    } else {
      document.body.classList.remove("saas-fixed");
    }
  }, [isSaasPage, isFixedLayout]);

  return (
    <QueryClientProvider client={queryClient}>
      {isAdmin ? (
        <Suspense fallback={<SuspenseLoader />}>
          <AdminPage />
        </Suspense>
      ) : isLanding ? (
        <Suspense fallback={<SuspenseLoader />}>
          <LandingPage />
        </Suspense>
      ) : isRegister ? (
        <Suspense fallback={<SuspenseLoader />}>
          <RegisterPage />
        </Suspense>
      ) : isLogin ? (
        <Suspense fallback={<SuspenseLoader />}>
          <LoginPage />
        </Suspense>
      ) : isDashboard ? (
        <Suspense fallback={<SuspenseLoader />}>
          <DashboardPage />
        </Suspense>
      ) : isDemo ? (
        <Suspense fallback={<SuspenseLoader />}>
          <DemoPage />
        </Suspense>
      ) : isGuides ? (
        <Suspense fallback={<SuspenseLoader />}>
          <GuidesPage />
        </Suspense>
      ) : isPanel ? (
        <Suspense fallback={<SuspenseLoader />}>
          <TenantPanelPage />
        </Suspense>
      ) : isContactChat ? (
        <ContactChat />
      ) : isChat ? (
        <FullScreenChat />
      ) : isWidget ? (
        <ChatWidget />
      ) : (
        <Suspense fallback={<SuspenseLoader />}>
          <LandingPage />
        </Suspense>
      )}
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
