import { CapptaLogo } from "@/components/CapptaLogo";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/[0.04] py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5" data-testid="link-logo-home">
            <CapptaLogo size={28} textClassName="text-lg" />
          </a>
          <a href="/" className="text-sm text-white/40 hover:text-primary transition-colors" data-testid="link-back-home">← Volver al inicio</a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-10">
        <div>
          <h1 className="text-3xl font-extrabold mb-2" data-testid="text-terms-title">Términos de Uso</h1>
          <p className="text-sm text-white/40">Última actualización: Marzo 2026</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/80">1. Aceptación de los términos</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Al acceder y utilizar Cappta AI, operado por Web Maker Chile, aceptas estos términos de uso en su totalidad. Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar el servicio.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/80">2. Descripción del servicio</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Cappta AI es una plataforma SaaS que permite a las empresas crear e integrar chatbots con inteligencia artificial en sus sitios web. El servicio incluye:
          </p>
          <ul className="list-disc list-inside text-sm text-white/50 leading-relaxed space-y-2 ml-4">
            <li>Creación y configuración de chatbots personalizados.</li>
            <li>Integración con sitios web mediante código embed, plugins o iframes.</li>
            <li>Respuestas automáticas generadas por inteligencia artificial.</li>
            <li>Panel de administración para gestionar conversaciones y configuraciones.</li>
            <li>Escalamiento a agentes humanos cuando sea necesario.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/80">3. Registro y cuenta</h2>
          <ul className="list-disc list-inside text-sm text-white/50 leading-relaxed space-y-2 ml-4">
            <li>Debes proporcionar información veraz y actualizada al registrarte.</li>
            <li>Eres responsable de mantener la seguridad de tu cuenta y contraseña.</li>
            <li>No debes compartir tu cuenta con terceros no autorizados.</li>
            <li>Debes notificarnos inmediatamente si sospechas de un uso no autorizado de tu cuenta.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/80">4. Planes, pagos y suscripciones</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Cappta AI ofrece diferentes planes de servicio (Starter, Pro, Enterprise). Los detalles de precios y características de cada plan están disponibles en nuestra página de precios. Nos reservamos el derecho de modificar los precios con previo aviso de 30 días.
          </p>
          <ul className="list-disc list-inside text-sm text-white/50 leading-relaxed space-y-2 ml-4">
            <li><strong className="text-white/70">Período de prueba:</strong> Los planes pagados incluyen un período de prueba gratuito de 7 días. Durante este período puedes cancelar sin costo alguno. El período de prueba no incluye el servicio de chatbot WhatsApp.</li>
            <li><strong className="text-white/70">Facturación:</strong> Una vez finalizado el período de prueba, se realizará el cobro automático mensual a través de Mercado Pago según el plan contratado.</li>
            <li><strong className="text-white/70">Cancelación:</strong> Puedes cancelar tu suscripción en cualquier momento desde el panel de control. La cancelación será efectiva al final del período de facturación actual.</li>
            <li><strong className="text-red-400 font-bold">Política de no reembolso:</strong> No se admiten reembolsos bajo ninguna circunstancia. Una vez realizado el cobro, el pago no es reembolsable. Al contratar un plan de pago, aceptas expresamente esta política. Te recomendamos aprovechar el período de prueba gratuito de 7 días para evaluar el servicio antes de comprometerte con un plan de pago.</li>
            <li><strong className="text-white/70">Procesador de pagos:</strong> Los pagos son procesados por Mercado Pago. Al suscribirte, aceptas también los términos y condiciones de Mercado Pago.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/80">5. Uso aceptable</h2>
          <p className="text-sm text-white/50 leading-relaxed">Al utilizar Cappta AI, te comprometes a no:</p>
          <ul className="list-disc list-inside text-sm text-white/50 leading-relaxed space-y-2 ml-4">
            <li>Usar el servicio para actividades ilegales o fraudulentas.</li>
            <li>Enviar contenido ofensivo, difamatorio o que infrinja derechos de terceros.</li>
            <li>Intentar acceder sin autorización a otros sistemas o cuentas.</li>
            <li>Sobrecargar deliberadamente los servidores o infraestructura del servicio.</li>
            <li>Revender o redistribuir el servicio sin autorización escrita.</li>
            <li>Usar el chatbot para recopilar datos personales sin consentimiento.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/80">6. Propiedad intelectual</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Cappta AI, su código, diseño, marca y contenido son propiedad de Web Maker Chile. El contenido que subas o configures (logos, textos, datos) sigue siendo de tu propiedad. Al usar el servicio, nos otorgas una licencia limitada para mostrar tu contenido según la funcionalidad del servicio.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/80">7. Inteligencia artificial</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Las respuestas generadas por el chatbot son producidas por modelos de inteligencia artificial y pueden no ser siempre precisas. Cappta AI no garantiza la exactitud de las respuestas generadas por IA. Eres responsable de revisar y configurar el contexto del bot para asegurar respuestas apropiadas para tu negocio.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/80">8. Disponibilidad del servicio</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Nos esforzamos por mantener el servicio disponible 24/7, pero no garantizamos disponibilidad ininterrumpida. Podremos realizar mantenimientos programados con previo aviso. No seremos responsables por interrupciones causadas por factores fuera de nuestro control.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/80">9. Limitación de responsabilidad</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Cappta AI se proporciona "tal como está". En la máxima medida permitida por la ley, Web Maker Chile no será responsable por daños indirectos, incidentales o consecuentes derivados del uso del servicio, incluyendo pérdida de datos, ingresos o oportunidades de negocio.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/80">10. Terminación y cancelación</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Puedes cancelar tu cuenta en cualquier momento desde el panel de control. Nos reservamos el derecho de suspender o cancelar cuentas que violen estos términos. En caso de cancelación:
          </p>
          <ul className="list-disc list-inside text-sm text-white/50 leading-relaxed space-y-2 ml-4">
            <li>La suscripción se cancelará y no se realizarán cobros futuros.</li>
            <li>El acceso a las funcionalidades del plan pagado se mantendrá hasta el final del período facturado.</li>
            <li>Los pagos ya realizados no son reembolsables.</li>
            <li>Tus datos serán eliminados según nuestra política de privacidad.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/80">11. Modificaciones</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios significativos serán notificados por correo electrónico o mediante un aviso en la plataforma. El uso continuado del servicio después de las modificaciones constituye tu aceptación de los nuevos términos.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/80">12. Ley aplicable</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Estos términos se rigen por las leyes de la República de Chile. Cualquier disputa será sometida a la jurisdicción de los tribunales competentes de la ciudad de Santiago, Chile.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/80">13. Contacto</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Para consultas sobre estos términos, contacta a Web Maker Chile en: <a href="mailto:webmakerchile@gmail.com" className="text-primary hover:underline" data-testid="link-terms-email">webmakerchile@gmail.com</a>
          </p>
        </section>
      </main>

      <footer className="border-t border-white/[0.04] py-8 px-6 text-center text-sm text-white/20">
        &copy; {new Date().getFullYear()} Cappta AI by Web Maker Chile. Todos los derechos reservados.
      </footer>
    </div>
  );
}
