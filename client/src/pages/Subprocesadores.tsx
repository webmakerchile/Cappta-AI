import { useEffect } from "react";
import { CapptaLogo } from "@/components/CapptaLogo";
import { ArrowLeft, Mail } from "lucide-react";

interface Subprocessor {
  name: string;
  purpose: string;
  country: string;
  data: string;
  url: string;
}

const SUBPROCESSORS: Subprocessor[] = [
  {
    name: "Neon",
    purpose: "Base de datos Postgres administrada (datos de cuenta, conversaciones, configuración).",
    country: "EE.UU.",
    data: "Todos los datos persistidos del cliente.",
    url: "https://neon.tech/privacy-policy",
  },
  {
    name: "OpenAI",
    purpose: "Generación de respuestas con IA, transcripción de audio (Whisper), análisis de imágenes.",
    country: "EE.UU.",
    data: "Contenido de mensajes, audio e imágenes enviadas durante la conversación.",
    url: "https://openai.com/policies/privacy-policy",
  },
  {
    name: "Replit Object Storage",
    purpose: "Almacenamiento de archivos adjuntos del chat (imágenes, audio, documentos).",
    country: "EE.UU.",
    data: "Adjuntos cargados por visitantes o por agentes.",
    url: "https://replit.com/site/privacy",
  },
  {
    name: "Mercado Pago",
    purpose: "Procesamiento de suscripciones y pagos.",
    country: "Argentina / Brasil / regional",
    data: "Email del titular del plan, identificador de suscripción. Cappta AI no almacena datos de tarjetas.",
    url: "https://www.mercadopago.com.ar/privacidad",
  },
  {
    name: "Resend",
    purpose: "Envío de emails transaccionales (verificación, notificaciones, recuperación).",
    country: "EE.UU.",
    data: "Email del destinatario y contenido de la notificación.",
    url: "https://resend.com/legal/privacy-policy",
  },
  {
    name: "Twilio",
    purpose: "Envío y recepción de mensajes WhatsApp y SMS cuando el cliente activa el canal Twilio.",
    country: "EE.UU.",
    data: "Número de teléfono y contenido de los mensajes.",
    url: "https://www.twilio.com/legal/privacy",
  },
  {
    name: "Meta (WhatsApp Business / Messenger / Instagram)",
    purpose: "Recepción y envío de mensajes en los canales WhatsApp Cloud, Messenger e Instagram.",
    country: "EE.UU. / Irlanda",
    data: "Identificador del usuario en la plataforma y contenido de los mensajes.",
    url: "https://www.facebook.com/privacy/policy",
  },
  {
    name: "Google",
    purpose: "Inicio de sesión con Google (cuando el cliente lo usa) y, opcionalmente, integración con Google Sheets.",
    country: "EE.UU.",
    data: "Email, nombre y avatar; datos exportados a Sheets cuando el cliente configura la integración.",
    url: "https://policies.google.com/privacy",
  },
  {
    name: "Anthropic (opcional)",
    purpose: "Modelo de IA alternativo cuando el cliente lo selecciona (planes superiores).",
    country: "EE.UU.",
    data: "Contenido de mensajes enviados durante la conversación.",
    url: "https://www.anthropic.com/legal/privacy",
  },
  {
    name: "Slack / Discord / Microsoft Teams",
    purpose: "Notificaciones internas cuando el cliente configura la integración.",
    country: "EE.UU.",
    data: "Solo el contenido del mensaje que el cliente decide enviar al canal interno.",
    url: "https://slack.com/trust/privacy/privacy-policy",
  },
  {
    name: "HubSpot / Pipedrive / Mailchimp / ActiveCampaign / Notion / Airtable",
    purpose: "Sincronización de leads y conversaciones cuando el cliente configura la integración.",
    country: "Varía según el proveedor",
    data: "Datos de contacto del lead y los campos que el cliente decide sincronizar.",
    url: "https://www.hubspot.com/data-privacy/gdpr",
  },
];

export default function SubprocesadoresPage() {
  useEffect(() => {
    document.title = "Subprocesadores | Cappta AI";
    const meta =
      document.querySelector('meta[name="description"]') ||
      document.head.appendChild(Object.assign(document.createElement("meta"), { name: "description" }));
    meta.setAttribute(
      "content",
      "Lista pública y vigente de los subprocesadores que Cappta AI utiliza para operar el servicio.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="page-subprocesadores">
      <header className="border-b border-white/[0.04] py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5" data-testid="link-logo-home">
            <CapptaLogo size={28} textClassName="text-lg" />
          </a>
          <a href="/" className="text-sm text-white/40 hover:text-primary transition-colors flex items-center gap-1.5" data-testid="link-back-home">
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al inicio
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 space-y-10">
        <section>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3" data-testid="text-subprocesadores-title">
            Subprocesadores
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-3xl">
            Para operar Cappta AI nos apoyamos en los proveedores listados abajo. Cada uno trata datos personales del cliente únicamente para la finalidad indicada y bajo obligaciones equivalentes a las de nuestro{" "}
            <a href="/dpa" className="text-violet-400 hover:underline" data-testid="link-dpa">DPA</a>.
          </p>
          <p className="text-xs text-white/30 mt-3">Última actualización: Abril 2026</p>
        </section>

        <section className="rounded-2xl border border-white/[0.06] overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-white/[0.04]">
              <tr>
                <th className="text-left px-4 py-3 text-white/60 font-semibold text-xs uppercase tracking-wider">Proveedor</th>
                <th className="text-left px-4 py-3 text-white/60 font-semibold text-xs uppercase tracking-wider">Propósito</th>
                <th className="text-left px-4 py-3 text-white/60 font-semibold text-xs uppercase tracking-wider">Datos</th>
                <th className="text-left px-4 py-3 text-white/60 font-semibold text-xs uppercase tracking-wider">País</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {SUBPROCESSORS.map((sp) => (
                <tr key={sp.name} data-testid={`row-subprocessor-${sp.name.substring(0, 12).toLowerCase().replace(/\s+/g, "-")}`}>
                  <td className="px-4 py-3 text-white/85 font-semibold align-top">
                    <a href={sp.url} target="_blank" rel="noopener noreferrer" className="hover:text-violet-300 transition-colors">
                      {sp.name}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-white/65 leading-relaxed align-top">{sp.purpose}</td>
                  <td className="px-4 py-3 text-white/55 leading-relaxed align-top">{sp.data}</td>
                  <td className="px-4 py-3 text-white/55 align-top whitespace-nowrap">{sp.country}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/85">Notificación de cambios</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Notificamos cualquier alta, baja o reemplazo de subprocesador con al menos 30 días de anticipación. Para recibir el aviso por email, suscribite escribiendo a{" "}
            <a href="mailto:webmakerchile@gmail.com?subject=Suscripci%C3%B3n%20Subprocesadores" className="text-violet-300 hover:underline" data-testid="link-subscribe-subprocessors">webmakerchile@gmail.com</a>{" "}
            con el asunto "Suscripción Subprocesadores".
          </p>
          <p className="text-sm text-white/60 leading-relaxed">
            Si tu organización tiene objeciones razonables al cambio por motivos de protección de datos, podemos coordinar alternativas o, en su defecto, rescindir el servicio sin penalidad conforme al{" "}
            <a href="/dpa" className="text-violet-400 hover:underline">DPA</a>.
          </p>
        </section>

        <section className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.03] p-6 flex items-start gap-4">
          <Mail className="w-5 h-5 text-violet-300 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-bold text-white/90 mb-1">¿Dudas sobre un proveedor?</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Si necesitás más detalle (DPA del proveedor, certificaciones, ubicación específica) escribinos a{" "}
              <a href="mailto:webmakerchile@gmail.com" className="text-violet-300 hover:underline">webmakerchile@gmail.com</a>{" "}
              y te lo facilitamos.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.04] py-8 px-6 text-center text-sm text-white/20">
        &copy; {new Date().getFullYear()} Cappta AI by Web Maker Chile.{" "}
        <a href="/privacidad" className="hover:text-white/40 transition-colors">Privacidad</a> ·{" "}
        <a href="/terminos" className="hover:text-white/40 transition-colors">Términos</a> ·{" "}
        <a href="/seguridad" className="hover:text-white/40 transition-colors">Seguridad</a> ·{" "}
        <a href="/dpa" className="hover:text-white/40 transition-colors">DPA</a> ·{" "}
        <a href="/subprocesadores" className="hover:text-white/40 transition-colors">Subprocesadores</a>
      </footer>
    </div>
  );
}
