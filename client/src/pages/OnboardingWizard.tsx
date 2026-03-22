import { useState, useRef } from "react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Globe,
  Wand2,
  Loader2,
  Palette,
  Upload,
  X,
  Headphones,
  ArrowRight,
  ArrowLeft,
  Check,
  CircleCheck,
  Copy,
  Code,
  Rocket,
  Sparkles,
  UserCircle,
  Send,
  ImageIcon,
  ChevronDown,
  ChevronUp,
  Phone,
  ExternalLink,
  Plus,
  Trash2,
  MessageCircle,
} from "lucide-react";
import type { Tenant } from "@shared/schema";
import { NexiaIcon } from "@/components/NexiaLogo";

type TenantProfile = Omit<Tenant, "passwordHash">;

interface OnboardingWizardProps {
  tenant: TenantProfile;
  token: string;
  onComplete: () => void;
}

const STEPS = [
  { title: "Tu Negocio", icon: Globe, description: "Dinos sobre tu empresa" },
  { title: "Personaliza", icon: Palette, description: "Dale estilo a tu chat" },
  { title: "¡Listo!", icon: Rocket, description: "Tu chatbot está listo" },
];

export default function OnboardingWizard({ tenant, token, onComplete }: OnboardingWizardProps) {
  const { toast } = useToast();
  const initialStep = Math.min(tenant.onboardingStep || 0, 2);
  const [step, setStep] = useState(initialStep);

  const [companyName, setCompanyName] = useState(tenant.companyName || "");
  const [domain, setDomain] = useState(tenant.domain || "");
  const [analyzingUrl, setAnalyzingUrl] = useState(false);
  const [analyzedResult, setAnalyzedResult] = useState<string | null>(tenant.botContext || null);

  const [widgetColor, setWidgetColor] = useState(tenant.widgetColor || "#10b981");
  const [headerTextColor, setHeaderTextColor] = useState(tenant.headerTextColor || "#ffffff");
  const [botBubbleColor, setBotBubbleColor] = useState(tenant.botBubbleColor || "#2a2a2a");
  const [botTextColor, setBotTextColor] = useState(tenant.botTextColor || "#e0e0e0");
  const [userTextColor, setUserTextColor] = useState(tenant.userTextColor || "#ffffff");
  const [welcomeMessage, setWelcomeMessage] = useState(tenant.welcomeMessage || "Hola, ¿en qué podemos ayudarte?");
  const [logoUrl, setLogoUrl] = useState(tenant.logoUrl || "");
  const [logoScale, setLogoScale] = useState(tenant.logoScale || 100);
  const [avatarUrl, setAvatarUrl] = useState(tenant.avatarUrl || "");
  const [welcomeSubtitle, setWelcomeSubtitle] = useState(tenant.welcomeSubtitle || "Completa tus datos para iniciar la conversación");
  const [launcherImageUrl, setLauncherImageUrl] = useState(tenant.launcherImageUrl || "");
  const [launcherImageScale, setLauncherImageScale] = useState(tenant.launcherImageScale || 100);
  const [botIconUrl, setBotIconUrl] = useState(tenant.botIconUrl || "");
  const [botIconScale, setBotIconScale] = useState(tenant.botIconScale || 100);
  const [widgetPosition, setWidgetPosition] = useState(tenant.widgetPosition || "right");
  const [labelContactButton, setLabelContactButton] = useState(tenant.labelContactButton || "");
  const [labelTicketButton, setLabelTicketButton] = useState(tenant.labelTicketButton || "");
  const [labelFinalizeButton, setLabelFinalizeButton] = useState(tenant.labelFinalizeButton || "");
  const [welcomeBannerText, setWelcomeBannerText] = useState(tenant.welcomeBannerText || "");
  const [launcherBubbleText, setLauncherBubbleText] = useState(tenant.launcherBubbleText || "");
  const [launcherBubbleStyle, setLauncherBubbleStyle] = useState(tenant.launcherBubbleStyle || "normal");
  const [consultationOptions, setConsultationOptions] = useState<{ value: string; label: string }[]>(() => {
    try { return tenant.consultationOptions ? JSON.parse(tenant.consultationOptions) : []; } catch { return []; }
  });
  const [newOption, setNewOption] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLauncher, setUploadingLauncher] = useState(false);
  const [uploadingBotIcon, setUploadingBotIcon] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const launcherInputRef = useRef<HTMLInputElement>(null);
  const botIconInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState<"welcome" | "chat" | "launcher">("welcome");

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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: urlToAnalyze }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Error al analizar" }));
        throw new Error(err.message);
      }
      const { organized } = await res.json();
      setAnalyzedResult(organized);
      await fetch("/api/tenant-panel/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ botContext: organized }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tenants/me"] });
      toast({ title: "Sitio analizado", description: "Tu bot ya aprendió sobre tu negocio automáticamente." });
    } catch (err: any) {
      toast({ title: "Error al analizar", description: err.message || "Verifica que la URL sea accesible", variant: "destructive" });
    }
    setAnalyzingUrl(false);
  };

  const saveFieldToDb = async (field: string, value: string | null): Promise<boolean> => {
    try {
      const res = await fetch("/api/tenants/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast({ title: "Solo imágenes de hasta 5MB", variant: "destructive" });
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
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast({ title: "Solo imágenes de hasta 5MB", variant: "destructive" });
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

  const handleLauncherUpload = async (file: File) => {
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast({ title: "Solo imágenes de hasta 5MB", variant: "destructive" });
      return;
    }
    setUploadingLauncher(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads/direct", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Error al subir archivo");
      const { objectPath } = await res.json();
      const saved = await saveFieldToDb("launcherImageUrl", objectPath);
      if (saved) {
        setLauncherImageUrl(objectPath);
        toast({ title: "Imagen del botón subida y guardada" });
      }
    } catch {
      toast({ title: "Error al subir la imagen", variant: "destructive" });
    }
    setUploadingLauncher(false);
  };

  const handleBotIconUpload = async (file: File) => {
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast({ title: "Solo imágenes de hasta 5MB", variant: "destructive" });
      return;
    }
    setUploadingBotIcon(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads/direct", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Error al subir archivo");
      const { objectPath } = await res.json();
      const saved = await saveFieldToDb("botIconUrl", objectPath);
      if (saved) {
        setBotIconUrl(objectPath);
        toast({ title: "Ícono del bot subido y guardado" });
      }
    } catch {
      toast({ title: "Error al subir la imagen", variant: "destructive" });
    }
    setUploadingBotIcon(false);
  };

  const addConsultationOption = () => {
    const label = newOption.trim();
    if (!label) return;
    const value = label.toLowerCase().replace(/\s+/g, "_");
    if (consultationOptions.some((o) => o.value === value)) return;
    setConsultationOptions([...consultationOptions, { value, label }]);
    setNewOption("");
  };

  const removeConsultationOption = (value: string) => {
    setConsultationOptions(consultationOptions.filter((o) => o.value !== value));
  };

  const [savingStep, setSavingStep] = useState(false);

  const saveStepAndAdvance = async (nextStep: number) => {
    setSavingStep(true);
    const data: any = {
      companyName,
      domain: domain.trim() || null,
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
      welcomeBannerText: welcomeBannerText.trim() || null,
      launcherBubbleText: launcherBubbleText.trim() || null,
      launcherBubbleStyle,
      consultationOptions: consultationOptions.length > 0 ? JSON.stringify(consultationOptions) : null,
      botConfigured: nextStep >= 2 ? 1 : 0,
      onboardingStep: nextStep,
    };
    try {
      const res = await fetch("/api/tenants/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al guardar");
      queryClient.invalidateQueries({ queryKey: ["/api/tenants/me"] });
      setStep(nextStep);
    } catch {
      toast({ title: "Error", description: "No se pudieron guardar los cambios. Intenta de nuevo.", variant: "destructive" });
    }
    setSavingStep(false);
  };

  const [saving, setSaving] = useState(false);

  const finishOnboarding = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/tenants/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ onboardingStep: 3, botConfigured: 1 }),
      });
      if (!res.ok) throw new Error("Error");
      queryClient.invalidateQueries({ queryKey: ["/api/tenants/me"] });
      onComplete();
    } catch {
      toast({ title: "Error", description: "No se pudo completar. Intenta de nuevo.", variant: "destructive" });
    }
    setSaving(false);
  };

  const step1Valid = companyName.trim().length > 0;
  const step2Valid = widgetColor.trim().length > 0;

  const baseUrl = window.location.origin;

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

  const iframeCode = `<iframe
  id="nexia-widget"
  src="${baseUrl}/widget?tenantId=${tenant.id}"
  style="position:fixed;bottom:12px;right:12px;width:70px;height:70px;border:none;z-index:9999;"
  allow="microphone"
></iframe>
<script>
  window.addEventListener('message', function(e) {
    var f = document.getElementById('nexia-widget');
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

  const copyEmbed = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Código copiado!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start justify-center min-h-screen bg-background p-4 pt-8 relative overflow-y-auto">
      <div className="absolute top-20 left-20 w-96 h-96 rounded-full animate-orb-drift pointer-events-none" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.04), transparent 60%)" }} />
      <div className="absolute bottom-20 right-20 w-72 h-72 rounded-full animate-orb-drift pointer-events-none" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.03), transparent 60%)", animationDelay: "-8s" }} />

      <div className={`w-full relative ${step === 1 ? "max-w-5xl" : "max-w-3xl"} transition-all duration-500`}>
        <div className="text-center mb-8 animate-dash-fade-in">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center animate-float">
              <NexiaIcon className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black" data-testid="text-onboarding-title">
              Configura tu <span className="text-primary font-bold">Nexia AI</span>
            </h1>
          </div>
          <p className="text-sm text-white/40">3 pasos rápidos y tu chatbot estará listo</p>
        </div>

        <div className="flex items-center justify-center gap-0 mb-8" data-testid="onboarding-progress">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                    i < step
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : i === step
                        ? "bg-primary/20 text-primary border border-primary/30 shadow-lg shadow-primary/10"
                        : "bg-white/[0.04] text-white/20 border border-white/[0.06]"
                  }`}
                  data-testid={`step-indicator-${i}`}
                >
                  {i < step ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                </div>
                <span className={`text-[10px] mt-1.5 font-medium ${i <= step ? "text-primary" : "text-white/20"}`}>
                  {s.title}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-16 sm:w-24 h-0.5 mx-2 mb-5 rounded-full transition-all duration-500 ${i < step ? "bg-primary" : "bg-white/[0.06]"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl glass-card overflow-hidden animate-dash-scale-in">
          {step === 0 && (
            <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar" data-testid="onboarding-step-0">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
                  <Globe className="w-5 h-5 text-primary" />
                  Cuentanos sobre tu negocio
                </h2>
                <p className="text-sm text-white/40">Nexia AI aprendera de tu sitio web automáticamente</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Nombre de tu empresa</label>
                <Input
                  data-testid="onboarding-input-company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ej: Mi Tienda Online"
                  className="h-12 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40 text-base"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Sitio web (opcional pero recomendado)</label>
                <div className="flex items-center gap-2">
                  <Input
                    data-testid="onboarding-input-domain"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="www.minegocio.cl"
                    className="h-12 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40 text-base"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAnalyzeUrl(); } }}
                  />
                  <Button
                    onClick={handleAnalyzeUrl}
                    disabled={analyzingUrl || !domain.trim()}
                    className="h-12 rounded-xl px-5 font-bold shrink-0"
                    data-testid="onboarding-button-analyze"
                  >
                    {analyzingUrl ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Analizando...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Wand2 className="w-4 h-4" /> Analizar</span>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-white/30">Al analizar tu sitio, Nexia AI extraera automáticamente productos, servicios, contacto y horarios para entrenar el chatbot.</p>
              </div>

              {analyzedResult && (
                <div className="rounded-xl bg-green-500/5 border border-green-500/15 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <CircleCheck className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-400">Sitio analizado correctamente</p>
                    <p className="text-xs text-white/40 mt-1">Tu bot ya aprendió sobre tu negocio. Podrás editar esta información después en el Panel de Soporte.</p>
                  </div>
                </div>
              )}

              {!analyzedResult && domain.trim() && !analyzingUrl && (
                <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-3 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-300/80">Haz clic en "Analizar" para que Nexia AI aprenda sobre tu negocio automáticamente.</p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => saveStepAndAdvance(1)}
                  disabled={!step1Valid || savingStep}
                  className="h-12 rounded-xl px-8 font-bold text-base"
                  data-testid="onboarding-next-1"
                >
                  {savingStep ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col xl:flex-row max-h-[70vh]" data-testid="onboarding-step-1">
              <div className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
                    <Palette className="w-5 h-5 text-primary" />
                    Personaliza tu chatbot
                  </h2>
                  <p className="text-sm text-white/40">Dale la apariencia de tu marca</p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/60">Colores</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Color principal", value: widgetColor, setter: setWidgetColor, desc: "Header y burbujas del usuario" },
                      { label: "Texto del header", value: headerTextColor, setter: setHeaderTextColor, desc: "Nombre en el header" },
                      { label: "Burbuja del bot", value: botBubbleColor, setter: setBotBubbleColor, desc: "Fondo mensajes bot" },
                      { label: "Texto del bot", value: botTextColor, setter: setBotTextColor, desc: "Color texto del bot" },
                      { label: "Texto del usuario", value: userTextColor, setter: setUserTextColor, desc: "Color texto usuario" },
                    ].map((c, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                        <label className="text-xs font-medium text-white/50">{c.label}</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={c.value}
                            onChange={(e) => c.setter(e.target.value)}
                            className="h-8 w-9 rounded-lg border border-white/[0.08] cursor-pointer bg-transparent"
                            data-testid={`onboarding-color-${idx}`}
                          />
                          <Input
                            value={c.value}
                            onChange={(e) => c.setter(e.target.value)}
                            className="flex-1 h-8 rounded-lg bg-white/[0.04] border-white/[0.08] font-mono text-xs"
                          />
                        </div>
                        <p className="text-[10px] text-white/25">{c.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/60">Mensaje de bienvenida</label>
                  <Input
                    data-testid="onboarding-input-welcome"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Hola, ¿en que podemos ayudarte?"
                    className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/60">Logo (opcional)</label>
                    <div className="flex items-center gap-3">
                      {logoUrl ? (
                        <div className="relative group">
                          <img src={logoUrl} alt="Logo" className="h-12 w-12 rounded-xl object-cover border border-white/[0.08]" onError={() => setLogoUrl("")} />
                          <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <button onClick={() => logoInputRef.current?.click()} className="p-1 rounded bg-white/10 hover:bg-white/20"><Upload className="w-3 h-3 text-white" /></button>
                            <button onClick={() => setLogoUrl("")} className="p-1 rounded bg-red-500/20 hover:bg-red-500/30"><X className="w-3 h-3 text-red-400" /></button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => logoInputRef.current?.click()}
                          disabled={uploadingLogo}
                          className="h-12 w-12 rounded-xl border-2 border-dashed border-white/[0.1] hover:border-primary/40 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex items-center justify-center text-white/40"
                          data-testid="onboarding-upload-logo"
                        >
                          {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        </button>
                      )}
                      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ""; }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/60">Avatar bot (opcional)</label>
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <div className="relative group">
                          <img src={avatarUrl} alt="Avatar" className="h-12 w-12 rounded-full object-cover border border-white/[0.08]" onError={() => setAvatarUrl("")} />
                          <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <button onClick={() => avatarInputRef.current?.click()} className="p-1 rounded-full bg-white/10 hover:bg-white/20"><Upload className="w-3 h-3 text-white" /></button>
                            <button onClick={() => setAvatarUrl("")} className="p-1 rounded-full bg-red-500/20 hover:bg-red-500/30"><X className="w-3 h-3 text-red-400" /></button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={uploadingAvatar}
                          className="h-12 w-12 rounded-full border-2 border-dashed border-white/[0.1] hover:border-primary/40 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex items-center justify-center text-white/40"
                          data-testid="onboarding-upload-avatar"
                        >
                          {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCircle className="w-5 h-5" />}
                        </button>
                      )}
                      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = ""; }} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/60">Subtítulo del formulario</label>
                  <Input
                    data-testid="onboarding-input-subtitle"
                    value={welcomeSubtitle}
                    onChange={(e) => setWelcomeSubtitle(e.target.value)}
                    placeholder="Completa tus datos para iniciar la conversación"
                    className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/60">Botón flotante (opcional)</label>
                    <div className="flex items-center gap-3">
                      {launcherImageUrl ? (
                        <div className="relative group">
                          <img src={launcherImageUrl} alt="Botón" className="h-12 w-12 rounded-full object-cover border border-white/[0.08]" onError={() => setLauncherImageUrl("")} />
                          <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <button onClick={() => launcherInputRef.current?.click()} className="p-1 rounded-full bg-white/10 hover:bg-white/20"><Upload className="w-3 h-3 text-white" /></button>
                            <button onClick={() => { setLauncherImageUrl(""); saveFieldToDb("launcherImageUrl", null); }} className="p-1 rounded-full bg-red-500/20 hover:bg-red-500/30"><X className="w-3 h-3 text-red-400" /></button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => launcherInputRef.current?.click()}
                          disabled={uploadingLauncher}
                          className="h-12 w-12 rounded-full border-2 border-dashed border-white/[0.1] hover:border-primary/40 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex items-center justify-center text-white/40"
                          data-testid="onboarding-upload-launcher"
                        >
                          {uploadingLauncher ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                        </button>
                      )}
                      <input ref={launcherInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLauncherUpload(f); e.target.value = ""; }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/60">Ícono del bot (opcional)</label>
                    <div className="flex items-center gap-3">
                      {botIconUrl ? (
                        <div className="relative group">
                          <img src={botIconUrl} alt="Bot" className="h-12 w-12 rounded-full object-cover border border-white/[0.08]" onError={() => setBotIconUrl("")} />
                          <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <button onClick={() => botIconInputRef.current?.click()} className="p-1 rounded-full bg-white/10 hover:bg-white/20"><Upload className="w-3 h-3 text-white" /></button>
                            <button onClick={() => { setBotIconUrl(""); saveFieldToDb("botIconUrl", null); }} className="p-1 rounded-full bg-red-500/20 hover:bg-red-500/30"><X className="w-3 h-3 text-red-400" /></button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => botIconInputRef.current?.click()}
                          disabled={uploadingBotIcon}
                          className="h-12 w-12 rounded-full border-2 border-dashed border-white/[0.1] hover:border-primary/40 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex items-center justify-center text-white/40"
                          data-testid="onboarding-upload-boticon"
                        >
                          {uploadingBotIcon ? <Loader2 className="w-4 h-4 animate-spin" /> : <Headphones className="w-4 h-4" />}
                        </button>
                      )}
                      <input ref={botIconInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBotIconUpload(f); e.target.value = ""; }} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/60">Opciones de consulta (opcional)</label>
                  <div className="flex items-center gap-2">
                    <Input
                      data-testid="onboarding-input-option"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      placeholder="Ej: Ventas, Soporte técnico"
                      className="h-9 rounded-lg bg-white/[0.04] border-white/[0.08] focus:border-primary/40 text-sm"
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addConsultationOption(); } }}
                    />
                    <Button onClick={addConsultationOption} size="sm" className="h-9 px-3 rounded-lg shrink-0" disabled={!newOption.trim()} data-testid="onboarding-add-option">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {consultationOptions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {consultationOptions.map((opt) => (
                        <span key={opt.value} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-white/[0.06] border border-white/[0.08] text-white/70">
                          {opt.label}
                          <button onClick={() => removeConsultationOption(opt.value)} className="text-white/30 hover:text-red-400" data-testid={`onboarding-remove-option-${opt.value}`}><Trash2 className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-white/25">Se muestran como dropdown en el formulario de bienvenida</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/60">Banner de anuncio (opcional)</label>
                    <Input
                      data-testid="onboarding-input-banner"
                      value={welcomeBannerText}
                      onChange={(e) => setWelcomeBannerText(e.target.value)}
                      placeholder="Ej: ¡Oferta especial!"
                      className="h-9 rounded-lg bg-white/[0.04] border-white/[0.08] focus:border-primary/40 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/60">Burbuja del botón (opcional)</label>
                    <Input
                      data-testid="onboarding-input-bubble"
                      value={launcherBubbleText}
                      onChange={(e) => setLauncherBubbleText(e.target.value)}
                      placeholder="Ej: ¿Necesitas ayuda?"
                      className="h-9 rounded-lg bg-white/[0.04] border-white/[0.08] focus:border-primary/40 text-sm"
                    />
                    {launcherBubbleText.trim() && (
                      <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] border border-white/[0.08] p-0.5 w-fit mt-1">
                        {([
                          { id: "subtle", label: "Discreta" },
                          { id: "normal", label: "Normal" },
                          { id: "bold", label: "Vistosa" },
                        ] as const).map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setLauncherBubbleStyle(s.id)}
                            className={`text-[10px] px-2 py-1 rounded transition-colors font-medium ${launcherBubbleStyle === s.id ? "bg-primary/20 text-primary" : "text-white/40 hover:text-white/60"}`}
                            data-testid={`onboarding-bubble-style-${s.id}`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/60">Posición del widget</label>
                  <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] border border-white/[0.08] p-1 w-fit">
                    <button
                      onClick={() => setWidgetPosition("left")}
                      className={`text-xs px-3 py-1.5 rounded-md transition-colors font-medium ${widgetPosition === "left" ? "bg-primary/20 text-primary" : "text-white/40 hover:text-white/60"}`}
                      data-testid="onboarding-position-left"
                    >
                      Izquierda
                    </button>
                    <button
                      onClick={() => setWidgetPosition("right")}
                      className={`text-xs px-3 py-1.5 rounded-md transition-colors font-medium ${widgetPosition === "right" ? "bg-primary/20 text-primary" : "text-white/40 hover:text-white/60"}`}
                      data-testid="onboarding-position-right"
                    >
                      Derecha
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/60">Textos de botones (opcional)</label>
                  <div className="grid grid-cols-1 gap-2">
                    <Input
                      data-testid="onboarding-input-label-contact"
                      value={labelContactButton}
                      onChange={(e) => setLabelContactButton(e.target.value)}
                      placeholder="Contactar un ejecutivo"
                      className="h-9 rounded-lg bg-white/[0.04] border-white/[0.08] focus:border-primary/40 text-sm"
                    />
                    <Input
                      data-testid="onboarding-input-label-ticket"
                      value={labelTicketButton}
                      onChange={(e) => setLabelTicketButton(e.target.value)}
                      placeholder="Contactar ejecutivo (fuera de horario)"
                      className="h-9 rounded-lg bg-white/[0.04] border-white/[0.08] focus:border-primary/40 text-sm"
                    />
                    <Input
                      data-testid="onboarding-input-label-finalize"
                      value={labelFinalizeButton}
                      onChange={(e) => setLabelFinalizeButton(e.target.value)}
                      placeholder="Finalizar y Valorar"
                      className="h-9 rounded-lg bg-white/[0.04] border-white/[0.08] focus:border-primary/40 text-sm"
                    />
                    <p className="text-[10px] text-white/25">Deja vacío para usar los textos predeterminados</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(0)}
                    className="h-11 rounded-xl px-6 border-white/[0.08]"
                    data-testid="onboarding-back-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Atras
                  </Button>
                  <Button
                    onClick={() => saveStepAndAdvance(2)}
                    disabled={!step2Valid || savingStep}
                    className="h-12 rounded-xl px-8 font-bold text-base"
                    data-testid="onboarding-next-2"
                  >
                    {savingStep ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Siguiente
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

              <div className="xl:w-[360px] shrink-0 p-4 xl:p-6 border-t xl:border-t-0 xl:border-l border-white/[0.06] xl:sticky xl:top-0 xl:self-start xl:z-10">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-white/40 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Vista previa
                  </p>
                  <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5">
                    {(["welcome", "chat", "launcher"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setPreviewMode(mode)}
                        className={`text-[10px] px-2 py-1 rounded-md transition-colors ${previewMode === mode ? "bg-white/[0.1] text-white/90" : "text-white/40 hover:text-white/60"}`}
                        data-testid={`onboarding-preview-${mode}`}
                      >
                        {mode === "welcome" ? "Formulario" : mode === "chat" ? "Chat" : "Botón"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.08] overflow-hidden" style={{ height: 460 }}>
                  {previewMode === "launcher" ? (
                    <div className="flex flex-col h-full items-center justify-center" style={{ background: "#1a1a1a" }}>
                      <p className="text-[10px] text-white/40 mb-4">Así se verá el botón en tu sitio:</p>
                      <div className="relative flex items-center gap-2">
                        {launcherBubbleText && launcherBubbleStyle === "subtle" && (
                          <div className="max-w-[140px] px-2 py-1 rounded-md text-[8px] text-white/60" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                            {launcherBubbleText}
                          </div>
                        )}
                        {launcherBubbleText && launcherBubbleStyle === "normal" && (
                          <div className="max-w-[140px] px-2 py-1.5 rounded-xl rounded-br-sm text-[9px] font-medium" style={{ backgroundColor: "#1a1a1a", color: "#e0e0e0", border: `1px solid ${widgetColor}30`, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                            {launcherBubbleText}
                          </div>
                        )}
                        {launcherBubbleText && launcherBubbleStyle === "bold" && (
                          <div className="relative max-w-[160px] px-2.5 py-1.5 rounded-2xl text-[10px] font-bold text-white shadow-2xl" style={{ background: `linear-gradient(135deg, ${widgetColor}, ${widgetColor}dd)`, boxShadow: `0 4px 16px ${widgetColor}50` }}>
                            {launcherBubbleText}
                            <div className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-0 h-0 border-t-[4px] border-b-[4px] border-l-[6px] border-t-transparent border-b-transparent" style={{ borderLeftColor: widgetColor }} />
                          </div>
                        )}
                        <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl overflow-hidden shrink-0" style={{ backgroundColor: launcherImageUrl ? "transparent" : widgetColor }}>
                          {launcherImageUrl ? (
                            <img src={launcherImageUrl} alt="Botón" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <MessageCircle className="w-6 h-6 text-white" />
                          )}
                        </div>
                      </div>
                      <p className="text-[9px] text-white/25 mt-3">{launcherImageUrl ? "Imagen personalizada" : "Botón predeterminado"}</p>
                      <div className="mt-4 flex items-center gap-2">
                        <p className="text-[10px] text-white/40">Ícono del bot:</p>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden border" style={{ backgroundColor: botIconUrl ? "transparent" : `${widgetColor}20`, borderColor: botIconUrl ? "transparent" : `${widgetColor}30` }}>
                          {botIconUrl ? <img src={botIconUrl} alt="" className="w-full h-full rounded-full object-cover" /> : <Headphones className="w-3.5 h-3.5" style={{ color: widgetColor }} />}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-1 rounded-lg bg-white/[0.04] border border-white/[0.08] p-0.5">
                        <button onClick={() => setWidgetPosition("left")} className={`text-[9px] px-2 py-1 rounded-md transition-colors font-medium ${widgetPosition === "left" ? "bg-primary/20 text-primary" : "text-white/40"}`}>Izquierda</button>
                        <button onClick={() => setWidgetPosition("right")} className={`text-[9px] px-2 py-1 rounded-md transition-colors font-medium ${widgetPosition === "right" ? "bg-primary/20 text-primary" : "text-white/40"}`}>Derecha</button>
                      </div>
                    </div>
                  ) : previewMode === "welcome" ? (
                    <div className="flex flex-col h-full" style={{ background: "#1a1a1a" }}>
                      <div className="px-4 py-3 flex items-center gap-2 shrink-0" style={{ background: widgetColor }}>
                        {logoUrl ? (
                          <img src={logoUrl} alt="" className="w-7 h-7 rounded-full object-cover bg-white/15" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                            <Headphones className="w-3.5 h-3.5" style={{ color: headerTextColor }} />
                          </div>
                        )}
                        <span className="text-sm font-semibold truncate" style={{ color: headerTextColor }}>{companyName || "Mi Empresa"}</span>
                        <div className="ml-auto w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                          <X className="w-3 h-3" style={{ color: headerTextColor }} />
                        </div>
                      </div>
                      <div className="flex flex-col items-center pt-4 pb-2 px-4 shrink-0">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center mb-2 border overflow-hidden" style={{ backgroundColor: `${widgetColor}20`, borderColor: `${widgetColor}30` }}>
                          {logoUrl ? (
                            <img src={logoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <Headphones className="w-5 h-5" style={{ color: widgetColor }} />
                          )}
                        </div>
                        <h2 className="text-xs font-bold text-white mb-0.5 text-center">{welcomeMessage || "Hola, ¿en que podemos ayudarte?"}</h2>
                        <p className="text-[9px] text-white/50 text-center">{welcomeSubtitle || "Completa tus datos para iniciar la conversación"}</p>
                      </div>
                      {welcomeBannerText && (
                        <div className="mx-4 px-2 py-1.5 rounded-md text-[9px] text-center font-medium" style={{ backgroundColor: `${widgetColor}15`, border: `1px solid ${widgetColor}30`, color: widgetColor }}>
                          {welcomeBannerText}
                        </div>
                      )}
                      <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-2">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-medium text-white/40">Nombre</label>
                          <div className="h-7 rounded-md bg-white/5 border border-white/10 px-2 flex items-center">
                            <span className="text-[9px] text-white/25">Tu nombre</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-medium text-white/40">Email</label>
                          <div className="h-7 rounded-md bg-white/5 border border-white/10 px-2 flex items-center">
                            <span className="text-[9px] text-white/25">tu@correo.com</span>
                          </div>
                        </div>
                        {consultationOptions.length > 0 && (
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-medium text-white/40">Tipo de consulta</label>
                            <div className="h-7 rounded-md bg-white/5 border border-white/10 px-2 flex items-center justify-between">
                              <span className="text-[9px] text-white/25">Selecciona...</span>
                              <ChevronDown className="w-3 h-3 text-white/20" />
                            </div>
                          </div>
                        )}
                        <div className="pt-1">
                          <div className="h-8 rounded-md flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: widgetColor, color: headerTextColor }}>
                            Iniciar Conversación
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full" style={{ background: "#1a1a1a" }}>
                      <div className="px-4 py-3 flex items-center gap-2 shrink-0" style={{ background: widgetColor }}>
                        {logoUrl ? (
                          <img src={logoUrl} alt="" className="w-7 h-7 rounded-full object-cover bg-white/15" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                            <Headphones className="w-3.5 h-3.5" style={{ color: headerTextColor }} />
                          </div>
                        )}
                        <span className="text-sm font-semibold truncate" style={{ color: headerTextColor }}>{companyName || "Mi Empresa"}</span>
                        <div className="ml-auto w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                          <X className="w-3 h-3" style={{ color: headerTextColor }} />
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        <div className="flex items-end gap-1.5">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 overflow-hidden border" style={{ backgroundColor: botIconUrl ? "transparent" : `${widgetColor}20`, borderColor: botIconUrl ? "transparent" : `${widgetColor}30` }}>
                            {botIconUrl ? <img src={botIconUrl} alt="" className="w-full h-full rounded-full object-cover" /> : avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : logoUrl ? <img src={logoUrl} alt="" className="w-full h-full rounded-full object-cover" /> : <Headphones className="w-3 h-3" style={{ color: widgetColor }} />}
                          </div>
                          <div className="max-w-[80%]">
                            <div className="rounded-md rounded-bl-none px-3 py-2" style={{ backgroundColor: botBubbleColor, border: `1px solid ${botBubbleColor === "#2a2a2a" ? "rgba(255,255,255,0.1)" : botBubbleColor}` }}>
                              <p className="text-[11px] leading-relaxed" style={{ color: botTextColor }}>¡Hola! Bienvenido a {companyName || "nuestra empresa"}. ¿En qué puedo ayudarte?</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-end gap-1.5 flex-row-reverse">
                          <div className="max-w-[80%]">
                            <div className="rounded-md rounded-br-none px-3 py-2" style={{ backgroundColor: widgetColor, color: userTextColor }}>
                              <p className="text-[11px] leading-relaxed">Hola, quiero información</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-end gap-1.5">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 overflow-hidden border" style={{ backgroundColor: `${widgetColor}20`, borderColor: `${widgetColor}30` }}>
                            {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : logoUrl ? <img src={logoUrl} alt="" className="w-full h-full rounded-full object-cover" /> : <Headphones className="w-3 h-3" style={{ color: widgetColor }} />}
                          </div>
                          <div className="max-w-[80%]">
                            <div className="rounded-md rounded-bl-none px-3 py-2" style={{ backgroundColor: botBubbleColor, border: `1px solid ${botBubbleColor === "#2a2a2a" ? "rgba(255,255,255,0.1)" : botBubbleColor}` }}>
                              <p className="text-[11px] leading-relaxed" style={{ color: botTextColor }}>Claro! Aquí tienes nuestras opciones:</p>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1 pl-0.5">
                              <span className="px-2 py-0.5 text-[9px] font-semibold rounded-md border" style={{ borderColor: `${widgetColor}90`, backgroundColor: `${widgetColor}30`, color: "rgba(255,255,255,0.7)" }}>Ver catálogo</span>
                              <span className="px-2 py-0.5 text-[9px] font-semibold rounded-md border" style={{ borderColor: `${widgetColor}90`, backgroundColor: `${widgetColor}30`, color: "rgba(255,255,255,0.7)" }}>Precios</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="px-3 pb-2 pt-1 border-t border-white/10 shrink-0">
                        <div className="flex items-end gap-1.5">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center text-white/30"><ImageIcon className="w-3.5 h-3.5" /></div>
                          <div className="flex-1 py-1.5 px-3 rounded-md bg-white/5 border border-white/10">
                            <span className="text-[10px] text-white/25">Escribe un mensaje...</span>
                          </div>
                          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: widgetColor, color: headerTextColor }}>
                            <Send className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <Step2Ready
              embedScript={embedScript}
              iframeCode={iframeCode}
              copyEmbed={copyEmbed}
              copied={copied}
              saving={saving}
              onBack={() => setStep(1)}
              onFinish={finishOnboarding}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const PLATFORM_GUIDES = [
  {
    name: "WordPress",
    icon: "🔵",
    steps: [
      "Ve a tu panel de WordPress → Apariencia → Editor de temas → footer.php",
      "Pega el código justo antes de la etiqueta </body>",
      "Guarda los cambios y listo",
    ],
    alt: "También puedes usar el plugin 'Insert Headers and Footers' para pegarlo sin tocar código.",
  },
  {
    name: "Shopify",
    icon: "🟢",
    steps: [
      "Ve a Tienda online → Temas → Acciones → Editar código",
      "Abre el archivo theme.liquid",
      "Pega el código justo antes de </body>",
      "Guarda los cambios",
    ],
  },
  {
    name: "Wix",
    icon: "🟡",
    steps: [
      "Ve a Configuración del sitio → Código personalizado",
      "Haz clic en 'Agregar código personalizado'",
      "Pega el código, selecciona 'Body - final' y 'Todas las páginas'",
      "Publica tu sitio",
    ],
  },
  {
    name: "Webflow",
    icon: "🔷",
    steps: [
      "Ve a Configuración del proyecto → Código personalizado",
      "En 'Footer Code', pega el código",
      "Publica tu sitio",
    ],
  },
  {
    name: "Squarespace",
    icon: "⬛",
    steps: [
      "Ve a Configuración → Avanzado → Inyección de código",
      "Pega el código en el campo 'Footer'",
      "Guarda los cambios",
    ],
  },
  {
    name: "HTML / Otro",
    icon: "📄",
    steps: [
      "Abre tu archivo HTML principal (index.html)",
      "Pega el código justo antes de </body>",
      "Sube el archivo a tu servidor",
    ],
  },
];

function Step2Ready({
  embedScript,
  iframeCode,
  copyEmbed,
  copied,
  saving,
  onBack,
  onFinish,
}: {
  embedScript: string;
  iframeCode: string;
  copyEmbed: (code: string) => void;
  copied: boolean;
  saving: boolean;
  onBack: () => void;
  onFinish: () => void;
}) {
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [codeTab, setCodeTab] = useState<"script" | "iframe">("script");

  const activeCode = codeTab === "script" ? embedScript : iframeCode;

  const [showManualCode, setShowManualCode] = useState(false);

  return (
    <div className="p-6 sm:p-8 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar" data-testid="onboarding-step-2">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20 animate-float">
          <Rocket className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-1">¡Tu Nexia AI está listo!</h2>
        <p className="text-sm text-white/40">Solo falta instalarlo en tu sitio web</p>
      </div>

      <div className="rounded-2xl p-5 space-y-4" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))", border: "1px solid rgba(16,185,129,0.25)" }}>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
            <Headphones className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-white mb-1">Nosotros lo instalamos por ti</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              Un ejecutivo de Nexia AI se encargará de instalar el chatbot en tu sitio web.
              Solo toma <span className="text-primary font-semibold">5 a 10 minutos</span> y es completamente gratis.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <CircleCheck className="w-3.5 h-3.5 text-primary" />
            <span>Instalación gratuita en cualquier plataforma</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <CircleCheck className="w-3.5 h-3.5 text-primary" />
            <span>WordPress, Shopify, Wix, Webflow, HTML y más</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <CircleCheck className="w-3.5 h-3.5 text-primary" />
            <span>Tiempo estimado: 5-10 minutos</span>
          </div>
        </div>

        <a
          href="https://wa.me/56962511821?text=Hola%21%20Acabo%20de%20configurar%20mi%20Nexia%20AI%20y%20necesito%20ayuda%20para%20instalarlo%20en%20mi%20sitio%20web.%20%C2%BFMe%20pueden%20ayudar%3F"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/20"
          data-testid="button-request-install-help"
        >
          <Phone className="w-5 h-5" />
          Solicitar instalación gratuita por WhatsApp
        </a>
        <p className="text-[10px] text-white/30 text-center">Te responderemos en minutos para coordinar la instalación</p>
      </div>

      <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
        <button
          onClick={() => setShowManualCode(!showManualCode)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors"
          data-testid="button-toggle-manual-install"
        >
          <span className="flex items-center gap-2 text-sm text-white/50">
            <Code className="w-4 h-4" />
            Prefiero instalarlo manualmente
          </span>
          {showManualCode ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
        </button>

        {showManualCode && (
          <div className="px-4 pb-4 space-y-4 border-t border-white/[0.04]">
            <div className="pt-3 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Code className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-white/80">Código de integración</span>
              </div>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setCodeTab("script")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${codeTab === "script" ? "bg-primary text-white" : "bg-white/[0.05] text-white/50 hover:bg-white/[0.08]"}`}
                  data-testid="tab-script-onboarding"
                >
                  Script (recomendado)
                </button>
                <button
                  onClick={() => setCodeTab("iframe")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${codeTab === "iframe" ? "bg-primary text-white" : "bg-white/[0.05] text-white/50 hover:bg-white/[0.08]"}`}
                  data-testid="tab-iframe-onboarding"
                >
                  iFrame
                </button>
              </div>
              <div className="relative">
                <pre className="p-4 rounded-lg bg-black/40 text-[11px] text-green-400 font-mono overflow-x-auto border border-white/[0.06] max-h-48 overflow-y-auto chat-scrollbar" data-testid="onboarding-embed-code">
                  <code>{activeCode}</code>
                </pre>
              </div>
              <Button
                onClick={() => copyEmbed(activeCode)}
                variant="outline"
                className={`h-9 rounded-lg px-4 text-xs border-white/[0.08] w-full ${copied ? "bg-green-500/10 text-green-400 border-green-500/20" : ""}`}
                data-testid="onboarding-copy-embed"
              >
                {copied ? <><Check className="w-3 h-3 mr-1" /> Copiado</> : <><Copy className="w-3 h-3 mr-1" /> Copiar código</>}
              </Button>
              <p className="text-xs text-white/30">Pega este código antes del cierre &lt;/body&gt; en tu sitio web.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-white/80">Guías por plataforma</span>
              </div>
              <div className="space-y-1">
                {PLATFORM_GUIDES.map((platform) => (
                  <div key={platform.name} className="rounded-lg border border-white/[0.06] overflow-hidden">
                    <button
                      onClick={() => setExpandedPlatform(expandedPlatform === platform.name ? null : platform.name)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.03] transition-colors"
                      data-testid={`guide-${platform.name.toLowerCase().replace(/[^a-z]/g, "")}`}
                    >
                      <span className="flex items-center gap-2 text-sm text-white/70">
                        <span>{platform.icon}</span>
                        {platform.name}
                      </span>
                      {expandedPlatform === platform.name ? (
                        <ChevronUp className="w-4 h-4 text-white/30" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-white/30" />
                      )}
                    </button>
                    {expandedPlatform === platform.name && (
                      <div className="px-3 pb-3 space-y-2 border-t border-white/[0.04]">
                        <ol className="list-decimal list-inside space-y-1.5 pt-2">
                          {platform.steps.map((s, i) => (
                            <li key={i} className="text-xs text-white/50 leading-relaxed">{s}</li>
                          ))}
                        </ol>
                        {platform.alt && (
                          <p className="text-[11px] text-primary/70 italic mt-1">{platform.alt}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <a
                href="/guias"
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mt-1"
                data-testid="link-full-guides"
              >
                Ver guías completas con más plataformas
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-white/80">¿Qué sigue?</p>
          <ul className="text-xs text-white/50 space-y-1">
            <li>Entrena tu bot con más información en el Panel de Soporte</li>
            <li>Personaliza más opciones en la sección Configuración</li>
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          onClick={onBack}
          className="h-11 rounded-xl px-6 border-white/[0.08]"
          data-testid="onboarding-back-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Atrás
        </Button>
        <Button
          onClick={onFinish}
          disabled={saving}
          className="h-12 rounded-xl px-8 font-bold text-base bg-primary hover:bg-primary/90"
          data-testid="onboarding-finish"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Ir al Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
