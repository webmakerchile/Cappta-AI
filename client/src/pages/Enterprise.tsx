import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CapptaLogo } from "@/components/CapptaLogo";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Crown,
  Check,
  Shield,
  Users,
  Headphones,
  ArrowRight,
  Building2,
  Globe,
  Lock,
  Loader2,
} from "lucide-react";

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1.000", "1.000+"];
const VOLUMES = ["< 1.000", "1.000 - 10.000", "10.000 - 50.000", "50.000 - 200.000", "200.000+"];
const INDUSTRIES = ["Retail / E-commerce", "Servicios financieros", "Salud", "Educación", "Inmobiliaria", "Manufactura", "Tecnología", "Otra"];
const CHANNELS = ["WhatsApp", "Web", "Instagram", "Messenger", "Telegram", "API"];

interface FormState {
  name: string;
  email: string;
  phone: string;
  company: string;
  companySize: string;
  industry: string;
  monthlyConversations: string;
  channels: string[];
  message: string;
}

export default function EnterprisePage() {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    company: "",
    companySize: "",
    industry: "",
    monthlyConversations: "",
    channels: [],
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = "Cappta Enterprise | Chatbot IA para grandes empresas";
    const meta =
      document.querySelector('meta[name="description"]') ||
      document.head.appendChild(Object.assign(document.createElement("meta"), { name: "description" }));
    meta.setAttribute(
      "content",
      "Cappta Enterprise: SLA dedicado, SSO, integraciones a medida, soporte 24/7 y on-premise opcional. Habla con ventas.",
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.company) {
      toast({ title: "Faltan datos", description: "Nombre, email y empresa son obligatorios.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/enterprise-leads", {
        ...form,
        channels: form.channels.join(", "),
      });
      setSubmitted(true);
      toast({ title: "¡Gracias!", description: "Te contactamos en menos de 24h." });
    } catch (err) {
      toast({ title: "Error", description: "No pudimos enviar el formulario. Intenta de nuevo.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleChannel = (ch: string) => {
    setForm((s) => ({
      ...s,
      channels: s.channels.includes(ch) ? s.channels.filter((c) => c !== ch) : [...s.channels, ch],
    }));
  };

  return (
    <div className="min-h-screen bg-[#030308] text-white" data-testid="page-enterprise">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#030308]/80 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2" data-testid="link-home">
            <CapptaLogo className="h-7 w-auto" />
          </a>
          <a href="/comparar">
            <Button variant="outline" size="sm" className="border-white/10" data-testid="button-compare">Cappta vs Vambe</Button>
          </a>
        </div>
      </header>

      <section className="pt-16 pb-10 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(118,105,233,0.10) 0%, transparent 60%)" }} />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 mb-6">
            <Crown className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-bold text-violet-300 tracking-wider uppercase">CAPPTA ENTERPRISE</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.02em] leading-tight mb-5" data-testid="text-enterprise-title">
            La plataforma comercial con IA para empresas grandes
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            SLA dedicado, SSO, integraciones a medida y soporte 24/7. Diseñado para volumen alto y entornos regulados.
          </p>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-2">Lo que incluye</h2>
            <div className="space-y-4">
              {[
                { Icon: Crown, title: "Volumen ilimitado", desc: "Sesiones, mensajes y agentes sin límite. Pricing custom según uso real." },
                { Icon: Shield, title: "SSO + Auditoría", desc: "Single Sign-On con SAML/OIDC, logs de auditoría exportables y compliance." },
                { Icon: Users, title: "Equipo dedicado", desc: "Customer Success Manager, soporte 24/7 y onboarding white-glove." },
                { Icon: Globe, title: "Integraciones a medida", desc: "Conectamos tu CRM, ERP, helpdesk o cualquier sistema interno con API privada." },
                { Icon: Lock, title: "Seguridad enterprise", desc: "Datos encriptados en reposo y en tránsito. On-premise opcional." },
                { Icon: Headphones, title: "SLA 99.95%", desc: "Garantía contractual de uptime y tiempo de respuesta a incidentes." },
              ].map(({ Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3" data-testid={`feature-${title.substring(0, 15)}`}>
                  <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">{title}</h3>
                    <p className="text-sm text-white/60 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.03] p-5 mt-8">
              <p className="text-xs font-bold text-violet-300 uppercase tracking-wider mb-2">CASOS TÍPICOS</p>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-violet-400" />Bancos y fintechs con KYC automatizado</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-violet-400" />Retail con +50 sucursales</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-violet-400" />Aseguradoras con cotización automática</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-violet-400" />Operadores logísticos con tracking</li>
              </ul>
            </div>
          </div>

          <div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8 sticky top-20">
              {submitted ? (
                <div className="text-center py-12" data-testid="status-submitted">
                  <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-6">
                    <Check className="w-8 h-8 text-violet-300" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold mb-3">¡Gracias!</h3>
                  <p className="text-white/70 mb-6">
                    Recibimos tu solicitud. Un especialista te contactará en menos de 24h hábiles.
                  </p>
                  <a href="/">
                    <Button variant="outline" className="border-white/10" data-testid="button-back-home">Volver al inicio</Button>
                  </a>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-enterprise">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-violet-400" />
                    <h3 className="font-heading text-xl font-bold">Hablemos</h3>
                  </div>
                  <p className="text-sm text-white/50 mb-4">Cuéntanos de tu empresa y te preparamos una propuesta a medida.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="name" className="text-xs text-white/60">Nombre*</Label>
                      <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-white/[0.04] border-white/10 mt-1" data-testid="input-name" />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-xs text-white/60">Email corporativo*</Label>
                      <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-white/[0.04] border-white/10 mt-1" data-testid="input-email" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="company" className="text-xs text-white/60">Empresa*</Label>
                      <Input id="company" required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="bg-white/[0.04] border-white/10 mt-1" data-testid="input-company" />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-xs text-white/60">Teléfono</Label>
                      <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-white/[0.04] border-white/10 mt-1" data-testid="input-phone" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-white/60">Tamaño empresa</Label>
                      <Select value={form.companySize} onValueChange={(v) => setForm({ ...form, companySize: v })}>
                        <SelectTrigger className="bg-white/[0.04] border-white/10 mt-1" data-testid="select-size">
                          <SelectValue placeholder="Empleados" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPANY_SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-white/60">Industria</Label>
                      <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                        <SelectTrigger className="bg-white/[0.04] border-white/10 mt-1" data-testid="select-industry">
                          <SelectValue placeholder="Industria" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-white/60">Conversaciones / mes estimadas</Label>
                    <Select value={form.monthlyConversations} onValueChange={(v) => setForm({ ...form, monthlyConversations: v })}>
                      <SelectTrigger className="bg-white/[0.04] border-white/10 mt-1" data-testid="select-volume">
                        <SelectValue placeholder="Volumen mensual" />
                      </SelectTrigger>
                      <SelectContent>
                        {VOLUMES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-white/60 block mb-2">Canales que necesitas</Label>
                    <div className="flex flex-wrap gap-2">
                      {CHANNELS.map((ch) => (
                        <button
                          type="button"
                          key={ch}
                          onClick={() => toggleChannel(ch)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                            form.channels.includes(ch)
                              ? "border-violet-500/40 bg-violet-500/15 text-violet-300"
                              : "border-white/10 text-white/60 hover:border-white/20"
                          }`}
                          data-testid={`button-channel-${ch.toLowerCase()}`}
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-xs text-white/60">¿Algo más que quieras contarnos?</Label>
                    <Textarea id="message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="bg-white/[0.04] border-white/10 mt-1 min-h-[80px]" data-testid="input-message" />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full bg-violet-600 hover:bg-violet-500 py-6 rounded-xl font-bold" data-testid="button-submit-enterprise">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (<>Hablar con ventas <ArrowRight className="w-4 h-4 ml-2" /></>)}
                  </Button>
                  <p className="text-xs text-white/40 text-center">Te contactamos en menos de 24h hábiles.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-8 px-6 text-center text-xs text-white/30">
        © Cappta AI · Enterprise · <a href="/privacidad" className="hover:text-white/50">Privacidad</a> · <a href="/terminos" className="hover:text-white/50">Términos</a>
      </footer>
    </div>
  );
}
