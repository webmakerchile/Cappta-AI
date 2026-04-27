import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Clock, XCircle, ArrowLeft, Loader2 } from "lucide-react";

export default function PagoResultado() {
  const linkId = useMemo(() => {
    const m = window.location.pathname.match(/^\/pago-resultado\/(\d+)$/);
    return m ? parseInt(m[1]) : 0;
  }, []);
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const token = params.get("token") || "";

  useEffect(() => { document.documentElement.classList.add("dark"); }, []);

  const { data: link, isLoading } = useQuery<any>({
    queryKey: ["/api/connect/public/payment-link", linkId, token],
    queryFn: async () => {
      const url = token
        ? `/api/connect/public/payment-link/${linkId}?token=${encodeURIComponent(token)}`
        : `/api/connect/public/payment-link/${linkId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("not found");
      return res.json();
    },
    enabled: linkId > 0,
    refetchInterval: (query) => (query.state.data?.status === "pending" ? 5000 : false),
  });

  // Trust ONLY backend status (authoritative). URL query params are ignored to prevent spoofing.
  const isPaid = link?.status === "paid";
  const isFailed = link?.status === "cancelled" || link?.status === "expired";
  const isPending = !isPaid && !isFailed;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-white p-6">
      <div className="max-w-md w-full rounded-2xl glass-card p-8 text-center">
        {isLoading ? (
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
        ) : isPaid ? (
          <>
            <Check className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2" data-testid="text-payment-success">¡Pago confirmado!</h1>
            <p className="text-white/60 mb-2">{link?.description}</p>
            <p className="text-3xl font-bold text-emerald-400 mb-4">${link?.amount?.toLocaleString("es-CL")} CLP</p>
            <p className="text-xs text-white/40">{link?.tenantName}</p>
          </>
        ) : isFailed ? (
          <>
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2" data-testid="text-payment-failed">Pago no procesado</h1>
            <p className="text-white/60 mb-4">El pago fue rechazado o cancelado. Contacta al comercio para más información.</p>
          </>
        ) : (
          <>
            <Clock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2" data-testid="text-payment-pending">Pago en proceso</h1>
            <p className="text-white/60 mb-2">{link?.description}</p>
            <p className="text-3xl font-bold mb-4">${link?.amount?.toLocaleString("es-CL")} CLP</p>
            <p className="text-xs text-white/40">Estamos verificando tu pago. Esta página se actualizará automáticamente.</p>
          </>
        )}
        <a href="/" className="inline-flex items-center gap-2 text-primary hover:underline text-sm mt-6" data-testid="link-back-home">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </a>
      </div>
    </div>
  );
}
