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
  Link2,
  DollarSign,
  Clock,
  MessageCircle,
  Shield,
  Package,
  ShoppingBag,
  Megaphone,
  CalendarDays,
  CalendarPlus,
  Receipt,
  XCircle,
  ExternalLink,
  Brain,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { GuidesPanel } from "./Guides";
import { SiWordpress, SiShopify, SiWoocommerce, SiMagento, SiSquarespace, SiWix, SiWebflow, SiHtml5, SiGoogletagmanager, SiWhatsapp } from "react-icons/si";
import type { Tenant } from "@shared/schema";
import { CHANNEL_MIN_PLAN, planRank, type ChannelSlug } from "@shared/planMatrix";
import { formatMoney, getCurrency } from "@shared/currencies";
import { CurrencyInput } from "@/components/CurrencyInput";
import { CapptaIcon } from "@/components/CapptaLogo";
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
  const [logoScale, setLogoScale] = useState(tenant.logoScale || 100);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [showProductSearch, setShowProductSearch] = useState(tenant.showProductSearch === 1);
  const [productSearchLabel, setProductSearchLabel] = useState(tenant.productSearchLabel || "Buscar producto");
  const [productApiUrl, setProductApiUrl] = useState(tenant.productApiUrl || "");
  const [manualProducts, setManualProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductUrl, setNewProductUrl] = useState("");
  const [newProductDescription, setNewProductDescription] = useState("");
  const [addingProduct, setAddingProduct] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [saved, setSaved] = useState(false);
  const [domain, setDomain] = useState(tenant.domain || "");
  const [avatarUrl, setAvatarUrl] = useState(tenant.avatarUrl || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [launcherImageUrl, setLauncherImageUrl] = useState(tenant.launcherImageUrl || "");
  const [launcherImageScale, setLauncherImageScale] = useState(tenant.launcherImageScale || 100);
  const [uploadingLauncher, setUploadingLauncher] = useState(false);
  const launcherInputRef = useRef<HTMLInputElement>(null);
  const [botIconUrl, setBotIconUrl] = useState(tenant.botIconUrl || "");
  const [botIconScale, setBotIconScale] = useState(tenant.botIconScale || 100);
  const [uploadingBotIcon, setUploadingBotIcon] = useState(false);
  const botIconInputRef = useRef<HTMLInputElement>(null);
  const [widgetPosition, setWidgetPosition] = useState(tenant.widgetPosition || "right");
  const [labelContactButton, setLabelContactButton] = useState(tenant.labelContactButton || "");
  const [labelTicketButton, setLabelTicketButton] = useState(tenant.labelTicketButton || "");
  const [labelFinalizeButton, setLabelFinalizeButton] = useState(tenant.labelFinalizeButton || "");
  const [welcomeBannerText, setWelcomeBannerText] = useState(tenant.welcomeBannerText || "");
  const [launcherBubbleText, setLauncherBubbleText] = useState(tenant.launcherBubbleText || "");
  const [launcherBubbleStyle, setLauncherBubbleStyle] = useState(tenant.launcherBubbleStyle || "normal");
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
    setLogoScale(tenant.logoScale || 100);
    setShowProductSearch(tenant.showProductSearch === 1);
    setProductSearchLabel(tenant.productSearchLabel || "Buscar producto");
    setProductApiUrl(tenant.productApiUrl || "");
    setDomain(tenant.domain || "");
    setAvatarUrl(tenant.avatarUrl || "");
    setLauncherImageUrl(tenant.launcherImageUrl || "");
    setLauncherImageScale(tenant.launcherImageScale || 100);
    setBotIconUrl(tenant.botIconUrl || "");
    setBotIconScale(tenant.botIconScale || 100);
    setWidgetPosition(tenant.widgetPosition || "right");
    setLabelContactButton(tenant.labelContactButton || "");
    setLabelTicketButton(tenant.labelTicketButton || "");
    setLabelFinalizeButton(tenant.labelFinalizeButton || "");
    setWelcomeBannerText(tenant.welcomeBannerText || "");
    setLauncherBubbleText(tenant.launcherBubbleText || "");
    setLauncherBubbleStyle(tenant.launcherBubbleStyle || "normal");
    try {
      setConsultationOptions(tenant.consultationOptions ? JSON.parse(tenant.consultationOptions) : []);
    } catch { setConsultationOptions([]); }
  }, [tenant]);

  const fetchManualProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/tenant-panel/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setManualProducts(data);
      }
    } catch {} finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchManualProducts();
  }, []);

  const handleAddProduct = async () => {
    if (!newProductName.trim()) return;
    setAddingProduct(true);
    try {
      const res = await fetch("/api/tenant-panel/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: newProductName.trim(),
          price: newProductPrice.trim() || null,
          productUrl: newProductUrl.trim() || null,
          description: newProductDescription.trim() || null,
        }),
      });
      if (res.ok) {
        setNewProductName("");
        setNewProductPrice("");
        setNewProductUrl("");
        setNewProductDescription("");
        setShowAddProduct(false);
        await fetchManualProducts();
        toast({ title: "Producto agregado" });
      }
    } catch {
      toast({ title: "Error", description: "No se pudo agregar el producto", variant: "destructive" });
    } finally {
      setAddingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      const res = await fetch(`/api/tenant-panel/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setManualProducts(prev => prev.filter(p => p.id !== id));
        toast({ title: "Producto eliminado" });
      }
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" });
    }
  };

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
      logoScale,
      avatarUrl: avatarUrl || null,
      launcherImageUrl: launcherImageUrl || null,
      launcherImageScale,
      botIconUrl: botIconUrl || null,
      botIconScale,
      widgetPosition,
      labelContactButton: labelContactButton.trim() || null,
      labelTicketButton: labelTicketButton.trim() || null,
      labelFinalizeButton: labelFinalizeButton.trim() || null,
      domain: domain.trim() || null,
      consultationOptions: consultationOptions.length > 0 ? JSON.stringify(consultationOptions) : null,
      showProductSearch: showProductSearch ? 1 : 0,
      productSearchLabel,
      productApiUrl: productApiUrl.trim() || null,
      welcomeBannerText: welcomeBannerText.trim() || null,
      launcherBubbleText: launcherBubbleText.trim() || null,
      launcherBubbleStyle,
      botConfigured: isConfigComplete ? 1 : 0,
    };
    updateMutation.mutate(data);
  };

  const [previewMode, setPreviewMode] = useState<"welcome" | "chat" | "launcher">("welcome");

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      <div className="flex-1 min-w-0 space-y-6">

      <div className="rounded-2xl glass-card p-4 sm:p-6 space-y-5 sm:space-y-6 animate-dash-scale-in relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full animate-orb-drift opacity-30" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.06), transparent 60%)", animationDelay: "-3s" }} />

        <div className="relative">
          <h3 className="text-base sm:text-lg font-bold mb-1 animate-dash-slide-right flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Tu Negocio
          </h3>
          <p className="text-sm text-white/40 animate-dash-slide-right dash-stagger-1">Ingresa tu sitio web y Cappta AI aprendera sobre tu negocio automáticamente</p>
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
          <p className="text-xs text-white/30">Al analizar tu sitio web, Cappta AI extraera automáticamente la información de tu negocio (productos, servicios, contacto, horarios) y entrenara el chatbot por ti.</p>
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

      <div className="rounded-2xl glass-card p-4 sm:p-6 space-y-6 animate-dash-scale-in relative overflow-hidden">
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
          {launcherBubbleText.trim() && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/40">Estilo de burbuja</label>
              <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] p-1 w-fit">
                {([
                  { id: "subtle", label: "Discreta" },
                  { id: "normal", label: "Normal" },
                  { id: "bold", label: "Vistosa" },
                ] as const).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setLauncherBubbleStyle(s.id)}
                    className={`text-xs px-3 py-1.5 rounded-md transition-colors font-medium ${launcherBubbleStyle === s.id ? "bg-primary/20 text-primary" : "text-white/40 hover:text-white/60"}`}
                    data-testid={`button-bubble-style-${s.id}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-white/30">Texto emergente junto al botón flotante del chat</p>
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
          {logoUrl && (
            <div className="space-y-1.5 mt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-white/50">Tamaño del logo</label>
                <span className="text-xs text-white/40 font-mono">{logoScale}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                step="10"
                value={logoScale}
                onChange={(e) => setLogoScale(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary"
                style={{ accentColor: widgetColor }}
                data-testid="range-logo-scale"
              />
              <div className="flex justify-between text-[10px] text-white/25">
                <span>50%</span>
                <span>100%</span>
                <span>200%</span>
              </div>
            </div>
          )}
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
            {launcherImageUrl && (
              <div className="space-y-1.5 mt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-white/50">Tamaño del botón</label>
                  <span className="text-xs text-white/40 font-mono">{launcherImageScale}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="200"
                  step="10"
                  value={launcherImageScale}
                  onChange={(e) => setLauncherImageScale(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: widgetColor }}
                  data-testid="range-launcher-scale"
                />
                <div className="flex justify-between text-[10px] text-white/25">
                  <span>50%</span>
                  <span>100%</span>
                  <span>200%</span>
                </div>
              </div>
            )}
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
            {botIconUrl && (
              <div className="space-y-1.5 mt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-white/50">Tamaño del ícono</label>
                  <span className="text-xs text-white/40 font-mono">{botIconScale}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="200"
                  step="10"
                  value={botIconScale}
                  onChange={(e) => setBotIconScale(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: widgetColor }}
                  data-testid="range-boticon-scale"
                />
                <div className="flex justify-between text-[10px] text-white/25">
                  <span>50%</span>
                  <span>100%</span>
                  <span>200%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl glass-card p-4 sm:p-6 space-y-6 animate-dash-scale-in relative overflow-hidden">
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

      <div className="rounded-2xl glass-card p-4 sm:p-6 space-y-6 animate-dash-scale-in relative overflow-hidden">
        <div className="relative">
          <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Catálogo de Productos
          </h3>
          <p className="text-sm text-white/40">Agrega productos para que tus clientes los encuentren desde el chat</p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div>
            <p className="text-sm font-medium text-white/80">Habilitar buscador de productos</p>
            <p className="text-xs text-white/40 mt-0.5">Permite a tus clientes buscar productos directamente en el chat</p>
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
          <div className="space-y-5">
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

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-white/80">Productos manuales</p>
                    <p className="text-xs text-white/40">Agrega productos uno a uno desde aqui</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddProduct(!showAddProduct)}
                  className="text-xs rounded-lg border-white/[0.08] hover:border-primary/30"
                  data-testid="button-toggle-add-product"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Agregar
                </Button>
              </div>

              {showAddProduct && (
                <div className="p-4 border-b border-white/[0.06] bg-white/[0.02] space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      placeholder="Nombre del producto *"
                      className="h-9 text-xs bg-white/[0.04] border-white/[0.08]"
                      data-testid="input-new-product-name"
                    />
                    <Input
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      placeholder="Precio (ej: $9.990)"
                      className="h-9 text-xs bg-white/[0.04] border-white/[0.08]"
                      data-testid="input-new-product-price"
                    />
                  </div>
                  <Input
                    value={newProductUrl}
                    onChange={(e) => setNewProductUrl(e.target.value)}
                    placeholder="URL del producto (opcional)"
                    className="h-9 text-xs bg-white/[0.04] border-white/[0.08]"
                    data-testid="input-new-product-url"
                  />
                  <Input
                    value={newProductDescription}
                    onChange={(e) => setNewProductDescription(e.target.value)}
                    placeholder="Descripción breve (opcional)"
                    className="h-9 text-xs bg-white/[0.04] border-white/[0.08]"
                    data-testid="input-new-product-description"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setShowAddProduct(false); setNewProductName(""); setNewProductPrice(""); setNewProductUrl(""); setNewProductDescription(""); }}
                      className="text-xs h-8"
                      data-testid="button-cancel-add-product"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddProduct}
                      disabled={addingProduct || !newProductName.trim()}
                      className="text-xs h-8 bg-primary"
                      data-testid="button-confirm-add-product"
                    >
                      {addingProduct ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                      Agregar producto
                    </Button>
                  </div>
                </div>
              )}

              <div className="max-h-[240px] overflow-y-auto">
                {loadingProducts ? (
                  <div className="p-6 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-white/30 mx-auto" />
                  </div>
                ) : manualProducts.length === 0 ? (
                  <div className="p-6 text-center">
                    <Package className="w-8 h-8 text-white/10 mx-auto mb-2" />
                    <p className="text-xs text-white/30">No hay productos manuales aun</p>
                    <p className="text-[10px] text-white/20 mt-1">Agrega productos con el boton de arriba</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {manualProducts.map((p) => (
                      <div key={p.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-colors group" data-testid={`product-row-${p.id}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white/70 truncate">{p.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {p.price && <span className="text-[10px] text-primary font-semibold">{p.price}</span>}
                            {p.description && <span className="text-[10px] text-white/30 truncate">{p.description}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all"
                          title="Eliminar"
                          data-testid={`button-delete-product-${p.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {manualProducts.length > 0 && (
                <div className="px-4 py-2 border-t border-white/[0.04] bg-white/[0.01]">
                  <p className="text-[10px] text-white/25">{manualProducts.length} producto{manualProducts.length !== 1 ? "s" : ""} en tu catálogo</p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-white/80">Conectar plataforma externa</p>
                  <p className="text-xs text-white/40">Si tienes muchos productos en WooCommerce, Shopify u otra plataforma, conecta su API para sincronizar tu catálogo automaticamente</p>
                </div>
              </div>
              <Input
                value={productApiUrl}
                onChange={(e) => setProductApiUrl(e.target.value)}
                placeholder="https://tutienda.com/wp-json/wc/v3/products"
                className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40 transition-all duration-300"
                data-testid="input-product-api-url"
              />
              <p className="text-[11px] text-white/25">
                Compatible con WooCommerce REST API, Shopify Storefront API, y APIs personalizadas que retornen JSON con productos.
              </p>
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
                    {launcherBubbleText && launcherBubbleStyle === "subtle" && (
                      <div className="max-w-[160px] px-2 py-1 rounded-md text-[9px] text-white/60" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                        {launcherBubbleText}
                      </div>
                    )}
                    {launcherBubbleText && launcherBubbleStyle === "normal" && (
                      <div className="max-w-[160px] px-2.5 py-1.5 rounded-xl rounded-br-sm text-[10px] font-medium" style={{ backgroundColor: "#1a1a1a", color: "#e0e0e0", border: `1px solid ${widgetColor}30`, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                        {launcherBubbleText}
                      </div>
                    )}
                    {launcherBubbleText && launcherBubbleStyle === "bold" && (
                      <div className="relative max-w-[180px] px-3 py-2 rounded-2xl text-[11px] font-bold text-white shadow-2xl" style={{ background: `linear-gradient(135deg, ${widgetColor}, ${widgetColor}dd)`, boxShadow: `0 6px 24px ${widgetColor}50, 0 2px 8px rgba(0,0,0,0.3)` }}>
                        {launcherBubbleText}
                        <div className="absolute top-1/2 -translate-y-1/2 -right-2 w-0 h-0 border-t-[5px] border-b-[5px] border-l-[7px] border-t-transparent border-b-transparent" style={{ borderLeftColor: widgetColor }} />
                      </div>
                    )}
                    <div className="relative" style={{ width: `${Math.round(56 * launcherImageScale / 100)}px`, height: `${Math.round(56 * launcherImageScale / 100)}px` }}>
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center shadow-xl shrink-0"
                        style={{ backgroundColor: launcherImageUrl ? "transparent" : widgetColor }}
                      >
                        {launcherImageUrl ? (
                          <img src={launcherImageUrl} alt="Botón" className="w-full h-full rounded-full object-cover block" />
                        ) : (
                          <MessageCircle className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <span
                        className="absolute rounded-full bg-red-500 border-2 border-[#1a1a1a]"
                        style={{
                          width: `${Math.max(10, Math.round(16 * launcherImageScale / 100))}px`,
                          height: `${Math.max(10, Math.round(16 * launcherImageScale / 100))}px`,
                          top: `${Math.round(Math.max(10, Math.round(16 * launcherImageScale / 100)) * -0.15)}px`,
                          right: `${Math.round(Math.max(10, Math.round(16 * launcherImageScale / 100)) * -0.15)}px`,
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-white/25 mt-4">{launcherImageUrl ? `Imagen personalizada (${launcherImageScale}%)` : "Botón predeterminado"}</p>
                  <div className="mt-8 flex items-center gap-3">
                    <p className="text-xs text-white/40">Ícono del bot en mensajes:</p>
                    <div className="relative" style={{ width: `${Math.round(32 * botIconScale / 100)}px`, height: `${Math.round(32 * botIconScale / 100)}px` }}>
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center border"
                        style={{ backgroundColor: botIconUrl ? "transparent" : `${widgetColor}20`, borderColor: botIconUrl ? "transparent" : `${widgetColor}30` }}
                      >
                        {botIconUrl ? (
                          <img src={botIconUrl} alt="" className="w-full h-full rounded-full object-cover block" />
                        ) : (
                          <Headphones className="w-4 h-4" style={{ color: widgetColor }} />
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-white/25">{botIconUrl ? `Personalizado (${botIconScale}%)` : "Predeterminado"}</p>
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
                        <img src={logoUrl} alt="" className="rounded-full object-cover bg-white/15" style={{ width: `${Math.round(32 * logoScale / 100)}px`, height: `${Math.round(32 * logoScale / 100)}px`, aspectRatio: "1 / 1" }} />
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
                      <img src={logoUrl} alt="" className="rounded-full object-cover bg-white/15" style={{ width: `${Math.round(32 * logoScale / 100)}px`, height: `${Math.round(32 * logoScale / 100)}px`, aspectRatio: "1 / 1" }} />
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
                    <p className="text-[9px] text-white/20 text-center">Potenciado por <span className="font-medium">Cappta AI</span></p>
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

function VerifyInstallation({ tenantId }: { tenantId: number }) {
  const [verifyUrl, setVerifyUrl] = useState("");
  const [result, setResult] = useState<{ installed: boolean; status: string; message: string } | null>(null);
  const { toast } = useToast();

  const verifyMutation = useMutation({
    mutationFn: async (url: string) => {
      const token = localStorage.getItem("tenant_token");
      const res = await fetch("/api/tenants/me/verify-installation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error("Error al verificar");
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo verificar la instalación", variant: "destructive" });
    },
  });

  const handleVerify = () => {
    if (!verifyUrl.trim()) return;
    setResult(null);
    verifyMutation.mutate(verifyUrl.trim());
  };

  return (
    <div className="rounded-2xl glass-card p-4 sm:p-6 space-y-4 animate-dash-fade-up relative overflow-hidden">
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full animate-orb-drift opacity-20" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.08), transparent 60%)" }} />
      <div className="relative flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <Shield className="w-4.5 h-4.5 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white/80">Verificar instalación</h4>
          <p className="text-[11px] text-white/40">Comprueba que el widget esté funcionando en tu sitio</p>
        </div>
      </div>

      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
          <Input
            value={verifyUrl}
            onChange={(e) => { setVerifyUrl(e.target.value); setResult(null); }}
            placeholder="www.tu-sitio.com"
            className="h-10 text-sm bg-white/[0.04] border-white/[0.08] pl-9 pr-3"
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            data-testid="input-verify-url"
          />
        </div>
        <Button
          onClick={handleVerify}
          disabled={!verifyUrl.trim() || verifyMutation.isPending}
          className="h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-medium gap-2"
          data-testid="button-verify-installation"
        >
          {verifyMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Verificar
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className={`rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
          result.installed && result.status === "found"
            ? "bg-green-500/10 border border-green-500/20"
            : result.installed && result.status === "partial"
            ? "bg-amber-500/10 border border-amber-500/20"
            : "bg-red-500/10 border border-red-500/20"
        }`}>
          {result.installed && result.status === "found" ? (
            <CircleCheck className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          ) : result.installed && result.status === "partial" ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <X className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          )}
          <div>
            <p className={`text-sm font-medium ${
              result.installed && result.status === "found" ? "text-green-400"
              : result.installed && result.status === "partial" ? "text-amber-400"
              : "text-red-400"
            }`}>
              {result.installed && result.status === "found" ? "Instalado correctamente" 
              : result.installed && result.status === "partial" ? "Detectado parcialmente"
              : "No detectado"}
            </p>
            <p className="text-xs text-white/50 mt-0.5">{result.message}</p>
          </div>
        </div>
      )}
    </div>
  );
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
    iframe.id = 'nexia-widget';
    iframe.src = '${baseUrl}/widget?tenantId=${tenant.id}';
    iframe.allow = 'microphone';
    var pos = 'right';
    function setPos(p, state, w, h) {
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
        var cw = (w || 70) + 'px';
        var ch = (h || 70) + 'px';
        iframe.style.cssText = 'position:fixed;bottom:12px;' + s + ':12px;' + o + ':auto;width:' + cw + ';height:' + ch + ';border:none;z-index:9999;';
      }
    }
    setPos(pos, 'closed');
    document.body.appendChild(iframe);
    window.addEventListener('message', function(e) {
      if (!e.data || !e.data.type) return;
      if (e.data.position) pos = e.data.position;
      if (e.data.type === 'nexia_position') { pos = e.data.position; setPos(pos, 'closed'); }
      if (e.data.type === 'open_chat') setPos(pos, 'open');
      if (e.data.type === 'close_chat') setPos(pos, 'closed', e.data.width, e.data.height);
    });
  })();
</script>`;

  const iframeCode = embedScript;

  const handleDownloadWPPlugin = async () => {
    try {
      const token = localStorage.getItem("tenant_token");
      const response = await fetch("/api/tenants/me/wordpress-plugin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Error al descargar");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "nexia-chat.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Plugin descargado", description: "Sube el archivo .zip en tu WordPress: Plugins > Añadir nuevo > Subir plugin" });
    } catch {
      toast({ title: "Error", description: "No se pudo descargar el plugin", variant: "destructive" });
    }
  };

  const platforms: PlatformGuide[] = [
    {
      id: "wordpress", name: "WordPress", icon: SiWordpress, color: "#21759b", difficulty: "fácil",
      steps: [
        { title: "Descarga el plugin de Cappta AI", description: "Haz clic en el botón de abajo para descargar tu plugin personalizado. Ya viene preconfigurado con tu cuenta." },
        { title: "Sube el plugin a WordPress", description: "En tu panel de WordPress, ve a Plugins > Añadir nuevo > Subir plugin. Selecciona el archivo nexia-chat.zip que descargaste." },
        { title: "Activa el plugin", description: "Después de instalar, haz clic en 'Activar plugin'. Listo, el chatbot aparecerá automáticamente en todas las páginas de tu sitio." },
      ],
    },
    {
      id: "woocommerce", name: "WooCommerce", icon: SiWoocommerce, color: "#96588a", difficulty: "fácil",
      steps: [
        { title: "Descarga el plugin de Cappta AI", description: "WooCommerce funciona sobre WordPress. Haz clic en el botón de abajo para descargar tu plugin personalizado." },
        { title: "Sube el plugin a WordPress", description: "En tu panel de WordPress/WooCommerce, ve a Plugins > Añadir nuevo > Subir plugin. Selecciona el archivo nexia-chat.zip." },
        { title: "Activa el plugin", description: "Haz clic en 'Activar plugin'. El chatbot aparecerá en tu tienda automáticamente." },
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
      <div className="rounded-2xl glass-card p-4 sm:p-6 space-y-6 animate-dash-scale-in relative overflow-hidden">
        <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full animate-orb-drift" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.04), transparent 60%)", animationDelay: "-7s" }} />

        <div className="relative flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold mb-1 animate-dash-slide-right">Instala tu chatbot</h3>
            <p className="text-sm text-white/40 animate-dash-slide-right dash-stagger-1">Cappta AI se integra con cualquier sitio web o plataforma que soporte HTML. Solo necesitas pegar un pequeño código y tu asistente estará listo.</p>
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
                    {(selectedGuide.id === "wordpress" || selectedGuide.id === "woocommerce") && i === 0 && (
                      <Button
                        onClick={handleDownloadWPPlugin}
                        className="mt-3 rounded-lg bg-[#21759b] hover:bg-[#1a5f7e] text-white text-xs h-9 px-4 gap-2"
                        data-testid="button-download-wp-plugin"
                      >
                        <Download className="w-4 h-4" />
                        Descargar Plugin WordPress (.zip)
                      </Button>
                    )}
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

      <VerifyInstallation tenantId={tenant.id} />

      <div className="rounded-2xl glass-card p-4 sm:p-6 space-y-4 animate-dash-fade-up">
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
                href="https://wa.me/56962530976?text=Hola%2C%20necesito%20ayuda%20para%20instalar%20Cappta%20AI%20en%20mi%20sitio%20web"
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
                href="mailto:webmakerchile@gmail.com?subject=Ayuda%20instalaci%C3%B3n%20Cappta%20AI&body=Hola%2C%20necesito%20ayuda%20para%20instalar%20Cappta%20AI%20en%20mi%20sitio%20web."
                className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-blue-500/5 hover:border-blue-500/20 transition-all group"
                data-testid="link-email-help"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Send className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/70">Correo</p>
                  <p className="text-[10px] text-white/40">webmakerchile@gmail.com</p>
                </div>
              </a>

              <a
                href="https://www.cappta.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-orange-500/5 hover:border-orange-500/20 transition-all group"
                data-testid="link-website-help"
              >
                <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bot className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/70">Cappta AI</p>
                  <p className="text-[10px] text-white/40">cappta.ai</p>
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
    { refs: 1, cash: "$3.000", reward: "+ 1 mes Cappta Pro", color: "16,185,129", icon: <Gift className="w-4 h-4" />, desc: "Tu primer referido: dinero + plan premium" },
    { refs: 3, cash: "$9.000", reward: "+ 2 meses Cappta Pro", color: "59,130,246", icon: <Star className="w-4 h-4" />, desc: "Acumulas $3.000 CLP por cada referido" },
    { refs: 5, cash: "$15.000", reward: "+ 3 meses Cappta Enterprise", color: "245,158,11", icon: <Trophy className="w-4 h-4" />, desc: "Sesiones y mensajes ilimitados para ti" },
    { refs: 10, cash: "$30.000", reward: "+ 6 meses Cappta Enterprise", color: "168,85,247", icon: <Crown className="w-4 h-4" />, desc: "Nivel experto: dinero real + el mejor plan" },
    { refs: 15, cash: "$45.000", reward: "Embajador Cappta AI", color: "236,72,153", icon: <Shield className="w-4 h-4" />, desc: "Plan gratis permanente + $5.000 por referido" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl glass-card p-4 sm:p-6 animate-dash-scale-in relative overflow-hidden">
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
                    <span className="text-sm font-black text-pink-400">Embajador Cappta AI</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30">ACTIVO</span>
                  </div>
                  <p className="text-xs text-white/50 mt-0.5">
                    Ganas <span className="text-pink-400 font-bold">$5.000 CLP</span> por referido · Plan Cappta Enterprise gratis mientras mantengas {data.ambassadorThreshold}+ referidos pagados
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
              Cada vez que un negocio se registra con tu enlace y compra Cappta Pro o Cappta Enterprise, recibes {formatCLP(data.cashPerReferral)} CLP en saldo.
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

      <div className="rounded-2xl glass-card p-4 sm:p-6 animate-dash-fade-up dash-stagger-3">
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
        <div className="rounded-2xl glass-card p-4 sm:p-6 animate-dash-fade-up dash-stagger-4">
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

function WhatsAppSection({ tenant, token }: { tenant: TenantProfile; token: string }) {
  const { toast } = useToast();
  const [greeting, setGreeting] = useState((tenant as any).whatsappGreeting || "");
  const [saving, setSaving] = useState(false);
  const isEnabled = (tenant as any).whatsappEnabled === 1;
  const whatsappNumber = (tenant as any).whatsappNumber || "";
  const isPaidPlan = tenant.plan === "solo" || tenant.plan === "basic" || tenant.plan === "scale" || tenant.plan === "pro" || tenant.plan === "enterprise";
  const isSoloPlan = tenant.plan === "solo";

  const handleSaveGreeting = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/tenants/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ whatsappGreeting: greeting.trim() || null }),
      });
      if (!res.ok) throw new Error("Error");
      queryClient.invalidateQueries({ queryKey: ["/api/tenants/me"] });
      toast({ title: "Guardado", description: "Saludo de WhatsApp actualizado." });
    } catch {
      toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl glass-card p-4 sm:p-6 animate-dash-scale-in relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full animate-subtle-breathe" style={{ background: "radial-gradient(circle, rgba(37,211,102,0.15), transparent 60%)" }} />

        <div className="flex items-center gap-4 mb-6 relative">
          <div className="w-14 h-14 rounded-2xl bg-[#25d366]/10 flex items-center justify-center">
            <SiWhatsapp className="w-7 h-7 text-[#25d366]" />
          </div>
          <div>
            <h3 className="text-lg font-bold" data-testid="text-whatsapp-title">WhatsApp Business</h3>
            <p className="text-sm text-white/40">Conecta tu chatbot IA a WhatsApp y atiende clientes automáticamente</p>
          </div>
        </div>

        {!isPaidPlan ? (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white/80 mb-2">Disponible en planes pagados</h4>
            <p className="text-sm text-white/50 mb-4">
              WhatsApp Business viene incluido en Cappta Pro, Scale y Enterprise. En Cappta Solo se ofrece como add-on por <span className="text-[#25d366] font-bold">$14.990 CLP/mes</span>.
            </p>
            <Button
              className="bg-[#25d366] hover:bg-[#20bd5a] text-white font-bold rounded-xl"
              onClick={() => {
                const planTab = document.querySelector('[data-testid="nav-plan"]');
                if (planTab) (planTab as HTMLElement).click();
              }}
              data-testid="button-upgrade-for-whatsapp"
            >
              <Zap className="w-4 h-4 mr-2" />
              Ver planes
            </Button>
          </div>
        ) : isSoloPlan && !isEnabled ? (
          <div className="rounded-xl border border-[#25d366]/20 bg-[#25d366]/5 p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#25d366]/15 flex items-center justify-center flex-shrink-0">
                <SiWhatsapp className="w-5 h-5 text-[#25d366]" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-white/80 mb-1">Activá WhatsApp como add-on</h4>
                <p className="text-sm text-white/50 mb-3">
                  En tu plan Cappta Solo podés sumar WhatsApp Business por <span className="text-[#25d366] font-bold">$14.990 CLP/mes</span> adicionales. Asignamos un número dedicado para tu negocio y configuramos la integración por vos.
                </p>
                <Button
                  className="bg-[#25d366] hover:bg-[#20bd5a] text-white font-bold rounded-xl"
                  onClick={() => {
                    window.location.href = "mailto:soporte@cappta.ai?subject=Activar%20WhatsApp%20add-on%20(Cappta%20Solo)";
                  }}
                  data-testid="button-request-whatsapp-addon"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Solicitar activación del add-on
                </Button>
              </div>
            </div>
          </div>
        ) : !isEnabled ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-white/40" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white/80 mb-1">Pendiente de activación</h4>
                <p className="text-sm text-white/50 mb-3">
                  Para activar WhatsApp en tu cuenta, contacta a nuestro equipo. Asignaremos un número de WhatsApp Business dedicado para tu negocio.
                </p>
                <p className="text-xs text-white/30 mb-4">
                  Costo adicional: <span className="text-[#25d366] font-semibold">$14.990 CLP/mes</span>
                </p>
                <div className="flex gap-3">
                  <a
                    href="mailto:webmakerchile@gmail.com?subject=Activar%20WhatsApp%20Cappta%20AI&body=Hola%2C%20quiero%20activar%20la%20integraci%C3%B3n%20de%20WhatsApp%20en%20mi%20cuenta%20Cappta%20AI."
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25d366] hover:bg-[#20bd5a] text-white text-sm font-bold transition-colors"
                    data-testid="link-activate-whatsapp"
                  >
                    <Send className="w-4 h-4" />
                    Solicitar activación
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#25d366]/5 border border-[#25d366]/20">
              <div className="w-3 h-3 rounded-full bg-[#25d366] animate-pulse" />
              <div>
                <p className="text-sm font-bold text-[#25d366]" data-testid="text-whatsapp-status">WhatsApp Activo</p>
                <p className="text-xs text-white/40">
                  {whatsappNumber ? `Número: ${whatsappNumber}` : "Número asignado por el administrador"}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-white/60 mb-2 block">Saludo personalizado de WhatsApp</label>
              <p className="text-xs text-white/30 mb-2">Este mensaje se usa como contexto adicional cuando el bot responde por WhatsApp</p>
              <Textarea
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                placeholder="Ej: Hola, bienvenido a [tu negocio]. ¿En qué te puedo ayudar hoy?"
                className="bg-white/[0.04] border-white/[0.08] text-white min-h-[80px] rounded-xl"
                data-testid="input-whatsapp-greeting"
              />
            </div>

            <Button
              onClick={handleSaveGreeting}
              disabled={saving}
              className="bg-[#25d366] hover:bg-[#20bd5a] text-white font-bold rounded-xl"
              data-testid="button-save-whatsapp"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Guardar configuración
            </Button>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 mt-4">
              <h4 className="text-sm font-bold text-white/60 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#25d366]" />
                Cómo funciona
              </h4>
              <ul className="space-y-2 text-xs text-white/40">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#25d366] mt-0.5 flex-shrink-0" />
                  Los clientes envían un mensaje a tu número de WhatsApp
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#25d366] mt-0.5 flex-shrink-0" />
                  Cappta AI responde automáticamente con IA usando tu base de conocimiento
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#25d366] mt-0.5 flex-shrink-0" />
                  Si necesitan atención humana, un ejecutivo puede tomar el control
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#25d366] mt-0.5 flex-shrink-0" />
                  Funciona 24/7 con la misma personalidad e información de tu chatbot web
                </li>
              </ul>
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("upgrade");
    const validPlans = ["solo", "basic", "scale"];
    if (requested && validPlans.includes(requested) && requested !== tenant.plan) {
      toast({
        title: "Plan recomendado",
        description: `Estás viendo el flujo de upgrade a Cappta ${requested === "basic" ? "Pro" : requested[0].toUpperCase() + requested.slice(1)}. Confirma abajo para activarlo.`,
      });
      const url = new URL(window.location.href);
      url.searchParams.delete("upgrade");
      window.history.replaceState({}, "", url.toString());
    }
  }, [tenant.plan, toast]);

  const planLabels: Record<string, string> = {
    free: "Cappta Starter",
    solo: "Cappta Solo",
    basic: "Cappta Pro",
    scale: "Cappta Scale",
    pro: "Cappta Pro (legacy)",
    enterprise: "Cappta Enterprise",
  };
  const planPrices: Record<string, string> = {
    free: "$0",
    solo: "$7.990",
    basic: "$19.990",
    scale: "$49.990",
    pro: "$49.990",
    enterprise: "Custom",
  };
  const planPricesClp: Record<string, number> = {
    free: 0,
    solo: 7990,
    basic: 19990,
    scale: 49990,
    pro: 49990,
    enterprise: 0,
  };

  const tenantCurrency = (tenant.currency || "CLP").toUpperCase();
  const showFx = tenantCurrency !== "CLP";

  const { data: fxData } = useQuery<{ base: string; date: string; rates: Record<string, number> }>({
    queryKey: ["/api/fx/rates"],
    enabled: showFx,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  const fxRate = showFx && fxData?.rates ? fxData.rates[tenantCurrency] : null;
  const renderConverted = (planKey: string, testIdSuffix: string) => {
    if (!showFx || !fxRate || !isFinite(fxRate) || fxRate <= 0) return null;
    const clp = planPricesClp[planKey];
    if (!clp || clp <= 0) return null;
    const meta = getCurrency(tenantCurrency);
    const rounded = Math.max(1, Math.round(clp * fxRate));
    let amountStr: string;
    try {
      amountStr = new Intl.NumberFormat(meta.locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(rounded);
    } catch {
      amountStr = String(rounded);
    }
    return (
      <p className="text-[10px] text-white/55 font-semibold mt-0.5" data-testid={`text-plan-converted-${testIdSuffix}`}>
        ≈ {meta.code} {amountStr} aprox.
      </p>
    );
  };
  const planColors: Record<string, string> = {
    free: "#6b7280",
    solo: "hsl(258, 78%, 65%)",
    basic: "hsl(142, 72%, 40%)",
    scale: "hsl(217, 91%, 60%)",
    pro: "hsl(217, 75%, 55%)",
    enterprise: "hsl(30, 90%, 52%)",
  };

  const planLimits: Record<string, { sessions: string; messages: string; features: string[] }> = {
    free: {
      sessions: "50 / mes",
      messages: "500 / mes",
      features: ["Widget web personalizable", "IA con GPT-4o Mini", "Base de conocimiento básica", "1 usuario admin"],
    },
    solo: {
      sessions: "200 / mes",
      messages: "2.000 / mes",
      features: ["Todo de Starter", "KB ilimitada con análisis de URL", "App PWA con notificaciones push", "Plantillas verticales", "Soporte por email"],
    },
    basic: {
      sessions: "500 / mes",
      messages: "5.000 / mes",
      features: ["Todo de Solo", "WhatsApp Business incluido", "3 usuarios / agentes", "Catálogo de productos", "Calificaciones de clientes", "Soporte prioritario"],
    },
    scale: {
      sessions: "5.000 / mes",
      messages: "50.000 / mes",
      features: ["Todo de Pro", "Multi-canal (Instagram, Messenger, Telegram)", "10 usuarios / agentes con roles", "Flow builder visual", "Lead scoring + secuencias", "Reportes avanzados"],
    },
    pro: {
      sessions: "Ilimitadas",
      messages: "Ilimitados",
      features: ["Plan legado — equivalente a Scale", "Soporte 24/7", "API personalizada", "Multi-agente", "Onboarding personalizado"],
    },
    enterprise: {
      sessions: "Ilimitadas",
      messages: "Ilimitados",
      features: ["Todo de Scale", "Usuarios ilimitados", "SLA dedicado y soporte 24/7", "SSO + auditoría", "Integraciones a medida", "Cuenta dedicada"],
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
      const order = ["free", "solo", "basic", "scale", "pro", "enterprise"];
      const currentIdx = order.indexOf(tenant.plan);
      const targetIdx = order.indexOf(key);
      // Enterprise es solo por ventas, no aparece en checkout self-serve.
      // Pro es plan legado, no se ofrece como upgrade.
      return targetIdx > currentIdx && key !== "pro" && key !== "enterprise";
    }
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl glass-card p-4 sm:p-6 animate-dash-scale-in relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full animate-subtle-breathe" style={{ background: `radial-gradient(circle, ${currentColor}20, transparent 60%)` }} />

        <div className="flex items-center justify-between mb-6 relative">
          <div className="animate-dash-slide-right">
            <h3 className="text-lg font-bold mb-1">Tu Plan Actual</h3>
            <p className="text-sm text-white/40">Gestiona tu suscripción</p>
          </div>
          <div className="text-right animate-icon-pop">
            <div className="px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105 inline-flex items-center gap-1.5" style={{ backgroundColor: `${currentColor}15`, color: currentColor, boxShadow: `0 0 20px ${currentColor}10` }} data-testid="badge-plan">
              <Sparkles className="w-3.5 h-3.5" />
              {planLabels[tenant.plan] || tenant.plan}
            </div>
            <p className="text-xs text-white/45 mt-1.5" data-testid="text-current-plan-price">
              {tenant.plan === "enterprise"
                ? "Precio personalizado"
                : tenant.plan === "free"
                ? "Gratis"
                : <><span className="font-bold text-white/70">{planPrices[tenant.plan]}</span> CLP/mes</>}
            </p>
            {renderConverted(tenant.plan, "current")}
            {(tenant.currency || "CLP") !== "CLP" && tenant.plan !== "free" && tenant.plan !== "enterprise" && (
              <p className="text-[10px] text-amber-400/80 mt-1" data-testid="text-billed-clp-current">
                Facturado en CLP
              </p>
            )}
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

      {tenant.plan !== "free" && (
        <div className="rounded-xl glass-card p-4 animate-dash-fade-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Suscripción activa</p>
              <p className="text-xs text-white/30 mt-0.5">Se renueva automáticamente cada mes</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-300"
              data-testid="button-cancel-subscription"
              onClick={async () => {
                if (!confirm("¿Estás seguro de cancelar tu suscripción? Volverás al plan gratuito.")) return;
                try {
                  const token = localStorage.getItem("tenant_token");
                  const res = await fetch("/api/tenants/me/cancel-subscription", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (res.ok) {
                    toast({ title: "Suscripción cancelada", description: "Tu plan ha sido degradado a Cappta Starter." });
                    queryClient.invalidateQueries({ queryKey: ["/api/tenants/me"] });
                  } else {
                    toast({ title: "Error", description: "No se pudo cancelar la suscripción", variant: "destructive" });
                  }
                } catch {
                  toast({ title: "Error", description: "Error de conexión", variant: "destructive" });
                }
              }}
            >
              Cancelar suscripción
            </Button>
          </div>
        </div>
      )}

      {tenant.plan !== "enterprise" && (
        <div className="animate-dash-fade-up dash-stagger-4">
          <h3 className="text-base font-bold mb-4 text-white/70 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary animate-glow-pulse" />
            Mejora tu plan
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {upgradePlans.map(([key, limits], idx) => {
              const color = planColors[key];
              const isGreen = key === "basic";
              const planTaglines: Record<string, string> = {
                solo: "Para microemprendedores y profesionales independientes",
                basic: "Para negocios en crecimiento",
                scale: "Para empresas medianas con varios canales y equipos",
              };
              return (
                <div key={key} className={`rounded-2xl glass-card ${isGreen ? "glass-card-glow-green" : "glass-card-glow-orange"} p-6 transition-all duration-300 relative overflow-hidden group animate-dash-scale-in dash-stagger-${idx + 2}`}>
                  <div className="absolute top-0 left-0 right-0 h-px transition-opacity duration-500 group-hover:opacity-100 opacity-60" style={{ background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)` }} />
                  <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full transition-all duration-700 opacity-0 group-hover:opacity-100" style={{ background: `radial-gradient(circle, ${color}10, transparent 60%)` }} />

                  <div className="flex items-center justify-between mb-4 relative">
                    <div>
                      <h4 className="text-lg font-bold transition-colors duration-300 group-hover:text-white">{planLabels[key]}</h4>
                      <p className="text-xs text-white/35">
                        {planTaglines[key] || "Mejora tus capacidades"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black transition-all duration-300 group-hover:scale-105" style={{ color }} data-testid={`badge-price-${key}`}>{planPrices[key]}</p>
                      <p className="text-xs text-white/30">CLP/mes</p>
                      {renderConverted(key, key)}
                      {(tenant.currency || "CLP") !== "CLP" && (
                        <p className="text-[9px] text-amber-400/80 font-medium" data-testid={`text-billed-clp-${key}`}>Facturado en CLP</p>
                      )}
                      <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">7 días para probar</p>
                      {key === "solo" ? (
                        <p className="text-[9px] text-white/30 mt-0.5">WhatsApp como add-on opcional</p>
                      ) : (
                        <p className="text-[9px] text-emerald-400/70 mt-0.5">WhatsApp Business incluido</p>
                      )}
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
                        Probar 7 días gratis
                      </span>
                    )}
                  </Button>
                  <p className="text-[9px] text-white/25 text-center mt-2">Al suscribirte aceptas que no se admiten reembolsos. <a href="/terminos" className="underline hover:text-white/40">Ver términos</a></p>
                </div>
              );
            })}

            <div className={`rounded-2xl glass-card glass-card-glow-orange p-6 transition-all duration-300 relative overflow-hidden group animate-dash-scale-in dash-stagger-${upgradePlans.length + 2}`} data-testid="card-upgrade-enterprise">
              <div className="absolute top-0 left-0 right-0 h-px transition-opacity duration-500 group-hover:opacity-100 opacity-60" style={{ background: "linear-gradient(90deg, transparent 0%, hsl(30, 90%, 52%) 50%, transparent 100%)" }} />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full transition-all duration-700 opacity-0 group-hover:opacity-100" style={{ background: "radial-gradient(circle, hsla(30, 90%, 52%, 0.1), transparent 60%)" }} />

              <div className="flex items-center justify-between mb-4 relative">
                <div>
                  <h4 className="text-lg font-bold transition-colors duration-300 group-hover:text-white">{planLabels.enterprise}</h4>
                  <p className="text-xs text-white/35">Para grandes empresas y operaciones críticas</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black transition-all duration-300 group-hover:scale-105" style={{ color: "hsl(30, 90%, 52%)" }} data-testid="badge-price-enterprise">A medida</p>
                  <p className="text-xs text-white/30">Precio personalizado</p>
                  <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">SLA dedicado</p>
                  <p className="text-[9px] text-emerald-400/70 mt-0.5">WhatsApp Business incluido</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 relative">
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 transition-all duration-300 group-hover:bg-white/[0.05]">
                  <p className="text-xs text-white/35">Sesiones</p>
                  <p className="text-sm font-bold">{planLimits.enterprise.sessions}</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 transition-all duration-300 group-hover:bg-white/[0.05]">
                  <p className="text-xs text-white/35">Mensajes</p>
                  <p className="text-sm font-bold">{planLimits.enterprise.messages}</p>
                </div>
              </div>

              <ul className="space-y-2 mb-5 relative">
                {planLimits.enterprise.features.slice(0, 6).map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/50 transition-colors duration-300 group-hover:text-white/65">
                    <Check className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" style={{ color: "hsl(30, 90%, 52%)" }} />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className="w-full rounded-xl h-11 font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-xl relative overflow-hidden"
                style={{ backgroundColor: "hsl(30, 90%, 52%)", color: "white" }}
                data-testid="button-contact-sales-enterprise"
              >
                <a href="/enterprise" className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Hablar con ventas
                </a>
              </Button>
              <p className="text-[9px] text-white/25 text-center mt-2">Onboarding white-glove, account manager y contrato a medida.</p>
            </div>
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

  const currentUrl = "https://www.cappta.ai/panel";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl glass-card p-4 sm:p-6 space-y-6 animate-dash-scale-in relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full animate-orb-drift opacity-30" style={{ background: "radial-gradient(circle, rgba(6,182,212,0.06), transparent 60%)", animationDelay: "-4s" }} />

        <div className="relative">
          <h3 className="text-lg font-bold mb-1 animate-dash-slide-right flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Descarga Cappta AI en tus dispositivos
          </h3>
          <p className="text-sm text-white/40 animate-dash-slide-right dash-stagger-1">Instala Cappta AI como app en tu celular o computador desde <span className="text-primary font-medium">cappta.ai/panel</span>. Tu panel es personal — solo tu puedes ver y gestionar tu negocio. Una vez que inicies sesión, no tendras que volver a hacerlo.</p>
        </div>

        {isInstalled && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-xl bg-green-500/5 border border-green-500/15 p-4 flex items-center gap-3">
            <CircleCheck className="w-5 h-5 text-green-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-400">App instalada</p>
              <p className="text-xs text-white/40">Cappta AI ya está instalado en este dispositivo. Puedes abrirlo desde tu escritorio o pantalla de inicio.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-3 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.1] group">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Smartphone className="w-6 h-6 text-cyan-400" />
            </div>
            <h4 className="text-sm font-bold text-white/90">Celular (Android / iOS)</h4>
            <p className="text-xs text-white/40 leading-relaxed">Agrega Cappta AI a tu pantalla de inicio y recibe notificaciones push cada vez que un cliente escriba.</p>
          </div>

          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-3 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.1] group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Monitor className="w-6 h-6 text-blue-400" />
            </div>
            <h4 className="text-sm font-bold text-white/90">Computador (PC / Mac)</h4>
            <p className="text-xs text-white/40 leading-relaxed">Instala Cappta AI como aplicación de escritorio en Chrome, Edge o Brave. Se abre como una ventana independiente.</p>
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
        <div className="rounded-2xl glass-card p-4 sm:p-6 animate-dash-fade-up relative overflow-hidden">
          <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full animate-orb-drift opacity-30" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.06), transparent 60%)" }} />
          <div className="flex items-center gap-4 relative">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 animate-float" style={{ animationDuration: "6s" }}>
              <Download className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold mb-1">Instalar ahora</h4>
              <p className="text-xs text-white/40">Tu navegador permite instalar Cappta AI directamente. Haz clic para agregarlo a tu dispositivo.</p>
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

      <div className="rounded-2xl glass-card p-4 sm:p-6 space-y-6 animate-dash-fade-up relative overflow-hidden">
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
              { step: "1", text: "Abre Chrome y visita cappta.ai/panel" },
              { step: "2", text: "Inicia sesión con tu cuenta (si no tienes, registrate gratis)" },
              { step: "3", text: 'Toca el menú (3 puntos arriba a la derecha)' },
              { step: "4", text: 'Selecciona "Agregar a pantalla de inicio" o "Instalar aplicación"' },
              { step: "5", text: "Cappta AI se instalara como app y tu sesión quedara activa" },
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
              { step: "1", text: "Abre Safari y visita cappta.ai/panel" },
              { step: "2", text: "Inicia sesión con tu cuenta (si no tienes, registrate gratis)" },
              { step: "3", text: 'Toca el botón de compartir (cuadrado con flecha hacia arriba)' },
              { step: "4", text: 'Selecciona "Agregar a pantalla de inicio" y confirma' },
              { step: "5", text: "Cappta AI se instalara como app y tu sesión quedara activa" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0 text-[10px] font-bold text-blue-400">{item.step}</div>
                <p className="text-xs text-white/60 leading-relaxed pt-0.5">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl glass-card p-4 sm:p-6 space-y-6 animate-dash-fade-up relative overflow-hidden">
        <div className="relative">
          <h3 className="text-base font-bold mb-1 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-primary" />
            Como instalar en tu computador
          </h3>
          <p className="text-xs text-white/40">Chrome, Edge y Brave permiten instalar Cappta AI como app de escritorio</p>
        </div>

        <div className="space-y-4">
          {[
            { step: "1", text: "Abre tu navegador (Chrome, Edge o Brave) y visita cappta.ai/panel" },
            { step: "2", text: "Inicia sesión con tu cuenta (si no tienes, registrate gratis)" },
            { step: "3", text: 'Busca el icono de instalar en la barra de direcciones o ve al menú del navegador' },
            { step: "4", text: 'Haz clic en "Instalar Cappta AI" o "Instalar aplicación"' },
            { step: "5", text: "Cappta AI se abrira como ventana independiente con tu sesión activa" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary">{item.step}</div>
              <p className="text-xs text-white/60 leading-relaxed pt-0.5">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl glass-card p-4 sm:p-6 space-y-4 animate-dash-fade-up relative overflow-hidden">
        <div className="relative">
          <h3 className="text-base font-bold mb-1 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-primary" />
            Comparte con tu equipo
          </h3>
          <p className="text-xs text-white/40">Envia este enlace a tus ejecutivos para que instalen Cappta AI en sus dispositivos</p>
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

        <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 space-y-1.5">
          <p className="text-xs text-white/60 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-medium">Tu panel es privado y personal</span>
          </p>
          <p className="text-[11px] text-white/35 leading-relaxed pl-5">Cada persona que acceda a cappta.ai/panel vera unicamente su propio negocio. Si no tiene cuenta, podra registrarse e iniciar sesión. Una vez dentro, la sesión se mantiene activa — no tendra que iniciar sesión cada vez.</p>
        </div>
      </div>
    </div>
  );
}

const addonDashboardIcons: Record<string, typeof Package> = {
  Megaphone, Link: LinkIcon, Phone: Headphones, FileText: BookOpen, TrendingDown: TrendingUp, BarChart: BarChart3, Workflow: Sparkles, Calendar: Clock, Package, Instagram: MessageCircle,
};

const addonCategoryColors: Record<string, string> = {
  marketing: "#f59e0b",
  comunicacion: "#06b6d4",
  analytics: "#8b5cf6",
  productividad: "#10b981",
};

const addonCategoryLabels: Record<string, string> = {
  marketing: "Marketing",
  comunicacion: "Comunicación",
  analytics: "Analytics",
  productividad: "Productividad",
};

interface AddonInfo {
  id: number;
  slug: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  category: string;
  active: number;
  sortOrder: number;
}

interface TenantAddonInfo {
  id: number;
  tenantId: number;
  addonSlug: string;
  status: string;
  activatedAt: string;
  cancelledAt: string | null;
  mpPaymentId: string | null;
  addon: AddonInfo;
}

interface IndustryTemplateDashboard {
  id: number;
  slug: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  icon: string;
}

function PlantillasSection({ tenant, token }: { tenant: TenantProfile; token: string }) {
  const { toast } = useToast();
  const [applying, setApplying] = useState<string | null>(null);
  const { data: templates = [] } = useQuery<IndustryTemplateDashboard[]>({
    queryKey: ["/api/industry-templates"],
  });

  const applyTemplate = async (slug: string) => {
    if (!confirm(`¿Aplicar la plantilla "${templates.find(t => t.slug === slug)?.name}"? Esto reemplazará tu mensaje de bienvenida y opciones de consulta.`)) {
      return;
    }
    setApplying(slug);
    try {
      const res = await fetch(`/api/tenants/me/apply-template/${slug}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al aplicar");
      queryClient.invalidateQueries({ queryKey: ["/api/tenants/me"] });
      toast({ title: "Plantilla aplicada", description: "Tu chatbot ya tiene la nueva configuración." });
    } catch (err: any) {
      toast({ title: "Error al aplicar plantilla", description: err.message, variant: "destructive" });
    }
    setApplying(null);
  };

  const currentSlug = tenant.appliedTemplateSlug || "";

  return (
    <div className="space-y-5" data-testid="section-plantillas">
      <div className="rounded-2xl glass-card p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Plantillas verticales</h2>
            <p className="text-sm text-white/50">
              Aplica una plantilla optimizada para tu rubro en 1 click. Incluye mensajes de bienvenida, opciones de consulta y respuestas rápidas listas para usar.
            </p>
          </div>
        </div>
        {currentSlug && (
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 mb-4 flex items-center gap-2">
            <CircleCheck className="w-4 h-4 text-primary" />
            <p className="text-sm text-white/70">
              Plantilla activa:{" "}
              <strong className="text-white">{templates.find((t) => t.slug === currentSlug)?.name || currentSlug}</strong>
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {templates.map((tpl) => {
            const isActive = currentSlug === tpl.slug;
            const isApplying = applying === tpl.slug;
            return (
              <button
                key={tpl.slug}
                onClick={() => applyTemplate(tpl.slug)}
                disabled={!!applying}
                className={`relative rounded-xl border p-4 text-left transition-all hover-elevate ${
                  isActive
                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                } ${isApplying ? "opacity-60" : ""}`}
                data-testid={`button-template-${tpl.slug}`}
                style={isActive ? { borderColor: tpl.color, background: `${tpl.color}1A` } : undefined}
              >
                {isApplying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-xl">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                )}
                <div className="flex items-start justify-between mb-2">
                  <span className="text-3xl">{tpl.emoji}</span>
                  {isActive && <CircleCheck className="w-4 h-4 text-primary mt-1" />}
                </div>
                <h3 className="font-bold text-sm mb-1" data-testid={`text-template-name-${tpl.slug}`}>{tpl.name}</h3>
                <p className="text-xs text-white/40 leading-tight line-clamp-2">{tpl.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface ChannelInfo {
  id: number;
  channel: string;
  enabled: number;
  displayName: string | null;
  externalId: string | null;
  inboundAddress: string | null;
  status: string;
  statusMessage: string | null;
  hasAccessToken: boolean;
  hasBotToken: boolean;
  hasWebhookSecret: boolean;
  lastSyncedAt: string | null;
}

type ChannelCatalogEntry = {
  slug: ChannelSlug;
  name: string;
  emoji: string;
  color: string;
  description: string;
  fields: { key: string; label: string; placeholder: string }[];
  docs: string;
};

const CHANNEL_CATALOG: ChannelCatalogEntry[] = [
  {
    slug: "telegram",
    name: "Telegram",
    emoji: "✈️",
    color: "#0088cc",
    description: "Setup express con BotFather. 60 segundos.",
    fields: [
      { key: "botToken", label: "Bot Token (BotFather)", placeholder: "123456:ABC-DEF..." },
      { key: "displayName", label: "Nombre del bot (opcional)", placeholder: "@MiBot" },
    ],
    docs: "Creá tu bot con @BotFather en Telegram (/newbot) y pegá aquí el token. Cappta configura el webhook automáticamente.",
  },
  {
    slug: "whatsapp_cloud",
    name: "WhatsApp Cloud API",
    emoji: "📱",
    color: "#25D366",
    description: "Conexión directa con Meta Cloud API (sin Twilio).",
    fields: [
      { key: "accessToken", label: "Access Token", placeholder: "EAAB..." },
      { key: "phoneNumberId", label: "Phone Number ID", placeholder: "1234567890" },
      { key: "webhookSecret", label: "Verify Token", placeholder: "Tu verify token (App Setup)" },
    ],
    docs: "Configurá tu app en Meta for Developers, generá Access Token y Phone Number ID.",
  },
  {
    slug: "instagram",
    name: "Instagram DM",
    emoji: "📷",
    color: "#E1306C",
    description: "Recibí y respondé DMs de Instagram Business.",
    fields: [
      { key: "accessToken", label: "Page Access Token", placeholder: "EAAB..." },
      { key: "igUserId", label: "IG User ID", placeholder: "1789..." },
      { key: "webhookSecret", label: "Verify Token", placeholder: "Tu verify token" },
    ],
    docs: "Conectá tu cuenta Business de Instagram a una Página de Facebook. Genera el Page Access Token con permisos de instagram_basic e instagram_manage_messages.",
  },
  {
    slug: "messenger",
    name: "Facebook Messenger",
    emoji: "💬",
    color: "#0084FF",
    description: "Atendé mensajes desde tu Página de Facebook.",
    fields: [
      { key: "accessToken", label: "Page Access Token", placeholder: "EAAB..." },
      { key: "pageId", label: "Page ID", placeholder: "1234567890" },
      { key: "webhookSecret", label: "Verify Token", placeholder: "Tu verify token" },
    ],
    docs: "Conectá tu Página de Facebook con Meta for Developers y permisos pages_messaging.",
  },
  {
    slug: "email",
    name: "Email-to-Chat",
    emoji: "📧",
    color: "#F59E0B",
    description: "Convierte emails en conversaciones de chat.",
    fields: [
      { key: "inboundAddress", label: "Dirección inbound", placeholder: "soporte+t1@cappta.app" },
      { key: "displayName", label: "Nombre que ven los clientes", placeholder: "Soporte de tu negocio" },
    ],
    docs: "Configurá una dirección de email inbound. Reenviá tus emails desde tu casilla y respondé desde el inbox.",
  },
];

function CanalesSection({ tenant, token }: { tenant: TenantProfile; token: string }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const { data: channels = [], refetch } = useQuery<ChannelInfo[]>({
    queryKey: ["/api/tenants/me/channels"],
    queryFn: async () => {
      const res = await fetch("/api/tenants/me/channels", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const startEdit = (slug: string) => {
    const existing = channels.find((c) => c.channel === slug);
    setFormValues({
      displayName: existing?.displayName || "",
      externalId: existing?.externalId || "",
      inboundAddress: existing?.inboundAddress || "",
    });
    setEditing(slug);
  };

  const saveChannel = async (slug: string) => {
    try {
      const payload: any = { ...formValues, enabled: 1 };
      const res = await fetch(`/api/tenants/me/channels/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Error" }));
        throw new Error(err.message || "Error al guardar");
      }
      toast({ title: "Canal guardado", description: "Tu canal está conectado." });
      setEditing(null);
      setFormValues({});
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const toggleChannel = async (slug: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/tenants/me/channels/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: enabled ? 1 : 0 }),
      });
      if (!res.ok) throw new Error("Error");
      refetch();
      toast({ title: enabled ? "Canal activado" : "Canal pausado" });
    } catch {
      toast({ title: "Error al actualizar canal", variant: "destructive" });
    }
  };

  const deleteChannel = async (slug: string) => {
    if (!confirm("¿Eliminar este canal? Se desconectará y se borrarán sus credenciales.")) return;
    try {
      const res = await fetch(`/api/tenants/me/channels/${slug}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error");
      refetch();
      toast({ title: "Canal eliminado" });
    } catch {
      toast({ title: "Error al eliminar canal", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5" data-testid="section-canales">
      <div className="rounded-2xl glass-card p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Canales conectados</h2>
            <p className="text-sm text-white/50">
              Conectá WhatsApp, Instagram, Messenger, Telegram y Email. Tus mensajes llegan al mismo inbox del Panel de Soporte.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {CHANNEL_CATALOG.map((cfg) => {
          const existing = channels.find((c) => c.channel === cfg.slug);
          const isConnected = !!existing;
          const isEnabled = existing?.enabled === 1;
          const isEditing = editing === cfg.slug;
          const minPlan = CHANNEL_MIN_PLAN[cfg.slug];
          const isLocked = planRank(tenant.plan) < planRank(minPlan.plan);

          if (isLocked) {
            return (
              <div
                key={cfg.slug}
                className="rounded-2xl glass-card p-5 relative overflow-hidden opacity-80"
                data-testid={`card-channel-${cfg.slug}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl grayscale"
                      style={{ background: `${cfg.color}10`, color: cfg.color }}
                    >
                      {cfg.emoji}
                    </div>
                    <div>
                      <h3 className="font-bold text-white/70" data-testid={`text-channel-name-${cfg.slug}`}>{cfg.name}</h3>
                      <p className="text-xs text-white/40">{cfg.description}</p>
                    </div>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full border font-medium bg-amber-500/10 border-amber-500/30 text-amber-300"
                    data-testid={`badge-channel-locked-${cfg.slug}`}
                  >
                    {minPlan.label}+
                  </span>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-xs text-white/55 mb-3">
                  Disponible desde <strong className="text-white/80">{minPlan.label}</strong>. Mejorá tu plan para activar este canal.
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-amber-500/30 hover:bg-amber-500/10 text-amber-300"
                  onClick={() => {
                    const planTab = document.querySelector('[data-testid="nav-plan"]');
                    if (planTab) (planTab as HTMLElement).click();
                  }}
                  data-testid={`button-upgrade-${cfg.slug}`}
                >
                  <Zap className="w-3.5 h-3.5 mr-2" />
                  Mejorar a {minPlan.label}
                </Button>
              </div>
            );
          }

          return (
            <div
              key={cfg.slug}
              className="rounded-2xl glass-card p-5"
              data-testid={`card-channel-${cfg.slug}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: `${cfg.color}20`, color: cfg.color }}
                  >
                    {cfg.emoji}
                  </div>
                  <div>
                    <h3 className="font-bold" data-testid={`text-channel-name-${cfg.slug}`}>{cfg.name}</h3>
                    <p className="text-xs text-white/40">{cfg.description}</p>
                  </div>
                </div>
                {isConnected && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
                    style={{
                      background: isEnabled ? `${cfg.color}20` : "rgba(255,255,255,0.04)",
                      borderColor: isEnabled ? `${cfg.color}66` : "rgba(255,255,255,0.08)",
                      color: isEnabled ? cfg.color : "rgba(255,255,255,0.4)",
                    }}
                    data-testid={`status-channel-${cfg.slug}`}
                  >
                    {isEnabled ? "Activo" : "Pausado"}
                  </span>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  {cfg.fields.map((f) => (
                    <div key={f.key}>
                      <label className="text-xs text-white/60 mb-1 block">{f.label}</label>
                      <Input
                        type={f.key.toLowerCase().includes("token") || f.key.toLowerCase().includes("secret") ? "password" : "text"}
                        placeholder={f.placeholder}
                        value={formValues[f.key] || ""}
                        onChange={(e) => setFormValues({ ...formValues, [f.key]: e.target.value })}
                        className="bg-white/[0.04] border-white/[0.08]"
                        data-testid={`input-${cfg.slug}-${f.key}`}
                      />
                    </div>
                  ))}
                  <p className="text-[11px] text-white/40 leading-relaxed">{cfg.docs}</p>
                  {(cfg.slug === "instagram" || cfg.slug === "messenger" || cfg.slug === "whatsapp_cloud") && (
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2 text-[11px] text-white/50">
                      <strong className="text-white/70">Webhook URL:</strong>{" "}
                      <code className="text-primary break-all">
                        {baseUrl}/api/channels/{cfg.slug === "whatsapp_cloud" ? "whatsapp-cloud" : cfg.slug}/webhook
                      </code>
                    </div>
                  )}
                  {cfg.slug === "email" && (
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2 text-[11px] text-white/50">
                      <strong className="text-white/70">Webhook inbound:</strong>{" "}
                      <code className="text-primary break-all">{baseUrl}/api/channels/email/inbound</code>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={() => saveChannel(cfg.slug)} className="flex-1" data-testid={`button-save-${cfg.slug}`}>
                      Guardar y conectar
                    </Button>
                    <Button variant="outline" onClick={() => { setEditing(null); setFormValues({}); }} data-testid={`button-cancel-${cfg.slug}`}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => startEdit(cfg.slug)}
                    variant={isConnected ? "outline" : "default"}
                    size="sm"
                    className="flex-1"
                    data-testid={`button-${isConnected ? "edit" : "connect"}-${cfg.slug}`}
                  >
                    {isConnected ? "Editar" : "Conectar"}
                  </Button>
                  {isConnected && (
                    <>
                      <Button
                        onClick={() => toggleChannel(cfg.slug, !isEnabled)}
                        variant="outline"
                        size="sm"
                        data-testid={`button-toggle-${cfg.slug}`}
                      >
                        {isEnabled ? "Pausar" : "Activar"}
                      </Button>
                      <Button
                        onClick={() => deleteChannel(cfg.slug)}
                        variant="outline"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        data-testid={`button-delete-${cfg.slug}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl glass-card p-5 sm:p-6">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          ¿Cómo funciona la omnicanalidad?
        </h3>
        <ul className="space-y-2 text-sm text-white/60">
          <li className="flex items-start gap-2">
            <CircleCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span>Cada canal aparece como una conversación más en el <strong>Panel de Soporte</strong>, con un badge de color para identificarlo.</span>
          </li>
          <li className="flex items-start gap-2">
            <CircleCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span>Tus respuestas vuelven automáticamente por el mismo canal de origen (WhatsApp por WhatsApp, IG por IG, etc.).</span>
          </li>
          <li className="flex items-start gap-2">
            <CircleCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span>Tu plantilla de rubro se aplica automáticamente al primer mensaje en cualquier canal.</span>
          </li>
          <li className="flex items-start gap-2">
            <CircleCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span>Podés filtrar el inbox por canal para concentrarte en uno a la vez.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function ExtensionesSection({ token }: { token: string }) {
  const { toast } = useToast();

  const { data: allAddons = [], isLoading: addonsLoading } = useQuery<AddonInfo[]>({
    queryKey: ["/api/addons"],
    queryFn: async () => {
      const res = await fetch("/api/addons");
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const { data: myAddons = [], isLoading: myAddonsLoading } = useQuery<TenantAddonInfo[]>({
    queryKey: ["/api/tenants/me/addons"],
    queryFn: async () => {
      const res = await fetch("/api/tenants/me/addons", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (addonSlug: string) => {
      const res = await fetch(`/api/tenants/me/addons/${addonSlug}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.requiresPayment && data.initPoint) {
        window.open(data.initPoint, "_blank");
        toast({ title: "Redirigiendo al pago", description: "Completa el pago para activar la extensión" });
      } else {
        toast({ title: "Extensión activada" });
        queryClient.invalidateQueries({ queryKey: ["/api/tenants/me/addons"] });
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (slug: string) => {
      const res = await fetch(`/api/tenants/me/addons/${slug}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Extensión cancelada" });
      queryClient.invalidateQueries({ queryKey: ["/api/tenants/me/addons"] });
    },
    onError: () => {
      toast({ title: "Error al cancelar", variant: "destructive" });
    },
  });

  const activeAddonSlugs = new Set(myAddons.filter(a => a.status === "active").map(a => a.addonSlug));

  if (addonsLoading || myAddonsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="section-dashboard-addons">
      {myAddons.filter(a => a.status === "active").length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider">Tus extensiones activas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myAddons.filter(a => a.status === "active").map((ta) => {
              const IconComp = addonDashboardIcons[ta.addon.icon] || Package;
              const catColor = addonCategoryColors[ta.addon.category] || "#8b5cf6";
              return (
                <div key={ta.id} className="glass-card rounded-xl p-4 flex items-start gap-3" data-testid={`active-addon-${ta.addonSlug}`}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${catColor}15` }}>
                    <IconComp className="w-4.5 h-4.5" style={{ color: catColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-white/90">{ta.addon.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400">ACTIVA</span>
                    </div>
                    <p className="text-[11px] text-white/35 truncate">{ta.addon.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] text-red-400/60 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                    onClick={() => cancelMutation.mutate(ta.addonSlug)}
                    disabled={cancelMutation.isPending}
                    data-testid={`button-cancel-addon-${ta.addonSlug}`}
                  >
                    Cancelar
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider">Todas las extensiones</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allAddons.map((addon) => {
            const IconComp = addonDashboardIcons[addon.icon] || Package;
            const catColor = addonCategoryColors[addon.category] || "#8b5cf6";
            const isActive = activeAddonSlugs.has(addon.slug);
            return (
              <div
                key={addon.slug}
                className={`glass-card rounded-xl p-4 flex flex-col transition-all duration-300 ${isActive ? "ring-1 ring-emerald-500/20" : "hover:border-white/10"}`}
                data-testid={`addon-card-${addon.slug}`}
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${catColor}15` }}>
                    <IconComp className="w-4.5 h-4.5" style={{ color: catColor }} />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider" style={{ color: catColor, backgroundColor: `${catColor}10` }}>
                    {addonCategoryLabels[addon.category]}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white/90 mb-1">{addon.name}</h4>
                <p className="text-[11px] text-white/35 leading-relaxed mb-3 flex-1">{addon.description}</p>
                <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06]">
                  <span className="text-base font-black" style={{ color: catColor }}>
                    ${addon.price.toLocaleString("es-CL")}
                    <span className="text-[10px] text-white/25 font-normal ml-0.5">/mes</span>
                  </span>
                  {isActive ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <CircleCheck className="w-3 h-3" /> Activa
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      className="text-xs rounded-lg px-3 py-1.5 h-auto"
                      onClick={() => activateMutation.mutate(addon.slug)}
                      disabled={activateMutation.isPending}
                      data-testid={`button-activate-addon-${addon.slug}`}
                    >
                      {activateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Activar"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ConnectSection({ tenant, token }: { tenant: TenantProfile; token: string }) {
  const { toast } = useToast();
  const isPaidPlan = ["solo", "basic", "scale", "pro", "enterprise"].includes(tenant.plan);
  const [tab, setTab] = useState<"reportes" | "pagos" | "citas">("reportes");

  const authFetch = async (url: string) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error((await res.json().catch(() => ({ message: "Error" }))).message || "Error");
    return res.json();
  };

  const { data: stats } = useQuery<{
    totalAppointments: number;
    upcomingAppointments: number;
    appointmentsThisMonth: number;
    completedAppointments: number;
    totalPaymentLinks: number;
    paidPaymentLinks: number;
    pendingPaymentLinks: number;
    revenueThisMonth: number;
    revenueAllTime: number;
  }>({
    queryKey: ["/api/tenant-panel/connect/stats"],
    queryFn: () => authFetch("/api/tenant-panel/connect/stats"),
    enabled: isPaidPlan,
  });

  const { data: links = [] } = useQuery<any[]>({
    queryKey: ["/api/tenant-panel/connect/payment-links"],
    queryFn: () => authFetch("/api/tenant-panel/connect/payment-links"),
    enabled: isPaidPlan,
  });
  const { data: appts = [] } = useQuery<any[]>({
    queryKey: ["/api/tenant-panel/connect/appointments"],
    queryFn: () => authFetch("/api/tenant-panel/connect/appointments"),
    enabled: isPaidPlan,
  });
  const { data: slots = [] } = useQuery<any[]>({
    queryKey: ["/api/tenant-panel/connect/slots"],
    queryFn: () => authFetch("/api/tenant-panel/connect/slots"),
    enabled: isPaidPlan,
  });

  const [linkForm, setLinkForm] = useState<{ description: string; amount: number | null; customerName: string; customerEmail: string }>({ description: "", amount: null, customerName: "", customerEmail: "" });
  const [slotForm, setSlotForm] = useState<{ name: string; description: string; durationMinutes: number; price: number | null; requiresPayment: boolean }>({ name: "", description: "", durationMinutes: 30, price: null, requiresPayment: false });

  const createLink = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tenant-panel/connect/payment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          description: linkForm.description,
          amount: linkForm.amount ?? 0,
          customerName: linkForm.customerName || null,
          customerEmail: linkForm.customerEmail || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Error");
      return res.json();
    },
    onSuccess: (link: any) => {
      setLinkForm({ description: "", amount: null, customerName: "", customerEmail: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/connect/payment-links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/connect/stats"] });
      toast({ title: "Link de pago creado", description: link.paymentUrl ? "Cópialo y compártelo con tu cliente" : "Activá Mercado Pago para generar el enlace de cobro" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const cancelLink = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/tenant-panel/connect/payment-links/${id}/cancel`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.json()).message || "Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/connect/payment-links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/connect/stats"] });
    },
  });

  const createSlot = useMutation({
    mutationFn: async () => {
      const availability = JSON.stringify({
        "1": [{ start: "09:00", end: "18:00" }],
        "2": [{ start: "09:00", end: "18:00" }],
        "3": [{ start: "09:00", end: "18:00" }],
        "4": [{ start: "09:00", end: "18:00" }],
        "5": [{ start: "09:00", end: "18:00" }],
      });
      const res = await fetch("/api/tenant-panel/connect/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: slotForm.name,
          description: slotForm.description || null,
          durationMinutes: parseInt(String(slotForm.durationMinutes)) || 30,
          price: slotForm.price ?? null,
          requiresPayment: slotForm.requiresPayment ? 1 : 0,
          availability,
          active: 1,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Error");
      return res.json();
    },
    onSuccess: () => {
      setSlotForm({ name: "", description: "", durationMinutes: 30, price: null, requiresPayment: false });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/connect/slots"] });
      toast({ title: "Servicio creado", description: "Comparte tu link público para que reserven" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteSlot = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/tenant-panel/connect/slots/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Error");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/connect/slots"] }),
  });

  const updateApptStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/tenant-panel/connect/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/connect/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-panel/connect/stats"] });
    },
  });

  if (!isPaidPlan) {
    return (
      <div className="rounded-2xl glass-card p-8 text-center">
        <Link2 className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Cappta Connect</h2>
        <p className="text-white/50 mb-4">Cobra y agenda directamente desde el chat de tu sitio. Disponible desde el plan <strong className="text-primary">Básico</strong>.</p>
        <p className="text-sm text-white/40">Mejorá tu plan para activar links de pago, reservas online y reportes de ventas cerradas.</p>
      </div>
    );
  }

  const tenantCurrency = tenant.currency || "CLP";
  const fmt = (v: number) => formatMoney(v, tenantCurrency);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast({ title: "Copiado al portapapeles" }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-white/[0.06]">
        {([
          { v: "reportes", label: "Reportes", icon: BarChart3 },
          { v: "pagos", label: "Pagos en chat", icon: DollarSign },
          { v: "citas", label: "Citas", icon: CalendarDays },
        ] as const).map(t => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${tab === t.v ? "border-primary text-primary" : "border-transparent text-white/50 hover:text-white/70"}`}
            data-testid={`tab-connect-${t.v}`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "reportes" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Ventas cerradas (mes)", value: fmt(stats?.revenueThisMonth || 0), icon: DollarSign, accent: "text-emerald-400" },
            { label: "Ventas totales", value: fmt(stats?.revenueAllTime || 0), icon: TrendingUp, accent: "text-primary" },
            { label: "Pagos exitosos", value: stats?.paidPaymentLinks ?? 0, icon: Receipt, accent: "text-blue-400" },
            { label: "Pagos pendientes", value: stats?.pendingPaymentLinks ?? 0, icon: Clock, accent: "text-amber-400" },
            { label: "Citas próximas", value: stats?.upcomingAppointments ?? 0, icon: CalendarDays, accent: "text-primary" },
            { label: "Citas este mes", value: stats?.appointmentsThisMonth ?? 0, icon: CalendarPlus, accent: "text-emerald-400" },
            { label: "Citas completadas", value: stats?.completedAppointments ?? 0, icon: Check, accent: "text-blue-400" },
            { label: "Citas totales", value: stats?.totalAppointments ?? 0, icon: Users, accent: "text-white/60" },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl glass-card p-5" data-testid={`stat-connect-${i}`}>
              <s.icon className={`w-5 h-5 mb-2 ${s.accent}`} />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-white/40 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "pagos" && (
        <div className="space-y-6">
          <div className="rounded-2xl glass-card p-6">
            <h3 className="font-bold mb-1">Crear nuevo link de pago</h3>
            <p className="text-xs text-white/40 mb-4">Genera un enlace de Mercado Pago para cobrar a un cliente desde el chat o WhatsApp.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder="Descripción (ej: Consultoría 1h)" value={linkForm.description} onChange={e => setLinkForm({ ...linkForm, description: e.target.value })} data-testid="input-link-description" />
              <CurrencyInput
                value={linkForm.amount}
                onValueChange={(v) => setLinkForm({ ...linkForm, amount: v })}
                currency={tenantCurrency}
                placeholder={`Monto en ${tenantCurrency}`}
                ariaLabel="Monto del link de pago"
                data-testid="input-link-amount"
              />
              <Input placeholder="Nombre cliente (opcional)" value={linkForm.customerName} onChange={e => setLinkForm({ ...linkForm, customerName: e.target.value })} data-testid="input-link-customer-name" />
              <Input type="email" placeholder="Email cliente (opcional)" value={linkForm.customerEmail} onChange={e => setLinkForm({ ...linkForm, customerEmail: e.target.value })} data-testid="input-link-customer-email" />
            </div>
            <Button
              className="mt-4"
              onClick={() => createLink.mutate()}
              disabled={createLink.isPending || !linkForm.description || !linkForm.amount}
              data-testid="button-create-link"
            >
              {createLink.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Generar link
            </Button>
          </div>

          <div className="rounded-2xl glass-card p-6">
            <h3 className="font-bold mb-4">Historial de cobros ({links.length})</h3>
            {links.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-8">Aún no has generado links de pago.</p>
            ) : (
              <div className="space-y-2">
                {links.map((l: any) => (
                  <div key={l.id} className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]" data-testid={`row-payment-link-${l.id}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{l.description}</p>
                      <p className="text-xs text-white/40">{formatMoney(l.amount, l.currency || tenantCurrency)} · {l.customerName || l.customerEmail || "Sin cliente"}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${
                      l.status === "paid" ? "bg-emerald-500/15 text-emerald-400" :
                      l.status === "pending" ? "bg-amber-500/15 text-amber-400" :
                      l.status === "cancelled" ? "bg-white/10 text-white/40" :
                      "bg-red-500/15 text-red-400"
                    }`}>{l.status === "paid" ? "PAGADO" : l.status === "pending" ? "PENDIENTE" : l.status === "cancelled" ? "CANCELADO" : "EXPIRADO"}</span>
                    {l.paymentUrl && l.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => copy(l.paymentUrl)} data-testid={`button-copy-link-${l.id}`}>
                          <Copy className="w-3 h-3 mr-1" /> Copiar
                        </Button>
                        <a href={l.paymentUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1" data-testid={`link-open-${l.id}`}>
                          Abrir <ExternalLink className="w-3 h-3" />
                        </a>
                        <Button size="sm" variant="ghost" onClick={() => cancelLink.mutate(l.id)} disabled={cancelLink.isPending} data-testid={`button-cancel-link-${l.id}`}>
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "citas" && (
        <div className="space-y-6">
          <div className="rounded-2xl glass-card p-6">
            <h3 className="font-bold mb-1">Crear servicio agendable</h3>
            <p className="text-xs text-white/40 mb-4">Define un tipo de cita. Tus clientes podrán reservarla desde el link público.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder="Nombre del servicio (ej: Consulta inicial)" value={slotForm.name} onChange={e => setSlotForm({ ...slotForm, name: e.target.value })} data-testid="input-slot-name" />
              <Input type="number" placeholder="Duración (minutos)" value={slotForm.durationMinutes} onChange={e => setSlotForm({ ...slotForm, durationMinutes: parseInt(e.target.value) || 30 })} data-testid="input-slot-duration" />
              <Input placeholder="Descripción (opcional)" value={slotForm.description} onChange={e => setSlotForm({ ...slotForm, description: e.target.value })} data-testid="input-slot-description" />
              <CurrencyInput
                value={slotForm.price}
                onValueChange={(v) => setSlotForm({ ...slotForm, price: v })}
                currency={tenantCurrency}
                placeholder={`Precio ${tenantCurrency} (opcional)`}
                ariaLabel="Precio del servicio agendable"
                data-testid="input-slot-price"
              />
            </div>
            <label className="flex items-center gap-2 mt-3 text-sm text-white/60">
              <input type="checkbox" checked={slotForm.requiresPayment} onChange={e => setSlotForm({ ...slotForm, requiresPayment: e.target.checked })} data-testid="checkbox-slot-requires-payment" />
              Requerir pago al reservar
            </label>
            <Button className="mt-4" onClick={() => createSlot.mutate()} disabled={createSlot.isPending || !slotForm.name} data-testid="button-create-slot">
              {createSlot.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Crear servicio
            </Button>
          </div>

          <div className="rounded-2xl glass-card p-6">
            <h3 className="font-bold mb-4">Servicios activos ({slots.length})</h3>
            {slots.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-6">Aún no creaste servicios.</p>
            ) : (
              <div className="space-y-2">
                {slots.map((s: any) => {
                  const publicUrl = `${window.location.origin}/agenda/${s.id}`;
                  return (
                    <div key={s.id} className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]" data-testid={`row-slot-${s.id}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <p className="text-xs text-white/40">{s.durationMinutes} min{s.price ? ` · ${formatMoney(s.price, tenantCurrency)}` : ""}{s.requiresPayment ? " · pago requerido" : ""}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => copy(publicUrl)} data-testid={`button-copy-agenda-${s.id}`}>
                        <Copy className="w-3 h-3 mr-1" /> Link
                      </Button>
                      <a href={publicUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                        Abrir <ExternalLink className="w-3 h-3" />
                      </a>
                      <Button size="sm" variant="ghost" onClick={() => deleteSlot.mutate(s.id)} disabled={deleteSlot.isPending} data-testid={`button-delete-slot-${s.id}`}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl glass-card p-6">
            <h3 className="font-bold mb-4">Próximas citas ({appts.length})</h3>
            {appts.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-6">Aún no tienes reservas.</p>
            ) : (
              <div className="space-y-2">
                {appts.map((a: any) => (
                  <div key={a.id} className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]" data-testid={`row-appt-${a.id}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.customerName} · {a.customerEmail}</p>
                      <p className="text-xs text-white/40">{new Date(a.scheduledAt).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" })}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${
                      a.status === "completed" ? "bg-emerald-500/15 text-emerald-400" :
                      a.status === "confirmed" ? "bg-blue-500/15 text-blue-400" :
                      a.status === "cancelled" || a.status === "no_show" ? "bg-white/10 text-white/40" :
                      "bg-amber-500/15 text-amber-400"
                    }`}>{a.status.toUpperCase()}</span>
                    {a.status === "scheduled" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => updateApptStatus.mutate({ id: a.id, status: "confirmed" })} data-testid={`button-confirm-${a.id}`}>Confirmar</Button>
                        <Button size="sm" variant="ghost" onClick={() => updateApptStatus.mutate({ id: a.id, status: "cancelled" })} data-testid={`button-cancel-${a.id}`}>Cancelar</Button>
                      </>
                    )}
                    {a.status === "confirmed" && (
                      <Button size="sm" variant="outline" onClick={() => updateApptStatus.mutate({ id: a.id, status: "completed" })} data-testid={`button-complete-${a.id}`}>Completar</Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type DashboardTab = "stats" | "config" | "embed" | "download" | "plan" | "referidos" | "guides" | "whatsapp" | "extensiones" | "connect" | "plantillas" | "canales";

const navItems: { title: string; value: DashboardTab; icon: typeof Settings }[] = [
  { title: "Estadísticas", value: "stats", icon: BarChart3 },
  { title: "Plantillas", value: "plantillas", icon: Sparkles },
  { title: "Canales", value: "canales", icon: Zap },
  { title: "Configuración", value: "config", icon: Palette },
  { title: "Integración", value: "embed", icon: Code },
  { title: "WhatsApp", value: "whatsapp", icon: MessageCircle },
  { title: "Cappta Connect", value: "connect", icon: Link2 },
  { title: "Extensiones", value: "extensiones", icon: Package },
  { title: "Descargar App", value: "download", icon: Download },
  { title: "Referidos", value: "referidos", icon: Gift },
  { title: "Guías", value: "guides", icon: BookOpen },
  { title: "Plan", value: "plan", icon: CreditCard },
];

export default function Dashboard() {
  const { tenant, isLoading, token } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>("stats");
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== "undefined" ? window.innerWidth >= 768 : true);
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
        if (typeof window !== "undefined" && (window as any).ttq) {
          (window as any).ttq.track("CompletePayment", { content_type: "product", content_name: "Cappta AI Plan" });
        }
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
            <CapptaIcon className="w-9 h-9 relative" />
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
          const tourSeen = localStorage.getItem("nexia_tour_seen");
          if (!tourSeen) {
            setShowTourPrompt(true);
          }
        }}
      />
    );
  }

  const planLabels: Record<string, string> = {
    free: "Cappta Starter",
    solo: "Cappta Solo",
    basic: "Cappta Pro",
    scale: "Cappta Scale",
    pro: "Cappta Pro (legacy)",
    enterprise: "Cappta Enterprise",
  };
  const planColors: Record<string, string> = {
    free: "#6b7280",
    solo: "hsl(258, 78%, 65%)",
    basic: "hsl(142, 72%, 40%)",
    scale: "hsl(217, 91%, 60%)",
    pro: "hsl(217, 75%, 55%)",
    enterprise: "hsl(30, 90%, 52%)",
  };

  const planTheme: Record<string, { borderColor: string; glowFrom: string; glowTo: string; orbColor: string; accentRgba: string }> = {
    free: {
      borderColor: "rgba(16, 185, 129, 0.12)",
      glowFrom: "rgba(16, 185, 129, 0.03)",
      glowTo: "transparent",
      orbColor: "rgba(16, 185, 129, 0.04)",
      accentRgba: "rgba(16, 185, 129, 0.08)",
    },
    solo: {
      borderColor: "rgba(167, 139, 250, 0.18)",
      glowFrom: "rgba(167, 139, 250, 0.05)",
      glowTo: "rgba(118, 105, 233, 0.03)",
      orbColor: "rgba(167, 139, 250, 0.05)",
      accentRgba: "rgba(167, 139, 250, 0.1)",
    },
    basic: {
      borderColor: "rgba(16, 185, 129, 0.18)",
      glowFrom: "rgba(16, 185, 129, 0.04)",
      glowTo: "rgba(245, 158, 11, 0.03)",
      orbColor: "rgba(245, 158, 11, 0.05)",
      accentRgba: "rgba(16, 185, 129, 0.1)",
    },
    scale: {
      borderColor: "rgba(59, 130, 246, 0.20)",
      glowFrom: "rgba(59, 130, 246, 0.05)",
      glowTo: "rgba(37, 99, 235, 0.03)",
      orbColor: "rgba(59, 130, 246, 0.06)",
      accentRgba: "rgba(59, 130, 246, 0.1)",
    },
    pro: {
      borderColor: "rgba(59, 130, 246, 0.18)",
      glowFrom: "rgba(59, 130, 246, 0.04)",
      glowTo: "rgba(37, 99, 235, 0.03)",
      orbColor: "rgba(59, 130, 246, 0.05)",
      accentRgba: "rgba(59, 130, 246, 0.08)",
    },
    enterprise: {
      borderColor: "rgba(245, 158, 11, 0.20)",
      glowFrom: "rgba(245, 158, 11, 0.05)",
      glowTo: "rgba(217, 119, 6, 0.03)",
      orbColor: "rgba(245, 158, 11, 0.07)",
      accentRgba: "rgba(245, 158, 11, 0.12)",
    },
  };
  const theme = planTheme[tenant.plan] || planTheme.free;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`${sidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full md:translate-x-0 overflow-hidden"} fixed md:relative z-50 md:z-auto h-full shrink-0 transition-all duration-300 flex flex-col bg-background animate-sidebar-glow`} style={{ borderRight: `1px solid ${theme.borderColor}` }}>
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
                <CapptaIcon className="w-6 h-6" />
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
                onClick={() => { setActiveTab(item.value); if (window.innerWidth < 768) setSidebarOpen(false); }}
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

          <div className="mt-3 pt-3 space-y-2" style={{ borderTop: `1px solid ${theme.borderColor}` }}>
            <a
              href="/panel"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-300 bg-primary/10 text-primary font-semibold hover:bg-primary/20 group/panel"
              data-testid="nav-panel"
            >
              <Headphones className="w-[18px] h-[18px] transition-transform duration-300 group-hover/panel:scale-110" />
              <span>Panel de Soporte</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto text-primary/50" />
            </a>
            <a
              href="/sales-engine"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-300 bg-gradient-to-r from-primary/15 to-fuchsia-500/10 text-primary font-semibold hover:from-primary/25 hover:to-fuchsia-500/20 group/sales border border-primary/20"
              data-testid="nav-sales-engine"
            >
              <Brain className="w-[18px] h-[18px] transition-transform duration-300 group-hover/sales:scale-110" />
              <span>Motor de Ventas IA</span>
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
        <header className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 animate-dash-fade-in relative overflow-hidden" style={{ borderBottom: `1px solid ${theme.borderColor}` }}>
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

          <div className="relative min-w-0">
            <h1 className="text-base sm:text-lg font-bold truncate" data-testid="text-dashboard-title">
              {navItems.find((n) => n.value === activeTab)?.title || "Dashboard"}
            </h1>
            <p className="text-[10px] sm:text-xs text-white/30 hidden sm:block">
              {activeTab === "stats" && "Métricas de tu chat en tiempo real"}
              {activeTab === "config" && "Personaliza tu widget de chat"}
              {activeTab === "embed" && "Agrega el chat a tu sitio web"}
              {activeTab === "download" && "Instala Cappta AI en tu celular o computador"}
              {activeTab === "guides" && "Manuales de instalación paso a paso"}
              {activeTab === "referidos" && "Invita negocios y gana meses gratis"}
              {activeTab === "whatsapp" && "Conecta tu chatbot a WhatsApp"}
              {activeTab === "connect" && "Cobra y agenda directo desde el chat"}
              {activeTab === "extensiones" && "Añade superpoderes a tu plataforma"}
              {activeTab === "plantillas" && "Aplica una plantilla optimizada para tu rubro"}
              {activeTab === "canales" && "Conecta WhatsApp, Instagram, Telegram, Email y más"}
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

        <main className="flex-1 overflow-auto p-3 sm:p-6 md:p-8 relative">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none animate-orb-drift" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.02), transparent 60%)", animationDelay: "-5s" }} />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none animate-orb-drift" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.02), transparent 60%)", animationDelay: "-12s" }} />

          <div className="max-w-5xl mx-auto space-y-6 relative" key={activeTab}>
            {activeTab === "stats" && <StatsSection token={token!} />}
            {activeTab === "config" && <WidgetConfigSection tenant={tenant} token={token!} />}
            {activeTab === "embed" && <EmbedCodeSection tenant={tenant} />}
            {activeTab === "download" && <DownloadAppSection />}
            {activeTab === "guides" && <GuidesPanel />}
            {activeTab === "referidos" && <ReferidosSection />}
            {activeTab === "whatsapp" && <WhatsAppSection tenant={tenant} token={token!} />}
            {activeTab === "connect" && <ConnectSection tenant={tenant} token={token!} />}
            {activeTab === "extensiones" && <ExtensionesSection token={token!} />}
            {activeTab === "plantillas" && <PlantillasSection tenant={tenant} token={token!} />}
            {activeTab === "canales" && <CanalesSection tenant={tenant} token={token!} />}
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
            localStorage.setItem("nexia_tour_seen", "1");
          }}
        />
      )}

      {showTour && (
        <DashboardTour
          onComplete={() => {
            setShowTour(false);
            localStorage.setItem("nexia_tour_seen", "1");
          }}
          onSkip={() => {
            setShowTour(false);
            localStorage.setItem("nexia_tour_seen", "1");
          }}
        />
      )}
    </div>
  );
}
