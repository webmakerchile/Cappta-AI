import { NexiaLogo } from "@/components/NexiaLogo";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/[0.04] py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5" data-testid="link-logo-home">
            <NexiaLogo size={28} textClassName="text-lg" />
          </a>
          <a href="/" className="text-sm text-white/40 hover:text-primary transition-colors" data-testid="link-back-home">← Volver al inicio</a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-10">
        <div>
          <h1 className="text-3xl font-extrabold mb-2" data-testid="text-privacy-title">Política de Privacidad</h1>
          <p className="text-sm text-white/40">Última actualización: Marzo 2026</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/80">1. Información que recopilamos</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Nexia AI, operado por Web Maker Chile, recopila la siguiente información cuando utilizas nuestra plataforma:
          </p>
          <ul className="list-disc list-inside text-sm text-white/50 leading-relaxed space-y-2 ml-4">
            <li><strong className="text-white/70">Datos de registro:</strong> nombre, correo electrónico y contraseña al crear una cuenta de negocio.</li>
            <li><strong className="text-white/70">Datos del chatbot:</strong> configuración del widget, nombre de empresa, logo, colores y mensajes personalizados.</li>
            <li><strong className="text-white/70">Conversaciones:</strong> mensajes intercambiados entre los visitantes de tu sitio web y el chatbot de IA.</li>
            <li><strong className="text-white/70">Datos de visitantes:</strong> correo electrónico y nombre que los visitantes proporcionan voluntariamente al iniciar una conversación.</li>
            <li><strong className="text-white/70">Datos técnicos:</strong> dirección IP, tipo de navegador, sistema operativo y datos de uso general.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/80">2. Cómo usamos la información</h2>
          <ul className="list-disc list-inside text-sm text-white/50 leading-relaxed space-y-2 ml-4">
            <li>Proveer y mantener el servicio de chatbot con IA.</li>
            <li>Procesar y responder consultas de los visitantes de tu sitio web.</li>
            <li>Mejorar la calidad de las respuestas del bot mediante el entrenamiento contextual.</li>
            <li>Enviar comunicaciones relacionadas con el servicio (actualizaciones, alertas de seguridad).</li>
            <li>Generar estadísticas agregadas y anónimas sobre el uso de la plataforma.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/80">3. Compartición de datos</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            No vendemos, alquilamos ni compartimos tus datos personales con terceros, excepto en los siguientes casos:
          </p>
          <ul className="list-disc list-inside text-sm text-white/50 leading-relaxed space-y-2 ml-4">
            <li><strong className="text-white/70">Proveedores de IA:</strong> utilizamos OpenAI para procesar las conversaciones del chatbot. Los mensajes se envían a sus servidores para generar respuestas.</li>
            <li><strong className="text-white/70">Procesador de pagos:</strong> utilizamos Mercado Pago para procesar suscripciones y pagos. Al suscribirte, tus datos de pago son gestionados directamente por Mercado Pago según sus propias políticas de privacidad. Nexia AI no almacena datos de tarjetas de crédito ni información financiera sensible.</li>
            <li><strong className="text-white/70">Infraestructura:</strong> utilizamos servicios de hosting y base de datos de terceros para operar la plataforma.</li>
            <li><strong className="text-white/70">Obligaciones legales:</strong> podemos divulgar información si la ley lo requiere.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/80">4. Almacenamiento y seguridad</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Los datos se almacenan en servidores seguros con cifrado en tránsito (HTTPS/TLS). Las contraseñas se almacenan con hash seguro (bcrypt). Implementamos medidas técnicas y organizativas razonables para proteger la información.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/80">5. Retención de datos</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Conservamos los datos mientras tu cuenta esté activa. Las conversaciones del chatbot se almacenan por el período necesario para el funcionamiento del servicio. Puedes solicitar la eliminación de tu cuenta y datos asociados en cualquier momento contactándonos.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/80">6. Tus derechos</h2>
          <p className="text-sm text-white/50 leading-relaxed">Tienes derecho a:</p>
          <ul className="list-disc list-inside text-sm text-white/50 leading-relaxed space-y-2 ml-4">
            <li>Acceder a tus datos personales.</li>
            <li>Rectificar información inexacta.</li>
            <li>Solicitar la eliminación de tu cuenta y datos.</li>
            <li>Exportar tus datos en un formato legible.</li>
            <li>Oponerte al procesamiento de tus datos para fines específicos.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/80">7. Datos de pago</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Los pagos y suscripciones se procesan a través de Mercado Pago. Nexia AI no almacena ni tiene acceso a los datos de tu tarjeta de crédito o débito. Toda la información financiera es gestionada de forma segura por Mercado Pago bajo sus estándares de seguridad PCI DSS. Solo almacenamos un identificador de suscripción para gestionar el estado de tu plan.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/80">8. Cookies</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Nexia AI utiliza cookies esenciales para el funcionamiento de la plataforma (autenticación y sesiones). No utilizamos cookies de seguimiento ni publicidad de terceros.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white/80">9. Contacto</h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Para consultas sobre privacidad, contacta a Web Maker Chile en: <a href="mailto:webmakerchile@gmail.com" className="text-primary hover:underline" data-testid="link-privacy-email">webmakerchile@gmail.com</a>
          </p>
        </section>
      </main>

      <footer className="border-t border-white/[0.04] py-8 px-6 text-center text-sm text-white/20">
        &copy; {new Date().getFullYear()} Nexia AI by Web Maker Chile. Todos los derechos reservados.
      </footer>
    </div>
  );
}
