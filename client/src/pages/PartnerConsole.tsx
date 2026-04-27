import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Users, DollarSign, Link2, LogIn, Download, Copy, History, ExternalLink, Building2, Briefcase, ShieldCheck, Plus, CheckCircle2, PauseCircle } from "lucide-react";

interface PartnerMe {
  partner: {
    id: number;
    slug: string;
    displayName: string;
    contactEmail: string;
    agencyName: string | null;
    country: string | null;
    tier: "embajador" | "certificado";
    commissionPct: number;
    status: "pending" | "active" | "paused";
  };
  tenantsCount: number;
}

interface PartnerTenant {
  id: number;
  name: string;
  email: string;
  companyName: string;
  plan: string;
  currency: string;
  botConfigured: boolean;
  isTrial: boolean;
  onboardingStep: number | null;
  createdAt: string;
  mrrCents: number;
  monthlyConversations: number;
  monthlyMessages: number;
  commissionMonthCents: number;
  health: "saludable" | "riesgo" | "onboarding";
}

interface PartnerCommission {
  id: number;
  partnerId: number;
  tenantId: number;
  periodMonth: string;
  paidAmountCents: number;
  currency: string;
  commissionAmountCents: number;
  commissionPctSnapshot: number;
  ordersCount: number;
  status: "pending" | "approved" | "paid";
  computedAt: string;
  paidAt: string | null;
}

interface ImpersonationRow {
  id: number;
  partnerId: number;
  adminUserId: number | null;
  tenantId: number;
  startedAt: string;
  endedAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

function formatMoney(cents: number, currency: string) {
  const value = cents / 100;
  try {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("es-CL")}`;
  }
}

interface AuthMe {
  id: number;
  email: string;
  role: string;
  displayName: string;
}

interface AdminPartnerRow {
  id: number;
  userId: number;
  slug: string;
  displayName: string;
  contactEmail: string;
  agencyName: string | null;
  country: string | null;
  tier: "embajador" | "certificado";
  commissionPct: number;
  status: "pending" | "active" | "paused";
  notes: string | null;
  approvedAt: string | null;
  createdAt: string;
  tenantsCount: number;
  totalCommissionCents: number;
}

export default function PartnerConsole() {
  const { toast } = useToast();
  const adminToken = localStorage.getItem("admin_token");
  const [tab, setTab] = useState<"tenants" | "commissions" | "audit" | "materiales" | "perfil">("tenants");

  const authMeQuery = useQuery<AuthMe>({
    queryKey: ["/api/auth/me"],
    enabled: !!adminToken,
    retry: false,
  });

  const isSuperadmin = authMeQuery.data?.role === "superadmin";

  const meQuery = useQuery<PartnerMe>({
    queryKey: ["/api/partners/me"],
    enabled: !!adminToken && authMeQuery.data?.role === "partner",
    retry: false,
  });

  const tenantsQuery = useQuery<PartnerTenant[]>({
    queryKey: ["/api/partners/me/tenants"],
    enabled: !!adminToken && !!meQuery.data,
  });

  const commissionsQuery = useQuery<PartnerCommission[]>({
    queryKey: ["/api/partners/me/commissions"],
    enabled: !!adminToken && !!meQuery.data,
  });

  const impersonationsQuery = useQuery<ImpersonationRow[]>({
    queryKey: ["/api/partners/me/impersonations"],
    enabled: !!adminToken && !!meQuery.data && tab === "audit",
  });

  const impersonateMutation = useMutation({
    mutationFn: async (tenantId: number) => {
      const res = await apiRequest("POST", `/api/partners/me/impersonate/${tenantId}`, {});
      return res.json();
    },
    onSuccess: (data: { tenantToken: string; impersonationId: number; tenantId: number; tenantName: string; partnerName: string; expiresAt: string }) => {
      localStorage.setItem("tenant_token", data.tenantToken);
      localStorage.setItem(
        "partner_impersonation",
        JSON.stringify({
          impersonationId: data.impersonationId,
          tenantId: data.tenantId,
          tenantName: data.tenantName,
          partnerName: data.partnerName,
          expiresAt: data.expiresAt,
        }),
      );
      toast({ title: "Sesión iniciada", description: `Ahora estás dentro del panel de ${data.tenantName}. Tu sesión queda registrada.` });
      setTimeout(() => { window.location.href = "/panel"; }, 600);
    },
    onError: (e: Error) => toast({ title: "No se pudo impersonar", description: e.message, variant: "destructive" }),
  });

  const me = meQuery.data;
  const tenants = tenantsQuery.data || [];
  const commissions = commissionsQuery.data || [];
  const impersonations = impersonationsQuery.data || [];

  const totalsByPeriod = useMemo(() => {
    const map = new Map<string, { paid: number; commission: number; currency: string; orders: number; tenants: Set<number> }>();
    for (const c of commissions) {
      const cur = map.get(c.periodMonth) || { paid: 0, commission: 0, currency: c.currency, orders: 0, tenants: new Set<number>() };
      cur.paid += c.paidAmountCents;
      cur.commission += c.commissionAmountCents;
      cur.orders += c.ordersCount;
      cur.tenants.add(c.tenantId);
      cur.currency = c.currency;
      map.set(c.periodMonth, cur);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [commissions]);

  if (!adminToken) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck className="w-12 h-12 text-violet-400 mb-4" />
        <h1 className="text-2xl font-bold mb-2" data-testid="text-partner-needs-login">Inicia sesión como partner</h1>
        <p className="text-muted-foreground mb-6 max-w-md">Esta consola es exclusiva para agencias y consultores certificados de Cappta AI. Si todavía no tenés cuenta, escribinos a partners@cappta.ai.</p>
        <Button onClick={() => { window.location.href = "/admin"; }} data-testid="button-go-to-login">Ir al login</Button>
      </div>
    );
  }

  if (authMeQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (isSuperadmin) {
    return <SuperadminPartnersPanel />;
  }

  if (meQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (meQuery.isError || !me) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold mb-2" data-testid="text-partner-not-found">Acceso denegado</h1>
        <p className="text-muted-foreground mb-6 max-w-md">Tu usuario no está vinculado a ningún partner activo. Si pensás que es un error, contactá a partners@cappta.ai.</p>
        <Button variant="outline" onClick={() => { localStorage.removeItem("admin_token"); window.location.href = "/admin"; }} data-testid="button-logout-partner">Cerrar sesión</Button>
      </div>
    );
  }

  const referralLink = `${window.location.origin}/register?partner=${me.partner.slug}`;
  const totalPaidCommission = commissions.filter((c) => c.status === "paid").reduce((s, c) => s + c.commissionAmountCents, 0);
  const totalPendingCommission = commissions.filter((c) => c.status !== "paid").reduce((s, c) => s + c.commissionAmountCents, 0);
  const baseCurrency = commissions[0]?.currency || tenants[0]?.currency || "CLP";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/40">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold" data-testid="text-partner-display-name">{me.partner.displayName}</h1>
              <p className="text-xs text-muted-foreground">
                Programa Partners · <span className="capitalize">{me.partner.tier}</span> · {me.partner.commissionPct}% de comisión
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={me.partner.status === "active" ? "default" : "secondary"} className="capitalize" data-testid="badge-partner-status">{me.partner.status}</Badge>
            <Button variant="outline" size="sm" onClick={() => { localStorage.removeItem("admin_token"); window.location.href = "/admin"; }} data-testid="button-logout">Cerrar sesión</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card data-testid="card-stat-tenants">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Cuentas en cartera</p>
                <p className="text-3xl font-black mt-1" data-testid="text-stat-tenants">{me.tenantsCount}</p>
              </div>
              <Users className="w-8 h-8 text-violet-400/60" />
            </CardContent>
          </Card>
          <Card data-testid="card-stat-pending">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Comisión pendiente</p>
                <p className="text-3xl font-black mt-1" data-testid="text-stat-pending">{formatMoney(totalPendingCommission, baseCurrency)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-amber-400/60" />
            </CardContent>
          </Card>
          <Card data-testid="card-stat-paid">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Comisión pagada</p>
                <p className="text-3xl font-black mt-1" data-testid="text-stat-paid">{formatMoney(totalPaidCommission, baseCurrency)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-400/60" />
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-referral-link">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Link2 className="w-4 h-4 text-violet-400" /> Tu link de referido</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Input readOnly value={referralLink} data-testid="input-referral-link" className="font-mono text-sm" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => { navigator.clipboard.writeText(referralLink); toast({ title: "Link copiado" }); }}
              data-testid="button-copy-referral"
            >
              <Copy className="w-4 h-4 mr-2" /> Copiar
            </Button>
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="tenants" data-testid="tab-tenants">Mis cuentas</TabsTrigger>
            <TabsTrigger value="commissions" data-testid="tab-commissions">Comisiones</TabsTrigger>
            <TabsTrigger value="audit" data-testid="tab-audit">Mi auditoría</TabsTrigger>
            <TabsTrigger value="materiales" data-testid="tab-materiales">Materiales</TabsTrigger>
            <TabsTrigger value="perfil" data-testid="tab-perfil">Perfil</TabsTrigger>
          </TabsList>

          <TabsContent value="tenants" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                {tenantsQuery.isLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
                ) : tenants.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Aún no tenés cuentas referidas. Compartí tu link para empezar.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/50">
                          <th className="py-3 px-2">Empresa</th>
                          <th className="py-3 px-2">Plan</th>
                          <th className="py-3 px-2 text-right">MRR</th>
                          <th className="py-3 px-2 text-right">Tu comisión / mes</th>
                          <th className="py-3 px-2 text-right">Conversaciones (mes)</th>
                          <th className="py-3 px-2">Salud</th>
                          <th className="py-3 px-2">Alta</th>
                          <th className="py-3 px-2 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenants.map((t) => (
                          <tr key={t.id} className="border-b border-border/30 hover:bg-muted/30" data-testid={`row-tenant-${t.id}`}>
                            <td className="py-3 px-2">
                              <div className="font-medium" data-testid={`text-tenant-name-${t.id}`}>{t.companyName}</div>
                              <div className="text-xs text-muted-foreground">{t.email}</div>
                            </td>
                            <td className="py-3 px-2">
                              <Badge variant="outline" className="capitalize" data-testid={`badge-tenant-plan-${t.id}`}>{t.plan}</Badge>
                              {t.isTrial && <Badge variant="secondary" className="ml-1">trial</Badge>}
                            </td>
                            <td className="py-3 px-2 text-right tabular-nums" data-testid={`text-tenant-mrr-${t.id}`}>
                              {t.mrrCents > 0 ? formatMoney(t.mrrCents, t.currency) : <span className="text-muted-foreground text-xs">—</span>}
                            </td>
                            <td className="py-3 px-2 text-right tabular-nums font-semibold text-violet-400" data-testid={`text-tenant-commission-${t.id}`}>
                              {t.commissionMonthCents > 0 ? formatMoney(t.commissionMonthCents, t.currency) : <span className="text-muted-foreground text-xs font-normal">—</span>}
                            </td>
                            <td className="py-3 px-2 text-right tabular-nums" data-testid={`text-tenant-conversations-${t.id}`}>
                              {t.monthlyConversations.toLocaleString("es-CL")}
                            </td>
                            <td className="py-3 px-2">
                              <Badge
                                variant={t.health === "saludable" ? "default" : t.health === "riesgo" ? "destructive" : "secondary"}
                                data-testid={`badge-tenant-health-${t.id}`}
                                className="capitalize"
                              >
                                {t.health === "saludable" ? "Saludable" : t.health === "riesgo" ? "Riesgo de churn" : "Onboarding"}
                              </Badge>
                            </td>
                            <td className="py-3 px-2 text-muted-foreground">
                              {new Date(t.createdAt).toLocaleDateString("es-CL")}
                            </td>
                            <td className="py-3 px-2 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={impersonateMutation.isPending}
                                onClick={() => impersonateMutation.mutate(t.id)}
                                data-testid={`button-impersonate-${t.id}`}
                              >
                                {impersonateMutation.isPending && impersonateMutation.variables === t.id ? (
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                  <LogIn className="w-3 h-3 mr-1" />
                                )}
                                Entrar al panel
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-xs text-muted-foreground mt-4">
                      MRR refleja el plan activo del cliente; trials suman 0. Cada acceso a un panel queda registrado con fecha, IP y agente, y el cliente puede ver el historial desde su panel.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = `/api/partners/me/commissions.csv`;
                  const token = localStorage.getItem("admin_token") || "";
                  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
                    .then((r) => r.blob())
                    .then((blob) => {
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(blob);
                      a.download = `cappta-partner-${me.partner.slug}-comisiones.csv`;
                      a.click();
                    });
                }}
                data-testid="button-download-csv"
              >
                <Download className="w-4 h-4 mr-2" /> Descargar CSV
              </Button>
            </div>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Resumen por período</CardTitle></CardHeader>
              <CardContent>
                {commissionsQuery.isLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
                ) : totalsByPeriod.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">Aún no hay comisiones acumuladas. El cálculo corre automáticamente cada hora sobre los pagos confirmados de tus cuentas.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/50">
                          <th className="py-3 px-2">Período</th>
                          <th className="py-3 px-2 text-right">Cuentas</th>
                          <th className="py-3 px-2 text-right">Pagado por clientes</th>
                          <th className="py-3 px-2 text-right">Tu comisión</th>
                        </tr>
                      </thead>
                      <tbody>
                        {totalsByPeriod.map(([period, t]) => (
                          <tr key={period} className="border-b border-border/30" data-testid={`row-period-${period}`}>
                            <td className="py-3 px-2 font-medium">{period}</td>
                            <td className="py-3 px-2 text-right">{t.tenants.size}</td>
                            <td className="py-3 px-2 text-right">{formatMoney(t.paid, t.currency)}</td>
                            <td className="py-3 px-2 text-right font-bold text-violet-400">{formatMoney(t.commission, t.currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Detalle por cliente</CardTitle></CardHeader>
              <CardContent>
                {commissions.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground text-sm">Sin movimientos.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/50">
                          <th className="py-2 px-2">Período</th>
                          <th className="py-2 px-2">Tenant</th>
                          <th className="py-2 px-2 text-right">Pagado</th>
                          <th className="py-2 px-2 text-right">% Comisión</th>
                          <th className="py-2 px-2 text-right">Comisión</th>
                          <th className="py-2 px-2">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commissions.map((c) => (
                          <tr key={c.id} className="border-b border-border/20" data-testid={`row-commission-${c.id}`}>
                            <td className="py-2 px-2">{c.periodMonth}</td>
                            <td className="py-2 px-2">#{c.tenantId}</td>
                            <td className="py-2 px-2 text-right">{formatMoney(c.paidAmountCents, c.currency)}</td>
                            <td className="py-2 px-2 text-right">{c.commissionPctSnapshot}%</td>
                            <td className="py-2 px-2 text-right font-semibold">{formatMoney(c.commissionAmountCents, c.currency)}</td>
                            <td className="py-2 px-2">
                              <Badge
                                variant={c.status === "paid" ? "default" : c.status === "approved" ? "secondary" : "outline"}
                                data-testid={`badge-commission-status-${c.id}`}
                              >
                                {c.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><History className="w-4 h-4" /> Historial de accesos a paneles de clientes</CardTitle>
              </CardHeader>
              <CardContent>
                {impersonationsQuery.isLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
                ) : impersonations.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">No hay accesos registrados.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/50">
                          <th className="py-2 px-2">Inicio</th>
                          <th className="py-2 px-2">Fin</th>
                          <th className="py-2 px-2">Tenant</th>
                          <th className="py-2 px-2">IP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {impersonations.map((i) => (
                          <tr key={i.id} className="border-b border-border/20" data-testid={`row-impersonation-${i.id}`}>
                            <td className="py-2 px-2">{new Date(i.startedAt).toLocaleString("es-CL")}</td>
                            <td className="py-2 px-2 text-muted-foreground">{i.endedAt ? new Date(i.endedAt).toLocaleString("es-CL") : "—"}</td>
                            <td className="py-2 px-2">#{i.tenantId}</td>
                            <td className="py-2 px-2 text-muted-foreground font-mono text-xs">{i.ipAddress || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materiales" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Download className="w-4 h-4" /> Materiales de venta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Descargá los recursos para vender Cappta AI a tus clientes. Para versiones a medida (deck por vertical, video demo personalizado), escribinos a <a href="mailto:partners@cappta.ai" className="text-violet-400 underline">partners@cappta.ai</a>.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { title: "Pitch deck Cappta AI", desc: "Presentación general para mostrar a un prospect en 10 minutos. Incluye planes, comisión partner y diferenciales.", href: "/sales-materials/pitch-deck.md", file: "cappta-pitch-deck.md", testid: "card-material-pitch" },
                    { title: "One-pagers por vertical", desc: "Resúmenes específicos por industria: retail, salud, educación, profesionales independientes y agencias.", href: "/sales-materials/one-pagers.md", file: "cappta-one-pagers.md", testid: "card-material-onepager" },
                    { title: "Casos de éxito", desc: "Cuatro casos reales con métricas: % de mensajes contestados, no-show, leads calificados y conversión.", href: "/sales-materials/casos-exito.md", file: "cappta-casos-exito.md", testid: "card-material-cases" },
                    { title: "Script de demo + 12 objeciones", desc: "Guion paso a paso para una demo de 15 minutos y respuestas listas para las 12 objeciones más comunes.", href: "/sales-materials/script-demo.md", file: "cappta-script-demo.md", testid: "card-material-script" },
                  ].map((item) => (
                    <a
                      key={item.title}
                      href={item.href}
                      download={item.file}
                      className="block p-4 border border-border/50 rounded-lg hover:border-violet-400/40 hover:bg-violet-500/5 transition"
                      data-testid={item.testid}
                    >
                      <div className="font-medium text-sm flex items-center gap-2">
                        <Download className="w-4 h-4 text-violet-400" /> {item.title}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                      <p className="text-xs text-violet-400 mt-2">Descargar (.md) →</p>
                    </a>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground pt-2">
                  Los materiales se entregan en Markdown editable para que los puedas adaptar a la marca de tu agencia o traducirlos. Si preferís PDF, abrí el archivo, copiá el contenido y exportalo desde tu editor favorito.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="perfil" className="mt-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Datos del partner</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Nombre público</p>
                    <p className="font-medium" data-testid="text-perfil-display">{me.partner.displayName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Slug (para tu link)</p>
                    <p className="font-mono" data-testid="text-perfil-slug">{me.partner.slug}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Agencia</p>
                    <p data-testid="text-perfil-agency">{me.partner.agencyName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">País</p>
                    <p data-testid="text-perfil-country">{me.partner.country || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Email de contacto</p>
                    <p data-testid="text-perfil-contact">{me.partner.contactEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Comisión</p>
                    <p data-testid="text-perfil-commission">{me.partner.commissionPct}%</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Para cambiar tus datos, escribinos a <a href="mailto:partners@cappta.ai" className="text-violet-400 underline">partners@cappta.ai</a>.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center text-xs text-muted-foreground pt-6">
          <a href="/" className="hover:text-foreground inline-flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> Volver al sitio público
          </a>
        </div>
      </main>
    </div>
  );
}

function SuperadminPartnersPanel() {
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: "",
    slug: "",
    agencyName: "",
    country: "Chile",
    tier: "embajador" as "embajador" | "certificado",
    commissionPct: 20,
  });

  const partnersQuery = useQuery<AdminPartnerRow[]>({
    queryKey: ["/api/admin/partners"],
    retry: false,
  });

  const createMut = useMutation({
    mutationFn: async (payload: typeof form) => {
      const res = await apiRequest("POST", "/api/admin/partners", payload);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Partner creado" });
      setShowCreate(false);
      setForm({ email: "", password: "", displayName: "", slug: "", agencyName: "", country: "Chile", tier: "embajador", commissionPct: 20 });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
    },
    onError: (err: any) => {
      toast({ title: "Error al crear partner", description: err?.message || "Intentá de nuevo", variant: "destructive" });
    },
  });

  const updateStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/partners/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Estado actualizado" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
    },
  });

  const partners = partnersQuery.data || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/50 bg-card/40 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="font-bold text-lg" data-testid="text-admin-partners-title">Programa Partners</h1>
              <p className="text-xs text-muted-foreground">Vista superadmin · Web Maker Chile</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreate((v) => !v)}
            className="bg-violet-600 hover:bg-violet-700"
            data-testid="button-toggle-create-partner"
          >
            <Plus className="w-4 h-4 mr-1" /> Nuevo partner
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {showCreate && (
          <Card>
            <CardHeader>
              <CardTitle>Alta de partner</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="input-partner-email" />
              </div>
              <div>
                <Label>Contraseña inicial</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="input-partner-password" />
              </div>
              <div>
                <Label>Nombre del responsable</Label>
                <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} data-testid="input-partner-display-name" />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })} placeholder="agencia-acme" data-testid="input-partner-slug" />
              </div>
              <div>
                <Label>Nombre de la agencia</Label>
                <Input value={form.agencyName} onChange={(e) => setForm({ ...form, agencyName: e.target.value })} data-testid="input-partner-agency" />
              </div>
              <div>
                <Label>País</Label>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} data-testid="input-partner-country" />
              </div>
              <div>
                <Label>Tier</Label>
                <Select value={form.tier} onValueChange={(v: "embajador" | "certificado") => setForm({ ...form, tier: v, commissionPct: v === "certificado" ? 30 : 20 })}>
                  <SelectTrigger data-testid="select-partner-tier"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="embajador">Embajador (20%)</SelectItem>
                    <SelectItem value="certificado">Certificado (30%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Comisión %</Label>
                <Input type="number" min={0} max={100} value={form.commissionPct} onChange={(e) => setForm({ ...form, commissionPct: Number(e.target.value) })} data-testid="input-partner-commission-pct" />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowCreate(false)} data-testid="button-cancel-create-partner">Cancelar</Button>
                <Button
                  className="bg-violet-600 hover:bg-violet-700"
                  onClick={() => createMut.mutate(form)}
                  disabled={createMut.isPending || !form.email || !form.password || !form.slug || !form.displayName}
                  data-testid="button-submit-create-partner"
                >
                  {createMut.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Crear
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-violet-400" /> Partners ({partners.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {partnersQuery.isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-violet-400" /></div>
            ) : partners.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Todavía no hay partners. Creá el primero.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted-foreground uppercase border-b border-border/50">
                    <tr>
                      <th className="py-2 pr-3">Partner</th>
                      <th className="py-2 pr-3">Slug</th>
                      <th className="py-2 pr-3">Tier</th>
                      <th className="py-2 pr-3">%</th>
                      <th className="py-2 pr-3">Tenants</th>
                      <th className="py-2 pr-3">Comisión total</th>
                      <th className="py-2 pr-3">Estado</th>
                      <th className="py-2 pr-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((p) => (
                      <tr key={p.id} className="border-b border-border/30" data-testid={`row-partner-${p.id}`}>
                        <td className="py-2 pr-3">
                          <div className="font-medium" data-testid={`text-partner-name-${p.id}`}>{p.displayName}</div>
                          <div className="text-xs text-muted-foreground">{p.contactEmail}</div>
                        </td>
                        <td className="py-2 pr-3 font-mono text-xs">{p.slug}</td>
                        <td className="py-2 pr-3 capitalize">{p.tier}</td>
                        <td className="py-2 pr-3">{p.commissionPct}%</td>
                        <td className="py-2 pr-3" data-testid={`text-partner-tenants-${p.id}`}>{p.tenantsCount}</td>
                        <td className="py-2 pr-3 tabular-nums">{(p.totalCommissionCents / 100).toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })}</td>
                        <td className="py-2 pr-3">
                          <Badge variant={p.status === "active" ? "default" : p.status === "paused" ? "secondary" : "outline"} data-testid={`badge-partner-status-${p.id}`}>
                            {p.status}
                          </Badge>
                        </td>
                        <td className="py-2 pr-3">
                          <div className="flex gap-1">
                            {p.status !== "active" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatusMut.mutate({ id: p.id, status: "active" })}
                                disabled={updateStatusMut.isPending}
                                data-testid={`button-activate-partner-${p.id}`}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                              </Button>
                            )}
                            {p.status === "active" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatusMut.mutate({ id: p.id, status: "paused" })}
                                disabled={updateStatusMut.isPending}
                                data-testid={`button-pause-partner-${p.id}`}
                              >
                                <PauseCircle className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground pt-2">
          <a href="/admin" className="hover:text-foreground inline-flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> Volver al panel
          </a>
        </div>
      </main>
    </div>
  );
}
