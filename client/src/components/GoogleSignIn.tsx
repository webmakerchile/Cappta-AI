import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/config/google-client-id")
      .then((r) => r.json())
      .then((data) => {
        if (data.clientId) setClientId(data.clientId);
      })
      .catch(() => {});
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
            toast({ title: "Error", description: data.message || "Error de autenticacion", variant: "destructive" });
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

  if (!clientId) return null;

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
