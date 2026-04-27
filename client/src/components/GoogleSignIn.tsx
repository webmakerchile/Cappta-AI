import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SiGoogle } from "react-icons/si";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (el: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleSignInProps {
  onSuccess: (token: string) => void;
  text?: string;
}

export function GoogleSignIn({ onSuccess, text = "Continuar con Google" }: GoogleSignInProps) {
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/config/google-client-id")
      .then((r) => r.json())
      .then((data) => {
        if (data.clientId) setClientId(data.clientId);
      })
      .catch(() => {})
      .finally(() => setConfigLoaded(true));
  }, []);

  useEffect(() => {
    if (!clientId) return;
    if (document.getElementById("google-gsi-script")) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
  }, [clientId]);

  useEffect(() => {
    if (!scriptLoaded || !clientId || !window.google || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: { credential: string }) => {
        setLoading(true);
        try {
          const res = await fetch("/api/tenants/google-auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential: response.credential }),
          });
          const data = await res.json();
          if (!res.ok) {
            toast({ title: "Error", description: data.message || "Error de autenticación", variant: "destructive" });
            return;
          }
          onSuccess(data.token);
        } catch {
          toast({ title: "Error", description: "No se pudo conectar con el servidor", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      type: "standard",
      theme: "filled_black",
      size: "large",
      text: "continue_with",
      shape: "pill",
      width: buttonRef.current.offsetWidth,
      logo_alignment: "center",
    });
  }, [scriptLoaded, clientId, onSuccess, toast]);

  if (!configLoaded) {
    return (
      <div
        className="w-full h-11 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center gap-2 text-sm text-white/30"
        data-testid="button-google-signin-loading"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando opciones de inicio de sesión...
      </div>
    );
  }

  if (!clientId) {
    return (
      <button
        type="button"
        disabled
        title="El administrador aún no configuró la credencial de Google. Usa tu email para continuar."
        className="w-full h-11 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center gap-2 text-sm text-white/35 cursor-not-allowed"
        data-testid="button-google-signin-unavailable"
      >
        <SiGoogle className="w-4 h-4" />
        Inicio de sesión con Google no disponible
      </button>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 rounded-xl">
          <Loader2 className="w-5 h-5 animate-spin text-white/60" />
        </div>
      )}
      <div ref={buttonRef} className="w-full [&>div]:!w-full [&_iframe]:!w-full" data-testid="button-google-signin" />
    </div>
  );
}
