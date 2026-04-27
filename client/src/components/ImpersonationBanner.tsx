import { useEffect, useState } from "react";
import { LogOut, Eye } from "lucide-react";

interface ImpersonationMeta {
  impersonationId: number;
  tenantId: number;
  tenantName: string;
  partnerName: string;
  expiresAt: string;
}

function readMeta(): ImpersonationMeta | null {
  try {
    const raw = localStorage.getItem("partner_impersonation");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ImpersonationMeta;
    if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
      localStorage.removeItem("partner_impersonation");
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function ImpersonationBanner() {
  const [meta, setMeta] = useState<ImpersonationMeta | null>(() => readMeta());

  useEffect(() => {
    const handler = () => setMeta(readMeta());
    window.addEventListener("storage", handler);
    const interval = setInterval(handler, 30000);
    return () => {
      window.removeEventListener("storage", handler);
      clearInterval(interval);
    };
  }, []);

  if (!meta) return null;

  const handleExit = async () => {
    const adminToken = localStorage.getItem("admin_token");
    try {
      if (adminToken) {
        await fetch(`/api/partners/me/impersonate/${meta.impersonationId}/end`, {
          method: "POST",
          headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        });
      }
    } catch {}
    localStorage.removeItem("partner_impersonation");
    localStorage.removeItem("tenant_token");
    window.location.href = "/partners";
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-amber-950 shadow-lg"
      data-testid="banner-impersonation"
      style={{ borderBottom: "2px solid rgba(0,0,0,0.15)" }}
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="w-4 h-4 shrink-0" />
          <span className="font-semibold shrink-0">Modo partner</span>
          <span className="truncate" data-testid="text-impersonation-info">
            {meta.partnerName} viendo el panel de <strong>{meta.tenantName}</strong>. Esta acción queda registrada.
          </span>
        </div>
        <button
          onClick={handleExit}
          className="shrink-0 inline-flex items-center gap-1.5 bg-amber-950 text-amber-50 hover:bg-amber-900 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
          data-testid="button-exit-impersonation"
        >
          <LogOut className="w-3 h-3" /> Salir de impersonación
        </button>
      </div>
    </div>
  );
}
