import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Check,
  User,
  Mail,
  Building2,
  Phone,
  Users,
  MessageSquare,
  ChevronDown,
  Wrench,
  Sparkles,
} from "lucide-react";
import { CapptaIcon } from "@/components/CapptaLogo";

const COUNTRY_CODES = [
  { code: "+56", flag: "cl", label: "CL" },
  { code: "+52", flag: "mx", label: "MX" },
  { code: "+57", flag: "co", label: "CO" },
  { code: "+54", flag: "ar", label: "AR" },
  { code: "+1", flag: "us", label: "US" },
  { code: "+55", flag: "br", label: "BR" },
  { code: "+51", flag: "pe", label: "PE" },
  { code: "+593", flag: "ec", label: "EC" },
];

const TOOLS_OPTIONS = [
  "WhatsApp Business",
  "HubSpot",
  "Salesforce",
  "Zendesk",
  "Intercom",
  "Freshdesk",
  "Drift",
  "Tidio",
  "LiveChat",
  "Chatbot propio",
  "Ninguna",
  "Otra",
];

const TEAM_SIZES = [
  "1-5",
  "6-15",
  "16-50",
  "51-200",
  "200+",
];

const CONVERSATION_RANGES = [
  "Menos de 100",
  "100 - 500",
  "500 - 2.000",
  "2.000 - 10.000",
  "Más de 10.000",
];

interface FormData {
  name: string;
  email: string;
  company: string;
  countryCode: string;
  phone: string;
  teamSize: string;
  conversations: string;
  tools: string[];
  message: string;
}

export default function DemoPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    company: "",
    countryCode: "+56",
    phone: "",
    teamSize: "",
    conversations: "",
    tools: [],
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [toolsOpen, setToolsOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleTool = (tool: string) => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.includes(tool)
        ? prev.tools.filter(t => t !== tool)
        : [...prev.tools, tool],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          phone: `${formData.countryCode} ${formData.phone}`,
          teamSize: formData.teamSize,
          conversations: formData.conversations,
          tools: formData.tools,
          message: formData.message,
        }),
      });
      if (!res.ok) throw new Error("Error al enviar");
      setSubmitted(true);
    } catch {
      setError("No pudimos enviar tu solicitud. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  };

  const selectedCountry = COUNTRY_CODES.find(c => c.code === formData.countryCode) || COUNTRY_CODES[0];

  const inputCls = "w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-violet-500/40 transition-colors";

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#030308] flex items-center justify-center px-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-md w-full text-center" data-testid="demo-form-success">
          <div className="w-20 h-20 rounded-full bg-violet-500/15 flex items-center justify-center mx-auto mb-6 border border-violet-500/20">
            <Check className="w-10 h-10 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">¡Solicitud enviada!</h1>
          <p className="text-white/50 text-sm leading-relaxed mb-8">
            Nuestro equipo revisará tu información y te contactará dentro de las próximas 24 horas para agendar tu reunión personalizada.
          </p>
          <a href="/">
            <Button variant="outline" className="rounded-xl border-white/10 hover:border-primary/30 hover:bg-primary/5" data-testid="button-demo-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030308] flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <nav className="sticky top-0 z-50 border-b border-white/[0.04] bg-[#030308]/80 backdrop-blur-2xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2.5 group" data-testid="link-demo-home">
            <CapptaIcon size={30} />
            <span className="text-base font-heading font-semibold tracking-[-0.02em]">
              <span className="text-white/90">Cappta</span>
              <span className="text-white font-light ml-1">AI</span>
            </span>
          </a>
          <a href="/" className="text-sm text-white/40 hover:text-white/70 transition-colors flex items-center gap-1.5" data-testid="link-demo-back">
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver
          </a>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12 sm:py-16">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white tracking-[-0.02em] mb-3" data-testid="text-demo-title">
              Agenda tu Reunión
            </h1>
            <p className="text-white/50 text-sm sm:text-base" data-testid="text-demo-subtitle">
              Cuéntanos un poco sobre ti y tu negocio
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="demo-form">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold text-white/40 mb-2 block">¿Cuál es tu nombre? *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Juan Pérez"
                    className={inputCls}
                    data-testid="input-demo-name"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-white/40 mb-2 block">¿Cuál es tu correo corporativo? *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="juan@miempresa.com"
                    className={inputCls}
                    data-testid="input-demo-email"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold text-white/40 mb-2 block">¿Cuál es el nombre de tu empresa? *</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    required
                    placeholder="Mi Empresa SpA"
                    className={inputCls}
                    data-testid="input-demo-company"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-white/40 mb-2 block">WhatsApp *</label>
                <div className="flex gap-2">
                  <div className="relative shrink-0">
                    <select
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleChange}
                      className="appearance-none w-[120px] pl-10 pr-7 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-violet-500/40 transition-colors cursor-pointer"
                      data-testid="select-demo-country"
                    >
                      {COUNTRY_CODES.map(c => (
                        <option key={c.code} value={c.code} className="bg-[#1a1a1a]">
                          {c.label} {c.code}
                        </option>
                      ))}
                    </select>
                    <img
                      src={`https://flagcdn.com/w40/${selectedCountry.flag}.png`}
                      alt=""
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-4 rounded-[2px] object-cover pointer-events-none"
                    />
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                  </div>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="55 1234 5678"
                      className={inputCls}
                      data-testid="input-demo-phone"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold text-white/40 mb-2 block">¿Cuántas personas trabajan en tu empresa? *</label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <select
                    name="teamSize"
                    value={formData.teamSize}
                    onChange={handleChange}
                    required
                    className={`${inputCls} appearance-none cursor-pointer`}
                    data-testid="select-demo-team"
                  >
                    <option value="" className="bg-[#1a1a1a]">Selecciona...</option>
                    {TEAM_SIZES.map(s => (
                      <option key={s} value={s} className="bg-[#1a1a1a]">{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-white/40 mb-2 block">¿Cuántas conversaciones manejas al mes? *</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <select
                    name="conversations"
                    value={formData.conversations}
                    onChange={handleChange}
                    required
                    className={`${inputCls} appearance-none cursor-pointer`}
                    data-testid="select-demo-conversations"
                  >
                    <option value="" className="bg-[#1a1a1a]">Selecciona...</option>
                    {CONVERSATION_RANGES.map(r => (
                      <option key={r} value={r} className="bg-[#1a1a1a]">{r}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/40 mb-2 block">¿Qué herramientas usas actualmente?</label>
              <div className="relative">
                <Wrench className="absolute left-3.5 top-3.5 w-4 h-4 text-white/20 pointer-events-none z-10" />
                <button
                  type="button"
                  onClick={() => setToolsOpen(!toolsOpen)}
                  className="w-full pl-11 pr-10 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-left text-sm focus:outline-none focus:border-violet-500/40 transition-colors"
                  data-testid="button-demo-tools"
                >
                  <span className={formData.tools.length ? "text-white" : "text-white/25"}>
                    {formData.tools.length
                      ? formData.tools.join(", ")
                      : "Selecciona una o más herramientas"}
                  </span>
                </button>
                <ChevronDown className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none transition-transform ${toolsOpen ? "rotate-180" : ""}`} />
                {toolsOpen && (
                  <div className="absolute z-20 top-full mt-1 w-full rounded-xl bg-[#0f0f14] border border-white/[0.08] py-1 max-h-48 overflow-y-auto shadow-xl shadow-black/40">
                    {TOOLS_OPTIONS.map(tool => (
                      <button
                        key={tool}
                        type="button"
                        onClick={() => toggleTool(tool)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-white/[0.04] transition-colors"
                        data-testid={`option-tool-${tool.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${formData.tools.includes(tool) ? "bg-violet-500 border-violet-500" : "border-white/20"}`}>
                          {formData.tools.includes(tool) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={formData.tools.includes(tool) ? "text-white" : "text-white/60"}>{tool}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/40 mb-2 block">¿Algo más que debamos saber?</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={3}
                placeholder="Cuéntanos sobre tu negocio, tus necesidades o preguntas..."
                className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-violet-500/40 transition-colors resize-none"
                data-testid="input-demo-message"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs text-center" data-testid="text-demo-error">{error}</p>
            )}

            <Button
              type="submit"
              disabled={sending || !formData.name || !formData.email || !formData.company || !formData.phone || !formData.teamSize || !formData.conversations}
              className="w-full py-6 rounded-2xl text-sm font-bold shadow-xl shadow-primary/15 transition-all duration-300"
              data-testid="button-demo-submit"
            >
              {sending ? (
                "Enviando..."
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Solicitar Reunión
                </>
              )}
            </Button>

            <p className="text-[11px] text-white/20 text-center leading-relaxed">
              Al enviar este formulario, aceptas nuestra{" "}
              <a href="/privacidad" className="text-white/30 hover:text-white/50 transition-colors">Política de Privacidad</a>.
              Nos pondremos en contacto contigo en un máximo de 24 horas.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
