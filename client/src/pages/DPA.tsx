import { useEffect } from "react";
import { CapptaLogo } from "@/components/CapptaLogo";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";

export default function DPAPage() {
  useEffect(() => {
    document.title = "Acuerdo de Procesamiento de Datos (DPA) | Cappta AI";
    const meta =
      document.querySelector('meta[name="description"]') ||
      document.head.appendChild(Object.assign(document.createElement("meta"), { name: "description" }));
    meta.setAttribute(
      "content",
      "Acuerdo de Procesamiento de Datos (DPA) de Cappta AI alineado con GDPR, Ley 19.628 (Chile), LFPDPPP (México) y LGPD (Brasil).",
    );
  }, []);

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="page-dpa">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body, html { background: white !important; color: black !important; }
          main, section, h1, h2, h3, p, li, td, th { color: black !important; background: transparent !important; }
          table, th, td { border-color: #ccc !important; }
          .rounded-2xl, .rounded-xl, .rounded-lg { border-radius: 4px !important; }
          a { color: #4f46e5 !important; text-decoration: underline; }
        }
      `}</style>

      <header className="border-b border-white/[0.04] py-4 px-6 no-print">
        <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <a href="/" className="flex items-center gap-2.5" data-testid="link-logo-home">
            <CapptaLogo size={28} textClassName="text-lg" />
          </a>
          <div className="flex items-center gap-3">
            <Button
              onClick={handlePrint}
              size="sm"
              className="bg-violet-600 hover:bg-violet-500 text-white"
              data-testid="button-print-dpa"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Imprimir / PDF
            </Button>
            <a href="/" className="text-sm text-white/40 hover:text-primary transition-colors flex items-center gap-1.5" data-testid="link-back-home">
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-10 print:py-6">
        <section>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2" data-testid="text-dpa-title">
            Acuerdo de Procesamiento de Datos (DPA)
          </h1>
          <p className="text-sm text-white/45">Versión 1.0 · Vigente desde Abril 2026</p>
          <p className="text-sm text-white/45">Operador: Web Maker Chile · Contacto: webmakerchile@gmail.com</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white/85">1. Partes y objeto</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Este Acuerdo de Procesamiento de Datos (en adelante, "DPA") se celebra entre Web Maker Chile, en su carácter de Encargado de Tratamiento (en adelante, "Cappta AI"), y el cliente que ha contratado los servicios de Cappta AI (en adelante, el "Responsable"). El presente DPA forma parte integrante de los Términos de Uso de Cappta AI y aplica al tratamiento de datos personales que Cappta AI realiza por cuenta del Responsable a través de la plataforma.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white/85">2. Marco regulatorio aplicable</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Este DPA se interpreta de buena fe en el marco de la legislación aplicable en la jurisdicción del Responsable, incluyendo:
          </p>
          <ul className="list-disc list-inside text-sm text-white/60 leading-relaxed space-y-1.5 ml-4">
            <li>Reglamento (UE) 2016/679 — RGPD (cuando aplique a residentes europeos).</li>
            <li>Ley 19.628 sobre Protección de la Vida Privada de Chile.</li>
            <li>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) de México.</li>
            <li>Lei Geral de Proteção de Dados (LGPD) de Brasil.</li>
            <li>Ley 25.326 de Protección de los Datos Personales de Argentina.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white/85">3. Roles</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            El Responsable determina los fines y medios del tratamiento de los datos personales que carga en la plataforma o que recolecta a través del chatbot. Cappta AI actúa como Encargado y trata los datos personales únicamente conforme a las instrucciones documentadas del Responsable, incluidas las contenidas en este DPA y en la configuración de la plataforma.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white/85">4. Categorías de datos y titulares</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            <strong className="text-white/80">Titulares:</strong> visitantes y clientes finales del Responsable que interactúan con el chatbot, así como usuarios internos que el Responsable da de alta en la plataforma.
          </p>
          <p className="text-sm text-white/60 leading-relaxed">
            <strong className="text-white/80">Categorías de datos:</strong> datos de contacto (nombre, email, teléfono), contenido de las conversaciones, adjuntos compartidos voluntariamente, metadatos técnicos (IP, navegador, dispositivo, página de origen) e identificadores de sesión.
          </p>
          <p className="text-sm text-white/60 leading-relaxed">
            Cappta AI no solicita ni promueve la carga de categorías especiales de datos (datos de salud, biométricos, ideológicos, judiciales). Si el Responsable los carga, lo hace bajo su exclusiva responsabilidad.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white/85">5. Finalidades del tratamiento</h2>
          <ul className="list-disc list-inside text-sm text-white/60 leading-relaxed space-y-1.5 ml-4">
            <li>Operar la plataforma de chatbot, atención al cliente y motor de ventas contratada.</li>
            <li>Generar respuestas automatizadas mediante modelos de inteligencia artificial.</li>
            <li>Permitir el handoff a agentes humanos del Responsable.</li>
            <li>Enviar notificaciones operativas al Responsable y a los visitantes (cuando el Responsable lo configure).</li>
            <li>Generar métricas y estadísticas de uso para el Responsable.</li>
          </ul>
          <p className="text-sm text-white/60 leading-relaxed">
            Cappta AI no usa los datos personales del Responsable para fines propios de marketing ni para entrenar modelos de IA generales.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white/85">6. Obligaciones de Cappta AI</h2>
          <ul className="list-disc list-inside text-sm text-white/60 leading-relaxed space-y-1.5 ml-4">
            <li>Tratar los datos exclusivamente conforme a las instrucciones del Responsable.</li>
            <li>Garantizar la confidencialidad mediante acuerdos de confidencialidad con su personal y proveedores con acceso.</li>
            <li>Implementar medidas técnicas y organizativas razonables descritas en la sección 8.</li>
            <li>Asistir al Responsable, en la medida de lo posible y a costo razonable, para responder a solicitudes de titulares.</li>
            <li>Notificar al Responsable, sin demora indebida y a más tardar dentro de las 72 horas, cualquier brecha de seguridad que afecte datos personales del Responsable.</li>
            <li>Devolver o eliminar los datos personales al finalizar el servicio, conforme a la sección 11.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white/85">7. Subprocesadores</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            El Responsable autoriza a Cappta AI a contratar subprocesadores para la prestación del servicio. La lista actualizada está publicada en{" "}
            <a href="/subprocesadores" className="text-violet-400 hover:underline">/subprocesadores</a>.
            Cappta AI mantendrá con cada subprocesador obligaciones contractuales equivalentes a las de este DPA en materia de protección de datos.
          </p>
          <p className="text-sm text-white/60 leading-relaxed">
            Cappta AI notificará al Responsable cualquier alta o cambio de subprocesador con al menos 30 días de antelación, mediante actualización pública en la página de subprocesadores y, cuando el Responsable se haya suscrito al canal correspondiente, también por email. El Responsable podrá objetar el cambio por motivos razonables relacionados con protección de datos; si las partes no llegan a un acuerdo, el Responsable podrá rescindir el servicio sin penalidad.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white/85">8. Medidas técnicas y organizativas</h2>
          <ul className="list-disc list-inside text-sm text-white/60 leading-relaxed space-y-1.5 ml-4">
            <li>Cifrado en tránsito mediante TLS 1.2+ en todos los endpoints públicos.</li>
            <li>Cifrado en reposo (AES-256) administrado por los proveedores de base de datos y almacenamiento de objetos.</li>
            <li>Hashing seguro de contraseñas con bcrypt y salt único por usuario.</li>
            <li>Aislamiento lógico multi-tenant: todas las consultas se filtran por identificador de tenant en el backend.</li>
            <li>Control de acceso basado en roles (administrador, agente, operador) y expiración de sesiones.</li>
            <li>Registro de auditoría de acciones administrativas relevantes.</li>
            <li>Backups automáticos diarios gestionados por el proveedor de base de datos.</li>
            <li>Política de respuesta a incidentes con triage en menos de 24 horas hábiles.</li>
            <li>Detalle público y vigente en{" "}
              <a href="/seguridad" className="text-violet-400 hover:underline">/seguridad</a>.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white/85">9. Transferencias internacionales</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            La infraestructura principal de Cappta AI se aloja en Estados Unidos (proveedores Neon Postgres, almacenamiento de objetos, OpenAI). Cuando el Responsable se rige por una jurisdicción que requiere garantías específicas para transferencias internacionales (por ejemplo, cláusulas contractuales tipo del RGPD), las partes acordarán por escrito el mecanismo apropiado.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white/85">10. Asistencia al Responsable</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Cappta AI asistirá al Responsable, en la medida razonable y mediante las funciones disponibles en la plataforma o solicitudes específicas, para:
          </p>
          <ul className="list-disc list-inside text-sm text-white/60 leading-relaxed space-y-1.5 ml-4">
            <li>Responder a solicitudes de acceso, rectificación, oposición, portabilidad y supresión de los titulares.</li>
            <li>Garantizar el cumplimiento de las obligaciones del Responsable bajo la legislación aplicable.</li>
            <li>Colaborar en evaluaciones de impacto en la protección de datos.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white/85">11. Devolución y eliminación de datos</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Al terminar la relación contractual y previa solicitud del Responsable, Cappta AI eliminará o devolverá los datos personales en un plazo de 60 días. Quedan exceptuadas las copias requeridas por obligaciones legales de retención, las cuales permanecerán protegidas hasta su eliminación segura.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white/85">12. Auditoría</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            El Responsable podrá auditar el cumplimiento de este DPA mediante: (a) la documentación pública en{" "}
            <a href="/seguridad" className="text-violet-400 hover:underline">/seguridad</a>{" "}
            y{" "}
            <a href="/subprocesadores" className="text-violet-400 hover:underline">/subprocesadores</a>;
            (b) los reportes de terceros que Cappta AI ponga a disposición; y (c) auditorías acordadas con razonable anticipación, no más de una vez al año salvo causa justificada, durante horario hábil y bajo confidencialidad. Los costos de auditorías presenciales son a cargo del Responsable.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white/85">13. Limitación de responsabilidad</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            La responsabilidad de las partes bajo este DPA se rige por las limitaciones establecidas en los Términos de Uso de Cappta AI, salvo que la ley aplicable disponga lo contrario para infracciones a la normativa de protección de datos.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white/85">14. Vigencia, modificaciones y ley aplicable</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Este DPA permanece vigente mientras Cappta AI trate datos personales por cuenta del Responsable. Cappta AI podrá actualizarlo cuando lo exija la regulación o la evolución del servicio, notificando al Responsable con razonable antelación. Para clientes regidos por jurisdicciones distintas a Chile, las partes podrán suscribir adendas específicas. La ley aplicable en defecto de acuerdo distinto es la de la República de Chile.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white/85">15. Aceptación</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            La contratación y uso de los servicios de Cappta AI por parte del Responsable implica la aceptación íntegra de este DPA. Para clientes que requieran un DPA firmado bilateralmente, escribir a{" "}
            <a href="mailto:webmakerchile@gmail.com" className="text-violet-400 hover:underline">webmakerchile@gmail.com</a>{" "}
            con el asunto "DPA firmable".
          </p>
        </section>

        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 mt-8">
          <p className="text-xs text-white/45 leading-relaxed">
            Este DPA es un documento legal pero no constituye asesoría jurídica. El Responsable debe evaluar si este DPA se ajusta a sus obligaciones específicas bajo la legislación aplicable y, en caso de duda, consultar con su asesor legal.
          </p>
        </section>
      </main>

      <footer className="border-t border-white/[0.04] py-8 px-6 text-center text-sm text-white/20 no-print">
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
