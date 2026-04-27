import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CapptaLogo } from "@/components/CapptaLogo";
import {
  ShoppingBag,
  UtensilsCrossed,
  Scissors,
  Stethoscope,
  Home as HomeIcon,
  Dumbbell,
  Briefcase,
  GraduationCap,
  Car,
  Plane,
  PawPrint,
  Wrench,
  Check,
  ArrowRight,
  Sparkles,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";
import { SiWhatsapp, SiInstagram } from "react-icons/si";

type IconType = typeof ShoppingBag;

interface VerticalConfig {
  slug: string;
  name: string;
  emoji: string;
  Icon: IconType;
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  pains: string[];
  solutions: { title: string; description: string }[];
  exampleConversation: { sender: "user" | "bot"; text: string }[];
  templates: string[];
  metrics: { value: string; label: string }[];
  recommendedPlan: { name: string; price: string; href: string };
  testimonial: { quote: string; author: string; role: string };
}

const VERTICALS: Record<string, VerticalConfig> = {
  restaurantes: {
    slug: "restaurantes",
    name: "Restaurantes y Delivery",
    emoji: "🍽️",
    Icon: UtensilsCrossed,
    hero: {
      eyebrow: "CAPPTA PARA RESTAURANTES",
      title: "Toma pedidos por WhatsApp 24/7 sin contratar a nadie",
      subtitle:
        "Cappta AI atiende a tus clientes, muestra el menú, toma el pedido y lo envía a tu cocina. Tú solo cocinas y entregas.",
    },
    pains: [
      "Clientes que escriben fuera de horario y se pierden",
      "Tu mesero o cajero responde WhatsApp y descuida la mesa",
      "Errores al copiar pedidos del chat al sistema",
      "No alcanzas a responder en hora punta y se van con la competencia",
    ],
    solutions: [
      {
        title: "Menú interactivo en el chat",
        description:
          "Sube tu carta una vez. La IA muestra platos, precios y promociones según lo que pregunta el cliente.",
      },
      {
        title: "Toma de pedidos automática",
        description:
          "El bot arma el pedido, calcula el total con delivery y lo envía a tu cocina o sistema POS.",
      },
      {
        title: "Reservas y horarios",
        description:
          "Agenda mesas, confirma reservas y avisa cuando estás cerrado, con respuestas instantáneas.",
      },
      {
        title: "Reactivación de clientes",
        description:
          "Envía menús del día y promociones por WhatsApp solo a clientes que ya te compraron.",
      },
    ],
    exampleConversation: [
      { sender: "user", text: "Hola, ¿hacen delivery hoy?" },
      {
        sender: "bot",
        text: "¡Hola! Sí, delivery hasta las 23:00. ¿Te muestro el menú? 🍕",
      },
      { sender: "user", text: "Sí, quiero 2 pizzas familiares" },
      {
        sender: "bot",
        text: "Tenemos Margarita ($14.990), Pepperoni ($16.990) y Hawaiana ($15.990). ¿Cuáles te llevas?",
      },
    ],
    templates: [
      "Menú con categorías y precios",
      "Promociones del día automáticas",
      "Confirmación de pedido + tiempo estimado",
      "Recordatorio de reservas",
      "Encuesta NPS post-entrega",
    ],
    metrics: [
      { value: "+38%", label: "Más pedidos por WhatsApp" },
      { value: "12s", label: "Tiempo de respuesta" },
      { value: "0", label: "Pedidos perdidos en la noche" },
    ],
    recommendedPlan: { name: "Pro", price: "$19.990 / mes", href: "/register?plan=basic" },
    testimonial: {
      quote:
        "Antes contestábamos WhatsApp entre todos y se perdían pedidos. Con Cappta no se nos cae uno y los meseros vuelven a estar en el salón.",
      author: "Carolina M.",
      role: "Dueña, Pizzería La Esquina",
    },
  },
  salones: {
    slug: "salones",
    name: "Salones y Spa",
    emoji: "💇",
    Icon: Scissors,
    hero: {
      eyebrow: "CAPPTA PARA SALONES Y SPA",
      title: "Agenda horas mientras tú estás cortando",
      subtitle:
        "Cappta AI muestra disponibilidad real, agenda horas, envía recordatorios y reduce las inasistencias automáticamente.",
    },
    pains: [
      "Pierdes clientes porque no alcanzas a responder",
      "Inasistencias que dejan sillas vacías",
      "Clientes que preguntan precios y nunca se agendan",
      "Reagendar por WhatsApp se transforma en una conversación eterna",
    ],
    solutions: [
      {
        title: "Agenda automática 24/7",
        description:
          "Conecta tu calendario y deja que la IA muestre solo horas disponibles. Confirma sola.",
      },
      {
        title: "Recordatorios sin trabajo",
        description: "Recordatorios automáticos 24h y 2h antes. Reduce inasistencias hasta 60%.",
      },
      {
        title: "Catálogo de servicios",
        description:
          "Cortes, color, manicure, masajes: el bot explica cada servicio con su precio y duración.",
      },
      {
        title: "Reactivación inteligente",
        description:
          "Detecta clientes que no vuelven hace 60 días y los invita con promociones personalizadas.",
      },
    ],
    exampleConversation: [
      { sender: "user", text: "Quiero hora para corte y color" },
      {
        sender: "bot",
        text: "¡Perfecto! Tengo el viernes 2/5 a las 15:00 o sábado 3/5 a las 11:00. ¿Cuál te acomoda?",
      },
      { sender: "user", text: "Sábado a las 11" },
      {
        sender: "bot",
        text: "Listo Sofía, te agendé el sábado 3/5 a las 11:00 con Andrea. Te envío recordatorio el viernes ✨",
      },
    ],
    templates: [
      "Catálogo de servicios y precios",
      "Agenda con disponibilidad real",
      "Recordatorios 24h y 2h antes",
      "Encuesta post-servicio",
      "Reactivación a 60 días sin volver",
    ],
    metrics: [
      { value: "−60%", label: "Inasistencias" },
      { value: "+45%", label: "Horas agendadas / semana" },
      { value: "24/7", label: "Toma reservas" },
    ],
    recommendedPlan: { name: "Solo", price: "$7.990 / mes", href: "/register?plan=solo" },
    testimonial: {
      quote:
        "Empecé sola y ahora con 3 estilistas. Cappta agenda mientras estoy con la tijera. Cambió mi vida.",
      author: "Andrea P.",
      role: "Dueña, Salón Andrea",
    },
  },
  ecommerce: {
    slug: "ecommerce",
    name: "E-commerce y Tiendas",
    emoji: "🛒",
    Icon: ShoppingBag,
    hero: {
      eyebrow: "CAPPTA PARA E-COMMERCE",
      title: "Vendedor experto en tu tienda, 24/7, sin sueldo",
      subtitle:
        "Cappta AI conoce tus productos, ayuda a elegir, recupera carritos abandonados y cierra la venta sin que el cliente se vaya del chat.",
    },
    pains: [
      "Carritos abandonados sin recuperar",
      "Preguntas de stock y envíos que se quedan sin responder",
      "Cliente que pregunta de noche y compra en la competencia",
      "Visitas que se van sin convertir porque no encuentran lo que buscan",
    ],
    solutions: [
      {
        title: "Catálogo conectado",
        description:
          "Sincroniza Shopify, WooCommerce o cualquier CMS. Stock y precios siempre al día.",
      },
      {
        title: "Recomendador inteligente",
        description:
          "La IA pregunta qué busca el cliente y le sugiere productos compatibles, con fotos y precios.",
      },
      {
        title: "Recuperación de carritos",
        description:
          "Si el cliente abandona el chat, el bot le escribe a las 2 horas con un descuento personalizado.",
      },
      {
        title: "Tracking y postventa",
        description:
          "Estado de pedido, cambios y devoluciones automáticos sin tocar tu inbox.",
      },
    ],
    exampleConversation: [
      { sender: "user", text: "Busco zapatillas para correr, talla 41" },
      {
        sender: "bot",
        text: "Tengo 3 modelos en talla 41 que te van a encantar. ¿Las quieres ver? 👟",
      },
      { sender: "user", text: "Sí" },
      {
        sender: "bot",
        text: "Nike Pegasus $89.990 | Adidas Solar $79.990 | New Balance 880 $95.990. Envío gratis sobre $50K.",
      },
    ],
    templates: [
      "Catálogo conectado a tu tienda",
      "Recuperación de carritos a 2h",
      "Tracking de pedidos automático",
      "Cambios y devoluciones",
      "Cross-sell y up-sell con IA",
    ],
    metrics: [
      { value: "3x", label: "Conversión vs sin chat" },
      { value: "+22%", label: "Tickets recuperados" },
      { value: "<10s", label: "Respuesta promedio" },
    ],
    recommendedPlan: { name: "Pro", price: "$19.990 / mes", href: "/register?plan=basic" },
    testimonial: {
      quote:
        "Cappta vende mientras duermo. Mi tienda factura 30% más sin contratar a nadie nuevo.",
      author: "Diego R.",
      role: "Founder, ModaUrbana.cl",
    },
  },
  clinicas: {
    slug: "clinicas",
    name: "Clínicas y Consultas",
    emoji: "🩺",
    Icon: Stethoscope,
    hero: {
      eyebrow: "CAPPTA PARA CLÍNICAS",
      title: "Tu recepción digital que nunca se enferma",
      subtitle:
        "Cappta AI agenda horas, confirma asistencia, responde dudas frecuentes y libera a tu equipo administrativo.",
    },
    pains: [
      "Recepcionista saturada con WhatsApp y teléfono",
      "Pacientes que no asisten y dejan horas vacías",
      "Preguntas repetitivas (precios, prevenciones, horarios)",
      "Trazabilidad nula de las conversaciones",
    ],
    solutions: [
      {
        title: "Agenda médica integrada",
        description:
          "El bot ofrece horas reales por especialidad y profesional. Confirma con el paciente.",
      },
      {
        title: "Triaje inicial",
        description:
          "Hace preguntas iniciales para derivar al profesional correcto y agilizar la consulta.",
      },
      {
        title: "Recordatorios y confirmaciones",
        description:
          "Reduce inasistencias con recordatorios automáticos. El paciente puede reagendar solo.",
      },
      {
        title: "Handoff a humano",
        description:
          "Para temas sensibles, transfiere al equipo humano sin que el paciente lo note.",
      },
    ],
    exampleConversation: [
      { sender: "user", text: "Necesito hora con dentista" },
      {
        sender: "bot",
        text: "¿Es por una urgencia o evaluación general? Tengo horas con la Dra. Pérez esta semana.",
      },
      { sender: "user", text: "Evaluación, idealmente jueves" },
      {
        sender: "bot",
        text: "Jueves 2/5 tengo 10:00, 11:30 y 17:00. ¿Cuál te queda mejor?",
      },
    ],
    templates: [
      "Agenda médica multi-profesional",
      "Triaje inicial guiado",
      "Recordatorios 24h antes",
      "Confirmación de asistencia",
      "Handoff seguro para temas clínicos",
    ],
    metrics: [
      { value: "−50%", label: "Carga de la recepción" },
      { value: "−40%", label: "Inasistencias" },
      { value: "100%", label: "Conversaciones trazables" },
    ],
    recommendedPlan: { name: "Pro", price: "$19.990 / mes", href: "/register?plan=basic" },
    testimonial: {
      quote:
        "Antes la secretaria no daba abasto. Hoy responde solo lo importante y los pacientes se sienten mejor atendidos.",
      author: "Dr. Felipe O.",
      role: "Director, Clínica Integral",
    },
  },
  inmobiliarias: {
    slug: "inmobiliarias",
    name: "Inmobiliarias",
    emoji: "🏠",
    Icon: HomeIcon,
    hero: {
      eyebrow: "CAPPTA PARA INMOBILIARIAS",
      title: "Califica leads automáticamente y cierra más visitas",
      subtitle:
        "Cappta AI responde a leads de portales y redes en segundos, califica, agenda visitas y entrega solo los leads calientes a tus corredores.",
    },
    pains: [
      "Leads de Portalinmobiliario que demoras en contestar",
      "Corredores perdiendo tiempo con leads no calificados",
      "Visitas agendadas a las que nadie llega",
      "Sin trazabilidad del funnel de venta",
    ],
    solutions: [
      {
        title: "Respuesta en segundos",
        description:
          "Conecta los leads de portales y redes. La IA responde en < 1 minuto, 24/7.",
      },
      {
        title: "Calificación automática",
        description:
          "El bot pregunta presupuesto, comuna, dormitorios y financiamiento. Solo los calientes pasan al corredor.",
      },
      {
        title: "Agenda de visitas",
        description:
          "Agenda visitas con disponibilidad real del corredor y envía recordatorios.",
      },
      {
        title: "Reportes de funnel",
        description:
          "Sabes cuántos leads entraron, cuántos calificaron y cuántos visitaron. Sin Excel.",
      },
    ],
    exampleConversation: [
      { sender: "user", text: "Estoy interesado en el depto de Ñuñoa" },
      {
        sender: "bot",
        text: "¡Hola! ¿Es para vivir o invertir? ¿Tienes pre-aprobación de crédito o pagas con ahorros?",
      },
      { sender: "user", text: "Para vivir, con crédito hipotecario" },
      {
        sender: "bot",
        text: "Perfecto. Te puedo agendar visita esta semana con Carla, nuestra corredora de la zona. ¿Tienes alguna preferencia de día?",
      },
    ],
    templates: [
      "Captura de leads multi-portal",
      "Cuestionario de calificación BANT",
      "Agenda de visitas",
      "Recordatorios automáticos",
      "Handoff al corredor con resumen",
    ],
    metrics: [
      { value: "<1 min", label: "Respuesta a leads" },
      { value: "+60%", label: "Tasa de calificación" },
      { value: "2.5x", label: "Más visitas concretadas" },
    ],
    recommendedPlan: { name: "Scale", price: "$49.990 / mes", href: "/register?plan=scale" },
    testimonial: {
      quote:
        "Antes perdíamos leads por no contestar a tiempo. Ahora nuestros corredores solo hablan con los que ya están listos para visitar.",
      author: "Pablo G.",
      role: "Gerente, Inmobiliaria Norte",
    },
  },
  gimnasios: {
    slug: "gimnasios",
    name: "Gimnasios y Wellness",
    emoji: "💪",
    Icon: Dumbbell,
    hero: {
      eyebrow: "CAPPTA PARA GIMNASIOS",
      title: "Inscribe socios sin que tu staff se mueva del piso",
      subtitle:
        "Cappta AI explica planes, agenda clases de prueba, gestiona renovaciones y recupera socios inactivos automáticamente.",
    },
    pains: [
      "Consultas por planes que se quedan sin contestar",
      "Tu profe está dando clase, no puede atender WhatsApp",
      "Socios que dejan de venir y no los reactivas a tiempo",
      "Reservas de clases por planilla manual",
    ],
    solutions: [
      {
        title: "Planes y precios al instante",
        description:
          "El bot muestra todos tus planes, accesorios y promociones. Cierra la inscripción.",
      },
      {
        title: "Reserva de clases",
        description:
          "Crossfit, yoga, spinning: el cliente reserva su cupo desde el chat con cupo en tiempo real.",
      },
      {
        title: "Renovaciones y cobros",
        description:
          "Avisa antes de que venza el plan y guía al socio a renovar sin fricción.",
      },
      {
        title: "Reactivación de inactivos",
        description:
          "Detecta socios que no vienen hace 2 semanas y los invita con un plan personalizado.",
      },
    ],
    exampleConversation: [
      { sender: "user", text: "Cuánto cuesta el plan mensual?" },
      {
        sender: "bot",
        text: "Tenemos: Mensual $35.990, Trimestral $89.990 y Anual $299.990. ¿Te agendo una clase de prueba gratis? 💪",
      },
      { sender: "user", text: "Sí, mañana en la tarde" },
      {
        sender: "bot",
        text: "¡Genial! Mañana 18:00 funcional o 19:30 spinning. ¿Cuál te tinca?",
      },
    ],
    templates: [
      "Planes y precios automatizados",
      "Reserva de clases con cupo real",
      "Recordatorio de renovación",
      "Reactivación de socios inactivos",
      "Encuesta NPS post-clase",
    ],
    metrics: [
      { value: "+50%", label: "Inscripciones cerradas en chat" },
      { value: "+30%", label: "Reactivación de inactivos" },
      { value: "24/7", label: "Atención automática" },
    ],
    recommendedPlan: { name: "Pro", price: "$19.990 / mes", href: "/register?plan=basic" },
    testimonial: {
      quote:
        "Mi staff dejó de estar en el celular. Las inscripciones suben mes a mes y ya nadie se queja por demoras.",
      author: "Matías V.",
      role: "Dueño, BoxFit Gym",
    },
  },
  servicios: {
    slug: "servicios",
    name: "Servicios profesionales",
    emoji: "💼",
    Icon: Briefcase,
    hero: {
      eyebrow: "CAPPTA PARA SERVICIOS PROFESIONALES",
      title: "Recibe consultas y agenda asesorías mientras estás con un cliente",
      subtitle:
        "Abogados, contadores, consultores, arquitectos: Cappta AI atiende dudas iniciales, califica oportunidades y agenda reuniones.",
    },
    pains: [
      "Consultas iniciales que toman tiempo y no convierten",
      "Te llaman por dudas básicas que ya están en tu web",
      "No tienes tiempo de hacer seguimiento a leads tibios",
      "Reuniones agendadas con personas que no son tu cliente ideal",
    ],
    solutions: [
      {
        title: "Filtro inteligente de consultas",
        description:
          "El bot responde dudas frecuentes y deriva solo lo que requiere tu expertise.",
      },
      {
        title: "Calificación de leads",
        description:
          "Pregunta por industria, tamaño y necesidad. Solo los que califican llegan a tu calendario.",
      },
      {
        title: "Agenda de reuniones",
        description:
          "Conecta Google Calendar y deja que los leads agenden directo en tus huecos disponibles.",
      },
      {
        title: "Seguimiento automático",
        description:
          "Si un lead no responde, el bot le escribe a los 3, 7 y 14 días con contenido relevante.",
      },
    ],
    exampleConversation: [
      { sender: "user", text: "Necesito asesoría tributaria" },
      {
        sender: "bot",
        text: "Te ayudo. ¿Eres persona natural o empresa? ¿Cuál es el tema principal?",
      },
      { sender: "user", text: "Empresa, declaración renta atrasada" },
      {
        sender: "bot",
        text: "Entiendo. Tengo hora con Felipe (especialista en renta) el martes 14:00 o jueves 11:00. ¿Cuál te acomoda?",
      },
    ],
    templates: [
      "FAQ jurídico/contable/consultoría",
      "Calificación BANT de leads",
      "Agenda con Google Calendar",
      "Seguimiento a 3-7-14 días",
      "Confirmación de reunión",
    ],
    metrics: [
      { value: "+70%", label: "Reuniones con cliente ideal" },
      { value: "−4h", label: "Tiempo en consultas básicas / día" },
      { value: "+35%", label: "Conversión lead → cliente" },
    ],
    recommendedPlan: { name: "Solo", price: "$7.990 / mes", href: "/register?plan=solo" },
    testimonial: {
      quote:
        "Antes contestaba whatsapps todo el día. Ahora la IA filtra y solo me llegan los leads serios.",
      author: "Lic. Marta R.",
      role: "Abogada Tributaria",
    },
  },
  educacion: {
    slug: "educacion",
    name: "Educación y Cursos",
    emoji: "🎓",
    Icon: GraduationCap,
    hero: {
      eyebrow: "CAPPTA PARA EDUCACIÓN",
      title: "Inscribe alumnos automáticamente, sin perder consultas",
      subtitle:
        "Academias, centros de idiomas, escuelas y cursos online: Cappta AI informa, agenda matrículas y hace seguimiento a postulantes.",
    },
    pains: [
      "Consultas de matrícula que se pierden en el inbox",
      "Padres preguntando lo mismo todos los días",
      "Postulantes tibios que se olvidan",
      "Difícil escalar atención en períodos de matrícula",
    ],
    solutions: [
      {
        title: "Información instantánea",
        description:
          "Programas, requisitos, horarios, becas y aranceles, siempre disponibles en el chat.",
      },
      {
        title: "Agenda de visitas y pruebas",
        description:
          "Agenda recorridos, entrevistas o pruebas de nivel automáticamente.",
      },
      {
        title: "Seguimiento de postulantes",
        description:
          "Mantiene caliente al postulante con recordatorios de matrícula y documentación pendiente.",
      },
      {
        title: "Soporte a alumnos actuales",
        description:
          "Responde dudas de horarios, asistencia, certificados y plataforma virtual.",
      },
    ],
    exampleConversation: [
      { sender: "user", text: "Quiero información del curso de inglés" },
      {
        sender: "bot",
        text: "¡Hola! Tenemos cursos por nivel: básico, intermedio y avanzado. Modalidad presencial u online. ¿Qué te acomoda?",
      },
      { sender: "user", text: "Intermedio online" },
      {
        sender: "bot",
        text: "Perfecto. Empezamos un nuevo grupo el 5/6. ¿Te agendo una prueba de nivel gratis?",
      },
    ],
    templates: [
      "Catálogo de programas",
      "Agenda de pruebas y entrevistas",
      "Recordatorios de matrícula",
      "Soporte académico básico",
      "Encuesta de satisfacción",
    ],
    metrics: [
      { value: "+80%", label: "Tiempo respuesta vs antes" },
      { value: "+25%", label: "Conversión a matrícula" },
      { value: "100%", label: "Consultas trazables" },
    ],
    recommendedPlan: { name: "Pro", price: "$19.990 / mes", href: "/register?plan=basic" },
    testimonial: {
      quote:
        "En matrícula recibimos 10x más consultas. Cappta nos ordenó el caos y subimos las inscripciones.",
      author: "Patricia L.",
      role: "Directora, Instituto Idiomas",
    },
  },
  automotriz: {
    slug: "automotriz",
    name: "Automotriz y Talleres",
    emoji: "🚗",
    Icon: Car,
    hero: {
      eyebrow: "CAPPTA PARA AUTOMOTRIZ",
      title: "Cotiza, agenda servicios y hace seguimiento a clientes 24/7",
      subtitle:
        "Concesionarias, talleres mecánicos y venta de repuestos: Cappta AI cotiza, agenda servicios y reactiva clientes que no agendaron.",
    },
    pains: [
      "Cotizaciones que se demoran y el cliente compra en la competencia",
      "Llamadas para agendar servicios que nadie alcanza a contestar",
      "Seguimiento manual a leads tibios",
      "Recordatorios de mantenimiento que no se hacen",
    ],
    solutions: [
      { title: "Cotización inmediata", description: "Modelo, año y kilometraje en el chat — entrega cotización al instante." },
      { title: "Agenda de servicios", description: "Reserva cambios de aceite, revisión técnica y mantenciones automáticamente." },
      { title: "Reactivación inteligente", description: "Avisa al cliente cuando le toca mantención según el histórico." },
      { title: "Catálogo de repuestos", description: "Busca repuestos por modelo y patente, muestra disponibilidad y precio." },
    ],
    exampleConversation: [
      { sender: "user", text: "Necesito cambio de aceite para mi auto" },
      { sender: "bot", text: "¡Hola! ¿Marca, modelo y año? Te cotizo al tiro." },
      { sender: "user", text: "Toyota Yaris 2019" },
      { sender: "bot", text: "Perfecto. Cambio de aceite + filtro: $45.000. Tengo cupos jueves 10:00 o viernes 15:00. ¿Cuál te acomoda?" },
    ],
    templates: [
      "Cotizador de servicios",
      "Agenda de mantenciones",
      "Catálogo de repuestos",
      "Recordatorio de revisión técnica",
      "Encuesta post-servicio",
    ],
    metrics: [
      { value: "+40%", label: "Conversión de cotizaciones" },
      { value: "3x", label: "Servicios agendados" },
      { value: "60%", label: "Recompra anual" },
    ],
    recommendedPlan: { name: "Pro", price: "$19.990 / mes", href: "/register?plan=basic" },
    testimonial: {
      quote: "Bajamos el tiempo de respuesta a cotizaciones de 2 horas a 30 segundos. Cerramos 40% más servicios.",
      author: "Diego F.",
      role: "Dueño, Taller Pro",
    },
  },
  turismo: {
    slug: "turismo",
    name: "Turismo y Hotelería",
    emoji: "✈️",
    Icon: Plane,
    hero: {
      eyebrow: "CAPPTA PARA TURISMO",
      title: "Reservas, tours y check-ins automáticos por WhatsApp",
      subtitle:
        "Hoteles, tour operadores, hostales y agencias: Cappta AI cotiza paquetes, toma reservas y atiende huéspedes 24/7 en español, inglés o portugués.",
    },
    pains: [
      "Consultas de reserva fuera de horario que se pierden",
      "Atender en varios idiomas sin contratar más staff",
      "Check-in y FAQ del hotel manuales",
      "Pasajeros que cancelan por falta de información",
    ],
    solutions: [
      { title: "Cotizador multi-idioma", description: "Atiende en español, inglés y portugués sin contratar a nadie más." },
      { title: "Reservas en el chat", description: "Disponibilidad, precios y reserva con seña — todo en la conversación." },
      { title: "Asistente de huésped", description: "Responde sobre desayuno, WiFi, late check-out y servicios sin molestar a recepción." },
      { title: "Upsell automático", description: "Ofrece tours, traslados y experiencias según el perfil del huésped." },
    ],
    exampleConversation: [
      { sender: "user", text: "Hi, do you have a room for 2 from May 5 to 8?" },
      { sender: "bot", text: "Hello! Yes, we have a Double Room at $85.000 CLP/night. Breakfast included. Want me to confirm with a 30% deposit?" },
      { sender: "user", text: "Yes please" },
      { sender: "bot", text: "Perfect. I'll send the payment link now. After that I'll confirm your reservation." },
    ],
    templates: [
      "Cotizador de hospedaje multi-idioma",
      "Reservas con seña",
      "FAQ del hotel/tour",
      "Upsell de tours y traslados",
      "Encuesta post-estadía",
    ],
    metrics: [
      { value: "+55%", label: "Reservas directas" },
      { value: "3 idiomas", label: "Atención simultánea" },
      { value: "24/7", label: "Disponibilidad" },
    ],
    recommendedPlan: { name: "Scale", price: "$49.990 / mes", href: "/register?plan=scale" },
    testimonial: {
      quote: "Empezamos a recibir reservas de gringos a las 3 AM. El bot las cierra y yo amanezco con la plata en la cuenta.",
      author: "Camila O.",
      role: "Dueña, Hostel Patagonia",
    },
  },
  veterinarias: {
    slug: "veterinarias",
    name: "Veterinarias y Pet Shops",
    emoji: "🐾",
    Icon: PawPrint,
    hero: {
      eyebrow: "CAPPTA PARA VETERINARIAS",
      title: "Agenda consultas, vacunas y baños sin descuidar tus pacientes",
      subtitle:
        "Veterinarias, peluquerías caninas y pet shops: Cappta AI agenda controles, recuerda vacunas y vende productos por chat.",
    },
    pains: [
      "Llamadas constantes para agendar mientras atiendes pacientes",
      "Olvidos de vacunas y desparasitaciones",
      "Consultas de productos que demoran en responderse",
      "Clientes que se pierden entre control y control",
    ],
    solutions: [
      { title: "Agenda por especie y servicio", description: "Distingue consulta, vacuna, baño o cirugía y agenda con el profesional correcto." },
      { title: "Recordatorios automáticos", description: "Avisa cuando toca vacuna, desparasitación o control según historial de la mascota." },
      { title: "Venta de productos", description: "Catálogo de alimentos, medicamentos y accesorios con cotización en el chat." },
      { title: "Triage inicial", description: "Pregunta síntomas y deriva: urgencia, control de rutina o consejo telefónico." },
    ],
    exampleConversation: [
      { sender: "user", text: "Mi perrita está vomitando" },
      { sender: "bot", text: "Lo siento. ¿Cuántas veces vomitó hoy y desde cuándo? ¿Come y toma agua?" },
      { sender: "user", text: "3 veces hoy, no quiere comer" },
      { sender: "bot", text: "Te recomiendo traerla. Tengo cupo con la Dra. Martínez hoy 18:30 o mañana 10:00. ¿Cuál te sirve?" },
    ],
    templates: [
      "Agenda médica veterinaria",
      "Recordatorio de vacunas",
      "Catálogo de productos",
      "Triage de síntomas",
      "Encuesta post-consulta",
    ],
    metrics: [
      { value: "+70%", label: "Adherencia a vacunas" },
      { value: "+30%", label: "Venta cruzada" },
      { value: "5x", label: "Productividad recepción" },
    ],
    recommendedPlan: { name: "Pro", price: "$19.990 / mes", href: "/register?plan=basic" },
    testimonial: {
      quote: "Antes perdíamos clientes entre vacuna y vacuna. Ahora el bot avisa solito y suben en consulta.",
      author: "Dra. Andrea C.",
      role: "Veterinaria Mascota Feliz",
    },
  },
  construccion: {
    slug: "construccion",
    name: "Construcción y Ferreterías",
    emoji: "🔧",
    Icon: Wrench,
    hero: {
      eyebrow: "CAPPTA PARA CONSTRUCCIÓN",
      title: "Cotiza materiales, agenda visitas y atiende obras 24/7",
      subtitle:
        "Ferreterías, constructoras, contratistas y proveedores de materiales: Cappta AI cotiza, atiende pedidos y coordina entregas.",
    },
    pains: [
      "Cotizaciones de materiales que demoran días",
      "Pedidos por WhatsApp desordenados sin seguimiento",
      "Visita a terreno difícil de coordinar",
      "Stock que cambia y nadie sabe qué hay",
    ],
    solutions: [
      { title: "Cotizador de materiales", description: "Lista de materiales en el chat — entrega cotización detallada con totales." },
      { title: "Toma de pedidos B2B", description: "Recibe orden de compra estructurada, calcula despacho y confirma fecha." },
      { title: "Coordinación de visita técnica", description: "Agenda visitas a terreno con dirección, contacto y tipo de obra." },
      { title: "Catálogo con stock", description: "Consulta disponibilidad, precio y alternativa si está agotado." },
    ],
    exampleConversation: [
      { sender: "user", text: "Necesito cotizar 50 sacos de cemento y 200 ladrillos" },
      { sender: "bot", text: "Perfecto. ¿Para entrega o retiro? ¿Comuna de despacho?" },
      { sender: "user", text: "Entrega en Maipú" },
      { sender: "bot", text: "50 sacos cemento $190.000 + 200 ladrillos $48.000 + despacho Maipú $25.000 = $263.000. ¿Confirmas pedido?" },
    ],
    templates: [
      "Cotizador de materiales",
      "Pedidos B2B",
      "Agenda de visitas técnicas",
      "Catálogo con stock",
      "Seguimiento de despacho",
    ],
    metrics: [
      { value: "-90%", label: "Tiempo cotización" },
      { value: "+35%", label: "Pedidos cerrados" },
      { value: "0", label: "Pedidos perdidos" },
    ],
    recommendedPlan: { name: "Scale", price: "$49.990 / mes", href: "/register?plan=scale" },
    testimonial: {
      quote: "Antes una cotización tomaba 2 días. Ahora son 30 segundos y cerramos el doble de pedidos.",
      author: "Roberto V.",
      role: "Gerente, Ferretería Industrial",
    },
  },
};

interface VerticalPageProps {
  vertical: string;
}

export default function VerticalPage({ vertical }: VerticalPageProps) {
  const config = useMemo(() => VERTICALS[vertical] ?? null, [vertical]);

  useEffect(() => {
    if (config) {
      document.title = `Cappta AI para ${config.name} | Chatbot IA + WhatsApp`;
      const meta =
        document.querySelector('meta[name="description"]') ||
        document.head.appendChild(Object.assign(document.createElement("meta"), { name: "description" }));
      meta.setAttribute(
        "content",
        `${config.hero.subtitle} Plantilla lista para ${config.name.toLowerCase()}.`,
      );
    }
  }, [config]);

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030308] text-white">
        <div className="text-center">
          <p className="text-lg mb-4">Vertical no encontrado</p>
          <a href="/" className="text-violet-400 underline">
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  const { Icon } = config;

  return (
    <div className="min-h-screen bg-[#030308] text-white" data-testid={`page-vertical-${config.slug}`}>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#030308]/80 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2" data-testid="link-home">
            <CapptaLogo className="h-7 w-auto" />
          </a>
          <div className="flex items-center gap-3">
            <a href="/comparar" className="hidden sm:block text-sm text-white/60 hover:text-white" data-testid="link-compare">
              Cappta vs Vambe
            </a>
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

      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(118,105,233,0.12) 0%, transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 mb-8">
            <Icon className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-bold text-violet-300 tracking-wider uppercase">{config.hero.eyebrow}</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.02em] leading-tight mb-6" data-testid="text-vertical-title">
            {config.hero.title}
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed mb-10">
            {config.hero.subtitle}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href={config.recommendedPlan.href}>
              <Button size="lg" className="bg-violet-600 hover:bg-violet-500 text-base px-8 py-6 rounded-2xl font-bold" data-testid="button-vertical-cta-primary">
                <Sparkles className="w-4 h-4 mr-2" />
                Empezar con {config.recommendedPlan.name}
              </Button>
            </a>
            <a href="/demo">
              <Button variant="outline" size="lg" className="text-base px-8 py-6 rounded-2xl border-white/10" data-testid="button-vertical-cta-secondary">
                Ver demo en vivo
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {config.metrics.map((m) => (
            <div key={m.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-center" data-testid={`stat-${m.label}`}>
              <p className="text-4xl sm:text-5xl font-black text-violet-400 mb-2">{m.value}</p>
              <p className="text-sm text-white/60">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-6 bg-white/[0.01] border-y border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-white/40 tracking-[0.2em] uppercase mb-3 text-center">EL PROBLEMA</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-center mb-12">
            ¿Te suena familiar?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {config.pains.map((pain) => (
              <div key={pain} className="rounded-xl border border-red-500/15 bg-red-500/[0.03] p-5 flex items-start gap-3" data-testid={`pain-${pain.substring(0, 20)}`}>
                <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-red-400 font-bold">!</span>
                </div>
                <p className="text-white/80 leading-relaxed">{pain}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold text-white/40 tracking-[0.2em] uppercase mb-3 text-center">LA SOLUCIÓN</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-center mb-12">
            Cómo Cappta resuelve esto en {config.name.toLowerCase()}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {config.solutions.map((sol, i) => (
              <div key={sol.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 hover:border-violet-500/30 transition-colors" data-testid={`solution-${i}`}>
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center mb-4">
                  <Check className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="font-heading text-xl font-bold mb-2">{sol.title}</h3>
                <p className="text-white/60 leading-relaxed">{sol.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-white/[0.01] border-y border-white/[0.04]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold text-white/40 tracking-[0.2em] uppercase mb-3">EJEMPLO REAL</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-6">
              Así conversa Cappta con tus clientes
            </h2>
            <p className="text-white/70 mb-6 leading-relaxed">
              Tono natural, respuestas precisas y tiempos de reacción de segundos.
              Pegado a la marca y al estilo de tu negocio.
            </p>
            <div className="flex items-center gap-4 text-sm text-white/50">
              <div className="flex items-center gap-2">
                <SiWhatsapp className="w-4 h-4 text-green-400" />
                <span>WhatsApp</span>
              </div>
              <div className="flex items-center gap-2">
                <SiInstagram className="w-4 h-4 text-pink-400" />
                <span>Instagram</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>Web widget</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c12] p-5 space-y-3">
            {config.exampleConversation.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.sender === "user" ? "bg-violet-600 text-white rounded-br-sm" : "bg-white/[0.06] text-white/85 rounded-bl-sm"}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-white/40 tracking-[0.2em] uppercase mb-3 text-center">LISTO EN 5 MINUTOS</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-center mb-12">
            Plantilla pre-cargada para {config.name.toLowerCase()}
          </h2>
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.03] p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {config.templates.map((t) => (
                <div key={t} className="flex items-center gap-3" data-testid={`template-${t.substring(0, 20)}`}>
                  <Check className="w-4 h-4 text-violet-400 shrink-0" />
                  <span className="text-white/80">{t}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-white/50 mt-6 leading-relaxed">
              Lo activas, importas tu información y la IA está lista para atender. Personaliza colores, mensajes y horarios cuando quieras.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-white/[0.01] border-y border-white/[0.04]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-6xl mb-6">{config.emoji}</div>
          <p className="text-2xl sm:text-3xl font-medium leading-relaxed mb-6 text-white/90">
            "{config.testimonial.quote}"
          </p>
          <p className="font-bold text-white">{config.testimonial.author}</p>
          <p className="text-sm text-white/50">{config.testimonial.role}</p>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-600/15 to-violet-900/5 p-10 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
            Empieza con el plan {config.recommendedPlan.name}
          </h2>
          <p className="text-white/70 mb-2">Recomendado para {config.name.toLowerCase()}</p>
          <p className="text-5xl font-black text-violet-400 mb-8">{config.recommendedPlan.price}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href={config.recommendedPlan.href}>
              <Button size="lg" className="bg-violet-600 hover:bg-violet-500 text-base px-8 py-6 rounded-2xl font-bold" data-testid="button-vertical-final-cta">
                Empezar ahora
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
            <a href="/#pricing">
              <Button variant="outline" size="lg" className="text-base px-8 py-6 rounded-2xl border-white/10" data-testid="button-see-plans">
                Ver todos los planes
              </Button>
            </a>
          </div>
          <p className="text-xs text-white/40 mt-6">Sin permanencia · Cancela cuando quieras · Soporte humano</p>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-white/40 mb-4">Otras industrias que usan Cappta</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {Object.values(VERTICALS)
              .filter((v) => v.slug !== config.slug)
              .map((v) => (
                <a
                  key={v.slug}
                  href={`/para/${v.slug}`}
                  className="px-3 py-1.5 rounded-full border border-white/10 text-sm text-white/60 hover:border-violet-500/30 hover:text-violet-300 transition-colors"
                  data-testid={`link-other-${v.slug}`}
                >
                  {v.emoji} {v.name}
                </a>
              ))}
          </div>
          <p className="text-xs text-white/30 mt-8">© Cappta AI · La plataforma comercial con IA para todo tipo de empresa</p>
        </div>
      </footer>
    </div>
  );
}

export const VERTICAL_LIST = Object.values(VERTICALS).map((v) => ({
  slug: v.slug,
  name: v.name,
  emoji: v.emoji,
  Icon: v.Icon,
  shortDescription: v.hero.subtitle,
}));
