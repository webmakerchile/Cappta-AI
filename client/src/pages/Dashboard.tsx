import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ArrowRight,
  Activity,
  TrendingUp,
  Bot,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  AlertTriangle,
  CircleCheck,
  Eye,
  Search,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { GuidesPanel } from "./Guides";
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

function AnimatedCounter({ value, color }: { value: string; color: string }) {
  const [displayed, setDisplayed] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value;
      setDisplayed(value);
    }
  }, [value]);

  return (
    <p
      className="text-3xl font-black mb-1 animate-value-count"
      style={{ color }}
      key={displayed}
    >
      {displayed}
    </p>
  );
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
    {
      label: "Sesiones Totales",
      value: statsLoading ? "..." : String(statsData?.totalSessions || 0),
      icon: Users,
      sub: `${statsData?.activeSessionsCount || 0} activas`,
      color: "hsl(142, 72%, 40%)",
      trend: "+12%",
      glowClass: "glass-card-glow-green",
    },
    {
      label: "Mensajes",
      value: statsLoading ? "..." : String(statsData?.totalMessages || 0),
      icon: MessageSquare,
      sub: "Total enviados",
      color: "hsl(142, 60%, 50%)",
      trend: "+8%",
      glowClass: "glass-card-glow-green",
    },
    {
      label: "Satisfaccion",
      value: statsLoading ? "..." : statsData?.avgRating ? `${statsData.avgRating}/5` : "N/A",
      icon: Star,
      sub: statsData?.avgRating ? "Promedio" : "Sin datos",
      color: "hsl(30, 90%, 52%)",
      trend: null,
      glowClass: "glass-card-glow-orange",
    },
    {
      label: "Sesiones Activas",
      value: statsLoading ? "..." : String(statsData?.activeSessionsCount || 0),
      icon: Activity,
      sub: "En curso",
      color: "hsl(30, 80%, 45%)",
      trend: null,
      glowClass: "glass-card-glow-orange",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={`rounded-2xl glass-card ${stat.glowClass} p-5 transition-all duration-300 animate-dash-fade-up dash-stagger-${i + 1} relative overflow-hidden group cursor-default`}
          data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}
        >
          <div className="absolute inset-0 animate-shimmer-line rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)` }} />

          <div className="relative flex items-center justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center animate-icon-pop dash-stagger-${i + 2} transition-transform duration-300 group-hover:scale-110`} style={{ backgroundColor: `${stat.color}15` }}>
              <stat.icon className="w-5 h-5 transition-all duration-300 group-hover:drop-shadow-lg" style={{ color: stat.color }} />
            </div>
            {stat.trend && (
              <span className="text-xs font-semibold flex items-center gap-0.5 px-2 py-1 rounded-lg bg-white/[0.04] animate-dash-fade-in dash-stagger-4" style={{ color: stat.color }}>
                <TrendingUp className="w-3 h-3" />
                {stat.trend}
              </span>
            )}
          </div>

          <div className="relative" data-testid={`stat-value-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <AnimatedCounter value={stat.value} color={stat.color} />
          </div>
          <p className="text-sm font-medium text-white/60 relative">{stat.label}</p>
          <p className="text-xs text-white/30 mt-0.5 relative">{stat.sub}</p>
        </div>
      ))}
    </div>
  );
}

function WidgetConfigSection({ tenant, token }: { tenant: TenantProfile; token: string }) {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState(tenant.companyName);
  const [widgetColor, setWidgetColor] = useState(tenant.widgetColor);
  const [welcomeMessage, setWelcomeMessage] = useState(tenant.welcomeMessage);
  const [welcomeSubtitle, setWelcomeSubtitle] = useState(tenant.welcomeSubtitle || "Completa tus datos para iniciar la conversacion");
  const [logoUrl, setLogoUrl] = useState(tenant.logoUrl || "");
  const [showProductSearch, setShowProductSearch] = useState(tenant.showProductSearch === 1);
  const [productSearchLabel, setProductSearchLabel] = useState(tenant.productSearchLabel || "Buscar producto");
  const [saved, setSaved] = useState(false);

  const [consultationOptions, setConsultationOptions] = useState<{ value: string; label: string }[]>(() => {
    try {
      return tenant.consultationOptions ? JSON.parse(tenant.consultationOptions) : [];
    } catch { return []; }
  });
  const [newOption, setNewOption] = useState("");

  useEffect(() => {
    setCompanyName(tenant.companyName);
    setWidgetColor(tenant.widgetColor);
    setWelcomeMessage(tenant.welcomeMessage);
    setWelcomeSubtitle(tenant.welcomeSubtitle || "Completa tus datos para iniciar la conversacion");
    setLogoUrl(tenant.logoUrl || "");
    setShowProductSearch(tenant.showProductSearch === 1);
    setProductSearchLabel(tenant.productSearchLabel || "Buscar producto");
    try {
      setConsultationOptions(tenant.consultationOptions ? JSON.parse(tenant.consultationOptions) : []);
    } catch { setConsultationOptions([]); }
  }, [tenant]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
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
      toast({ title: "Configuracion guardada", description: "Los cambios se han aplicado correctamente." });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudieron guardar los cambios.", variant: "destructive" });
    },
  });

  const addOption = () => {
    const label = newOption.trim();
    if (!label) return;
    const value = label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (consultationOptions.some((o) => o.value === value)) return;
    setConsultationOptions([...consultationOptions, { value, label }]);
    setNewOption("");
  };

  const removeOption = (value: string) => {
    setConsultationOptions(consultationOptions.filter((o) => o.value !== value));
  };

  const isConfigComplete = companyName.trim().length > 0 && widgetColor.trim().length > 0;

  const handleSave = () => {
    const data: any = {
      companyName,
      widgetColor,
      welcomeMessage,
      welcomeSubtitle,
      logoUrl: logoUrl || null,
      consultationOptions: consultationOptions.length > 0 ? JSON.stringify(consultationOptions) : null,
      showProductSearch: showProductSearch ? 1 : 0,
      productSearchLabel,
      botConfigured: isConfigComplete ? 1 : 0,
    };
    updateMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl glass-card p-6 space-y-6 animate-dash-scale-in relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full animate-orb-drift opacity-30" style={{ background: `radial-gradient(circle, ${widgetColor}10, transparent 60%)` }} />

        <div className="relative">
          <h3 className="text-lg font-bold mb-1 animate-dash-slide-right flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Apariencia del Widget
          </h3>
          <p className="text-sm text-white/40 animate-dash-slide-right dash-stagger-1">Color, logo y textos de tu chatbot</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          <div className="space-y-2 animate-dash-fade-up dash-stagger-1">
            <label className="text-sm font-medium text-white/60">Nombre de la Empresa</label>
            <Input
              data-testid="input-company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Mi Empresa"
              className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40 transition-all duration-300 focus:shadow-[0_0_16px_rgba(16,185,129,0.1)]"
            />
          </div>

          <div className="space-y-2 animate-dash-fade-up dash-stagger-2">
            <label className="text-sm font-medium text-white/60">Color del Widget</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                data-testid="input-widget-color"
                value={widgetColor}
                onChange={(e) => setWidgetColor(e.target.value)}
                className="h-11 w-14 rounded-xl border border-white/[0.08] cursor-pointer bg-transparent transition-transform duration-200 hover:scale-105"
              />
              <Input
                value={widgetColor}
                onChange={(e) => setWidgetColor(e.target.value)}
                className="max-w-[140px] h-11 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40 font-mono text-sm transition-all duration-300 focus:shadow-[0_0_16px_rgba(16,185,129,0.1)]"
                data-testid="input-widget-color-text"
              />
              <div
                className="h-11 w-11 rounded-xl border border-white/[0.08] shrink-0 transition-all duration-500 hover:scale-110 hover:shadow-lg"
                style={{ backgroundColor: widgetColor, boxShadow: `0 4px 20px ${widgetColor}30` }}
                data-testid="widget-color-preview"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 animate-dash-fade-up dash-stagger-3 relative">
          <label className="text-sm font-medium text-white/60">Mensaje de Bienvenida</label>
          <Input
            data-testid="input-welcome-message"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="Hola, ¿en que podemos ayudarte?"
            className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40 transition-all duration-300 focus:shadow-[0_0_16px_rgba(16,185,129,0.1)]"
          />
        </div>

        <div className="space-y-2 animate-dash-fade-up dash-stagger-4 relative">
          <label className="text-sm font-medium text-white/60">Subtitulo (texto bajo el mensaje)</label>
          <Input
            data-testid="input-welcome-subtitle"
            value={welcomeSubtitle}
            onChange={(e) => setWelcomeSubtitle(e.target.value)}
            placeholder="Completa tus datos para iniciar la conversacion"
            className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40 transition-all duration-300 focus:shadow-[0_0_16px_rgba(16,185,129,0.1)]"
          />
        </div>

        <div className="space-y-2 animate-dash-fade-up dash-stagger-4 relative">
          <label className="text-sm font-medium text-white/60">URL del Logo (opcional)</label>
          <div className="flex items-center gap-3">
            <Input
              data-testid="input-logo-url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://ejemplo.com/logo.png"
              className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40 transition-all duration-300 focus:shadow-[0_0_16px_rgba(16,185,129,0.1)]"
            />
            {logoUrl && (
              <img src={logoUrl} alt="Preview" className="h-11 w-11 rounded-xl object-cover border border-white/[0.08] animate-dash-scale-in" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl glass-card p-6 space-y-6 animate-dash-scale-in relative overflow-hidden">
        <div className="relative">
          <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Opciones de Consulta
          </h3>
          <p className="text-sm text-white/40">Define las opciones que veran tus clientes al iniciar el chat (opcional)</p>
        </div>

        <div className="space-y-3">
          {consultationOptions.map((opt, i) => (
            <div key={opt.value} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]" data-testid={`consultation-option-${i}`}>
              <span className="flex-1 text-sm text-white/80">{opt.label}</span>
              <button
                onClick={() => removeOption(opt.value)}
                className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                data-testid={`button-remove-option-${i}`}
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-3">
            <Input
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              placeholder="Ej: Quiero una cotizacion"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
              className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40 transition-all duration-300"
              data-testid="input-new-option"
            />
            <Button
              onClick={addOption}
              variant="outline"
              className="h-11 rounded-xl border-white/[0.08] hover:border-primary/30 shrink-0"
              data-testid="button-add-option"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </div>
          <p className="text-xs text-white/30">Si no agregas opciones, el formulario solo pedira nombre y correo.</p>
        </div>
      </div>

      <div className="rounded-2xl glass-card p-6 space-y-6 animate-dash-scale-in relative overflow-hidden">
        <div className="relative">
          <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Buscador de Productos
          </h3>
          <p className="text-sm text-white/40">Activa el buscador de productos en tu formulario de bienvenida</p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div>
            <p className="text-sm font-medium text-white/80">Mostrar buscador de productos</p>
            <p className="text-xs text-white/40 mt-0.5">Permite a los clientes buscar productos antes de chatear</p>
          </div>
          <Switch
            checked={showProductSearch}
            onCheckedChange={setShowProductSearch}
            data-testid="switch-product-search"
          />
        </div>

        {showProductSearch && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Etiqueta del buscador</label>
            <Input
              value={productSearchLabel}
              onChange={(e) => setProductSearchLabel(e.target.value)}
              placeholder="Buscar producto..."
              className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40 transition-all duration-300"
              data-testid="input-product-search-label"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2 animate-dash-fade-up relative">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className={`rounded-xl px-6 h-11 font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20 ${saved ? "bg-green-600 hover:bg-green-600" : ""}`}
          data-testid="button-save-config"
        >
          {saved ? (
            <span className="flex items-center gap-2 animate-dash-scale-in">
              <Check className="w-4 h-4" />
              Guardado!
            </span>
          ) : updateMutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Guardando...
            </span>
          ) : "Guardar Configuracion"}
        </Button>
        <div
          className="h-11 w-11 rounded-xl border border-white/[0.08] flex items-center justify-center transition-all duration-500 hover:scale-110 animate-float"
          style={{ backgroundColor: widgetColor, boxShadow: `0 4px 20px ${widgetColor}25` }}
        >
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function EmbedCodeSection({ tenant }: { tenant: TenantProfile }) {
  const [copied, setCopied] = useState<string | null>(null);
  const isConfigured = tenant.botConfigured === 1;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const iframeCode = `<iframe
  src="${baseUrl}/widget?tenantId=${tenant.id}"
  style="position:fixed;bottom:0;right:0;width:100%;max-width:400px;height:620px;border:none;z-index:9999;border-radius:16px 16px 0 0;"
  allow="microphone"
></iframe>`;

  const scriptCode = `<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${baseUrl}/widget?tenantId=${tenant.id}';
    iframe.allow = 'microphone';
    function adjustSize() {
      var w = window.innerWidth;
      if (w <= 480) {
        iframe.style.cssText = 'position:fixed;bottom:0;right:0;width:100%;height:100%;border:none;z-index:9999;';
      } else {
        iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:400px;height:620px;border:none;z-index:9999;border-radius:16px;';
      }
    }
    adjustSize();
    window.addEventListener('resize', adjustSize);
    document.body.appendChild(iframe);
  })();
</script>`;

  const handleCopy = (code: string, type: string) => {
    navigator.clipboard.writeText(code);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isConfigured) {
    return (
      <div className="rounded-2xl glass-card p-8 space-y-4 animate-dash-scale-in relative overflow-hidden text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto border border-amber-500/20">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="text-lg font-bold">Configura tu bot primero</h3>
        <p className="text-sm text-white/50 max-w-md mx-auto">
          Antes de obtener el codigo de integracion, debes configurar tu chatbot en la seccion de Configuracion. Define el nombre de tu empresa, color, mensaje de bienvenida y opciones de consulta.
        </p>
        <p className="text-xs text-white/30">
          Ve a Configuracion → completa los datos → guarda → vuelve aqui para obtener tu codigo.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl glass-card p-6 space-y-6 animate-dash-scale-in relative overflow-hidden">
      <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full animate-orb-drift" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.04), transparent 60%)", animationDelay: "-7s" }} />

      <div className="relative flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold mb-1 animate-dash-slide-right">Codigo de Integracion</h3>
          <p className="text-sm text-white/40 animate-dash-slide-right dash-stagger-1">Copia y pega este codigo en tu sitio web</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
          <CircleCheck className="w-4 h-4 text-green-400" />
          <span className="text-xs text-green-400">Bot configurado</span>
        </div>
      </div>

      <Tabs defaultValue="iframe" className="relative">
        <TabsList className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 animate-dash-fade-up dash-stagger-1">
          <TabsTrigger value="iframe" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200" data-testid="tab-iframe">iFrame</TabsTrigger>
          <TabsTrigger value="script" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200" data-testid="tab-script">Script</TabsTrigger>
        </TabsList>
        <TabsContent value="iframe" className="space-y-4 mt-4 animate-dash-fade-up">
          <pre className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-xs overflow-x-auto text-white/60 font-mono transition-all duration-300 hover:border-primary/20 hover:bg-white/[0.04]" data-testid="text-iframe-code">
            <code>{iframeCode}</code>
          </pre>
          <Button
            variant="outline"
            onClick={() => handleCopy(iframeCode, "iframe")}
            className="rounded-xl border-white/[0.08] hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.02]"
            data-testid="button-copy-iframe"
          >
            {copied === "iframe" ? <Check className="mr-2 h-4 w-4 text-primary animate-icon-pop" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied === "iframe" ? "Copiado!" : "Copiar codigo"}
          </Button>
        </TabsContent>
        <TabsContent value="script" className="space-y-4 mt-4 animate-dash-fade-up">
          <pre className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-xs overflow-x-auto text-white/60 font-mono transition-all duration-300 hover:border-primary/20 hover:bg-white/[0.04]" data-testid="text-script-code">
            <code>{scriptCode}</code>
          </pre>
          <Button
            variant="outline"
            onClick={() => handleCopy(scriptCode, "script")}
            className="rounded-xl border-white/[0.08] hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.02]"
            data-testid="button-copy-script"
          >
            {copied === "script" ? <Check className="mr-2 h-4 w-4 text-primary animate-icon-pop" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied === "script" ? "Copiado!" : "Copiar codigo"}
          </Button>
        </TabsContent>
      </Tabs>

      <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 flex items-start gap-3 animate-dash-fade-up dash-stagger-3 transition-all duration-300 hover:bg-primary/8 hover:border-primary/20 group">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-white/70 mb-1">Compatible con cualquier plataforma</p>
          <p className="text-xs text-white/40">WordPress, WooCommerce, Shopify, Magento, o cualquier sitio web que permita HTML personalizado.</p>
        </div>
      </div>
    </div>
  );
}

function PlanSection({ tenant }: { tenant: TenantProfile }) {
  const { toast } = useToast();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const planLabels: Record<string, string> = { free: "Gratis", basic: "Pro", pro: "Enterprise" };
  const planPrices: Record<string, string> = { free: "$0", basic: "$19.990", pro: "$49.990" };
  const planColors: Record<string, string> = { free: "#6b7280", basic: "hsl(142, 72%, 40%)", pro: "hsl(30, 90%, 52%)" };

  const planLimits: Record<string, { sessions: string; messages: string; features: string[] }> = {
    free: {
      sessions: "50 / mes",
      messages: "500 / mes",
      features: ["Chat en vivo", "Respuestas automaticas basicas", "Widget personalizable"],
    },
    basic: {
      sessions: "500 / mes",
      messages: "5.000 / mes",
      features: ["Chat en vivo", "IA avanzada con GPT", "Catalogo de productos", "Base de conocimiento", "Analiticas completas"],
    },
    pro: {
      sessions: "Ilimitadas",
      messages: "Ilimitados",
      features: ["Todo incluido", "Soporte 24/7 dedicado", "API personalizada", "Multi-agente", "Onboarding personalizado"],
    },
  };

  const currentPlan = planLimits[tenant.plan] || planLimits.free;
  const currentColor = planColors[tenant.plan] || planColors.free;

  const handleUpgrade = async (targetPlan: string) => {
    setUpgrading(targetPlan);
    try {
      const token = localStorage.getItem("tenant_token");
      const res = await fetch("/api/tenants/me/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: targetPlan }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.message || "Error al procesar el pago", variant: "destructive" });
        return;
      }
      window.location.href = data.paymentUrl;
    } catch {
      toast({ title: "Error", description: "No se pudo conectar con el servidor de pagos", variant: "destructive" });
    } finally {
      setUpgrading(null);
    }
  };

  const upgradePlans = Object.entries(planLimits).filter(
    ([key]) => {
      const order = ["free", "basic", "pro"];
      return order.indexOf(key) > order.indexOf(tenant.plan);
    }
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl glass-card p-6 animate-dash-scale-in relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full animate-subtle-breathe" style={{ background: `radial-gradient(circle, ${currentColor}20, transparent 60%)` }} />

        <div className="flex items-center justify-between mb-6 relative">
          <div className="animate-dash-slide-right">
            <h3 className="text-lg font-bold mb-1">Tu Plan Actual</h3>
            <p className="text-sm text-white/40">Gestiona tu suscripcion</p>
          </div>
          <div className="px-4 py-2 rounded-xl text-sm font-bold animate-icon-pop transition-all duration-300 hover:scale-105" style={{ backgroundColor: `${currentColor}15`, color: currentColor, boxShadow: `0 0 20px ${currentColor}10` }} data-testid="badge-plan">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {planLabels[tenant.plan] || tenant.plan}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 relative">
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 animate-dash-fade-up dash-stagger-1 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.1]">
            <p className="text-xs text-white/35 mb-1">Sesiones</p>
            <p className="text-lg font-bold" data-testid="text-plan-sessions">{currentPlan.sessions}</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 animate-dash-fade-up dash-stagger-2 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.1]">
            <p className="text-xs text-white/35 mb-1">Mensajes</p>
            <p className="text-lg font-bold" data-testid="text-plan-messages">{currentPlan.messages}</p>
          </div>
        </div>

        <div className="relative animate-dash-fade-up dash-stagger-3">
          <p className="text-xs text-white/35 mb-3">Funcionalidades incluidas</p>
          <div className="flex flex-wrap gap-2">
            {currentPlan.features.map((f, i) => (
              <span key={f} className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/60 animate-dash-fade-up dash-stagger-${Math.min(i + 1, 6)} transition-all duration-300 hover:bg-white/[0.08] hover:border-white/[0.12] hover:text-white/80`}>
                <Check className="h-3 w-3 text-primary" />
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {upgradePlans.length > 0 && (
        <div className="animate-dash-fade-up dash-stagger-4">
          <h3 className="text-base font-bold mb-4 text-white/70 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary animate-glow-pulse" />
            Mejora tu plan
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {upgradePlans.map(([key, limits], idx) => {
              const color = planColors[key];
              const isGreen = key === "basic";
              return (
                <div key={key} className={`rounded-2xl glass-card ${isGreen ? "glass-card-glow-green" : "glass-card-glow-orange"} p-6 transition-all duration-300 relative overflow-hidden group animate-dash-scale-in dash-stagger-${idx + 2}`}>
                  <div className="absolute top-0 left-0 right-0 h-px transition-opacity duration-500 group-hover:opacity-100 opacity-60" style={{ background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)` }} />
                  <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full transition-all duration-700 opacity-0 group-hover:opacity-100" style={{ background: `radial-gradient(circle, ${color}10, transparent 60%)` }} />

                  <div className="flex items-center justify-between mb-4 relative">
                    <div>
                      <h4 className="text-lg font-bold transition-colors duration-300 group-hover:text-white">{planLabels[key]}</h4>
                      <p className="text-xs text-white/35">
                        {key === "basic" ? "Para negocios en crecimiento" : "Para grandes empresas"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black transition-all duration-300 group-hover:scale-105" style={{ color }} data-testid={`badge-price-${key}`}>{planPrices[key]}</p>
                      <p className="text-xs text-white/30">CLP/mes</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 relative">
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 transition-all duration-300 group-hover:bg-white/[0.05]">
                      <p className="text-xs text-white/35">Sesiones</p>
                      <p className="text-sm font-bold">{limits.sessions}</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 transition-all duration-300 group-hover:bg-white/[0.05]">
                      <p className="text-xs text-white/35">Mensajes</p>
                      <p className="text-sm font-bold">{limits.messages}</p>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-5 relative">
                    {limits.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-white/50 transition-colors duration-300 group-hover:text-white/65">
                        <Check className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" style={{ color }} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full rounded-xl h-11 font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-xl relative overflow-hidden group/btn"
                    style={{ backgroundColor: color, color: "white" }}
                    disabled={upgrading !== null}
                    onClick={() => handleUpgrade(key)}
                    data-testid={`button-upgrade-${key}`}
                  >
                    <span className="absolute inset-0 animate-shimmer-line opacity-20" />
                    {upgrading === key ? (
                      <span className="flex items-center gap-2 relative">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Procesando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 relative">
                        <Zap className="h-4 w-4 transition-transform duration-300 group-hover/btn:rotate-12" />
                        Contratar {planLabels[key]}
                      </span>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type DashboardTab = "stats" | "config" | "embed" | "plan" | "guides";

const navItems: { title: string; value: DashboardTab; icon: typeof Settings }[] = [
  { title: "Estadisticas", value: "stats", icon: BarChart3 },
  { title: "Configuracion", value: "config", icon: Palette },
  { title: "Integracion", value: "embed", icon: Code },
  { title: "Guias", value: "guides", icon: BookOpen },
  { title: "Plan", value: "plan", icon: CreditCard },
];

export default function Dashboard() {
  const { tenant, isLoading, token } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>("stats");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (payment) {
      window.history.replaceState({}, "", "/dashboard");
      if (payment === "success") {
        toast({ title: "Pago exitoso!", description: "Tu plan ha sido actualizado. Ahora instala el chat en tu sitio web." });
        queryClient.invalidateQueries({ queryKey: ["/api/tenants/me"] });
        setActiveTab("guides");
      } else if (payment === "rejected") {
        toast({ title: "Pago rechazado", description: "Tu pago fue rechazado. Intenta con otro medio de pago.", variant: "destructive" });
        setActiveTab("plan");
      } else if (payment === "pending") {
        toast({ title: "Pago pendiente", description: "Tu pago esta siendo procesado. El plan se actualizara automaticamente." });
        setActiveTab("plan");
      } else if (payment === "error") {
        toast({ title: "Error", description: "Hubo un error procesando tu pago. Intenta nuevamente.", variant: "destructive" });
        setActiveTab("plan");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("tenant_token");
    window.location.href = "/login";
  };

  if (isLoading || !tenant) {
    return (
      <div className="flex items-center justify-center h-screen bg-background" data-testid="dashboard-loading">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl glass-card flex items-center justify-center animate-float relative">
            <div className="absolute inset-0 rounded-2xl animate-glow-pulse" style={{ boxShadow: "0 0 30px rgba(16,185,129,0.15)" }} />
            <img src={logoSinFondo} alt="FoxBot" className="w-9 h-9 object-contain relative" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-white/50 animate-dash-fade-in">Cargando dashboard...</p>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-glow-pulse" style={{ animationDelay: "0s" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-glow-pulse" style={{ animationDelay: "0.2s" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-glow-pulse" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const planLabels: Record<string, string> = { free: "Gratis", basic: "Pro", pro: "Enterprise" };
  const planColors: Record<string, string> = { free: "#6b7280", basic: "hsl(142, 72%, 40%)", pro: "hsl(30, 90%, 52%)" };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <aside className={`${sidebarOpen ? "w-64" : "w-0 overflow-hidden"} shrink-0 transition-all duration-300 border-r border-white/[0.06] flex flex-col relative animate-sidebar-glow`}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(16,185,129,0.03) 0%, transparent 40%, rgba(245,158,11,0.02) 100%)" }} />
        <div className="absolute top-20 -right-16 w-32 h-32 rounded-full animate-orb-drift pointer-events-none" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.04), transparent 60%)", animationDelay: "-10s" }} />

        <div className="relative p-5 border-b border-white/[0.06] animate-dash-fade-in">
          <div className="flex items-center gap-3">
            {tenant.avatarUrl ? (
              <img
                src={tenant.avatarUrl}
                alt={tenant.companyName}
                className="w-9 h-9 rounded-xl object-cover shrink-0 transition-transform duration-300 hover:scale-110 hover:rotate-3"
                referrerPolicy="no-referrer"
                data-testid="img-tenant-avatar"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl glass-card flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-110 hover:rotate-3 animate-float" style={{ animationDuration: "8s" }}>
                <img src={logoSinFondo} alt="FoxBot" className="w-6 h-6 object-contain" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{tenant.companyName}</p>
              <p className="text-[10px] text-white/30 truncate">{tenant.email}</p>
            </div>
          </div>
        </div>

        <nav className="relative flex-1 p-3 space-y-1">
          {navItems.map((item, i) => {
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setActiveTab(item.value)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-300 animate-dash-slide-right dash-stagger-${i + 1} group/nav relative overflow-hidden ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold shadow-[0_0_16px_rgba(16,185,129,0.06)]"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                }`}
                data-testid={`nav-${item.value}`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r animate-dash-scale-in" />
                )}
                <item.icon className={`w-[18px] h-[18px] transition-all duration-300 ${isActive ? "text-primary" : "group-hover/nav:scale-110"}`} />
                <span>{item.title}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary/50 animate-dash-fade-in" />}
              </button>
            );
          })}
        </nav>

        <div className="relative p-3 border-t border-white/[0.06]">
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 mb-3 animate-dash-fade-up transition-all duration-300 hover:bg-white/[0.04] hover:border-white/[0.1] group/plan">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full animate-glow-pulse" style={{ backgroundColor: planColors[tenant.plan] }} />
              <span className="text-xs font-semibold" style={{ color: planColors[tenant.plan] }}>
                Plan {planLabels[tenant.plan]}
              </span>
            </div>
            {tenant.plan === "free" && (
              <button
                onClick={() => setActiveTab("plan")}
                className="text-[11px] text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-all duration-300 group-hover/plan:gap-2"
                data-testid="link-upgrade-sidebar"
              >
                Mejorar plan <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover/plan:translate-x-0.5" />
              </button>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-white/30 hover:text-red-400 hover:bg-red-500/5 transition-all duration-300 group/logout"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 transition-transform duration-300 group-hover/logout:-translate-x-0.5" />
            <span>Cerrar Sesion</span>
          </button>
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06] animate-dash-fade-in relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer-line opacity-30 pointer-events-none" />

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-9 h-9 rounded-xl glass-card flex items-center justify-center hover:bg-white/[0.06] transition-all duration-300 hover:scale-105 relative"
            data-testid="button-sidebar-toggle"
          >
            <div className={`transition-transform duration-300 ${sidebarOpen ? "rotate-0" : "rotate-180"}`}>
              {sidebarOpen ? <X className="w-4 h-4 text-white/50" /> : <Menu className="w-4 h-4 text-white/50" />}
            </div>
          </button>

          <div className="relative">
            <h1 className="text-lg font-bold" data-testid="text-dashboard-title">
              {navItems.find((n) => n.value === activeTab)?.title || "Dashboard"}
            </h1>
            <p className="text-xs text-white/30">
              {activeTab === "stats" && "Metricas de tu chat en tiempo real"}
              {activeTab === "config" && "Personaliza tu widget de chat"}
              {activeTab === "embed" && "Agrega el chat a tu sitio web"}
              {activeTab === "guides" && "Manuales de instalacion paso a paso"}
              {activeTab === "plan" && "Gestiona tu suscripcion"}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3 relative">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] transition-all duration-300 hover:bg-white/[0.05]">
              <div className="w-2 h-2 rounded-full bg-primary animate-glow-pulse" />
              <span className="text-xs text-white/40">En linea</span>
            </div>
            <span className="text-sm text-white/30 hidden md:block" data-testid="text-tenant-email">{tenant.email}</span>
            {tenant.avatarUrl && (
              <img
                src={tenant.avatarUrl}
                alt={tenant.name}
                className="w-8 h-8 rounded-full object-cover border border-white/10"
                referrerPolicy="no-referrer"
                data-testid="img-header-avatar"
              />
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-8 relative">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none animate-orb-drift" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.02), transparent 60%)", animationDelay: "-5s" }} />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none animate-orb-drift" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.02), transparent 60%)", animationDelay: "-12s" }} />

          <div className="max-w-5xl mx-auto space-y-6 relative" key={activeTab}>
            {activeTab === "stats" && <StatsSection token={token!} />}
            {activeTab === "config" && <WidgetConfigSection tenant={tenant} token={token!} />}
            {activeTab === "embed" && <EmbedCodeSection tenant={tenant} />}
            {activeTab === "guides" && <GuidesPanel />}
            {activeTab === "plan" && <PlanSection tenant={tenant} />}
          </div>
        </main>
      </div>
    </div>
  );
}
