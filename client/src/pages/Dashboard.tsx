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
  ChevronDown,
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
  Send,
  UserRound,
  Headphones,
  Upload,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { GuidesPanel } from "./Guides";
import { SiWordpress, SiShopify, SiWoocommerce, SiMagento, SiSquarespace, SiWix, SiWebflow, SiHtml5, SiGoogletagmanager } from "react-icons/si";
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
      value: statsLoading ? "..." : statsData?.avgRating ? `${statsData.avgRating}/5` : "0/5",
      icon: Star,
      sub: statsData?.avgRating ? "Promedio de calificaciones" : "Sin calificaciones aun",
      color: "hsl(30, 90%, 52%)",
      trend: statsData?.avgRating && statsData.avgRating >= 4 ? `${statsData.avgRating >= 4.5 ? "Excelente" : "Bueno"}` : null,
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

function PreviewFormBody({ consultationOptions, showProductSearch, productSearchLabel, widgetColor }: {
  consultationOptions: { value: string; label: string }[];
  showProductSearch: boolean;
  productSearchLabel: string;
  widgetColor: string;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [previewName, setPreviewName] = useState("");
  const [previewEmail, setPreviewEmail] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  return (
    <div className="flex flex-col gap-2.5 px-4 pb-3 flex-1 overflow-y-auto chat-scrollbar">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-white/50 uppercase tracking-wider">Correo electronico</label>
        <div className="h-9 rounded-md bg-white/5 border border-white/10 flex items-center px-3">
          <input
            type="text"
            value={previewEmail}
            onChange={(e) => setPreviewEmail(e.target.value)}
            placeholder="tu@correo.com"
            className="w-full bg-transparent text-[11px] text-white/80 placeholder:text-white/25 outline-none"
            data-testid="input-preview-email"
          />
        </div>
      </div>
      {consultationOptions.length > 0 && (
        <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
          <label className="text-[10px] font-medium text-white/50 uppercase tracking-wider">Tipo de consulta</label>
          <div
            className="h-9 rounded-md bg-white/5 border border-white/10 flex items-center px-3 cursor-pointer hover:bg-white/[0.08] transition-colors"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            data-testid="button-preview-consultation-dropdown"
          >
            <span className={`text-[11px] flex-1 ${selectedOption ? "text-white/80" : "text-white/25"}`}>
              {selectedOption || "Selecciona una opcion"}
            </span>
            <ChevronDown className={`w-3 h-3 text-white/30 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </div>
          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#2a2a2a] border border-white/15 rounded-md shadow-xl z-10 max-h-32 overflow-y-auto chat-scrollbar">
              {consultationOptions.map((opt) => (
                <div
                  key={opt.value}
                  className="px-3 py-2 text-[11px] text-white/70 hover:bg-white/10 cursor-pointer transition-colors"
                  onClick={() => { setSelectedOption(opt.label); setDropdownOpen(false); }}
                  data-testid={`option-preview-${opt.value}`}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {showProductSearch && (
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-white/50 uppercase tracking-wider">{productSearchLabel || "Buscar producto"}</label>
          <div className="h-9 rounded-md bg-white/5 border border-white/10 flex items-center px-3">
            <Search className="w-3 h-3 text-white/20 mr-1.5 flex-shrink-0" />
            <span className="text-[11px] text-white/25">{productSearchLabel || "Buscar producto..."}</span>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-white/50 uppercase tracking-wider">Tu nombre</label>
        <div className="h-9 rounded-md bg-white/5 border border-white/10 flex items-center px-3">
          <input
            type="text"
            value={previewName}
            onChange={(e) => setPreviewName(e.target.value)}
            placeholder="Nombre"
            className="w-full bg-transparent text-[11px] text-white/80 placeholder:text-white/25 outline-none"
            data-testid="input-preview-name"
          />
        </div>
      </div>
      <div className="flex-1 min-h-2" />
      <div className="h-9 rounded-md flex items-center justify-center gap-1.5 text-white text-sm font-medium shrink-0 cursor-pointer hover:opacity-90 transition-opacity" style={{ backgroundColor: widgetColor }}>
        Iniciar Chat
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [showProductSearch, setShowProductSearch] = useState(tenant.showProductSearch === 1);
  const [productSearchLabel, setProductSearchLabel] = useState(tenant.productSearchLabel || "Buscar producto");
  const [productApiUrl, setProductApiUrl] = useState(tenant.productApiUrl || "");
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
    setProductApiUrl(tenant.productApiUrl || "");
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

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Solo se permiten imagenes", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "La imagen no puede superar 5MB", variant: "destructive" });
      return;
    }
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads/direct", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { objectPath } = await res.json();
      setLogoUrl(objectPath);
      toast({ title: "Logo subido correctamente" });
    } catch {
      toast({ title: "Error al subir la imagen", variant: "destructive" });
    }
    setUploadingLogo(false);
  };

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
      showProductSearch: (showProductSearch && productApiUrl.trim()) ? 1 : 0,
      productSearchLabel,
      productApiUrl: productApiUrl.trim() || null,
      botConfigured: isConfigComplete ? 1 : 0,
    };
    updateMutation.mutate(data);
  };

  const [previewMode, setPreviewMode] = useState<"welcome" | "chat">("welcome");

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      <div className="flex-1 min-w-0 space-y-6">
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
          <label className="text-sm font-medium text-white/60">Logo del Widget (opcional)</label>
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <div className="relative group">
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-16 w-16 rounded-xl object-cover border border-white/[0.08]"
                  data-testid="img-logo-preview"
                  onError={(e) => { (e.target as HTMLImageElement).src = ""; setLogoUrl(""); }}
                />
                <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <button
                    data-testid="button-change-logo"
                    onClick={() => logoInputRef.current?.click()}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    title="Cambiar logo"
                  >
                    <Upload className="w-3.5 h-3.5 text-white" />
                  </button>
                  <button
                    data-testid="button-remove-logo"
                    onClick={() => setLogoUrl("")}
                    className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
                    title="Eliminar logo"
                  >
                    <X className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                data-testid="button-upload-logo"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="h-16 w-full max-w-xs rounded-xl border-2 border-dashed border-white/[0.1] hover:border-primary/40 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 flex items-center justify-center gap-2 text-white/40 hover:text-white/60"
              >
                {uploadingLogo ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span className="text-sm">Subir logo</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(file);
                e.target.value = "";
              }}
            />
          </div>
          <p className="text-xs text-white/30">Formato: PNG, JPG, SVG. Maximo 5MB.</p>
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
            API de Productos
          </h3>
          <p className="text-sm text-white/40">Conecta tu catalogo de productos para que los clientes puedan buscar en el chat</p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div>
            <p className="text-sm font-medium text-white/80">Habilitar buscador de productos</p>
            <p className="text-xs text-white/40 mt-0.5">Requiere una URL de API de productos configurada</p>
          </div>
          <Switch
            checked={showProductSearch}
            onCheckedChange={(checked) => {
              setShowProductSearch(checked);
            }}
            data-testid="switch-product-search"
          />
        </div>

        {showProductSearch && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">
                URL de API de Productos <span className="text-red-400">*</span>
              </label>
              <Input
                value={productApiUrl}
                onChange={(e) => setProductApiUrl(e.target.value)}
                placeholder="https://tutienda.com/wp-json/wc/v3/products"
                className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40 transition-all duration-300"
                data-testid="input-product-api-url"
              />
              <p className="text-xs text-white/30">
                Ingresa la URL de tu API de productos (WooCommerce, Shopify, API personalizada). Si no tienes una, contacta a Web Maker Chile para generar una.
              </p>
              {showProductSearch && !productApiUrl.trim() && (
                <p className="text-xs text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Debes ingresar una URL de API para activar el buscador de productos
                </p>
              )}
            </div>
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

      <div className="xl:w-[370px] flex-shrink-0">
        <div className="xl:sticky xl:top-4">
          <div className="rounded-2xl glass-card p-4 space-y-3 animate-dash-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white/80 flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                Vista Previa
              </h3>
              <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5">
                <button
                  data-testid="button-preview-welcome"
                  onClick={() => setPreviewMode("welcome")}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${previewMode === "welcome" ? "bg-white/[0.1] text-white/90" : "text-white/40 hover:text-white/60"}`}
                >
                  Formulario
                </button>
                <button
                  data-testid="button-preview-chat"
                  onClick={() => setPreviewMode("chat")}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${previewMode === "chat" ? "bg-white/[0.1] text-white/90" : "text-white/40 hover:text-white/60"}`}
                >
                  Chat
                </button>
              </div>
            </div>

            <div
              className="rounded-xl border border-white/[0.08] overflow-hidden transition-all duration-500"
              style={{ height: 520 }}
              data-testid="widget-preview-container"
            >
              {previewMode === "welcome" ? (
                <div className="flex flex-col h-full" style={{ background: "#1a1a1a" }}>
                  <div className="px-4 py-3 flex items-center justify-between shrink-0" style={{ background: widgetColor }}>
                    <div className="flex items-center gap-2 min-w-0">
                      {logoUrl ? (
                        <img src={logoUrl} alt="" className="w-8 h-8 rounded-full object-cover bg-white/15" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                          <Headphones className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                      <span className="text-sm font-semibold text-white truncate">{companyName || "Mi Empresa"}</span>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                      <X className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center pt-4 pb-2 px-4 shrink-0">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2 border" style={{ backgroundColor: `${widgetColor}20`, borderColor: `${widgetColor}30` }}>
                      {logoUrl ? (
                        <img src={logoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <Headphones className="w-6 h-6" style={{ color: widgetColor }} />
                      )}
                    </div>
                    <h2 className="text-sm font-bold text-white mb-0.5 text-center">{welcomeMessage || "Hola, ¿en que podemos ayudarte?"}</h2>
                    <p className="text-[10px] text-white/50 text-center">{welcomeSubtitle || "Completa tus datos para iniciar la conversacion"}</p>
                  </div>
                  <PreviewFormBody
                    consultationOptions={consultationOptions}
                    showProductSearch={showProductSearch}
                    productSearchLabel={productSearchLabel}
                    widgetColor={widgetColor}
                  />
                </div>
              ) : (
                <div className="flex flex-col h-full" style={{ background: "#1a1a1a" }}>
                  <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 shrink-0" style={{ background: widgetColor }}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="" className="w-8 h-8 rounded-full object-cover bg-white/15" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                        <Headphones className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">{companyName || "Mi Empresa"}</h3>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-300" />
                        <span className="text-[10px] text-green-200">En linea</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                        <Search className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                        <X className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                    <div className="flex items-end gap-1.5">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ backgroundColor: `${widgetColor}20`, borderColor: `${widgetColor}30` }}>
                        <Headphones className="w-3 h-3" style={{ color: widgetColor }} />
                      </div>
                      <div className="max-w-[75%]">
                        <div className="rounded-md rounded-bl-none bg-white/5 border border-white/10 px-3 py-2">
                          <p className="text-[12px] text-white/90 leading-relaxed">Hola! Bienvenido a {companyName || "nuestra tienda"}. ¿En que puedo ayudarte hoy?</p>
                        </div>
                        <span className="text-[9px] text-white/25 mt-0.5 block">11:30 a.m.</span>
                      </div>
                    </div>
                    <div className="flex items-end gap-1.5 flex-row-reverse">
                      <div className="max-w-[75%]">
                        <div className="rounded-md rounded-br-none text-white px-3 py-2" style={{ backgroundColor: widgetColor }}>
                          <p className="text-[12px] leading-relaxed">Hola, quiero informacion sobre sus productos</p>
                        </div>
                        <span className="text-[9px] text-white/25 mt-0.5 block text-right">11:31 a.m.</span>
                      </div>
                    </div>
                    <div className="flex items-end gap-1.5">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ backgroundColor: `${widgetColor}20`, borderColor: `${widgetColor}30` }}>
                        <Headphones className="w-3 h-3" style={{ color: widgetColor }} />
                      </div>
                      <div className="max-w-[75%]">
                        <div className="rounded-md rounded-bl-none bg-white/5 border border-white/10 px-3 py-2">
                          <p className="text-[12px] text-white/90 leading-relaxed">Claro! Aqui tienes nuestras opciones:</p>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1 pl-0.5">
                          <span className="px-2 py-1 text-[10px] font-semibold rounded-md border" style={{ borderColor: `${widgetColor}90`, backgroundColor: `${widgetColor}30`, color: "rgba(255,255,255,0.7)" }}>Ver catalogo</span>
                          <span className="px-2 py-1 text-[10px] font-semibold rounded-md border" style={{ borderColor: `${widgetColor}90`, backgroundColor: `${widgetColor}30`, color: "rgba(255,255,255,0.7)" }}>Precios</span>
                        </div>
                        <span className="text-[9px] text-white/25 mt-0.5 block">11:31 a.m.</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-3 pt-2 pb-1 border-t border-white/10 shrink-0">
                    <div className="w-full mb-2 font-semibold text-[12px] flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-white" style={{ backgroundColor: widgetColor }}>
                      <UserRound className="w-3.5 h-3.5" />
                      Contactar un Ejecutivo
                    </div>
                    <div className="w-full mb-1 font-semibold text-[12px] flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-white/60 border border-white/10 bg-white/[0.03]">
                      <Star className="w-3.5 h-3.5" />
                      Finalizar y Valorar
                    </div>
                  </div>
                  <div className="px-3 pb-2 shrink-0">
                    <div className="flex items-end gap-1.5">
                      <div className="w-7 h-7 rounded-md flex items-center justify-center text-white/30">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 py-2 px-3 rounded-md bg-white/5 border border-white/10">
                        <span className="text-[11px] text-white/25">Escribe un mensaje...</span>
                      </div>
                      <div className="w-7 h-7 rounded-md flex items-center justify-center text-white" style={{ backgroundColor: widgetColor }}>
                        <Send className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                  <div className="py-1.5 px-3 border-t border-white/[0.04] shrink-0">
                    <p className="text-[9px] text-white/20 text-center">Powered by <span className="font-medium">FoxBot</span></p>
                  </div>
                </div>
              )}
            </div>
            <p className="text-[10px] text-white/25 text-center">Los cambios se reflejan en tiempo real</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TenantSession {
  sessionId: string;
  userName: string;
  userEmail: string;
  status: string;
  messageCount: number;
  lastMessage: string | null;
  lastMessageContent: string | null;
  problemType: string | null;
  createdAt: string | null;
}

interface TenantMessage {
  id: number;
  sessionId: string;
  userEmail: string;
  userName: string;
  sender: string;
  content: string;
  imageUrl: string | null;
  adminName: string | null;
  adminColor: string | null;
  timestamp: string;
}

function ConversationsSection({ token }: { token: string }) {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "closed">("all");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: sessionsList = [], isLoading: sessionsLoading } = useQuery<TenantSession[]>({
    queryKey: ["/api/tenants/me/sessions"],
    queryFn: async () => {
      const res = await fetch("/api/tenants/me/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    refetchInterval: 8000,
  });

  const { data: chatMessages = [], isLoading: messagesLoading } = useQuery<TenantMessage[]>({
    queryKey: ["/api/tenants/me/sessions", selectedSession, "messages"],
    queryFn: async () => {
      if (!selectedSession) return [];
      const res = await fetch(`/api/tenants/me/sessions/${selectedSession}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    enabled: !!selectedSession,
    refetchInterval: 4000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [chatMessages]);

  const handleReply = async () => {
    if (!replyText.trim() || !selectedSession || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tenants/me/sessions/${selectedSession}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: replyText.trim() }),
      });
      if (res.ok) {
        setReplyText("");
        queryClient.invalidateQueries({ queryKey: ["/api/tenants/me/sessions", selectedSession, "messages"] });
        queryClient.invalidateQueries({ queryKey: ["/api/tenants/me/sessions"] });
      } else {
        toast({ title: "Error", description: "No se pudo enviar el mensaje", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error de conexion", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const selectedSessionData = sessionsList.find(s => s.sessionId === selectedSession);
  const filteredSessions = filter === "all" ? sessionsList : sessionsList.filter(s => s.status === filter);
  const activeSessions = sessionsList.filter(s => s.status === "active").length;

  const renderMessageContent = (msg: TenantMessage) => {
    if (msg.content === "{{SHOW_RATING}}") {
      return (
        <div className="flex items-center gap-2 text-yellow-400">
          <Star className="w-4 h-4 fill-yellow-400" />
          <span className="text-xs font-medium">El cliente envio su valoracion</span>
        </div>
      );
    }
    if (msg.content.startsWith("{{QUICK_REPLIES:")) {
      try {
        const jsonStr = msg.content.replace("{{QUICK_REPLIES:", "").replace("}}", "");
        const data = JSON.parse(jsonStr);
        return (
          <div className="space-y-1.5">
            {data.text && <p className="whitespace-pre-wrap break-words text-sm">{data.text}</p>}
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(data.buttons || []).map((btn: { label: string }, i: number) => (
                <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-white/10 text-white/60 border border-white/10">{btn.label}</span>
              ))}
            </div>
          </div>
        );
      } catch { return <p className="whitespace-pre-wrap break-words text-sm">{msg.content}</p>; }
    }
    const urlRegex = /(https?:\/\/[^\s<>\])"]+)/g;
    const parts = msg.content.split(urlRegex);
    return (
      <p className="whitespace-pre-wrap break-words text-sm">
        {parts.map((part, i) => {
          if (urlRegex.test(part)) {
            urlRegex.lastIndex = 0;
            return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline text-blue-400 hover:text-blue-300 break-all">{part}</a>;
          }
          return part;
        })}
      </p>
    );
  };

  if (selectedSession) {
    return (
      <div className="rounded-2xl glass-card overflow-hidden animate-dash-scale-in flex flex-col" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-3" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)" }}>
          <button
            onClick={() => setSelectedSession(null)}
            className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.10] transition-colors"
            data-testid="button-back-sessions"
          >
            <ChevronRight className="w-4 h-4 text-white/50 rotate-180" />
          </button>
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/30">
            <UserRound className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate" data-testid="text-chat-user">{selectedSessionData?.userName || "Cliente"}</p>
            <p className="text-xs text-white/40 truncate">{selectedSessionData?.userEmail}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {selectedSessionData?.problemType && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/50 border border-white/10">{selectedSessionData.problemType}</span>
            )}
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${selectedSessionData?.status === "active" ? "bg-green-500/15 text-green-400 border border-green-500/20" : "bg-white/[0.06] text-white/40 border border-white/10"}`}>
              {selectedSessionData?.status === "active" ? "Activa" : "Cerrada"}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: "radial-gradient(ellipse at top, rgba(255,255,255,0.01) 0%, transparent 50%)" }}>
          {messagesLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : chatMessages.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-white/30 text-sm">Sin mensajes</div>
          ) : (
            chatMessages.map((msg, idx) => {
              const isSupport = msg.sender === "support";
              const showDateSeparator = idx === 0 || new Date(msg.timestamp).toDateString() !== new Date(chatMessages[idx - 1].timestamp).toDateString();
              const msgAdminColor = msg.adminColor || "#10b981";
              return (
                <div key={msg.id}>
                  {showDateSeparator && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-white/[0.06]" />
                      <span className="text-[10px] text-white/25 font-medium">{new Date(msg.timestamp).toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" })}</span>
                      <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>
                  )}
                  <div
                    className={`flex ${isSupport ? "justify-end" : "justify-start"} gap-2`}
                    data-testid={`msg-bubble-${msg.id}`}
                  >
                    {!isSupport && (
                      <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0 mt-1 border border-white/10">
                        <UserRound className="w-3.5 h-3.5 text-white/40" />
                      </div>
                    )}
                    <div className="max-w-[75%] flex flex-col">
                      {isSupport && msg.adminName && (
                        <div className="flex items-center gap-1.5 mb-0.5 justify-end">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: msgAdminColor }} />
                          <span className="text-[10px] font-medium" style={{ color: msgAdminColor }}>{msg.adminName}</span>
                        </div>
                      )}
                      {isSupport && !msg.adminName && (
                        <div className="flex items-center gap-1 mb-0.5 justify-end">
                          <Headphones className="w-2.5 h-2.5 text-primary/60" />
                          <span className="text-[10px] font-medium text-primary/60">Bot IA</span>
                        </div>
                      )}
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl ${
                          isSupport
                            ? "rounded-br-sm text-white"
                            : "bg-white/[0.06] text-white/90 rounded-bl-sm border border-white/[0.06]"
                        }`}
                        style={isSupport ? { backgroundColor: `${msgAdminColor}20`, border: `1px solid ${msgAdminColor}30` } : undefined}
                      >
                        {msg.imageUrl && (
                          <img
                            src={msg.imageUrl}
                            alt=""
                            className="max-w-full rounded-lg mb-2 max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setLightboxUrl(msg.imageUrl)}
                          />
                        )}
                        {renderMessageContent(msg)}
                      </div>
                      <span className={`text-[10px] text-white/20 mt-0.5 ${isSupport ? "text-right" : "text-left"}`}>
                        {new Date(msg.timestamp).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {isSupport && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 border" style={{ backgroundColor: `${msgAdminColor}15`, borderColor: `${msgAdminColor}30` }}>
                        <Headphones className="w-3.5 h-3.5" style={{ color: msgAdminColor }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {selectedSessionData?.status === "active" && (
          <div className="px-4 py-3 border-t border-white/[0.06]" style={{ background: "rgba(255,255,255,0.01)" }}>
            <form
              onSubmit={(e) => { e.preventDefault(); handleReply(); }}
              className="flex items-end gap-2"
            >
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleReply();
                  }
                }}
                placeholder="Escribe tu respuesta..."
                rows={1}
                className="flex-1 py-2.5 px-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                style={{ maxHeight: "100px" }}
                data-testid="input-tenant-reply"
              />
              <Button
                type="submit"
                disabled={!replyText.trim() || sending}
                className="bg-primary text-white rounded-xl px-5 h-10"
                data-testid="button-send-reply"
              >
                {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send className="w-4 h-4 mr-1.5" />Enviar</>}
              </Button>
            </form>
          </div>
        )}

        {lightboxUrl && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
            <img src={lightboxUrl} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-dash-scale-in">
      {sessionsLoading ? (
        <div className="rounded-2xl glass-card p-8 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sessionsList.length === 0 ? (
        <div className="rounded-2xl glass-card p-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
            <MessageSquare className="w-7 h-7 text-primary/60" />
          </div>
          <h3 className="text-lg font-bold text-white">Sin conversaciones</h3>
          <p className="text-sm text-white/40 max-w-md mx-auto">
            Cuando tus clientes empiecen a chatear a traves de tu widget, las conversaciones apareceran aqui.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm text-white/40">{filteredSessions.length} conversacion{filteredSessions.length !== 1 ? "es" : ""}</p>
              {activeSessions > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">{activeSessions} activa{activeSessions !== 1 ? "s" : ""}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {(["all", "active", "closed"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-colors ${filter === f ? "bg-primary/15 text-primary border border-primary/20" : "text-white/30 hover:text-white/50 hover:bg-white/[0.04]"}`}
                  data-testid={`filter-${f}`}
                >
                  {f === "all" ? "Todas" : f === "active" ? "Activas" : "Cerradas"}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-white/[0.04] max-h-[calc(100vh-300px)] overflow-y-auto">
            {filteredSessions.map((session) => (
              <button
                key={session.sessionId}
                onClick={() => setSelectedSession(session.sessionId)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.03] transition-colors text-left group"
                data-testid={`session-row-${session.sessionId}`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center border border-white/10">
                    <UserRound className="w-4 h-4 text-white/40" />
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0a0a] ${session.status === "active" ? "bg-green-400" : "bg-white/20"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white truncate">{session.userName}</p>
                    <span className="text-[10px] text-white/25 flex-shrink-0">
                      {session.lastMessage ? new Date(session.lastMessage).toLocaleDateString("es-CL", { day: "numeric", month: "short" }) : ""}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 truncate">{session.userEmail}</p>
                  {session.lastMessageContent && (
                    <p className="text-xs text-white/25 truncate mt-0.5">{session.lastMessageContent.startsWith("{{") ? "Mensaje del sistema" : session.lastMessageContent}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {session.problemType && (
                    <span className="text-[9px] text-white/30 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">{session.problemType}</span>
                  )}
                  <span className="text-[10px] text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded">{session.messageCount}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/40 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface PlatformGuide {
  id: string;
  name: string;
  icon: any;
  color: string;
  difficulty: "facil" | "medio";
  steps: { title: string; description: string; code?: string; note?: string }[];
}

function EmbedCodeSection({ tenant }: { tenant: TenantProfile }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [helpName, setHelpName] = useState("");
  const [helpEmail, setHelpEmail] = useState("");
  const [helpMessage, setHelpMessage] = useState("");
  const [helpSent, setHelpSent] = useState(false);
  const { toast } = useToast();
  const isConfigured = tenant.botConfigured === 1;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const embedScript = `<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.id = 'foxbot-widget';
    iframe.src = '${baseUrl}/widget?tenantId=${tenant.id}';
    iframe.allow = 'microphone';
    iframe.style.cssText = 'position:fixed;bottom:12px;right:12px;width:70px;height:70px;border:none;z-index:9999;';
    document.body.appendChild(iframe);
    window.addEventListener('message', function(e) {
      if (!e.data || !e.data.type) return;
      if (e.data.type === 'open_chat' || e.data.type === 'close_chat') {
        var mobile = window.innerWidth <= 480;
        if (e.data.type === 'open_chat') {
          if (mobile) {
            iframe.style.cssText = 'position:fixed;bottom:0;right:0;width:100%;height:100%;border:none;z-index:9999;';
          } else {
            iframe.style.cssText = 'position:fixed;bottom:16px;right:16px;width:400px;height:620px;border:none;z-index:9999;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.3);';
          }
        } else {
          iframe.style.cssText = 'position:fixed;bottom:12px;right:12px;width:70px;height:70px;border:none;z-index:9999;';
        }
      }
    });
  })();
</script>`;

  const iframeCode = `<iframe
  id="foxbot-widget"
  src="${baseUrl}/widget?tenantId=${tenant.id}"
  style="position:fixed;bottom:12px;right:12px;width:70px;height:70px;border:none;z-index:9999;"
  allow="microphone"
></iframe>
<script>
  window.addEventListener('message', function(e) {
    var f = document.getElementById('foxbot-widget');
    if (!f || !e.data || !e.data.type) return;
    if (e.data.type === 'open_chat' || e.data.type === 'close_chat') {
      var mobile = window.innerWidth <= 480;
      if (e.data.type === 'open_chat') {
        if (mobile) {
          f.style.cssText = 'position:fixed;bottom:0;right:0;width:100%;height:100%;border:none;z-index:9999;';
        } else {
          f.style.cssText = 'position:fixed;bottom:16px;right:16px;width:400px;height:620px;border:none;z-index:9999;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.3);';
        }
      } else {
        f.style.cssText = 'position:fixed;bottom:12px;right:12px;width:70px;height:70px;border:none;z-index:9999;';
      }
    }
  });
</script>`;

  const platforms: PlatformGuide[] = [
    {
      id: "wordpress", name: "WordPress", icon: SiWordpress, color: "#21759b", difficulty: "facil",
      steps: [
        { title: "Accede a tu panel de WordPress", description: "Ingresa a tu administrador de WordPress (tu-sitio.com/wp-admin)." },
        { title: "Ve a Apariencia > Editor de temas", description: "En el menu lateral, navega a Apariencia > Editor de temas. Si prefieres no editar archivos, instala el plugin gratuito 'WPCode' o 'Insert Headers and Footers'.", note: "Con WPCode: Ve a Code Snippets > Header & Footer > pega el codigo en el campo 'Footer'." },
        { title: "Abre el archivo footer.php", description: "En el editor de temas, selecciona footer.php de la lista de archivos del tema." },
        { title: "Pega el codigo antes de </body>", description: "Agrega el siguiente codigo justo antes de la etiqueta </body>:", code: embedScript },
        { title: "Guarda los cambios", description: "Haz clic en 'Actualizar archivo'. El chatbot aparecera automaticamente en todas las paginas de tu sitio." },
      ],
    },
    {
      id: "woocommerce", name: "WooCommerce", icon: SiWoocommerce, color: "#96588a", difficulty: "facil",
      steps: [
        { title: "Mismos pasos que WordPress", description: "WooCommerce funciona sobre WordPress, asi que el proceso es identico. Sigue los pasos de WordPress." },
        { title: "Pega el codigo en footer.php", description: "Ve a Apariencia > Editor de temas > footer.php y pega este codigo antes de </body>:", code: embedScript },
        { title: "Conecta tu catalogo (opcional)", description: "Para que el bot muestre tus productos, activa el buscador de productos en Configuracion > API de Productos e ingresa tu URL de WooCommerce REST API.", note: "Formato de URL: https://tu-tienda.com/wp-json/wc/v3/products" },
      ],
    },
    {
      id: "shopify", name: "Shopify", icon: SiShopify, color: "#95bf47", difficulty: "facil",
      steps: [
        { title: "Ve a tu panel de Shopify", description: "Ingresa a tu administrador en tu-tienda.myshopify.com/admin." },
        { title: "Abre el editor de temas", description: "Ve a Tienda Online > Temas > haz clic en '...' junto a tu tema activo > Editar codigo." },
        { title: "Abre theme.liquid", description: "En el editor de codigo, busca y abre Layout > theme.liquid." },
        { title: "Pega el codigo antes de </body>", description: "Busca la etiqueta </body> y pega este codigo justo antes:", code: embedScript },
        { title: "Guarda", description: "Haz clic en 'Guardar'. El chatbot aparecera en tu tienda inmediatamente." },
      ],
    },
    {
      id: "squarespace", name: "Squarespace", icon: SiSquarespace, color: "#ffffff", difficulty: "facil",
      steps: [
        { title: "Accede a tu panel", description: "Ingresa a tu cuenta de Squarespace." },
        { title: "Ve a Configuracion > Avanzado", description: "Navega a Configuracion > Avanzado > Inyeccion de codigo." },
        { title: "Pega en el campo 'Footer'", description: "En la seccion Footer, pega el siguiente codigo:", code: embedScript },
        { title: "Guarda", description: "Haz clic en 'Guardar'. El chatbot estara en todas las paginas.", note: "Requiere plan Business o superior de Squarespace." },
      ],
    },
    {
      id: "wix", name: "Wix", icon: SiWix, color: "#0c6efc", difficulty: "facil",
      steps: [
        { title: "Abre el editor de Wix", description: "Ingresa a tu sitio en Wix y abre el editor." },
        { title: "Agrega un bloque HTML", description: "Haz clic en Agregar (+) > Embeds > HTML embebido. Arrastralo a cualquier parte." },
        { title: "Pega el codigo", description: "Haz clic en 'Introducir codigo' y pega lo siguiente:", code: embedScript },
        { title: "Publica", description: "Haz clic en 'Publicar'. El chatbot aparecera en tu sitio en vivo." },
      ],
    },
    {
      id: "webflow", name: "Webflow", icon: SiWebflow, color: "#4353ff", difficulty: "facil",
      steps: [
        { title: "Abre la configuracion del proyecto", description: "En tu dashboard de Webflow, abre la configuracion de tu proyecto." },
        { title: "Ve a Custom Code", description: "Navega a la pestana 'Custom Code'." },
        { title: "Pega en Footer Code", description: "En el campo 'Footer Code', pega el siguiente codigo:", code: embedScript },
        { title: "Publica", description: "Haz clic en 'Publish'. El chatbot aparecera en tu sitio." },
      ],
    },
    {
      id: "magento", name: "Magento", icon: SiMagento, color: "#f46f25", difficulty: "medio",
      steps: [
        { title: "Accede al panel de administracion", description: "Ve a Content > Design > Configuration en tu panel de Magento." },
        { title: "Edita el tema", description: "Selecciona tu Store View > Edit > seccion HTML Head o Footer." },
        { title: "Pega el script", description: "Pega este codigo en 'Miscellaneous Scripts':", code: embedScript },
        { title: "Limpia la cache", description: "Ve a System > Cache Management y limpia la cache." },
      ],
    },
    {
      id: "html", name: "HTML / Cualquier web", icon: SiHtml5, color: "#e34f26", difficulty: "facil",
      steps: [
        { title: "Abre tu archivo HTML", description: "Abre el archivo principal de tu sitio web (generalmente index.html)." },
        { title: "Pega antes de </body>", description: "Agrega el siguiente codigo justo antes de la etiqueta de cierre </body>:", code: embedScript },
        { title: "Sube los cambios", description: "Guarda el archivo y subelo a tu servidor. El chatbot aparecera automaticamente." },
      ],
    },
    {
      id: "gtm", name: "Google Tag Manager", icon: SiGoogletagmanager, color: "#4285f4", difficulty: "medio",
      steps: [
        { title: "Abre Google Tag Manager", description: "Ingresa a tagmanager.google.com y selecciona tu contenedor." },
        { title: "Crea una nueva etiqueta", description: "Haz clic en 'Etiquetas' > 'Nueva' > tipo 'HTML personalizado'." },
        { title: "Pega el codigo", description: "En el campo de HTML, pega lo siguiente:", code: embedScript },
        { title: "Configura el activador", description: "En 'Activacion', selecciona 'All Pages' (Todas las paginas)." },
        { title: "Publica", description: "Haz clic en 'Enviar' para publicar los cambios." },
      ],
    },
    {
      id: "prestashop", name: "PrestaShop", icon: Code, color: "#df0067", difficulty: "medio",
      steps: [
        { title: "Accede al back office", description: "Ingresa a tu panel de administracion de PrestaShop." },
        { title: "Ve a Diseno > Posiciones", description: "Navega a Diseno > Posiciones de modulos." },
        { title: "Agrega un modulo HTML", description: "Usa el modulo 'HTML personalizado' y ancla a la posicion 'displayFooter'." },
        { title: "Pega el codigo", description: "En el contenido del modulo, pega:", code: embedScript },
        { title: "Guarda", description: "Guarda los cambios. El chatbot aparecera en tu tienda." },
      ],
    },
  ];

  const selectedGuide = platforms.find(p => p.id === selectedPlatform);

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
    <div className="space-y-6">
      <div className="rounded-2xl glass-card p-6 space-y-6 animate-dash-scale-in relative overflow-hidden">
        <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full animate-orb-drift" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.04), transparent 60%)", animationDelay: "-7s" }} />

        <div className="relative flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold mb-1 animate-dash-slide-right">Instala tu chatbot</h3>
            <p className="text-sm text-white/40 animate-dash-slide-right dash-stagger-1">Selecciona donde quieres instalar FoxBot y sigue las instrucciones</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
            <CircleCheck className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-400">Bot configurado</span>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">Selecciona tu plataforma</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {platforms.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlatform(selectedPlatform === p.id ? null : p.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 ${
                  selectedPlatform === p.id
                    ? "border-primary/50 bg-primary/10 ring-1 ring-primary/20"
                    : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12]"
                }`}
                data-testid={`button-platform-${p.id}`}
              >
                <p.icon className="w-5 h-5" style={{ color: p.color }} />
                <span className="text-[11px] font-medium text-white/70">{p.name}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${p.difficulty === "facil" ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"}`}>
                  {p.difficulty === "facil" ? "Facil" : "Intermedio"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {selectedGuide && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
              <selectedGuide.icon className="w-5 h-5" style={{ color: selectedGuide.color }} />
              <h4 className="text-base font-bold text-white/90">Instrucciones para {selectedGuide.name}</h4>
            </div>
            <div className="space-y-4">
              {selectedGuide.steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                      {i + 1}
                    </div>
                    {i < selectedGuide.steps.length - 1 && (
                      <div className="w-px flex-1 bg-white/[0.06] mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-semibold text-white/80 mb-1">{step.title}</p>
                    <p className="text-xs text-white/50 leading-relaxed">{step.description}</p>
                    {step.note && (
                      <div className="mt-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
                        <p className="text-[11px] text-amber-300/80 flex items-start gap-1.5">
                          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                          {step.note}
                        </p>
                      </div>
                    )}
                    {step.code && (
                      <div className="mt-3 space-y-2">
                        <pre className="rounded-lg bg-black/30 border border-white/[0.06] p-3 text-[11px] overflow-x-auto text-white/50 font-mono max-h-48 overflow-y-auto chat-scrollbar">
                          <code>{step.code}</code>
                        </pre>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(step.code!, `step-${i}`)}
                          className="rounded-lg border-white/[0.08] hover:border-primary/30 text-xs h-8"
                          data-testid={`button-copy-step-${i}`}
                        >
                          {copied === `step-${i}` ? <Check className="mr-1.5 h-3 w-3 text-primary" /> : <Copy className="mr-1.5 h-3 w-3" />}
                          {copied === `step-${i}` ? "Copiado!" : "Copiar codigo"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 flex items-start gap-3">
              <CircleCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white/70 mb-0.5">Listo!</p>
                <p className="text-xs text-white/40">Despues de seguir estos pasos, el chatbot aparecera automaticamente en la esquina inferior derecha de tu sitio web. Se adapta a cualquier pantalla (desktop y movil).</p>
              </div>
            </div>
          </div>
        )}

        {!selectedPlatform && (
          <div className="space-y-4">
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5 text-center space-y-2">
              <Code className="w-8 h-8 text-white/20 mx-auto" />
              <p className="text-sm text-white/50">Selecciona una plataforma para ver las instrucciones paso a paso</p>
              <p className="text-xs text-white/30">O copia directamente el codigo de integracion de abajo</p>
            </div>

            <Tabs defaultValue="script" className="relative">
              <TabsList className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
                <TabsTrigger value="script" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200 text-xs" data-testid="tab-script">Script (recomendado)</TabsTrigger>
                <TabsTrigger value="iframe" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200 text-xs" data-testid="tab-iframe">iFrame</TabsTrigger>
              </TabsList>
              <TabsContent value="script" className="space-y-3 mt-3">
                <pre className="rounded-lg bg-black/30 border border-white/[0.06] p-3 text-[11px] overflow-x-auto text-white/50 font-mono max-h-48 overflow-y-auto chat-scrollbar" data-testid="text-script-code">
                  <code>{embedScript}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(embedScript, "script")}
                  className="rounded-lg border-white/[0.08] hover:border-primary/30 text-xs h-8"
                  data-testid="button-copy-script"
                >
                  {copied === "script" ? <Check className="mr-1.5 h-3 w-3 text-primary" /> : <Copy className="mr-1.5 h-3 w-3" />}
                  {copied === "script" ? "Copiado!" : "Copiar codigo"}
                </Button>
              </TabsContent>
              <TabsContent value="iframe" className="space-y-3 mt-3">
                <pre className="rounded-lg bg-black/30 border border-white/[0.06] p-3 text-[11px] overflow-x-auto text-white/50 font-mono max-h-48 overflow-y-auto chat-scrollbar" data-testid="text-iframe-code">
                  <code>{iframeCode}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(iframeCode, "iframe")}
                  className="rounded-lg border-white/[0.08] hover:border-primary/30 text-xs h-8"
                  data-testid="button-copy-iframe"
                >
                  {copied === "iframe" ? <Check className="mr-1.5 h-3 w-3 text-primary" /> : <Copy className="mr-1.5 h-3 w-3" />}
                  {copied === "iframe" ? "Copiado!" : "Copiar codigo"}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      <div className="rounded-2xl glass-card p-6 space-y-4 animate-dash-fade-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Headphones className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white/80">Necesitas ayuda?</h4>
              <p className="text-[11px] text-white/40">Nuestro equipo te guia en la instalacion</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHelp(!showHelp)}
            className="rounded-lg border-white/[0.08] hover:border-primary/30 text-xs"
            data-testid="button-toggle-help"
          >
            {showHelp ? "Cerrar" : "Pedir ayuda"}
          </Button>
        </div>

        {showHelp && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <a
                href="https://wa.me/56962530976?text=Hola%2C%20necesito%20ayuda%20para%20instalar%20FoxBot%20en%20mi%20sitio%20web"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-green-500/5 hover:border-green-500/20 transition-all group"
                data-testid="link-whatsapp-help"
              >
                <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/70">WhatsApp</p>
                  <p className="text-[10px] text-white/40">Respuesta rapida</p>
                </div>
              </a>

              <a
                href="mailto:contacto@webmakerchile.cl?subject=Ayuda%20instalacion%20FoxBot&body=Hola%2C%20necesito%20ayuda%20para%20instalar%20FoxBot%20en%20mi%20sitio%20web."
                className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-blue-500/5 hover:border-blue-500/20 transition-all group"
                data-testid="link-email-help"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Send className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/70">Correo</p>
                  <p className="text-[10px] text-white/40">contacto@webmakerchile.cl</p>
                </div>
              </a>

              <a
                href="https://www.webmakerchile.cl"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-orange-500/5 hover:border-orange-500/20 transition-all group"
                data-testid="link-website-help"
              >
                <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bot className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/70">Web Maker Chile</p>
                  <p className="text-[10px] text-white/40">webmakerchile.cl</p>
                </div>
              </a>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
              <p className="text-xs font-medium text-white/60">Enviar solicitud de ayuda</p>
              {helpSent ? (
                <div className="text-center py-4 space-y-2">
                  <CircleCheck className="w-8 h-8 text-primary mx-auto" />
                  <p className="text-sm font-medium text-white/70">Solicitud enviada!</p>
                  <p className="text-xs text-white/40">Un ejecutivo se contactara contigo para guiarte en la instalacion.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      value={helpName}
                      onChange={(e) => setHelpName(e.target.value)}
                      placeholder="Tu nombre"
                      className="h-9 text-xs bg-white/[0.04] border-white/[0.08]"
                      data-testid="input-help-name"
                    />
                    <Input
                      value={helpEmail}
                      onChange={(e) => setHelpEmail(e.target.value)}
                      placeholder="Tu correo electronico"
                      className="h-9 text-xs bg-white/[0.04] border-white/[0.08]"
                      data-testid="input-help-email"
                    />
                  </div>
                  <Textarea
                    value={helpMessage}
                    onChange={(e) => setHelpMessage(e.target.value)}
                    placeholder="Describe en que necesitas ayuda (ej: No se donde pegar el codigo en mi WordPress)..."
                    className="bg-white/[0.04] border-white/[0.08] resize-none text-xs min-h-[80px]"
                    rows={3}
                    data-testid="textarea-help-message"
                  />
                  <Button
                    onClick={async () => {
                      if (!helpName.trim() || !helpEmail.trim()) {
                        toast({ title: "Campos requeridos", description: "Ingresa tu nombre y correo", variant: "destructive" });
                        return;
                      }
                      try {
                        const token = localStorage.getItem("tenant_token");
                        const res = await fetch("/api/tenant-panel/help-request", {
                          method: "POST",
                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ name: helpName, email: helpEmail, message: helpMessage }),
                        });
                        if (!res.ok) throw new Error("Error");
                        setHelpSent(true);
                        toast({ title: "Solicitud enviada", description: "Un ejecutivo se contactara contigo pronto" });
                      } catch {
                        toast({ title: "Error", description: "No se pudo enviar. Intenta por WhatsApp o correo.", variant: "destructive" });
                      }
                    }}
                    className="bg-primary border-primary w-full sm:w-auto text-xs h-9"
                    data-testid="button-send-help"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Solicitar ayuda de un ejecutivo
                  </Button>
                  <p className="text-[10px] text-white/30">Si no puedes instalar el chatbot tu mismo, un ejecutivo de Web Maker Chile se contactara contigo para guiarte paso a paso.</p>
                </>
              )}
            </div>
          </div>
        )}
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

type DashboardTab = "stats" | "conversations" | "config" | "embed" | "plan" | "guides";

const navItems: { title: string; value: DashboardTab; icon: typeof Settings }[] = [
  { title: "Estadisticas", value: "stats", icon: BarChart3 },
  { title: "Conversaciones", value: "conversations", icon: MessageSquare },
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

  useEffect(() => {
    if (!tenant || !token) return;
    async function subscribePush() {
      try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "activated") {
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          }
        });
        const res = await fetch("/api/push/vapid-public-key");
        const { key } = await res.json();
        if (!key) return;
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
        const urlBase64ToUint8Array = (base64String: string) => {
          const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
          const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          return outputArray;
        };
        let subscription = await reg.pushManager.getSubscription();
        if (!subscription) {
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(key),
          });
        }
        const subJson = subscription.toJSON();
        await fetch("/api/tenants/me/push-subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            endpoint: subJson.endpoint,
            keys: subJson.keys,
          }),
        });
      } catch (e) {
        console.log("Push subscription failed:", e);
      }
    }
    subscribePush();
  }, [tenant, token]);

  const handleLogout = () => {
    const token = localStorage.getItem("tenant_token");
    if (token && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) {
            fetch("/api/tenants/me/push-subscribe", {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ endpoint: sub.endpoint }),
            }).catch(() => {});
            sub.unsubscribe().catch(() => {});
          }
        }).catch(() => {});
      }).catch(() => {});
    }
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

          <div className="mt-3 pt-3 border-t border-white/[0.06]">
            <a
              href="/panel"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-300 bg-primary/10 text-primary font-semibold hover:bg-primary/20 group/panel"
              data-testid="nav-panel"
            >
              <Headphones className="w-[18px] h-[18px] transition-transform duration-300 group-hover/panel:scale-110" />
              <span>Panel de Soporte</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto text-primary/50" />
            </a>
          </div>
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
              {activeTab === "conversations" && "Chats de tus clientes en tiempo real"}
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
            {activeTab === "conversations" && <ConversationsSection token={token!} />}
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
