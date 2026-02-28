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
} from "lucide-react";
import type { Tenant } from "@shared/schema";
import logoSinFondo from "@assets/Logo_sin_fondo_1772247619250.png";

type TenantProfile = Omit<Tenant, "passwordHash">;

interface OnboardingWizardProps {
  tenant: TenantProfile;
  token: string;
  onComplete: () => void;
}

const STEPS = [
  { title: "Tu Negocio", icon: Globe, description: "Dinos sobre tu empresa" },
  { title: "Personaliza", icon: Palette, description: "Dale estilo a tu chat" },
  { title: "Listo!", icon: Rocket, description: "Tu chatbot esta listo" },
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
  const [avatarUrl, setAvatarUrl] = useState(tenant.avatarUrl || "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState<"welcome" | "chat">("welcome");

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
      toast({ title: "Sitio analizado", description: "Tu bot ya aprendio sobre tu negocio automaticamente." });
    } catch (err: any) {
      toast({ title: "Error al analizar", description: err.message || "Verifica que la URL sea accesible", variant: "destructive" });
    }
    setAnalyzingUrl(false);
  };

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast({ title: "Solo imagenes de hasta 5MB", variant: "destructive" });
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
      toast({ title: "Logo subido" });
    } catch {
      toast({ title: "Error al subir la imagen", variant: "destructive" });
    }
    setUploadingLogo(false);
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast({ title: "Solo imagenes de hasta 5MB", variant: "destructive" });
      return;
    }
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads/direct", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { objectPath } = await res.json();
      setAvatarUrl(objectPath);
      toast({ title: "Avatar subido" });
    } catch {
      toast({ title: "Error al subir la imagen", variant: "destructive" });
    }
    setUploadingAvatar(false);
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
      logoUrl: logoUrl || null,
      avatarUrl: avatarUrl || null,
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

  const embedCode = `<script src="${window.location.origin}/widget.js" data-tenant-id="${tenant.id}" async></script>`;

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast({ title: "Codigo copiado!" });
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
              <img src={logoSinFondo} alt="FoxBot" className="w-8 h-8 object-contain" />
            </div>
            <h1 className="text-2xl font-black" data-testid="text-onboarding-title">
              Configura tu <span className="text-gradient-green">Fox</span><span className="text-gradient-orange">Bot</span>
            </h1>
          </div>
          <p className="text-sm text-white/40">3 pasos rapidos y tu chatbot estara listo</p>
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
                <p className="text-sm text-white/40">FoxBot aprendera de tu sitio web automaticamente</p>
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
                <p className="text-xs text-white/30">Al analizar tu sitio, FoxBot extraera automaticamente productos, servicios, contacto y horarios para entrenar el chatbot.</p>
              </div>

              {analyzedResult && (
                <div className="rounded-xl bg-green-500/5 border border-green-500/15 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <CircleCheck className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-400">Sitio analizado correctamente</p>
                    <p className="text-xs text-white/40 mt-1">Tu bot ya aprendio sobre tu negocio. Podras editar esta informacion despues en el Panel de Soporte.</p>
                  </div>
                </div>
              )}

              {!analyzedResult && domain.trim() && !analyzingUrl && (
                <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-3 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-300/80">Haz clic en "Analizar" para que FoxBot aprenda sobre tu negocio automaticamente.</p>
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
                    <button
                      onClick={() => setPreviewMode("welcome")}
                      className={`text-[10px] px-2 py-1 rounded-md transition-colors ${previewMode === "welcome" ? "bg-white/[0.1] text-white/90" : "text-white/40 hover:text-white/60"}`}
                      data-testid="onboarding-preview-welcome"
                    >
                      Formulario
                    </button>
                    <button
                      onClick={() => setPreviewMode("chat")}
                      className={`text-[10px] px-2 py-1 rounded-md transition-colors ${previewMode === "chat" ? "bg-white/[0.1] text-white/90" : "text-white/40 hover:text-white/60"}`}
                      data-testid="onboarding-preview-chat"
                    >
                      Chat
                    </button>
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.08] overflow-hidden" style={{ height: 460 }}>
                  {previewMode === "welcome" ? (
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
                        <p className="text-[9px] text-white/50 text-center">Completa tus datos para iniciar la conversacion</p>
                      </div>
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
                        <div className="pt-1">
                          <div className="h-8 rounded-md flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: widgetColor, color: headerTextColor }}>
                            Iniciar Conversacion
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
                          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 overflow-hidden border" style={{ backgroundColor: `${widgetColor}20`, borderColor: `${widgetColor}30` }}>
                            {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : logoUrl ? <img src={logoUrl} alt="" className="w-full h-full rounded-full object-cover" /> : <Headphones className="w-3 h-3" style={{ color: widgetColor }} />}
                          </div>
                          <div className="max-w-[80%]">
                            <div className="rounded-md rounded-bl-none px-3 py-2" style={{ backgroundColor: botBubbleColor, border: `1px solid ${botBubbleColor === "#2a2a2a" ? "rgba(255,255,255,0.1)" : botBubbleColor}` }}>
                              <p className="text-[11px] leading-relaxed" style={{ color: botTextColor }}>Hola! Bienvenido a {companyName || "nuestra empresa"}. ¿En que puedo ayudarte?</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-end gap-1.5 flex-row-reverse">
                          <div className="max-w-[80%]">
                            <div className="rounded-md rounded-br-none px-3 py-2" style={{ backgroundColor: widgetColor, color: userTextColor }}>
                              <p className="text-[11px] leading-relaxed">Hola, quiero informacion</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-end gap-1.5">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 overflow-hidden border" style={{ backgroundColor: `${widgetColor}20`, borderColor: `${widgetColor}30` }}>
                            {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : logoUrl ? <img src={logoUrl} alt="" className="w-full h-full rounded-full object-cover" /> : <Headphones className="w-3 h-3" style={{ color: widgetColor }} />}
                          </div>
                          <div className="max-w-[80%]">
                            <div className="rounded-md rounded-bl-none px-3 py-2" style={{ backgroundColor: botBubbleColor, border: `1px solid ${botBubbleColor === "#2a2a2a" ? "rgba(255,255,255,0.1)" : botBubbleColor}` }}>
                              <p className="text-[11px] leading-relaxed" style={{ color: botTextColor }}>Claro! Aqui tienes nuestras opciones:</p>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1 pl-0.5">
                              <span className="px-2 py-0.5 text-[9px] font-semibold rounded-md border" style={{ borderColor: `${widgetColor}90`, backgroundColor: `${widgetColor}30`, color: "rgba(255,255,255,0.7)" }}>Ver catalogo</span>
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
            <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar" data-testid="onboarding-step-2">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20 animate-float">
                  <Rocket className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-1">Tu FoxBot esta listo!</h2>
                <p className="text-sm text-white/40">Copia el codigo y pegalo en tu sitio web para activar el chat</p>
              </div>

              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-white/80">Codigo de integracion</span>
                </div>
                <div className="relative">
                  <pre className="p-4 rounded-lg bg-black/40 text-xs text-green-400 font-mono overflow-x-auto border border-white/[0.06]" data-testid="onboarding-embed-code">
                    {embedCode}
                  </pre>
                  <Button
                    onClick={copyEmbed}
                    variant="outline"
                    className={`absolute top-2 right-2 h-8 rounded-lg px-3 text-xs border-white/[0.08] ${copied ? "bg-green-500/10 text-green-400 border-green-500/20" : ""}`}
                    data-testid="onboarding-copy-embed"
                  >
                    {copied ? <><Check className="w-3 h-3 mr-1" /> Copiado</> : <><Copy className="w-3 h-3 mr-1" /> Copiar</>}
                  </Button>
                </div>
                <p className="text-xs text-white/30">Pega este codigo antes del cierre &lt;/body&gt; en tu sitio web. Funciona con WordPress, Shopify, Wix, y cualquier sitio HTML.</p>
              </div>

              <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white/80">¿Que sigue?</p>
                  <ul className="text-xs text-white/50 space-y-1">
                    <li>Entrena tu bot con mas informacion en el Panel de Soporte</li>
                    <li>Personaliza mas opciones en la seccion Configuracion</li>
                    <li>Revisa las guias para instalar en tu plataforma</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="h-11 rounded-xl px-6 border-white/[0.08]"
                  data-testid="onboarding-back-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Atras
                </Button>
                <Button
                  onClick={finishOnboarding}
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
          )}
        </div>
      </div>
    </div>
  );
}
