import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings,
  Code,
  BarChart3,
  CreditCard,
  LogOut,
  MessageSquare,
  Users,
  Star,
  Palette,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import type { Tenant } from "@shared/schema";
import logoSinFondo from "@assets/Logo_sin_fondo_1772247619250.png";

type TenantProfile = Omit<Tenant, "passwordHash">;

function useAuth() {
  const token = localStorage.getItem("tenant_token");

  const { data: tenant, isLoading, error } = useQuery<TenantProfile>({
    queryKey: ["/api/tenants/me"],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch("/api/tenants/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
  });

  useEffect(() => {
    if (!token || error) {
      window.location.href = "/login";
    }
  }, [token, error]);

  return { tenant, isLoading, token };
}

function StatsSection({ token }: { token: string }) {
  const { data: statsData, isLoading: statsLoading } = useQuery<{ totalSessions: number; totalMessages: number; avgRating: number | null; activeSessionsCount: number }>({
    queryKey: ["/api/tenants/me/stats"],
    queryFn: async () => {
      const res = await fetch("/api/tenants/me/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const stats = [
    { label: "Sesiones Totales", value: statsLoading ? "..." : String(statsData?.totalSessions || 0), icon: Users, sub: `${statsData?.activeSessionsCount || 0} activas` },
    { label: "Mensajes", value: statsLoading ? "..." : String(statsData?.totalMessages || 0), icon: MessageSquare, sub: "Total enviados" },
    { label: "Satisfaccion", value: statsLoading ? "..." : statsData?.avgRating ? `${statsData.avgRating}/5` : "N/A", icon: Star, sub: statsData?.avgRating ? "Promedio" : "Sin datos" },
    { label: "Sesiones Activas", value: statsLoading ? "..." : String(statsData?.activeSessionsCount || 0), icon: BarChart3, sub: "En curso" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid={`stat-value-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground">{stat.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function WidgetConfigSection({ tenant, token }: { tenant: TenantProfile; token: string }) {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState(tenant.companyName);
  const [widgetColor, setWidgetColor] = useState(tenant.widgetColor);
  const [welcomeMessage, setWelcomeMessage] = useState(tenant.welcomeMessage);
  const [logoUrl, setLogoUrl] = useState(tenant.logoUrl || "");

  useEffect(() => {
    setCompanyName(tenant.companyName);
    setWidgetColor(tenant.widgetColor);
    setWelcomeMessage(tenant.welcomeMessage);
    setLogoUrl(tenant.logoUrl || "");
  }, [tenant]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<TenantProfile>) => {
      const res = await fetch("/api/tenants/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al guardar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants/me"] });
      toast({ title: "Configuración guardada", description: "Los cambios se han aplicado correctamente." });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudieron guardar los cambios.", variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ companyName, widgetColor, welcomeMessage, logoUrl: logoUrl || null });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Configuración del Widget</CardTitle>
        <CardDescription>Personaliza la apariencia de tu chat widget</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Nombre de la Empresa</Label>
          <Input
            id="companyName"
            data-testid="input-company-name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="widgetColor">Color del Widget</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              id="widgetColor"
              data-testid="input-widget-color"
              value={widgetColor}
              onChange={(e) => setWidgetColor(e.target.value)}
              className="h-9 w-12 rounded-md border border-input cursor-pointer"
            />
            <Input
              value={widgetColor}
              onChange={(e) => setWidgetColor(e.target.value)}
              className="max-w-[140px]"
              data-testid="input-widget-color-text"
            />
            <div
              className="h-9 w-9 rounded-md border border-input"
              style={{ backgroundColor: widgetColor }}
              data-testid="widget-color-preview"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="welcomeMessage">Mensaje de Bienvenida</Label>
          <Textarea
            id="welcomeMessage"
            data-testid="input-welcome-message"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            className="resize-none"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="logoUrl">URL del Logo (opcional)</Label>
          <Input
            id="logoUrl"
            data-testid="input-logo-url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://ejemplo.com/logo.png"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          data-testid="button-save-config"
        >
          {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function EmbedCodeSection({ tenant }: { tenant: TenantProfile }) {
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const iframeCode = `<iframe
  src="${baseUrl}/widget?tenantId=${tenant.id}"
  style="position:fixed;bottom:20px;right:20px;width:400px;height:600px;border:none;z-index:9999;"
  allow="microphone"
></iframe>`;

  const scriptCode = `<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${baseUrl}/widget?tenantId=${tenant.id}';
    iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:400px;height:600px;border:none;z-index:9999;';
    iframe.allow = 'microphone';
    document.body.appendChild(iframe);
  })();
</script>`;

  const handleCopy = (code: string, type: string) => {
    navigator.clipboard.writeText(code);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Código de Integración</CardTitle>
        <CardDescription>Copia y pega este código en tu sitio web para agregar el chat</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="iframe">
          <TabsList>
            <TabsTrigger value="iframe" data-testid="tab-iframe">iFrame</TabsTrigger>
            <TabsTrigger value="script" data-testid="tab-script">Script</TabsTrigger>
          </TabsList>
          <TabsContent value="iframe" className="space-y-3">
            <pre className="rounded-md bg-muted p-4 text-xs overflow-x-auto" data-testid="text-iframe-code">
              <code>{iframeCode}</code>
            </pre>
            <Button
              variant="outline"
              onClick={() => handleCopy(iframeCode, "iframe")}
              data-testid="button-copy-iframe"
            >
              {copied === "iframe" ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied === "iframe" ? "Copiado" : "Copiar código"}
            </Button>
          </TabsContent>
          <TabsContent value="script" className="space-y-3">
            <pre className="rounded-md bg-muted p-4 text-xs overflow-x-auto" data-testid="text-script-code">
              <code>{scriptCode}</code>
            </pre>
            <Button
              variant="outline"
              onClick={() => handleCopy(scriptCode, "script")}
              data-testid="button-copy-script"
            >
              {copied === "script" ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied === "script" ? "Copiado" : "Copiar código"}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function PlanSection({ tenant }: { tenant: TenantProfile }) {
  const planLabels: Record<string, string> = {
    free: "Gratis",
    basic: "Pro",
    pro: "Enterprise",
  };

  const planLimits: Record<string, { sessions: string; messages: string; features: string[] }> = {
    free: {
      sessions: "50 / mes",
      messages: "500 / mes",
      features: ["Chat en vivo", "Respuestas automáticas básicas"],
    },
    basic: {
      sessions: "500 / mes",
      messages: "5,000 / mes",
      features: ["Chat en vivo", "IA avanzada", "Catálogo de productos", "Base de conocimiento"],
    },
    pro: {
      sessions: "Ilimitadas",
      messages: "Ilimitados",
      features: ["Todo incluido", "Soporte prioritario", "API personalizada", "Multi-agente"],
    },
  };

  const currentPlan = planLimits[tenant.plan] || planLimits.free;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-lg">Tu Plan</CardTitle>
          <CardDescription>Gestiona tu suscripción</CardDescription>
        </div>
        <Badge variant="secondary" data-testid="badge-plan">
          {planLabels[tenant.plan] || tenant.plan}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Sesiones</p>
            <p className="text-sm font-medium" data-testid="text-plan-sessions">{currentPlan.sessions}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Mensajes</p>
            <p className="text-sm font-medium" data-testid="text-plan-messages">{currentPlan.messages}</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-2">Funcionalidades incluidas</p>
          <ul className="space-y-1">
            {currentPlan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <Check className="h-3 w-3 text-primary" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      {tenant.plan !== "pro" && (
        <CardFooter>
          <Button variant="default" data-testid="button-upgrade-plan">
            <Zap className="mr-2 h-4 w-4" />
            Mejorar Plan
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

type DashboardTab = "stats" | "config" | "embed" | "plan";

const navItems: { title: string; value: DashboardTab; icon: typeof Settings }[] = [
  { title: "Estadísticas", value: "stats", icon: BarChart3 },
  { title: "Configuración", value: "config", icon: Palette },
  { title: "Integración", value: "embed", icon: Code },
  { title: "Plan", value: "plan", icon: CreditCard },
];

export default function Dashboard() {
  const { tenant, isLoading, token } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>("stats");

  const handleLogout = () => {
    localStorage.removeItem("tenant_token");
    window.location.href = "/login";
  };

  if (isLoading || !tenant) {
    return (
      <div className="flex items-center justify-center h-screen" data-testid="dashboard-loading">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>
                <div className="flex items-center gap-2">
                  <img src={logoSinFondo} alt="FoxBot" className="w-5 h-5 object-contain" />
                  <span>{tenant.companyName}</span>
                </div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.value}>
                      <SidebarMenuButton
                        onClick={() => setActiveTab(item.value)}
                        data-active={activeTab === item.value}
                        className="data-[active=true]:bg-sidebar-accent"
                        data-testid={`nav-${item.value}`}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleLogout} data-testid="button-logout">
                      <LogOut />
                      <span>Cerrar Sesión</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-2 p-3 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <h1 className="text-lg font-semibold" data-testid="text-dashboard-title">Dashboard</h1>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground" data-testid="text-tenant-email">{tenant.email}</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
            {activeTab === "stats" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Resumen</h2>
                  <p className="text-sm text-muted-foreground">Métricas de tu chat en tiempo real</p>
                </div>
                <StatsSection token={token!} />
              </div>
            )}
            {activeTab === "config" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Configuración</h2>
                  <p className="text-sm text-muted-foreground">Personaliza tu widget de chat</p>
                </div>
                <WidgetConfigSection tenant={tenant} token={token!} />
              </div>
            )}
            {activeTab === "embed" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Integración</h2>
                  <p className="text-sm text-muted-foreground">Agrega el chat a tu sitio web</p>
                </div>
                <EmbedCodeSection tenant={tenant} />
              </div>
            )}
            {activeTab === "plan" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Plan y Facturación</h2>
                  <p className="text-sm text-muted-foreground">Gestiona tu suscripción</p>
                </div>
                <PlanSection tenant={tenant} />
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
