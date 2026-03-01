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
  Globe,
  Wand2,
  UserCircle,
  Smartphone,
  Download,
  Monitor,
  Bell,
  Wifi,
  Share2,
  Gift,
  UserPlus,
  Crown,
  Trophy,
  Link as LinkIcon,
  DollarSign,
  Clock,
  MessageCircle,
  Shield,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { GuidesPanel } from "./Guides";
import { SiWordpress, SiShopify, SiWoocommerce, SiMagento, SiSquarespace, SiWix, SiWebflow, SiHtml5, SiGoogletagmanager } from "react-icons/si";
import type { Tenant } from "@shared/schema";
import logoSinFondo from "@assets/Logo_sin_fondo_1772247619250.png";
import OnboardingWizard from "./OnboardingWizard";
import DashboardTour, { TourPrompt } from "./DashboardTour";

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
      if (!res.ok) throw new Error("No autorizado");
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
      if (!res.ok) throw new Error("Error al cargar estadísticas");
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
      label: "Satisfacción",
      value: statsLoading ? "..." : statsData?.avgRating ? `${statsData.avgRating}/5` : "0/5",
      icon: Star,
      sub: statsData?.avgRating ? "Promedio de calificaciones" : "Sin calificaciones aún",
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
        <label className="text-[10px] font-medium text-white/50 uppercase tracking-wider">Correo electrónico</label>
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
              {selectedOption || "Selecciona una opción"}
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
  const [headerTextColor, setHeaderTextColor] = useState(tenant.headerTextColor || "#ffffff");
  const [botBubbleColor, setBotBubbleColor] = useState(tenant.botBubbleColor || "#2a2a2a");
  const [botTextColor, setBotTextColor] = useState(tenant.botTextColor || "#e0e0e0");
  const [userTextColor, setUserTextColor] = useState(tenant.userTextColor || "#ffffff");
  const [welcomeMessage, setWelcomeMessage] = useState(tenant.welcomeMessage);
  const [welcomeSubtitle, setWelcomeSubtitle] = useState(tenant.welcomeSubtitle || "Completa tus datos para iniciar la conversación");
  const [logoUrl, setLogoUrl] = useState(tenant.logoUrl || "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [showProductSearch, setShowProductSearch] = useState(tenant.showProductSearch === 1);
  const [productSearchLabel, setProductSearchLabel] = useState(tenant.productSearchLabel || "Buscar producto");
  const [productApiUrl, setProductApiUrl] = useState(tenant.productApiUrl || "");
  const [saved, setSaved] = useState(false);
  const [domain, setDomain] = useState(tenant.domain || "");
  const [avatarUrl, setAvatarUrl] = useState(tenant.avatarUrl || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [launcherImageUrl, setLauncherImageUrl] = useState(tenant.launcherImageUrl || "");
  const [uploadingLauncher, setUploadingLauncher] = useState(false);
  const launcherInputRef = useRef<HTMLInputElement>(null);
  const [botIconUrl, setBotIconUrl] = useState(tenant.botIconUrl || "");
  const [uploadingBotIcon, setUploadingBotIcon] = useState(false);
  const botIconInputRef = useRef<HTMLInputElement>(null);
  const [widgetPosition, setWidgetPosition] = useState(tenant.widgetPosition || "right");
  const [labelContactButton, setLabelContactButton] = useState(tenant.labelContactButton || "");
  const [labelTicketButton, setLabelTicketButton] = useState(tenant.labelTicketButton || "");
  const [labelFinalizeButton, setLabelFinalizeButton] = useState(tenant.labelFinalizeButton || "");
  const [welcomeBannerText, setWelcomeBannerText] = useState(tenant.welcomeBannerText || "");
  const [launcherBubbleText, setLauncherBubbleText] = useState(tenant.launcherBubbleText || "");
  const [analyzingUrl, setAnalyzingUrl] = useState(false);
  const [analyzedResult, setAnalyzedResult] = useState<string | null>(null);

  const [consultationOptions, setConsultationOptions] = useState<{ value: string; label: string }[]>(() => {
    try {
      return tenant.consultationOptions ? JSON.parse(tenant.consultationOptions) : [];
    } catch { return []; }
  });
  const [newOption, setNewOption] = useState("");

  useEffect(() => {
    setCompanyName(tenant.companyName);
    setWidgetColor(tenant.widgetColor);
    setHeaderTextColor(tenant.headerTextColor || "#ffffff");
    setBotBubbleColor(tenant.botBubbleColor || "#2a2a2a");
    setBotTextColor(tenant.botTextColor || "#e0e0e0");
    setUserTextColor(tenant.userTextColor || "#ffffff");
    setWelcomeMessage(tenant.welcomeMessage);
    setWelcomeSubtitle(tenant.welcomeSubtitle || "Completa tus datos para iniciar la conversación");
    setLogoUrl(tenant.logoUrl || "");
    setShowProductSearch(tenant.showProductSearch === 1);
    setProductSearchLabel(tenant.productSearchLabel || "Buscar producto");
    setProductApiUrl(tenant.productApiUrl || "");
    setDomain(tenant.domain || "");
    setAvatarUrl(tenant.avatarUrl || "");
    setLauncherImageUrl(tenant.launcherImageUrl || "");
    setBotIconUrl(tenant.botIconUrl || "");
    setWidgetPosition(tenant.widgetPosition || "right");
    setLabelContactButton(tenant.labelContactButton || "");
    setLabelTicketButton(tenant.labelTicketButton || "");
    setLabelFinalizeButton(tenant.labelFinalizeButton || "");
    setWelcomeBannerText(tenant.welcomeBannerText || "");
    setLauncherBubbleText(tenant.launcherBubbleText || "");
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
      toast({ title: "Configuración guardada", description: "Los cambios se han aplicado correctamente." });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudieron guardar los cambios.", variant: "destructive" });
    },
  });

  const saveFieldToDb = async (field: string, value: string | null): Promise<boolean> => {
    try {
      const res = await fetch("/api/tenants/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      queryClient.invalidateQueries({ queryKey: ["/api/tenants/me"] });
      return true;
    } catch {
      toast({ title: "Error al guardar en la base de datos", variant: "destructive" });
      return false;
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Solo se permiten imágenes", variant: "destructive" });
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
      if (!res.ok) throw new Error("Error al subir archivo");
      const { objectPath } = await res.json();
      const saved = await saveFieldToDb("logoUrl", objectPath);
      if (saved) {
        setLogoUrl(objectPath);
        toast({ title: "Logo subido y guardado" });
      }
    } catch {
      toast({ title: "Error al subir la imagen", variant: "destructive" });
    }
    setUploadingLogo(false);
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Solo se permiten imágenes", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "La imagen no puede superar 5MB", variant: "destructive" });
      return;
    }
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads/direct", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Error al subir archivo");
      const { objectPath } = await res.json();
      const saved = await saveFieldToDb("avatarUrl", objectPath);
      if (saved) {
        setAvatarUrl(objectPath);
        toast({ title: "Avatar subido y guardado" });
      }
    } catch {
      toast({ title: "Error al subir la imagen", variant: "destructive" });
    }
    setUploadingAvatar(false);
  };

  const handleImageUpload = async (file: File, setter: (url: string) => void, setLoading: (v: boolean) => void, label: string, dbField: string) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Solo se permiten imágenes", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "La imagen no puede superar 5MB", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads/direct", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Error al subir archivo");
      const { objectPath } = await res.json();
      const saved = await saveFieldToDb(dbField, objectPath);
      if (saved) {
        setter(objectPath);
        toast({ title: `${label} subido y guardado` });
      }
    } catch {
      toast({ title: "Error al subir la imagen", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleAnalyzeUrl = async () => {
    const urlToAnalyze = domain.trim();
    if (!urlToAnalyze) {
      toast({ title: "Ingresa la URL de tu sitio web", variant: "destructive" });
      return;
    }
    setAnalyzingUrl(true);
    setAnalyzedResult(null);
    try {
      const res = await fetch("/api/tenant-panel/analyze-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: urlToAnalyze }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Error al analizar" }));
        throw new Error(err.message);
      }
      const { organized } = await res.json();
      setAnalyzedResult(organized);
      const settingsRes = await fetch("/api/tenant-panel/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ botContext: organized }),
      });
      if (settingsRes.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/tenants/me"] });
        toast({ title: "Sitio web analizado", description: "La información se guardo automáticamente en el entrenamiento del bot. Puedes editarla en Entrenar Bot." });
      }
    } catch (err: any) {
      toast({ title: "Error al analizar", description: err.message || "Verifica que la URL sea accesible", variant: "destructive" });
    }
    setAnalyzingUrl(false);
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
      headerTextColor,
      botBubbleColor,
      botTextColor,
      userTextColor,
      welcomeMessage,
      welcomeSubtitle,
      logoUrl: logoUrl || null,
      avatarUrl: avatarUrl || null,
      launcherImageUrl: launcherImageUrl || null,
      botIconUrl: botIconUrl || null,
      widgetPosition,
      labelContactButton: labelContactButton.trim() || null,
      labelTicketButton: labelTicketButton.trim() || null,
      labelFinalizeButton: labelFinalizeButton.trim() || null,
      domain: domain.trim() || null,
      consultationOptions: consultationOptions.length > 0 ? JSON.stringify(consultationOptions) : null,
      showProductSearch: (showProductSearch && productApiUrl.trim()) ? 1 : 0,
      productSearchLabel,
      productApiUrl: productApiUrl.trim() || null,
      welcomeBannerText: welcomeBannerText.trim() || null,
      launcherBubbleText: launcherBubbleText.trim() || null,
      botConfigured: isConfigComplete ? 1 : 0,
    };
    updateMutation.mutate(data);
  };

  const [previewMode, setPreviewMode] = useState<"welcome" | "chat" | "launcher">("welcome");

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      <div className="flex-1 min-w-0 space-y-6">

      <div className="rounded-2xl glass-card p-6 space-y-6 animate-dash-scale-in relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full animate-orb-drift opacity-30" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.06), transparent 60%)", animationDelay: "-3s" }} />

        <div className="relative">
          <h3 className="text-lg font-bold mb-1 animate-dash-slide-right flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Tu Negocio
          </h3>
          <p className="text-sm text-white/40 animate-dash-slide-right dash-stagger-1">Ingresa tu sitio web y FoxBot aprendera sobre tu negocio automáticamente</p>
        </div>

        <div className="space-y-2 animate-dash-fade-up dash-stagger-1 relative">
          <label className="text-sm font-medium text-white/60">Sitio Web</label>
          <div className="flex items-center gap-2">
            <Input
              data-testid="input-domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="www.minegocio.cl"
              className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40 transition-all duration-300 focus:shadow-[0_0_16px_rgba(16,185,129,0.1)]"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAnalyzeUrl(); } }}
            />
            <Button
              onClick={handleAnalyzeUrl}
              disabled={analyzingUrl || !domain.trim()}
              className="h-11 rounded-xl px-4 font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20 shrink-0"
              data-testid="button-analyze-url"
            >
              {analyzingUrl ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analizando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  Analizar sitio
                </span>
              )}
            </Button>
          </div>
          <p className="text-xs text-white/30">Al analizar tu sitio web, FoxBot extraera automáticamente la información de tu negocio (productos, servicios, contacto, horarios) y entrenara el chatbot por ti.</p>
        </div>

        {analyzedResult && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-xl bg-green-500/5 border border-green-500/15 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <CircleCheck className="w-4 h-4 text-green-400" />
              <p className="text-sm font-medium text-green-400">Sitio analizado correctamente</p>
            </div>
            <p className="text-xs text-white/40">La información extraida se guardo en el entrenamiento del bot. Puedes revisarla y editarla en la sección "Entrenar Bot" del Panel de Soporte.</p>
          </div>
        )}

        {!tenant.botContext && !analyzedResult && domain.trim() && (
          <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-3 flex items-start gap-2">
            <Wand2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/80">Haz clic en "Analizar sitio" para que el bot aprenda sobre tu negocio automáticamente. Solo toma unos segundos.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          <div className="space-y-2 animate-dash-fade-up dash-stagger-2">
            <label className="text-sm font-medium text-white/60">Avatar del Bot (opcional)</label>
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <div className="relative group">
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-14 w-14 rounded-full object-cover border border-white/[0.08]"
                    data-testid="img-avatar-preview"
                    onError={() => setAvatarUrl("")}
                  />
                  <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button
                      data-testid="button-change-avatar"
                      onClick={() => avatarInputRef.current?.click()}
                      className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <Upload className="w-3 h-3 text-white" />
                    </button>
                    <button
                      data-testid="button-remove-avatar"
                      onClick={() => { setAvatarUrl(""); saveFieldToDb("avatarUrl", null); }}
                      className="p-1 rounded-full bg-red-500/20 hover:bg-red-500/30 transition-colors"
                    >
                      <X className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  data-testid="button-upload-avatar"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="h-14 w-14 rounded-full border-2 border-dashed border-white/[0.1] hover:border-primary/40 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 flex items-center justify-center text-white/40 hover:text-white/60 shrink-0"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <UserCircle className="w-6 h-6" />
                  )}
                </button>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                  e.target.value = "";
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/50">Imagen que se muestra como foto de perfil del bot en el chat.</p>
                <p className="text-xs text-white/30 mt-0.5">PNG, JPG. Maximo 5MB.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl glass-card p-6 space-y-6 animate-dash-scale-in relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full animate-orb-drift opacity-30" style={{ background: `radial-gradient(circle, ${widgetColor}10, transparent 60%)` }} />

        <div className="relative">
          <h3 className="text-lg font-bold mb-1 animate-dash-slide-right flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Apariencia del Widget
          </h3>
          <p className="text-sm text-white/40 animate-dash-slide-right dash-stagger-1">Color, logo y textos de tu chatbot</p>
        </div>

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

        <div className="space-y-3 animate-dash-fade-up dash-stagger-2">
          <label className="text-sm font-medium text-white/60 flex items-center gap-2">
            <Palette className="w-3.5 h-3.5 text-primary" />
            Colores del Widget
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: "Color principal", value: widgetColor, setter: setWidgetColor, testId: "widget-color", desc: "Header y burbujas del usuario" },
              { label: "Texto del header", value: headerTextColor, setter: setHeaderTextColor, testId: "header-text-color", desc: "Nombre y estado en el header" },
              { label: "Burbuja del bot", value: botBubbleColor, setter: setBotBubbleColor, testId: "bot-bubble-color", desc: "Fondo de mensajes del bot" },
              { label: "Texto del bot", value: botTextColor, setter: setBotTextColor, testId: "bot-text-color", desc: "Color del texto del bot" },
              { label: "Texto del usuario", value: userTextColor, setter: setUserTextColor, testId: "user-text-color", desc: "Color del texto del usuario" },
            ].map((c) => (
              <div key={c.testId} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                <label className="text-xs font-medium text-white/50">{c.label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={c.value}
                    onChange={(e) => c.setter(e.target.value)}
                    className="h-9 w-10 rounded-lg border border-white/[0.08] cursor-pointer bg-transparent transition-transform duration-200 hover:scale-105"
                    data-testid={`input-${c.testId}`}
                  />
                  <Input
                    value={c.value}
                    onChange={(e) => c.setter(e.target.value)}
                    className="flex-1 h-9 rounded-lg bg-white/[0.04] border-white/[0.08] focus:border-primary/40 font-mono text-xs transition-all duration-300"
                    data-testid={`input-${c.testId}-text`}
                  />
                </div>
                <p className="text-[10px] text-white/25">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 animate-dash-fade-up dash-stagger-3 relative">
          <label className="text-sm font-medium text-white/60">Mensaje de Bienvenida</label>
          <Input
            data-testid="input-welcome-message"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="Hola, ¿en qué podemos ayudarte?"
            className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40 transition-all duration-300 focus:shadow-[0_0_16px_rgba(16,185,129,0.1)]"
          />
        </div>

        <div className="space-y-2 animate-dash-fade-up dash-stagger-4 relative">
          <label className="text-sm font-medium text-white/60">Subtitulo (texto bajo el mensaje)</label>
          <Input
            data-testid="input-welcome-subtitle"
            value={welcomeSubtitle}
            onChange={(e) => setWelcomeSubtitle(e.target.value)}
            placeholder="Completa tus datos para iniciar la conversación"
            className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40 transition-all duration-300 focus:shadow-[0_0_16px_rgba(16,185,129,0.1)]"
          />
        </div>

        <div className="space-y-2 animate-dash-fade-up dash-stagger-4 relative">
          <label className="text-sm font-medium text-white/60">Banner de anuncio (opcional)</label>
          <Input
            data-testid="input-welcome-banner"
            value={welcomeBannerText}
            onChange={(e) => setWelcomeBannerText(e.target.value)}
            placeholder="Ej: ¡Oferta especial esta semana!"
            className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40 transition-all duration-300 focus:shadow-[0_0_16px_rgba(16,185,129,0.1)]"
          />
          <p className="text-xs text-white/30">Se muestra como banner destacado en el formulario de bienvenida</p>
        </div>

        <div className="space-y-2 animate-dash-fade-up dash-stagger-4 relative">
          <label className="text-sm font-medium text-white/60">Burbuja del botón (opcional)</label>
          <Input
            data-testid="input-launcher-bubble"
            value={launcherBubbleText}
            onChange={(e) => setLauncherBubbleText(e.target.value)}
            placeholder="Ej: ¿Necesitas ayuda?"
            className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40 transition-all duration-300 focus:shadow-[0_0_16px_rgba(16,185,129,0.1)]"
          />
          <p className="text-xs text-white/30">Texto emergente junto al botón flotante del chat (se oculta tras 5 segundos)</p>
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
                    onClick={() => { setLogoUrl(""); saveFieldToDb("logoUrl", null); }}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          <div className="space-y-2 animate-dash-fade-up dash-stagger-5">
            <label className="text-sm font-medium text-white/60">Botón flotante del chat (opcional)</label>
            <div className="flex items-center gap-3">
              {launcherImageUrl ? (
                <div className="relative group">
                  <img
                    src={launcherImageUrl}
                    alt="Botón"
                    className="h-14 w-14 rounded-full object-cover border border-white/[0.08]"
                    data-testid="img-launcher-preview"
                    onError={() => setLauncherImageUrl("")}
                  />
                  <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button
                      data-testid="button-change-launcher"
                      onClick={() => launcherInputRef.current?.click()}
                      className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <Upload className="w-3 h-3 text-white" />
                    </button>
                    <button
                      data-testid="button-remove-launcher"
                      onClick={() => { setLauncherImageUrl(""); saveFieldToDb("launcherImageUrl", null); }}
                      className="p-1 rounded-full bg-red-500/20 hover:bg-red-500/30 transition-colors"
                    >
                      <X className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  data-testid="button-upload-launcher"
                  onClick={() => launcherInputRef.current?.click()}
                  disabled={uploadingLauncher}
                  className="h-14 w-14 rounded-full border-2 border-dashed border-white/[0.1] hover:border-primary/40 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 flex items-center justify-center text-white/40 hover:text-white/60 shrink-0"
                >
                  {uploadingLauncher ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <MessageCircle className="w-6 h-6" />
                  )}
                </button>
              )}
              <input
                ref={launcherInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, setLauncherImageUrl, setUploadingLauncher, "Botón flotante", "launcherImageUrl");
                  e.target.value = "";
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/50">Imagen personalizada para el botón flotante del chat.</p>
                <p className="text-xs text-white/30 mt-0.5">Si no se sube, se usa el ícono predeterminado.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 animate-dash-fade-up dash-stagger-5">
            <label className="text-sm font-medium text-white/60">Ícono del bot en mensajes (opcional)</label>
            <div className="flex items-center gap-3">
              {botIconUrl ? (
                <div className="relative group">
                  <img
                    src={botIconUrl}
                    alt="Ícono bot"
                    className="h-14 w-14 rounded-full object-cover border border-white/[0.08]"
                    data-testid="img-boticon-preview"
                    onError={() => setBotIconUrl("")}
                  />
                  <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button
                      data-testid="button-change-boticon"
                      onClick={() => botIconInputRef.current?.click()}
                      className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <Upload className="w-3 h-3 text-white" />
                    </button>
                    <button
                      data-testid="button-remove-boticon"
                      onClick={() => { setBotIconUrl(""); saveFieldToDb("botIconUrl", null); }}
                      className="p-1 rounded-full bg-red-500/20 hover:bg-red-500/30 transition-colors"
                    >
                      <X className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  data-testid="button-upload-boticon"
                  onClick={() => botIconInputRef.current?.click()}
                  disabled={uploadingBotIcon}
                  className="h-14 w-14 rounded-full border-2 border-dashed border-white/[0.1] hover:border-primary/40 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 flex items-center justify-center text-white/40 hover:text-white/60 shrink-0"
                >
                  {uploadingBotIcon ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Headphones className="w-6 h-6" />
                  )}
                </button>
              )}
              <input
                ref={botIconInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, setBotIconUrl, setUploadingBotIcon, "Ícono del bot", "botIconUrl");
                  e.target.value = "";
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/50">Imagen que aparece junto a los mensajes del bot.</p>
                <p className="text-xs text-white/30 mt-0.5">Si no se sube, se usa el ícono de auriculares.</p>
              </div>
            </div>
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
            API de Productos
          </h3>
          <p className="text-sm text-white/40">Conecta tu catálogo de productos para que los clientes puedan buscar en el chat</p>
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
          ) : "Guardar Configuración"}
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
                <button
                  data-testid="button-preview-launcher"
                  onClick={() => setPreviewMode("launcher")}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${previewMode === "launcher" ? "bg-white/[0.1] text-white/90" : "text-white/40 hover:text-white/60"}`}
                >
                  Botón
                </button>
              </div>
            </div>

            <div
              className="rounded-xl border border-white/[0.08] overflow-hidden transition-all duration-500"
              style={{ height: 520 }}
              data-testid="widget-preview-container"
            >
              {previewMode === "launcher" ? (
                <div className="flex flex-col h-full items-center justify-center" style={{ background: "#1a1a1a" }}>
                  <p className="text-xs text-white/40 mb-6">Así se verá el botón flotante en tu sitio:</p>
                  <div className="relative flex items-center gap-2">
                    {launcherBubbleText && (
                      <div className="max-w-[160px] px-2.5 py-1.5 rounded-xl rounded-br-sm text-[10px] font-medium" style={{ backgroundColor: "#1a1a1a", color: "#e0e0e0", border: `1px solid ${widgetColor}30`, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                        {launcherBubbleText}
                      </div>
                    )}
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl overflow-hidden shrink-0"
                      style={{ backgroundColor: launcherImageUrl ? "transparent" : widgetColor }}
                    >
                      {launcherImageUrl ? (
                        <img src={launcherImageUrl} alt="Botón" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <MessageCircle className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-white/25 mt-4">{launcherImageUrl ? "Imagen personalizada" : "Botón predeterminado"}</p>
                  <div className="mt-8 flex items-center gap-3">
                    <p className="text-xs text-white/40">Ícono del bot en mensajes:</p>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border"
                      style={{ backgroundColor: botIconUrl ? "transparent" : `${widgetColor}20`, borderColor: botIconUrl ? "transparent" : `${widgetColor}30` }}
                    >
                      {botIconUrl ? (
                        <img src={botIconUrl} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <Headphones className="w-4 h-4" style={{ color: widgetColor }} />
                      )}
                    </div>
                    <p className="text-[10px] text-white/25">{botIconUrl ? "Personalizado" : "Predeterminado"}</p>
                  </div>
                  <div className="mt-6 flex flex-col items-center gap-2">
                    <p className="text-xs text-white/40">Posición del widget:</p>
                    <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] border border-white/[0.08] p-1" data-testid="widget-position-toggle">
                      <button
                        data-testid="button-position-left"
                        onClick={() => setWidgetPosition("left")}
                        className={`text-[11px] px-3 py-1.5 rounded-md transition-colors font-medium ${widgetPosition === "left" ? "bg-primary/20 text-primary" : "text-white/40 hover:text-white/60"}`}
                      >
                        Izquierda
                      </button>
                      <button
                        data-testid="button-position-right"
                        onClick={() => setWidgetPosition("right")}
                        className={`text-[11px] px-3 py-1.5 rounded-md transition-colors font-medium ${widgetPosition === "right" ? "bg-primary/20 text-primary" : "text-white/40 hover:text-white/60"}`}
                      >
                        Derecha
                      </button>
                    </div>
                  </div>
                  <div className="mt-6 w-full max-w-[280px] mx-auto space-y-2">
                    <p className="text-xs text-white/40 text-center">Textos de los botones del chat:</p>
                    <div className="space-y-1.5">
                      <input
                        data-testid="input-label-contact"
                        value={labelContactButton}
                        onChange={(e) => setLabelContactButton(e.target.value)}
                        placeholder="Contactar un ejecutivo"
                        className="w-full text-[11px] px-2.5 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
                      />
                      <input
                        data-testid="input-label-ticket"
                        value={labelTicketButton}
                        onChange={(e) => setLabelTicketButton(e.target.value)}
                        placeholder="Contactar un ejecutivo (fuera de horario)"
                        className="w-full text-[11px] px-2.5 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
                      />
                      <input
                        data-testid="input-label-finalize"
                        value={labelFinalizeButton}
                        onChange={(e) => setLabelFinalizeButton(e.target.value)}
                        placeholder="Finalizar y Valorar"
                        className="w-full text-[11px] px-2.5 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
                      />
                      <p className="text-[9px] text-white/20 text-center">Deja vacío para usar los textos predeterminados</p>
                    </div>
                  </div>
                </div>
              ) : previewMode === "welcome" ? (
                <div className="flex flex-col h-full" style={{ background: "#1a1a1a" }}>
                  <div className="px-4 py-3 flex items-center justify-between shrink-0" style={{ background: widgetColor }}>
                    <div className="flex items-center gap-2 min-w-0">
                      {logoUrl ? (
                        <img src={logoUrl} alt="" className="w-8 h-8 rounded-full object-cover bg-white/15" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                          <Headphones className="w-3.5 h-3.5" style={{ color: headerTextColor }} />
                        </div>
                      )}
                      <span className="text-sm font-semibold truncate" style={{ color: headerTextColor }}>{companyName || "Mi Empresa"}</span>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                      <X className="w-3.5 h-3.5" style={{ color: headerTextColor }} />
                    </div>
                  </div>
                  <div className="flex flex-col items-center pt-4 pb-2 px-4 shrink-0">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2 border overflow-hidden" style={{ backgroundColor: `${widgetColor}20`, borderColor: `${widgetColor}30` }}>
                      {logoUrl ? (
                        <img src={logoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <Headphones className="w-6 h-6" style={{ color: widgetColor }} />
                      )}
                    </div>
                    <h2 className="text-sm font-bold text-white mb-0.5 text-center">{welcomeMessage || "Hola, ¿en qué podemos ayudarte?"}</h2>
                    <p className="text-[10px] text-white/50 text-center">{welcomeSubtitle || "Completa tus datos para iniciar la conversación"}</p>
                  </div>
                  {welcomeBannerText && (
                    <div className="mx-4 px-2.5 py-1.5 rounded-lg text-[10px] text-center font-medium" style={{ backgroundColor: `${widgetColor}15`, border: `1px solid ${widgetColor}30`, color: widgetColor }}>
                      {welcomeBannerText}
                    </div>
                  )}
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
                        <Headphones className="w-3.5 h-3.5" style={{ color: headerTextColor }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate" style={{ color: headerTextColor }}>{companyName || "Mi Empresa"}</h3>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-300" />
                        <span className="text-[10px] text-green-200">En línea</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                        <Search className="w-3.5 h-3.5" style={{ color: headerTextColor }} />
                      </div>
                      <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                        <X className="w-3.5 h-3.5" style={{ color: headerTextColor }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                    <div className="flex items-end gap-1.5">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border" style={{ backgroundColor: botIconUrl ? "transparent" : `${widgetColor}20`, borderColor: botIconUrl ? "transparent" : `${widgetColor}30` }}>
                        {botIconUrl ? (
                          <img src={botIconUrl} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <Headphones className="w-3 h-3" style={{ color: widgetColor }} />
                        )}
                      </div>
                      <div className="max-w-[75%]">
                        <div className="rounded-md rounded-bl-none px-3 py-2" style={{ backgroundColor: botBubbleColor, border: `1px solid ${botBubbleColor === "#2a2a2a" ? "rgba(255,255,255,0.1)" : botBubbleColor}` }}>
                          <p className="text-[12px] leading-relaxed" style={{ color: botTextColor }}>¡Hola! Bienvenido a {companyName || "nuestra tienda"}. ¿En qué puedo ayudarte hoy?</p>
                        </div>
                        <span className="text-[9px] text-white/25 mt-0.5 block">11:30 a.m.</span>
                      </div>
                    </div>
                    <div className="flex items-end gap-1.5 flex-row-reverse">
                      <div className="max-w-[75%]">
                        <div className="rounded-md rounded-br-none px-3 py-2" style={{ backgroundColor: widgetColor, color: userTextColor }}>
                          <p className="text-[12px] leading-relaxed">Hola, quiero información sobre sus productos</p>
                        </div>
                        <span className="text-[9px] text-white/25 mt-0.5 block text-right">11:31 a.m.</span>
                      </div>
                    </div>
                    <div className="flex items-end gap-1.5">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border" style={{ backgroundColor: botIconUrl ? "transparent" : `${widgetColor}20`, borderColor: botIconUrl ? "transparent" : `${widgetColor}30` }}>
                        {botIconUrl ? (
                          <img src={botIconUrl} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <Headphones className="w-3 h-3" style={{ color: widgetColor }} />
                        )}
                      </div>
                      <div className="max-w-[75%]">
                        <div className="rounded-md rounded-bl-none px-3 py-2" style={{ backgroundColor: botBubbleColor, border: `1px solid ${botBubbleColor === "#2a2a2a" ? "rgba(255,255,255,0.1)" : botBubbleColor}` }}>
                          <p className="text-[12px] leading-relaxed" style={{ color: botTextColor }}>Claro! Aquí tienes nuestras opciones:</p>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1 pl-0.5">
                          <span className="px-2 py-1 text-[10px] font-semibold rounded-md border" style={{ borderColor: `${widgetColor}90`, backgroundColor: `${widgetColor}30`, color: "rgba(255,255,255,0.7)" }}>Ver catálogo</span>
                          <span className="px-2 py-1 text-[10px] font-semibold rounded-md border" style={{ borderColor: `${widgetColor}90`, backgroundColor: `${widgetColor}30`, color: "rgba(255,255,255,0.7)" }}>Precios</span>
                        </div>
                        <span className="text-[9px] text-white/25 mt-0.5 block">11:31 a.m.</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-3 pt-2 pb-1 border-t border-white/10 shrink-0">
                    <div className="w-full mb-2 font-semibold text-[12px] flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5" style={{ backgroundColor: widgetColor, color: headerTextColor }}>
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
                      <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: widgetColor, color: headerTextColor }}>
                        <Send className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                  <div className="py-1.5 px-3 border-t border-white/[0.04] shrink-0">
                    <p className="text-[9px] text-white/20 text-center">Potenciado por <span className="font-medium">FoxBot</span></p>
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

interface PlatformGuide {
  id: string;
  name: string;
  icon: any;
  color: string;
  difficulty: "fácil" | "medio";
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
    var pos = 'right';
    function setPos(p, state) {
      var s = p === 'left' ? 'left' : 'right';
      var o = p === 'left' ? 'right' : 'left';
      var mobile = window.innerWidth <= 480;
      if (state === 'open') {
        if (mobile) {
          iframe.style.cssText = 'position:fixed;bottom:0;left:0;width:100%;height:100%;border:none;z-index:9999;';
        } else {
          iframe.style.cssText = 'position:fixed;bottom:16px;' + s + ':16px;' + o + ':auto;width:400px;height:620px;border:none;z-index:9999;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.3);';
        }
      } else {
        iframe.style.cssText = 'position:fixed;bottom:12px;' + s + ':12px;' + o + ':auto;width:70px;height:70px;border:none;z-index:9999;';
      }
    }
    setPos(pos, 'closed');
    document.body.appendChild(iframe);
    window.addEventListener('message', function(e) {
      if (!e.data || !e.data.type) return;
      if (e.data.position) pos = e.data.position;
      if (e.data.type === 'foxbot_position') { pos = e.data.position; setPos(pos, 'closed'); }
      if (e.data.type === 'open_chat') setPos(pos, 'open');
      if (e.data.type === 'close_chat') setPos(pos, 'closed');
    });
  })();
</script>`;

  const iframeCode = embedScript;

  const platforms: PlatformGuide[] = [
    {
      id: "wordpress", name: "WordPress", icon: SiWordpress, color: "#21759b", difficulty: "fácil",
      steps: [
        { title: "Accede a tu panel de WordPress", description: "Ingresa a tu administrador de WordPress (tu-sitio.com/wp-admin)." },
        { title: "Ve a Apariencia > Editor de temas", description: "En el menú lateral, navega a Apariencia > Editor de temas. Si prefieres no editar archivos, instala el plugin gratuito 'WPCode' o 'Insert Headers and Footers'.", note: "Con WPCode: Ve a Code Snippets > Header & Footer > pega el código en el campo 'Footer'." },
        { title: "Abre el archivo footer.php", description: "En el editor de temas, selecciona footer.php de la lista de archivos del tema." },
        { title: "Pega el código antes de </body>", description: "Agrega el siguiente código justo antes de la etiqueta </body>:", code: embedScript },
        { title: "Guarda los cambios", description: "Haz clic en 'Actualizar archivo'. El chatbot aparecerá automáticamente en todas las paginas de tu sitio." },
      ],
    },
    {
      id: "woocommerce", name: "WooCommerce", icon: SiWoocommerce, color: "#96588a", difficulty: "fácil",
      steps: [
        { title: "Mismos pasos que WordPress", description: "WooCommerce funciona sobre WordPress, así que el proceso es idéntico. Sigue los pasos de WordPress." },
        { title: "Pega el código en footer.php", description: "Ve a Apariencia > Editor de temas > footer.php y pega este código antes de </body>:", code: embedScript },
        { title: "Conecta tu catálogo (opcional)", description: "Para que el bot muestre tus productos, activa el buscador de productos en Configuración > API de Productos e ingresa tu URL de WooCommerce REST API.", note: "Formato de URL: https://tu-tienda.com/wp-json/wc/v3/products" },
      ],
    },
    {
      id: "shopify", name: "Shopify", icon: SiShopify, color: "#95bf47", difficulty: "fácil",
      steps: [
        { title: "Ve a tu panel de Shopify", description: "Ingresa a tu administrador en tu-tienda.myshopify.com/admin." },
        { title: "Abre el editor de temas", description: "Ve a Tienda Online > Temas > haz clic en '...' junto a tu tema activo > Editar código." },
        { title: "Abre theme.liquid", description: "En el editor de código, busca y abre Layout > theme.liquid." },
        { title: "Pega el código antes de </body>", description: "Busca la etiqueta </body> y pega este código justo antes:", code: embedScript },
        { title: "Guarda", description: "Haz clic en 'Guardar'. El chatbot aparecerá en tu tienda inmediatamente." },
      ],
    },
    {
      id: "squarespace", name: "Squarespace", icon: SiSquarespace, color: "#ffffff", difficulty: "fácil",
      steps: [
        { title: "Accede a tu panel", description: "Ingresa a tu cuenta de Squarespace." },
        { title: "Ve a Configuración > Avanzado", description: "Navega a Configuración > Avanzado > Inyeccion de código." },
        { title: "Pega en el campo 'Footer'", description: "En la sección Footer, pega el siguiente código:", code: embedScript },
        { title: "Guarda", description: "Haz clic en 'Guardar'. El chatbot estará en todas las paginas.", note: "Requiere plan Business o superior de Squarespace." },
      ],
    },
    {
      id: "wix", name: "Wix", icon: SiWix, color: "#0c6efc", difficulty: "fácil",
      steps: [
        { title: "Abre el editor de Wix", description: "Ingresa a tu sitio en Wix y abre el editor." },
        { title: "Agrega un bloque HTML", description: "Haz clic en Agregar (+) > Embeds > HTML embebido. Arrastralo a cualquier parte." },
        { title: "Pega el código", description: "Haz clic en 'Introducir código' y pega lo siguiente:", code: embedScript },
        { title: "Publica", description: "Haz clic en 'Publicar'. El chatbot aparecerá en tu sitio en vivo." },
      ],
    },
    {
      id: "webflow", name: "Webflow", icon: SiWebflow, color: "#4353ff", difficulty: "fácil",
      steps: [
        { title: "Abre la configuración del proyecto", description: "En tu dashboard de Webflow, abre la configuración de tu proyecto." },
        { title: "Ve a Custom Code", description: "Navega a la pestaña 'Custom Code'." },
        { title: "Pega en Footer Code", description: "En el campo 'Footer Code', pega el siguiente código:", code: embedScript },
        { title: "Publica", description: "Haz clic en 'Publish'. El chatbot aparecerá en tu sitio." },
      ],
    },
    {
      id: "magento", name: "Magento", icon: SiMagento, color: "#f46f25", difficulty: "medio",
      steps: [
        { title: "Accede al panel de administración", description: "Ve a Content > Design > Configuration en tu panel de Magento." },
        { title: "Edita el tema", description: "Selecciona tu Store View > Edit > sección HTML Head o Footer." },
        { title: "Pega el script", description: "Pega este código en 'Miscellaneous Scripts':", code: embedScript },
        { title: "Limpia la cache", description: "Ve a System > Cache Management y limpia la cache." },
      ],
    },
    {
      id: "html", name: "HTML / Cualquier web", icon: SiHtml5, color: "#e34f26", difficulty: "fácil",
      steps: [
        { title: "Abre tu archivo HTML", description: "Abre el archivo principal de tu sitio web (generalmente index.html)." },
        { title: "Pega antes de </body>", description: "Agrega el siguiente código justo antes de la etiqueta de cierre </body>:", code: embedScript },
        { title: "Sube los cambios", description: "Guarda el archivo y subelo a tu servidor. El chatbot aparecerá automáticamente." },
      ],
    },
    {
      id: "gtm", name: "Google Tag Manager", icon: SiGoogletagmanager, color: "#4285f4", difficulty: "medio",
      steps: [
        { title: "Abre Google Tag Manager", description: "Ingresa a tagmanager.google.com y selecciona tu contenedor." },
        { title: "Crea una nueva etiqueta", description: "Haz clic en 'Etiquetas' > 'Nueva' > tipo 'HTML personalizado'." },
        { title: "Pega el código", description: "En el campo de HTML, pega lo siguiente:", code: embedScript },
        { title: "Configura el activador", description: "En 'Activacion', selecciona 'All Pages' (Todas las paginas)." },
        { title: "Publica", description: "Haz clic en 'Enviar' para publicar los cambios." },
      ],
    },
    {
      id: "prestashop", name: "PrestaShop", icon: Code, color: "#df0067", difficulty: "medio",
      steps: [
        { title: "Accede al back office", description: "Ingresa a tu panel de administración de PrestaShop." },
        { title: "Ve a Diseño > Posiciones", description: "Navega a Diseño > Posiciones de modulos." },
        { title: "Agrega un modulo HTML", description: "Usa el modulo 'HTML personalizado' y ancla a la posicion 'displayFooter'." },
        { title: "Pega el código", description: "En el contenido del modulo, pega:", code: embedScript },
        { title: "Guarda", description: "Guarda los cambios. El chatbot aparecerá en tu tienda." },
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
          Antes de obtener el código de integración, debes configurar tu chatbot en la sección de Configuración. Define el nombre de tu empresa, color, mensaje de bienvenida y opciones de consulta.
        </p>
        <p className="text-xs text-white/30">
          Ve a Configuración → completa los datos → guarda → vuelve aquí para obtener tu código.
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
            <p className="text-sm text-white/40 animate-dash-slide-right dash-stagger-1">FoxBot se integra con cualquier sitio web o plataforma que soporte HTML. Solo necesitas pegar un pequeño código y tu asistente estará listo.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 shrink-0 ml-4">
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
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${p.difficulty === "fácil" ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"}`}>
                  {p.difficulty === "fácil" ? "Fácil" : "Intermedio"}
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
                          {copied === `step-${i}` ? "Copiado!" : "Copiar código"}
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
                <p className="text-xs text-white/40">Después de seguir estos pasos, el chatbot aparecerá automáticamente en la esquina inferior derecha de tu sitio web. Se adapta a cualquier pantalla (desktop y móvil).</p>
              </div>
            </div>
          </div>
        )}

        {!selectedPlatform && (
          <div className="space-y-4">
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5 text-center space-y-2">
              <Code className="w-8 h-8 text-white/20 mx-auto" />
              <p className="text-sm text-white/50">Selecciona una plataforma para ver las instrucciones paso a paso</p>
              <p className="text-xs text-white/30">O copia directamente el código de integración de abajo</p>
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
                  {copied === "script" ? "Copiado!" : "Copiar código"}
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
                  {copied === "iframe" ? "Copiado!" : "Copiar código"}
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
              <p className="text-[11px] text-white/40">Nuestro equipo te guia en la instalación</p>
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
                  <p className="text-[10px] text-white/40">Respuesta rápida</p>
                </div>
              </a>

              <a
                href="mailto:contacto@webmakerchile.cl?subject=Ayuda%20instalaci%C3%B3n%20FoxBot&body=Hola%2C%20necesito%20ayuda%20para%20instalar%20FoxBot%20en%20mi%20sitio%20web."
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
                  <p className="text-xs text-white/40">Un ejecutivo se contactara contigo para guiarte en la instalación.</p>
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
                      placeholder="Tu correo electrónico"
                      className="h-9 text-xs bg-white/[0.04] border-white/[0.08]"
                      data-testid="input-help-email"
                    />
                  </div>
                  <Textarea
                    value={helpMessage}
                    onChange={(e) => setHelpMessage(e.target.value)}
                    placeholder="Describe en qué necesitas ayuda (ej: No sé dónde pegar el código en mi WordPress)..."
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
                        if (!res.ok) throw new Error("Error al enviar solicitud");
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

interface ReferralData {
  code: string;
  confirmedCount: number;
  pendingCount: number;
  paidReferralCount: number;
  isAmbassador: boolean;
  ambassadorThreshold: number;
  cashPerReferral: number;
  referrals: { id: number; referredName: string; referredEmail: string; referredPlan: string; confirmed: number; createdAt: string; confirmedAt: string | null }[];
  currentReward: { plan: string; planLabel: string; expiresAt: string; months: number } | null;
  nextReward: { target: number; current: number; plan: string; months: number } | null;
  cashBalance: number;
  totalCashEarned: number;
}

function ReferidosSection() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const token = localStorage.getItem("tenant_token");

  const { data, isLoading } = useQuery<ReferralData>({
    queryKey: ["/api/tenants/me/referral"],
    queryFn: async () => {
      const res = await fetch("/api/tenants/me/referral", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Error al cargar datos de referidos");
      return res.json();
    },
  });

  const copyLink = () => {
    if (!data?.code) return;
    const link = `${window.location.origin}/register?ref=${data.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({ title: "Link copiado", description: "Comparte este link con otros negocios" });
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = () => {
    if (!data?.code) return;
    navigator.clipboard.writeText(data.code);
    toast({ title: "Código copiado" });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const progress = data.nextReward ? (data.nextReward.current / data.nextReward.target) * 100 : 100;
  const formatCLP = (v: number) => `$${v.toLocaleString("es-CL")}`;

  const tiers = [
    { refs: 1, cash: "$3.000", reward: "+ 1 mes Fox Pro", color: "16,185,129", icon: <Gift className="w-4 h-4" />, desc: "Tu primer referido: dinero + plan premium" },
    { refs: 3, cash: "$9.000", reward: "+ 2 meses Fox Pro", color: "59,130,246", icon: <Star className="w-4 h-4" />, desc: "Acumulas $3.000 CLP por cada referido" },
    { refs: 5, cash: "$15.000", reward: "+ 3 meses Fox Enterprise", color: "245,158,11", icon: <Trophy className="w-4 h-4" />, desc: "Sesiones y mensajes ilimitados para ti" },
    { refs: 10, cash: "$30.000", reward: "+ 6 meses Fox Enterprise", color: "168,85,247", icon: <Crown className="w-4 h-4" />, desc: "Nivel experto: dinero real + el mejor plan" },
    { refs: 15, cash: "$45.000", reward: "Embajador FoxBot", color: "236,72,153", icon: <Shield className="w-4 h-4" />, desc: "Plan gratis permanente + $5.000 por referido" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl glass-card p-6 animate-dash-scale-in relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full animate-subtle-breathe" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.1), transparent 60%)" }} />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full animate-subtle-breathe" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.08), transparent 60%)", animationDelay: "-3s" }} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3 animate-dash-slide-right">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Gift className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold" data-testid="text-referidos-title">Programa de Referidos</h3>
              <p className="text-sm text-white/40">Gana dinero real + meses gratis por cada negocio que invites</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 animate-dash-fade-up">
            <div className="rounded-xl p-4 text-center" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))", border: "1px solid rgba(16,185,129,0.2)" }}>
              <DollarSign className="w-5 h-5 text-primary mx-auto mb-1.5" />
              <div className="text-xl font-black text-primary" data-testid="text-cash-balance">{formatCLP(data.cashBalance)}</div>
              <p className="text-[10px] text-white/40 mt-0.5">Saldo disponible</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))", border: "1px solid rgba(245,158,11,0.2)" }}>
              <TrendingUp className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
              <div className="text-xl font-black text-amber-400" data-testid="text-total-earned">{formatCLP(data.totalCashEarned)}</div>
              <p className="text-[10px] text-white/40 mt-0.5">Total ganado</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.04))", border: "1px solid rgba(59,130,246,0.2)" }}>
              <Users className="w-5 h-5 text-blue-400 mx-auto mb-1.5" />
              <div className="text-xl font-black text-blue-400" data-testid="text-confirmed-count">{data.confirmedCount}</div>
              <p className="text-[10px] text-white/40 mt-0.5">Referidos confirmados</p>
            </div>
          </div>

          {data.isAmbassador && (
            <div className="rounded-xl p-4 mb-6 animate-dash-fade-up relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(168,85,247,0.1))", border: "1px solid rgba(236,72,153,0.3)" }} data-testid="banner-ambassador">
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full" style={{ background: "radial-gradient(circle, rgba(236,72,153,0.15), transparent 60%)" }} />
              <div className="relative flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(236,72,153,0.2)" }}>
                  <Shield className="w-6 h-6 text-pink-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-pink-400">Embajador FoxBot</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30">ACTIVO</span>
                  </div>
                  <p className="text-xs text-white/50 mt-0.5">
                    Ganas <span className="text-pink-400 font-bold">$5.000 CLP</span> por referido · Plan Fox Enterprise gratis mientras mantengas {data.ambassadorThreshold}+ referidos pagados
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-white/40">
                <Users className="w-3.5 h-3.5 text-pink-400/60" />
                <span>{data.paidReferralCount} referidos con plan pagado activo</span>
              </div>
            </div>
          )}

          {!data.isAmbassador && data.paidReferralCount >= 10 && (
            <div className="rounded-xl p-3 mb-6 animate-dash-fade-up" style={{ background: "rgba(236,72,153,0.06)", border: "1px solid rgba(236,72,153,0.15)" }}>
              <div className="flex items-center gap-2 text-xs text-pink-300/80">
                <Shield className="w-3.5 h-3.5" />
                <span>Te faltan <span className="font-bold text-pink-400">{data.ambassadorThreshold - data.paidReferralCount}</span> referidos pagados para ser Embajador ({data.paidReferralCount}/{data.ambassadorThreshold})</span>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/15 p-4 mb-6 animate-dash-fade-up dash-stagger-1">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-amber-400">{formatCLP(data.cashPerReferral)} CLP por cada referido confirmado</span>
            </div>
            <p className="text-xs text-white/40">
              Cada vez que un negocio se registra con tu enlace y compra Fox Pro o Fox Enterprise, recibes {formatCLP(data.cashPerReferral)} CLP en saldo.
              {data.isAmbassador ? " Como Embajador, ganas $5.000 en vez de $3.000 por referido." : " Los Embajadores ganan $5.000 por referido."}
              {" "}Solo cuentan referidos con plan de pago activo.
            </p>
          </div>

          <h4 className="text-sm font-bold text-white/60 mb-3 animate-dash-fade-up dash-stagger-1">Escalera de recompensas</h4>
          <div className="space-y-2.5 mb-6 animate-dash-fade-up dash-stagger-1">
            {tiers.map((tier) => {
              const achieved = data.confirmedCount >= tier.refs;
              return (
                <div key={tier.refs} className="flex items-center gap-4 rounded-xl p-4 transition-all duration-300" style={{ background: achieved ? `rgba(${tier.color},0.08)` : "rgba(255,255,255,0.02)", border: `1px solid rgba(${tier.color},${achieved ? 0.2 : 0.06})` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `rgba(${tier.color},${achieved ? 0.2 : 0.06})` }}>
                    <span style={{ color: achieved ? `rgb(${tier.color})` : "rgba(255,255,255,0.25)" }}>{tier.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold" style={{ color: achieved ? `rgb(${tier.color})` : "rgba(255,255,255,0.5)" }}>{tier.refs} {tier.refs === 1 ? "referido" : "referidos"}</span>
                      {achieved && <CircleCheck className="w-3.5 h-3.5" style={{ color: `rgb(${tier.color})` }} />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs font-bold" style={{ color: `rgba(${tier.color},0.8)` }}>{tier.cash} CLP</span>
                      <span className="text-[10px] text-white/25">+</span>
                      <span className="text-xs text-white/40">{tier.reward}</span>
                    </div>
                    <p className="text-[10px] text-white/25 mt-0.5">{tier.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {data.nextReward && (
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 mb-6 animate-dash-fade-up dash-stagger-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/60">Progreso hacia {data.nextReward.plan}</span>
                <span className="text-sm font-bold text-primary">{data.nextReward.current} / {data.nextReward.target}</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-700" style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
              <p className="text-[11px] text-white/30 mt-2">
                {data.nextReward.target - data.nextReward.current === 1
                  ? "Te falta solo 1 referido confirmado"
                  : `Te faltan ${data.nextReward.target - data.nextReward.current} referidos confirmados`}
                {" para ganar "}
                {data.nextReward.months} {data.nextReward.months === 1 ? "mes" : "meses"} de {data.nextReward.plan}
                {" + "}{formatCLP(data.nextReward.target * 3000)} CLP en saldo
              </p>
            </div>
          )}

          {data.currentReward && (
            <div className="rounded-xl bg-gradient-to-r from-primary/10 to-emerald-500/5 border border-primary/20 p-4 mb-6 animate-dash-fade-up dash-stagger-2">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-primary">Recompensa activa</span>
              </div>
              <p className="text-sm text-white/70">{data.currentReward.planLabel} gratis hasta el {new Date(data.currentReward.expiresAt).toLocaleDateString("es-CL")}</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl glass-card p-6 animate-dash-fade-up dash-stagger-3">
        <h4 className="text-base font-bold mb-4">Tu link de referido</h4>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <LinkIcon className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm text-white/60 truncate" data-testid="text-referral-link">{window.location.origin}/register?ref={data.code}</span>
          </div>
          <Button onClick={copyLink} className="bg-primary hover:bg-primary/80 gap-2 shrink-0" data-testid="button-copy-referral-link">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copiado" : "Copiar link"}
          </Button>
        </div>
        <div className="flex items-center gap-4 mt-3">
          <button onClick={copyCode} className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors" data-testid="button-copy-referral-code">
            <Copy className="w-3 h-3" />
            Código: <span className="font-mono font-bold text-primary">{data.code}</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-white/30">
            <UserPlus className="w-3 h-3" />
            {data.confirmedCount} confirmado{data.confirmedCount !== 1 ? "s" : ""} · {data.pendingCount} pendiente{data.pendingCount !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {data.referrals.length > 0 && (
        <div className="rounded-2xl glass-card p-6 animate-dash-fade-up dash-stagger-4">
          <h4 className="text-base font-bold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Tus referidos ({data.referrals.length})
          </h4>
          <div className="space-y-3">
            {data.referrals.map((ref) => (
              <div key={ref.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors" data-testid={`referral-row-${ref.id}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${ref.confirmed ? "bg-primary/15 text-primary" : "bg-white/[0.06] text-white/40"}`}>
                  {ref.referredName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{ref.referredName}</p>
                  <p className="text-xs text-white/30 truncate">{ref.referredEmail} · {new Date(ref.createdAt).toLocaleDateString("es-CL")}</p>
                </div>
                {ref.confirmed ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-primary">+{formatCLP(data.cashPerReferral)}</span>
                    {ref.referredPlan === "free" ? (
                      <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 font-medium border border-red-500/20" data-testid={`status-referral-${ref.id}`}>
                        <AlertTriangle className="w-3 h-3" />
                        Plan cancelado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                        <CircleCheck className="w-3 h-3" />
                        Activo
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 font-medium shrink-0" data-testid={`status-referral-${ref.id}`}>
                    <Clock className="w-3 h-3" />
                    Esperando compra
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.referrals.length === 0 && (
        <div className="rounded-2xl glass-card p-8 text-center animate-dash-fade-up dash-stagger-4">
          <UserPlus className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-sm text-white/40 mb-1">Aún no tienes referidos</p>
          <p className="text-xs text-white/25">Comparte tu link y gana $3.000 CLP + meses de plan premium por cada negocio que compre un plan</p>
        </div>
      )}
    </div>
  );
}

function PlanSection({ tenant }: { tenant: TenantProfile }) {
  const { toast } = useToast();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const planLabels: Record<string, string> = { free: "Fox Free", basic: "Fox Pro", pro: "Fox Enterprise" };
  const planPrices: Record<string, string> = { free: "$0", basic: "$19.990", pro: "$49.990" };
  const planColors: Record<string, string> = { free: "#6b7280", basic: "hsl(142, 72%, 40%)", pro: "hsl(30, 90%, 52%)" };

  const planLimits: Record<string, { sessions: string; messages: string; features: string[] }> = {
    free: {
      sessions: "50 / mes",
      messages: "500 / mes",
      features: ["Chat en vivo", "Respuestas automáticas básicas", "Widget personalizable"],
    },
    basic: {
      sessions: "500 / mes",
      messages: "5.000 / mes",
      features: ["Chat en vivo", "IA avanzada con GPT", "Catálogo de productos", "Base de conocimiento", "Analíticas completas"],
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
            <p className="text-sm text-white/40">Gestiona tu suscripción</p>
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

function DownloadAppSection() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  const currentUrl = window.location.origin + "/dashboard";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl glass-card p-6 space-y-6 animate-dash-scale-in relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full animate-orb-drift opacity-30" style={{ background: "radial-gradient(circle, rgba(6,182,212,0.06), transparent 60%)", animationDelay: "-4s" }} />

        <div className="relative">
          <h3 className="text-lg font-bold mb-1 animate-dash-slide-right flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Descarga FoxBot en tus dispositivos
          </h3>
          <p className="text-sm text-white/40 animate-dash-slide-right dash-stagger-1">Lleva tu panel de soporte a cualquier lugar. Responde a tus clientes desde el celular o tu computador como si fuera una app nativa.</p>
        </div>

        {isInstalled && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-xl bg-green-500/5 border border-green-500/15 p-4 flex items-center gap-3">
            <CircleCheck className="w-5 h-5 text-green-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-400">App instalada</p>
              <p className="text-xs text-white/40">FoxBot ya está instalado en este dispositivo. Puedes abrirlo desde tu escritorio o pantalla de inicio.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-3 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.1] group">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Smartphone className="w-6 h-6 text-cyan-400" />
            </div>
            <h4 className="text-sm font-bold text-white/90">Celular (Android / iOS)</h4>
            <p className="text-xs text-white/40 leading-relaxed">Agrega FoxBot a tu pantalla de inicio y recibe notificaciones push cada vez que un cliente escriba.</p>
          </div>

          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-3 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.1] group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Monitor className="w-6 h-6 text-blue-400" />
            </div>
            <h4 className="text-sm font-bold text-white/90">Computador (PC / Mac)</h4>
            <p className="text-xs text-white/40 leading-relaxed">Instala FoxBot como aplicación de escritorio en Chrome, Edge o Brave. Se abre como una ventana independiente.</p>
          </div>

          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-3 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.1] group">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Bell className="w-6 h-6 text-green-400" />
            </div>
            <h4 className="text-sm font-bold text-white/90">Notificaciones Push</h4>
            <p className="text-xs text-white/40 leading-relaxed">Recibe alertas en tiempo real cuando un cliente inicie un chat o escriba un mensaje. Nunca pierdas una venta.</p>
          </div>
        </div>
      </div>

      {deferredPrompt && !isInstalled && (
        <div className="rounded-2xl glass-card p-6 animate-dash-fade-up relative overflow-hidden">
          <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full animate-orb-drift opacity-30" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.06), transparent 60%)" }} />
          <div className="flex items-center gap-4 relative">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 animate-float" style={{ animationDuration: "6s" }}>
              <Download className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold mb-1">Instalar ahora</h4>
              <p className="text-xs text-white/40">Tu navegador permite instalar FoxBot directamente. Haz clic para agregarlo a tu dispositivo.</p>
            </div>
            <Button
              onClick={handleInstall}
              className="rounded-xl px-6 h-11 font-bold shrink-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20"
              data-testid="button-install-pwa"
            >
              <Download className="w-4 h-4 mr-2" />
              Instalar
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-2xl glass-card p-6 space-y-6 animate-dash-fade-up relative overflow-hidden">
        <div className="relative">
          <h3 className="text-base font-bold mb-1 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-primary" />
            Como instalar en tu celular
          </h3>
          <p className="text-xs text-white/40">Sigue estos pasos segun tu dispositivo</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-green-400" />
              </div>
              <h4 className="text-sm font-bold text-white/80">Android (Chrome)</h4>
            </div>
            {[
              { step: "1", text: "Abre Chrome y visita esta página" },
              { step: "2", text: 'Toca el menú (3 puntos arriba a la derecha)' },
              { step: "3", text: 'Selecciona "Agregar a pantalla de inicio" o "Instalar aplicación"' },
              { step: "4", text: 'Confirma tocando "Agregar"' },
              { step: "5", text: "FoxBot aparecerá como una app en tu celular" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary">{item.step}</div>
                <p className="text-xs text-white/60 leading-relaxed pt-0.5">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-blue-400" />
              </div>
              <h4 className="text-sm font-bold text-white/80">iPhone / iPad (Safari)</h4>
            </div>
            {[
              { step: "1", text: "Abre Safari y visita esta página" },
              { step: "2", text: 'Toca el botón de compartir (cuadrado con flecha hacia arriba)' },
              { step: "3", text: 'Desplazate y selecciona "Agregar a pantalla de inicio"' },
              { step: "4", text: 'Toca "Agregar" en la esquina superior derecha' },
              { step: "5", text: "FoxBot aparecerá como una app en tu iPhone" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0 text-[10px] font-bold text-blue-400">{item.step}</div>
                <p className="text-xs text-white/60 leading-relaxed pt-0.5">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl glass-card p-6 space-y-6 animate-dash-fade-up relative overflow-hidden">
        <div className="relative">
          <h3 className="text-base font-bold mb-1 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-primary" />
            Como instalar en tu computador
          </h3>
          <p className="text-xs text-white/40">Chrome, Edge y Brave permiten instalar FoxBot como app de escritorio</p>
        </div>

        <div className="space-y-4">
          {[
            { step: "1", text: "Abre tu navegador (Chrome, Edge o Brave) y visita esta página" },
            { step: "2", text: 'Busca el icono de instalar en la barra de direcciones (un monitor con flecha hacia abajo) o ve al menú del navegador' },
            { step: "3", text: 'Haz clic en "Instalar FoxBot" o "Instalar aplicación"' },
            { step: "4", text: "FoxBot se abrira como una ventana independiente, como cualquier otra app de tu computador" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary">{item.step}</div>
              <p className="text-xs text-white/60 leading-relaxed pt-0.5">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl glass-card p-6 space-y-4 animate-dash-fade-up relative overflow-hidden">
        <div className="relative">
          <h3 className="text-base font-bold mb-1 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-primary" />
            Comparte con tu equipo
          </h3>
          <p className="text-xs text-white/40">Envia este enlace a tus ejecutivos para que instalen FoxBot en sus dispositivos</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-xl bg-black/30 border border-white/[0.06] p-3">
            <p className="text-[11px] font-mono text-white/50 truncate" data-testid="text-share-url">{currentUrl}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(currentUrl);
            }}
            className="rounded-lg border-white/[0.08] hover:border-primary/30 text-xs h-10 shrink-0"
            data-testid="button-copy-share-url"
          >
            <Copy className="mr-1.5 h-3 w-3" />
            Copiar
          </Button>
        </div>
      </div>
    </div>
  );
}

type DashboardTab = "stats" | "config" | "embed" | "download" | "plan" | "referidos" | "guides";

const navItems: { title: string; value: DashboardTab; icon: typeof Settings }[] = [
  { title: "Estadísticas", value: "stats", icon: BarChart3 },
  { title: "Configuración", value: "config", icon: Palette },
  { title: "Integración", value: "embed", icon: Code },
  { title: "Descargar App", value: "download", icon: Download },
  { title: "Referidos", value: "referidos", icon: Gift },
  { title: "Guías", value: "guides", icon: BookOpen },
  { title: "Plan", value: "plan", icon: CreditCard },
];

export default function Dashboard() {
  const { tenant, isLoading, token } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>("stats");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTourPrompt, setShowTourPrompt] = useState(false);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (tenant && (tenant.onboardingStep ?? 0) < 3) {
      setShowOnboarding(true);
    }
  }, [tenant?.id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (payment) {
      window.history.replaceState({}, "", "/dashboard");
      if (payment === "success") {
        toast({ title: "¡Pago exitoso!", description: "Tu plan ha sido actualizado. Ahora instala el chat en tu sitio web." });
        queryClient.invalidateQueries({ queryKey: ["/api/tenants/me"] });
        setActiveTab("guides");
      } else if (payment === "rejected") {
        toast({ title: "Pago rechazado", description: "Tu pago fue rechazado. Intenta con otro medio de pago.", variant: "destructive" });
        setActiveTab("plan");
      } else if (payment === "pending") {
        toast({ title: "Pago pendiente", description: "Tu pago está siendo procesado. El plan se actualizará automáticamente." });
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

  if (showOnboarding && tenant && token) {
    return (
      <OnboardingWizard
        tenant={tenant}
        token={token}
        onComplete={() => {
          setShowOnboarding(false);
          queryClient.invalidateQueries({ queryKey: ["/api/tenants/me"] });
          const tourSeen = localStorage.getItem("foxbot_tour_seen");
          if (!tourSeen) {
            setShowTourPrompt(true);
          }
        }}
      />
    );
  }

  const planLabels: Record<string, string> = { free: "Fox Free", basic: "Fox Pro", pro: "Fox Enterprise" };
  const planColors: Record<string, string> = { free: "#6b7280", basic: "hsl(142, 72%, 40%)", pro: "hsl(30, 90%, 52%)" };

  const planTheme: Record<string, { borderColor: string; glowFrom: string; glowTo: string; orbColor: string; accentRgba: string }> = {
    free: {
      borderColor: "rgba(16, 185, 129, 0.12)",
      glowFrom: "rgba(16, 185, 129, 0.03)",
      glowTo: "transparent",
      orbColor: "rgba(16, 185, 129, 0.04)",
      accentRgba: "rgba(16, 185, 129, 0.08)",
    },
    basic: {
      borderColor: "rgba(16, 185, 129, 0.18)",
      glowFrom: "rgba(16, 185, 129, 0.04)",
      glowTo: "rgba(245, 158, 11, 0.03)",
      orbColor: "rgba(245, 158, 11, 0.05)",
      accentRgba: "rgba(16, 185, 129, 0.1)",
    },
    pro: {
      borderColor: "rgba(245, 158, 11, 0.18)",
      glowFrom: "rgba(245, 158, 11, 0.04)",
      glowTo: "rgba(217, 119, 6, 0.03)",
      orbColor: "rgba(245, 158, 11, 0.06)",
      accentRgba: "rgba(245, 158, 11, 0.1)",
    },
  };
  const theme = planTheme[tenant.plan] || planTheme.free;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <aside className={`${sidebarOpen ? "w-64" : "w-0 overflow-hidden"} shrink-0 transition-all duration-300 flex flex-col relative animate-sidebar-glow`} style={{ borderRight: `1px solid ${theme.borderColor}` }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(180deg, ${theme.glowFrom} 0%, transparent 40%, ${theme.glowTo} 100%)` }} />
        <div className="absolute top-20 -right-16 w-32 h-32 rounded-full animate-orb-drift pointer-events-none" style={{ background: `radial-gradient(circle, ${theme.orbColor}, transparent 60%)`, animationDelay: "-10s" }} />

        <div className="relative p-5 animate-dash-fade-in" style={{ borderBottom: `1px solid ${theme.borderColor}` }}>
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

          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${theme.borderColor}` }}>
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

        <div className="relative p-3" style={{ borderTop: `1px solid ${theme.borderColor}` }}>
          <div className="rounded-xl p-3 mb-3 animate-dash-fade-up transition-all duration-300 hover:bg-white/[0.04] group/plan" style={{ background: theme.accentRgba, border: `1px solid ${theme.borderColor}` }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full animate-glow-pulse" style={{ backgroundColor: planColors[tenant.plan] }} />
              <span className="text-xs font-semibold" style={{ color: planColors[tenant.plan] }}>
                {planLabels[tenant.plan]}
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
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="flex items-center gap-3 px-6 py-4 animate-dash-fade-in relative overflow-hidden" style={{ borderBottom: `1px solid ${theme.borderColor}` }}>
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
              {activeTab === "stats" && "Métricas de tu chat en tiempo real"}
              {activeTab === "config" && "Personaliza tu widget de chat"}
              {activeTab === "embed" && "Agrega el chat a tu sitio web"}
              {activeTab === "download" && "Instala FoxBot en tu celular o computador"}
              {activeTab === "guides" && "Manuales de instalación paso a paso"}
              {activeTab === "referidos" && "Invita negocios y gana meses gratis"}
              {activeTab === "plan" && "Gestiona tu suscripción"}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3 relative">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] transition-all duration-300 hover:bg-white/[0.05]">
              <div className="w-2 h-2 rounded-full bg-primary animate-glow-pulse" />
              <span className="text-xs text-white/40">En línea</span>
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
            {activeTab === "download" && <DownloadAppSection />}
            {activeTab === "guides" && <GuidesPanel />}
            {activeTab === "referidos" && <ReferidosSection />}
            {activeTab === "plan" && <PlanSection tenant={tenant} />}
          </div>
        </main>
      </div>

      {showTourPrompt && (
        <TourPrompt
          onStart={() => {
            setShowTourPrompt(false);
            setSidebarOpen(true);
            setTimeout(() => setShowTour(true), 400);
          }}
          onSkip={() => {
            setShowTourPrompt(false);
            localStorage.setItem("foxbot_tour_seen", "1");
          }}
        />
      )}

      {showTour && (
        <DashboardTour
          onComplete={() => {
            setShowTour(false);
            localStorage.setItem("foxbot_tour_seen", "1");
          }}
          onSkip={() => {
            setShowTour(false);
            localStorage.setItem("foxbot_tour_seen", "1");
          }}
        />
      )}
    </div>
  );
}
