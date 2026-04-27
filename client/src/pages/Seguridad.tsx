import { useEffect } from "react";
import { CapptaLogo } from "@/components/CapptaLogo";
import { Shield, Lock, Server, KeyRound, UserCheck, Database, AlertTriangle, ClipboardCheck, Mail, ArrowLeft } from "lucide-react";

export default function SeguridadPage() {
  useEffect(() => {
    document.title = "Seguridad y Confianza | Cappta AI";
    const meta =
      document.querySelector('meta[name="description"]') ||
      document.head.appendChild(Object.assign(document.createElement("meta"), { name: "description" }));
    meta.setAttribute(
      "content",
      "Cifrado, aislamiento multi-tenant, residencia de datos y respuesta a incidentes en Cappta AI. Centro de confianza público.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="page-seguridad">
      <header className="border-b border-white/[0.04] py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5" data-testid="link-logo-home">
            <CapptaLogo size={28} textClassName="text-lg" />
          </a>
          <a href="/" className="text-sm text-white/40 hover:text-primary transition-colors flex items-center gap-1.5" data-testid="link-back-home">
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al inicio
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        <section>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 mb-5">
            <Shield className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-violet-300">Centro de confianza</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3" data-testid="text-seguridad-title">Seguridad en Cappta AI</h1>
          <p className="text-white/60 text-base leading-relaxed max-w-2xl">
            Operamos software multi-tenant para LATAM. Esta página describe los controles que tenemos hoy, los que están en roadmap y cómo reportar un incidente.
          </p>
          <p className="text-xs text-white/30 mt-3">Última actualización: Abril 2026</p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { Icon: Lock, title: "Cifrado en tránsito", desc: "TLS 1.2+ en todos los endpoints (web, API, widgets, webhooks). Certificados gestionados automáticamente." },
            { Icon: Database, title: "Cifrado en reposo", desc: "Bases de datos y almacenamiento de objetos cifrados con AES-256 administrado por el proveedor de infraestructura." },
            { Icon: KeyRound, title: "Hashing de contraseñas", desc: "bcrypt con salt único por usuario. Las contraseñas no son recuperables, solo restablecibles." },
            { Icon: UserCheck, title: "Aislamiento multi-tenant", desc: "Cada negocio tiene un tenantId propio. Todas las consultas se filtran por tenant en backend, sin posibilidad de cruce." },
            { Icon: Server, title: "Residencia de datos", desc: "Postgres administrado por Neon (EE.UU.) y almacenamiento de objetos en infraestructura compatible con S3. Backups automáticos diarios." },
            { Icon: ClipboardCheck, title: "Controles de acceso", desc: "Roles separados (administrador, agente, operador). Sesiones con expiración. Logs de actividad por usuario." },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5" data-testid={`card-control-${title.substring(0, 12)}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-violet-400" />
                </div>
                <h2 className="font-bold text-white/90 text-sm">{title}</h2>
              </div>
              <p className="text-sm text-white/55 leading-relaxed">{desc}</p>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/85">Datos que procesamos</h2>
          <p className="text-sm text-white/55 leading-relaxed">
            Cappta AI procesa los siguientes tipos de datos en nombre del cliente (negocio):
          </p>
          <ul className="list-disc list-inside text-sm text-white/55 leading-relaxed space-y-2 ml-4">
            <li>Datos de identificación de visitantes proporcionados voluntariamente (nombre, email, teléfono).</li>
            <li>Mensajes intercambiados con el chatbot y con agentes humanos.</li>
            <li>Metadatos de sesión (IP, navegador, sistema operativo, ruta de origen).</li>
            <li>Adjuntos enviados por el visitante (imágenes, audio) cuando aplica.</li>
          </ul>
          <p className="text-sm text-white/55 leading-relaxed">
            Para procesar respuestas con IA enviamos el contenido necesario a OpenAI bajo el acuerdo de procesamiento estándar de OpenAI (los datos no se usan para entrenar sus modelos).
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/85">Subprocesadores</h2>
          <p className="text-sm text-white/55 leading-relaxed">
            La lista completa de subprocesadores con su propósito y país está publicada en{" "}
            <a href="/subprocesadores" className="text-violet-400 hover:underline" data-testid="link-subprocesadores">/subprocesadores</a>.
            Notificamos cualquier alta o baja con 30 días de anticipación a quienes se suscriban escribiendo a webmakerchile@gmail.com con el asunto "subprocesadores".
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/85">Respuesta a incidentes</h2>
          <ul className="list-disc list-inside text-sm text-white/55 leading-relaxed space-y-2 ml-4">
            <li><strong className="text-white/75">Triage:</strong> Confirmamos el reporte y aislamos el alcance dentro de las 24 horas hábiles.</li>
            <li><strong className="text-white/75">Notificación a clientes:</strong> Si tu tenant fue afectado, te avisamos por email en menos de 72 horas con causa, datos involucrados y plan de mitigación, en línea con GDPR Art. 33 y la Ley 19.628 de Chile.</li>
            <li><strong className="text-white/75">Postmortem:</strong> Publicamos el análisis a clientes afectados y ajustamos controles para evitar recurrencias.</li>
          </ul>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-white/80 font-semibold mb-1">¿Encontraste una vulnerabilidad?</p>
              <p className="text-xs text-white/55 leading-relaxed">
                Reportala a <a href="mailto:webmakerchile@gmail.com?subject=Reporte%20de%20seguridad" className="text-violet-400 hover:underline" data-testid="link-report-security">webmakerchile@gmail.com</a> con el asunto "Reporte de seguridad". Acusamos recibo en menos de 24h y te mantenemos informado del progreso.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/85">Estado actual y roadmap</h2>
          <p className="text-sm text-white/55 leading-relaxed">
            Somos transparentes sobre lo que está operativo y lo que estamos construyendo. No certificamos lo que no tenemos.
          </p>
          <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.04]">
                <tr>
                  <th className="text-left px-4 py-3 text-white/60 font-semibold text-xs uppercase tracking-wider">Control</th>
                  <th className="text-left px-4 py-3 text-white/60 font-semibold text-xs uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {[
                  { c: "Cifrado en tránsito (TLS) y en reposo (AES-256)", s: "Operativo" },
                  { c: "Aislamiento multi-tenant a nivel de aplicación", s: "Operativo" },
                  { c: "Backups diarios automáticos del proveedor de DB", s: "Operativo" },
                  { c: "Logs de auditoría de acciones administrativas", s: "Operativo" },
                  { c: "Roles y permisos por usuario", s: "Operativo" },
                  { c: "Reset de contraseña por email firmado", s: "Operativo" },
                  { c: "Single Sign-On (SAML / OIDC)", s: "Disponible para Enterprise bajo contrato" },
                  { c: "Auditoría externa SOC 2 Tipo II", s: "Roadmap 2026 (no certificados)" },
                  { c: "Certificación ISO 27001", s: "No certificados" },
                  { c: "Residencia de datos en la región del cliente", s: "Roadmap (hoy infraestructura en EE.UU.)" },
                  { c: "On-premise / VPC dedicado", s: "Solo Enterprise bajo evaluación" },
                ].map(({ c, s }) => {
                  const isOp = s === "Operativo";
                  const isRoadmap = s.includes("Roadmap") || s.includes("Disponible");
                  const color = isOp ? "text-emerald-400" : isRoadmap ? "text-amber-400" : "text-white/50";
                  return (
                    <tr key={c} data-testid={`row-control-${c.substring(0, 15)}`}>
                      <td className="px-4 py-3 text-white/70">{c}</td>
                      <td className={`px-4 py-3 text-xs font-semibold ${color}`}>{s}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/85">Documentos legales relacionados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { href: "/privacidad", title: "Política de privacidad", desc: "Cómo tratamos los datos personales" },
              { href: "/dpa", title: "DPA (acuerdo de procesamiento)", desc: "Para clientes que necesitan firmar" },
              { href: "/subprocesadores", title: "Subprocesadores", desc: "Lista pública con país y propósito" },
            ].map(({ href, title, desc }) => (
              <a
                key={href}
                href={href}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-violet-500/30 hover:bg-violet-500/[0.03] transition-all"
                data-testid={`link-doc-${href.substring(1)}`}
              >
                <p className="font-semibold text-white/90 text-sm mb-1">{title}</p>
                <p className="text-xs text-white/50">{desc}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.03] p-6 flex items-start gap-4">
          <Mail className="w-5 h-5 text-violet-300 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-bold text-white/90 mb-1">¿Necesitas más detalle?</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Para cuestionarios de seguridad de proveedores, DPAs firmables o conversaciones técnicas con tu equipo de cumplimiento, escribinos a{" "}
              <a href="mailto:webmakerchile@gmail.com" className="text-violet-300 hover:underline" data-testid="link-contact-security">webmakerchile@gmail.com</a>.
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
