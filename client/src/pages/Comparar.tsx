import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CapptaLogo } from "@/components/CapptaLogo";
import { Check, X, ArrowRight, Sparkles, Crown, Shield, Zap } from "lucide-react";

interface Feature {
  category: string;
  items: { name: string; cappta: string | boolean; vambe: string | boolean; chatgpt: string | boolean }[];
}

const FEATURES: Feature[] = [
  {
    category: "Precio",
    items: [
      { name: "Plan inicial mensual", cappta: "$0", vambe: "$199.990", chatgpt: "$0 (sin features)" },
      { name: "Plan PyME (más popular)", cappta: "$19.990 / mes", vambe: "$199.990 + setup", chatgpt: "—" },
      { name: "Cobro por implementación", cappta: "Incluido", vambe: "Hasta $999.990", chatgpt: "DIY" },
      { name: "Sin permanencia", cappta: true, vambe: false, chatgpt: true },
    ],
  },
  {
    category: "IA & Conversación",
    items: [
      { name: "GPT-4o Mini incluido", cappta: true, vambe: true, chatgpt: true },
      { name: "Múltiples modelos (GPT, Claude, Gemini)", cappta: "Plan Scale+", vambe: true, chatgpt: false },
      { name: "Base de conocimiento ilimitada", cappta: true, vambe: true, chatgpt: false },
      { name: "Análisis automático de tu sitio web", cappta: true, vambe: true, chatgpt: false },
      { name: "Subida de PDFs y catálogos", cappta: true, vambe: true, chatgpt: "Limitado" },
    ],
  },
  {
    category: "Canales",
    items: [
      { name: "Web widget", cappta: true, vambe: true, chatgpt: false },
      { name: "WhatsApp Business", cappta: "Plan Pro+", vambe: true, chatgpt: false },
      { name: "Instagram + Messenger", cappta: "Plan Scale+", vambe: true, chatgpt: false },
      { name: "Telegram", cappta: "Plan Scale+", vambe: false, chatgpt: false },
    ],
  },
  {
    category: "Equipo & Operación",
    items: [
      { name: "Handoff a humano transparente", cappta: true, vambe: true, chatgpt: false },
      { name: "App móvil con notificaciones push", cappta: true, vambe: false, chatgpt: false },
      { name: "Roles (admin, ejecutivo, propietario)", cappta: true, vambe: true, chatgpt: false },
      { name: "Calificaciones de clientes", cappta: true, vambe: true, chatgpt: false },
      { name: "Plantillas verticales pre-cargadas", cappta: "8 industrias", vambe: "Custom solo", chatgpt: false },
    ],
  },
  {
    category: "Comercio",
    items: [
      { name: "Catálogo en el chat", cappta: true, vambe: true, chatgpt: false },
      { name: "Integración Shopify / WooCommerce", cappta: true, vambe: true, chatgpt: false },
      { name: "Recuperación de carritos", cappta: "Plan Pro+", vambe: true, chatgpt: false },
      { name: "Recomendador de productos con IA", cappta: true, vambe: true, chatgpt: false },
    ],
  },
  {
    category: "Soporte y Onboarding",
    items: [
      { name: "Self-serve (te creas la cuenta solo)", cappta: true, vambe: false, chatgpt: true },
      { name: "Implementación con ingeniero", cappta: "Plan Scale+", vambe: "Obligatorio (paga)", chatgpt: false },
      { name: "Demo gratuita", cappta: true, vambe: true, chatgpt: false },
      { name: "Soporte 24/7", cappta: "Plan Enterprise", vambe: "Plan Enterprise", chatgpt: "Comunidad" },
    ],
  },
];

function CellValue({ value, isCappta }: { value: string | boolean; isCappta?: boolean }) {
  if (value === true) {
    return (
      <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto ${isCappta ? "bg-violet-500/20" : "bg-white/10"}`}>
        <Check className={`w-4 h-4 ${isCappta ? "text-violet-300" : "text-white/60"}`} />
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
        <X className="w-4 h-4 text-red-400/70" />
      </div>
    );
  }
  return (
    <span className={`text-sm font-medium block text-center ${isCappta ? "text-violet-300" : "text-white/70"}`}>
      {value}
    </span>
  );
}

export default function ComparePage() {
  useEffect(() => {
    document.title = "Cappta vs Vambe vs ChatGPT | Comparativa de chatbots con IA";
    const meta =
      document.querySelector('meta[name="description"]') ||
      document.head.appendChild(Object.assign(document.createElement("meta"), { name: "description" }));
    meta.setAttribute(
      "content",
      "Compara Cappta AI con Vambe.ai y ChatGPT Custom. Precios, IA, canales y soporte. Cappta cubre desde microemprendedor hasta enterprise.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#030308] text-white" data-testid="page-compare">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#030308]/80 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2" data-testid="link-home">
            <CapptaLogo className="h-7 w-auto" />
          </a>
          <div className="flex items-center gap-3">
            <a href="/demo">
              <Button variant="outline" size="sm" className="border-white/10" data-testid="button-demo">
                Ver demo
              </Button>
            </a>
            <a href="/register">
              <Button size="sm" className="bg-violet-600 hover:bg-violet-500" data-testid="button-register">
                Empezar gratis
              </Button>
            </a>
          </div>
        </div>
      </header>

      <section className="pt-20 pb-12 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(118,105,233,0.10) 0%, transparent 60%)" }} />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 mb-6">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-bold text-violet-300 tracking-wider uppercase">COMPARATIVA</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.02em] leading-tight mb-5" data-testid="text-compare-title">
            Cappta AI vs Vambe vs ChatGPT
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            La diferencia es simple: <span className="text-white font-semibold">Cappta sirve a todos</span>, desde
            microemprendedores hasta empresas enterprise. Vambe se enfoca solo en grandes. ChatGPT es DIY.
          </p>
        </div>
      </section>

      <section className="pb-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border-2 border-violet-500/40 bg-violet-500/[0.05] p-6 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-violet-500 text-white text-[10px] font-bold tracking-wider uppercase">RECOMENDADO</span>
            <div className="flex items-center gap-2 mb-2">
              <CapptaLogo className="h-5 w-auto" />
            </div>
            <p className="text-2xl font-black mb-1">Desde $0</p>
            <p className="text-xs text-white/50 mb-4">5 planes para todo tipo de negocio</p>
            <ul className="space-y-1.5 text-sm text-white/70">
              <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-violet-400 mt-1 shrink-0" />Free, Solo, Pro, Scale, Enterprise</li>
              <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-violet-400 mt-1 shrink-0" />Sin permanencia ni setup obligatorio</li>
              <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-violet-400 mt-1 shrink-0" />Plantillas para 8 industrias</li>
              <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-violet-400 mt-1 shrink-0" />App móvil con notificaciones</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
            <p className="font-heading text-xl font-bold mb-2">Vambe.ai</p>
            <p className="text-2xl font-black mb-1">Desde $199K</p>
            <p className="text-xs text-white/50 mb-4">Solo medianas y grandes empresas</p>
            <ul className="space-y-1.5 text-sm text-white/70">
              <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-white/40 mt-1 shrink-0" />Producto sólido para enterprise</li>
              <li className="flex items-start gap-2"><X className="w-3.5 h-3.5 text-red-400/70 mt-1 shrink-0" />No cubre microemprendedor</li>
              <li className="flex items-start gap-2"><X className="w-3.5 h-3.5 text-red-400/70 mt-1 shrink-0" />Setup obligatorio (caro)</li>
              <li className="flex items-start gap-2"><X className="w-3.5 h-3.5 text-red-400/70 mt-1 shrink-0" />Sin self-serve</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
            <p className="font-heading text-xl font-bold mb-2">ChatGPT Custom</p>
            <p className="text-2xl font-black mb-1">$0 + tu tiempo</p>
            <p className="text-xs text-white/50 mb-4">Hazlo tú mismo</p>
            <ul className="space-y-1.5 text-sm text-white/70">
              <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-white/40 mt-1 shrink-0" />Gratis para empezar</li>
              <li className="flex items-start gap-2"><X className="w-3.5 h-3.5 text-red-400/70 mt-1 shrink-0" />Sin canales (web, WhatsApp)</li>
              <li className="flex items-start gap-2"><X className="w-3.5 h-3.5 text-red-400/70 mt-1 shrink-0" />Sin handoff humano</li>
              <li className="flex items-start gap-2"><X className="w-3.5 h-3.5 text-red-400/70 mt-1 shrink-0" />Sin métricas ni equipo</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center mb-10">
            Comparativa funcional completa
          </h2>

          <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className="grid grid-cols-12 bg-white/[0.04] border-b border-white/[0.06] px-4 py-3">
              <div className="col-span-6 text-xs font-bold text-white/50 uppercase tracking-wider">Característica</div>
              <div className="col-span-2 text-xs font-bold text-violet-300 uppercase tracking-wider text-center">Cappta</div>
              <div className="col-span-2 text-xs font-bold text-white/50 uppercase tracking-wider text-center">Vambe</div>
              <div className="col-span-2 text-xs font-bold text-white/50 uppercase tracking-wider text-center">ChatGPT</div>
            </div>

            {FEATURES.map((category) => (
              <div key={category.category}>
                <div className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.04]">
                  <p className="text-sm font-bold text-white/80">{category.category}</p>
                </div>
                {category.items.map((item, i) => (
                  <div key={item.name} className={`grid grid-cols-12 px-4 py-4 items-center border-b border-white/[0.04] ${i % 2 === 0 ? "bg-white/[0.005]" : ""}`} data-testid={`compare-row-${item.name.substring(0, 25)}`}>
                    <div className="col-span-6 text-sm text-white/80">{item.name}</div>
                    <div className="col-span-2"><CellValue value={item.cappta} isCappta /></div>
                    <div className="col-span-2"><CellValue value={item.vambe} /></div>
                    <div className="col-span-2"><CellValue value={item.chatgpt} /></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-center mb-10">¿Por qué elegir Cappta?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-violet-500/15 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="font-heading font-bold mb-2">Para todos</h3>
              <p className="text-sm text-white/60 leading-relaxed">Desde el microemprendedor que parte solo, hasta enterprise con SLA. Vambe solo cubre grandes.</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-violet-500/15 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="font-heading font-bold mb-2">Self-serve real</h3>
              <p className="text-sm text-white/60 leading-relaxed">Te creas la cuenta solo y pruebas en 10 min. Vambe te obliga a una demo y a pagar setup.</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-violet-500/15 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="font-heading font-bold mb-2">Premium cuando creces</h3>
              <p className="text-sm text-white/60 leading-relaxed">Cuando llegas a Scale o Enterprise, tienes la misma sofisticación que Vambe ofrece.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-600/15 to-violet-900/5 p-10 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
            Empieza gratis. Crece a tu ritmo.
          </h2>
          <p className="text-white/70 mb-8 leading-relaxed">
            No te pedimos tarjeta. Sin demos obligatorias. Sin setup oculto.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="/register">
              <Button size="lg" className="bg-violet-600 hover:bg-violet-500 text-base px-8 py-6 rounded-2xl font-bold" data-testid="button-compare-cta-primary">
                Crear cuenta gratis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
            <a href="/enterprise">
              <Button variant="outline" size="lg" className="text-base px-8 py-6 rounded-2xl border-white/10" data-testid="button-compare-cta-enterprise">
                Hablar con ventas (Enterprise)
              </Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-8 px-6 text-center text-xs text-white/30 space-y-2">
        <p>© Cappta AI · Comparativa actualizada {new Date().toLocaleDateString("es-CL", { month: "long", year: "numeric" })}</p>
        <p>
          <a href="/seguridad" className="hover:text-white/60 transition-colors" data-testid="link-footer-security">Seguridad</a> ·{" "}
          <a href="/dpa" className="hover:text-white/60 transition-colors" data-testid="link-footer-dpa">DPA</a> ·{" "}
          <a href="/subprocesadores" className="hover:text-white/60 transition-colors" data-testid="link-footer-subprocessors">Subprocesadores</a> ·{" "}
          <a href="/privacidad" className="hover:text-white/60 transition-colors">Privacidad</a> ·{" "}
          <a href="/terminos" className="hover:text-white/60 transition-colors">Términos</a>
        </p>
      </footer>
    </div>
  );
}
