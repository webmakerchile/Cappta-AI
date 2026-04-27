import { db } from "./db";
import { messages, industryTemplates } from "@shared/schema";
import { sql } from "drizzle-orm";
import { log } from "./index";
import fs from "fs";
import path from "path";

async function applyMigrations() {
  try {
    const migrationsDir = path.resolve(process.cwd(), "migrations");
    if (!fs.existsSync(migrationsDir)) return;
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();
    for (const file of files) {
      const content = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
      // Strip line-comments first (-- ...) so they don't break statement splits
      const stripped = content
        .split(/\r?\n/)
        .map(l => l.replace(/--.*$/, ""))
        .join("\n");
      const statements = stripped
        .split(/;\s*(?:\n|$)/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      for (const stmt of statements) {
        try {
          await db.execute(sql.raw(stmt));
        } catch (err: any) {
          if (!/already exists|duplicate|exists, skipping/i.test(err.message || "")) {
            log(`Migration warn (${file}): ${err.message?.substring(0, 200)}`, "seed");
          }
        }
      }
    }
    log("Migrations applied", "seed");
  } catch (error: any) {
    log(`Migration error: ${error.message}`, "seed");
  }
}

const INDUSTRY_TEMPLATES_DATA = [
  {
    slug: "restaurante",
    name: "Restaurante",
    description: "Reservas, menú, delivery y atención de clientes",
    icon: "UtensilsCrossed",
    emoji: "🍽️",
    color: "#F97316",
    sortOrder: 1,
    welcomeMessage: "¡Hola! 🍽️ Bienvenido. ¿Querés ver el menú, reservar mesa o pedir delivery?",
    welcomeSubtitle: "Te respondemos en segundos.",
    botContext: "Eres el asistente virtual de un restaurante. Ayudas con reservas (consultando fecha, hora y cantidad de personas), explicas el menú y opciones para celíacos/vegetarianos, gestionas pedidos para delivery o retiro y derivas a un humano si la consulta es compleja. Sé cordial, breve y siempre ofrece próximos pasos concretos.",
    cannedResponses: JSON.stringify([
      { shortcut: "/menu", content: "Te paso el menú del día. ¿Querés algún plato en particular?" },
      { shortcut: "/reserva", content: "¡Genial! Para reservar necesito: fecha, hora y cantidad de personas." },
      { shortcut: "/delivery", content: "Hacemos delivery en estas zonas: [zonas]. ¿Querés que te tome el pedido?" },
      { shortcut: "/horario", content: "Atendemos de martes a domingo, de 12 a 16h y 20 a 23:30h." },
    ]),
    knowledgeEntries: JSON.stringify([
      { question: "¿Hacen delivery?", answer: "Sí, hacemos delivery dentro de un radio de 5km. El tiempo estimado es 30-45 minutos.", category: "general" },
      { question: "¿Tienen opciones sin gluten?", answer: "Tenemos varias opciones sin gluten marcadas en el menú. Avisanos siempre al ordenar para evitar contaminación cruzada.", category: "faq" },
      { question: "¿Aceptan reservas?", answer: "Sí, aceptamos reservas con al menos 2 horas de anticipación. Para grupos de más de 8 personas, mejor con 24hs.", category: "faq" },
    ]),
    suggestedTags: JSON.stringify(["reserva", "delivery", "menu", "consulta", "queja"]),
    consultationOptions: JSON.stringify(["Reservar mesa", "Ver menú", "Pedir delivery", "Hablar con un humano"]),
  },
  {
    slug: "peluqueria",
    name: "Peluquería / Barbería",
    description: "Turnos online, servicios y precios",
    icon: "Scissors",
    emoji: "💇",
    color: "#EC4899",
    sortOrder: 2,
    welcomeMessage: "¡Hola! 💇 ¿Te ayudo a sacar un turno?",
    welcomeSubtitle: "Reservá en menos de un minuto.",
    botContext: "Eres el asistente de una peluquería. Ayudas a sacar turnos preguntando: servicio (corte, color, alisado, barba), profesional preferido, fecha y horario. Informas precios y duración estimada. Si el horario está ocupado, ofreces alternativas cercanas. Eres cálido y profesional.",
    cannedResponses: JSON.stringify([
      { shortcut: "/turno", content: "¡Genial! ¿Qué servicio querés y para qué día?" },
      { shortcut: "/precios", content: "Te paso la lista de precios actualizada." },
      { shortcut: "/cancelar", content: "Para cancelar tu turno necesito tu nombre y la fecha reservada." },
    ]),
    knowledgeEntries: JSON.stringify([
      { question: "¿Cuánto sale un corte?", answer: "Corte de dama desde $X, caballero desde $Y. Color y alisado tienen precios variables según el largo.", category: "faq" },
      { question: "¿Cuánto dura el servicio?", answer: "Corte: 45 min. Color: 1h30. Alisado: 2-3h. Te recomendamos llegar 5 min antes.", category: "faq" },
    ]),
    suggestedTags: JSON.stringify(["turno", "consulta", "cancelacion", "precios"]),
    consultationOptions: JSON.stringify(["Sacar turno", "Ver precios", "Modificar turno", "Hablar con un humano"]),
  },
  {
    slug: "inmobiliaria",
    name: "Inmobiliaria",
    description: "Propiedades, visitas y leads calificados",
    icon: "Home",
    emoji: "🏠",
    color: "#0EA5E9",
    sortOrder: 3,
    welcomeMessage: "¡Hola! 🏠 ¿Buscás alquilar, comprar o vender?",
    welcomeSubtitle: "Te ayudo a encontrar lo que necesitas.",
    botContext: "Eres el asistente de una inmobiliaria. Calificas leads preguntando: operación (alquilar/comprar/vender), zona, ambientes, presupuesto, plazo. Si el lead está calificado, agendas una visita o derivas a un asesor humano. Sé profesional, claro y siempre pide datos de contacto.",
    cannedResponses: JSON.stringify([
      { shortcut: "/visita", content: "¡Perfecto! ¿Qué propiedad te interesa y para qué día?" },
      { shortcut: "/tasacion", content: "Para tasar tu propiedad necesito: dirección, m², ambientes y antigüedad." },
      { shortcut: "/asesor", content: "Te derivo con un asesor en breve." },
    ]),
    knowledgeEntries: JSON.stringify([
      { question: "¿Qué documentos necesito para alquilar?", answer: "Generalmente: DNI, recibos de sueldo (últimos 3) y garantía propietaria o seguro de caución.", category: "policy" },
      { question: "¿Cobran comisión?", answer: "La comisión varía según operación y monto. Te lo informa el asesor en la visita.", category: "faq" },
    ]),
    suggestedTags: JSON.stringify(["lead", "visita", "alquiler", "venta", "tasacion", "calificado"]),
    consultationOptions: JSON.stringify(["Ver propiedades", "Agendar visita", "Tasar mi propiedad", "Hablar con un asesor"]),
  },
  {
    slug: "ecommerce",
    name: "E-commerce",
    description: "Productos, envíos, pagos y postventa",
    icon: "ShoppingCart",
    emoji: "🛒",
    color: "#10B981",
    sortOrder: 4,
    welcomeMessage: "¡Hola! 🛒 ¿En qué te puedo ayudar con tu compra?",
    welcomeSubtitle: "Estamos para ayudarte 24/7.",
    botContext: "Eres el asistente de una tienda online. Ayudas a buscar productos, informas stock, envíos (zonas y costos), formas de pago, estado de pedidos (pidiendo el número) y políticas de cambio. Sé conciso y siempre confirma datos antes de cerrar.",
    cannedResponses: JSON.stringify([
      { shortcut: "/pedido", content: "Pasame tu número de pedido y te cuento el estado." },
      { shortcut: "/envio", content: "Hacemos envíos a todo el país. Llega entre 3-7 días hábiles." },
      { shortcut: "/cambio", content: "Tenés 10 días para cambios. Necesito el número de pedido para iniciarlo." },
    ]),
    knowledgeEntries: JSON.stringify([
      { question: "¿Cuánto demora el envío?", answer: "AMBA: 24-48hs. Resto del país: 3-7 días hábiles. Recibís el código de seguimiento por mail.", category: "faq" },
      { question: "¿Qué formas de pago aceptan?", answer: "Tarjetas de crédito y débito, MercadoPago, transferencia y efectivo en sucursal.", category: "faq" },
      { question: "¿Puedo cambiar el producto?", answer: "Sí, tenés 10 días corridos desde la recepción. El producto debe estar sin uso y con el packaging original.", category: "policy" },
    ]),
    suggestedTags: JSON.stringify(["pedido", "envio", "cambio", "consulta", "queja", "venta"]),
    consultationOptions: JSON.stringify(["Estado de mi pedido", "Consultar producto", "Cambios y devoluciones", "Hablar con un humano"]),
  },
  {
    slug: "clinica",
    name: "Clínica / Consultorio médico",
    description: "Turnos, especialidades y obras sociales",
    icon: "Stethoscope",
    emoji: "⚕️",
    color: "#06B6D4",
    sortOrder: 5,
    welcomeMessage: "¡Hola! ⚕️ ¿Te ayudo a sacar un turno?",
    welcomeSubtitle: "Atendemos consultas médicas y agenda.",
    botContext: "Eres el asistente de una clínica. Ayudas a sacar turnos preguntando: especialidad, profesional, obra social/prepaga, fecha. Brindas información sobre estudios, requisitos y horarios. NUNCA das diagnósticos médicos. Si la consulta es médica, derivas a un humano.",
    cannedResponses: JSON.stringify([
      { shortcut: "/turno", content: "Para sacar un turno necesito: especialidad y obra social." },
      { shortcut: "/obras", content: "Atendemos: OSDE, Swiss Medical, Galeno, Medicus, IOMA y particulares." },
      { shortcut: "/urgencia", content: "Si es una urgencia, llamá al 107 o acudí al hospital más cercano." },
    ]),
    knowledgeEntries: JSON.stringify([
      { question: "¿Qué obras sociales atienden?", answer: "OSDE, Swiss Medical, Galeno, Medicus, IOMA y particulares. Consultá tu plan al sacar turno.", category: "faq" },
      { question: "¿Necesito orden médica?", answer: "Para estudios sí. Para consulta con especialista, depende de la obra social. Consultá con tu plan.", category: "faq" },
    ]),
    suggestedTags: JSON.stringify(["turno", "consulta", "obra-social", "estudios", "urgencia"]),
    consultationOptions: JSON.stringify(["Sacar turno", "Consultar estudios", "Obras sociales", "Hablar con secretaría"]),
  },
  {
    slug: "gimnasio",
    name: "Gimnasio / Estudio",
    description: "Membresías, clases y profesores",
    icon: "Dumbbell",
    emoji: "🏋️",
    color: "#EF4444",
    sortOrder: 6,
    welcomeMessage: "¡Hola! 🏋️ ¿Querés sumarte a entrenar con nosotros?",
    welcomeSubtitle: "Probá tu primera clase gratis.",
    botContext: "Eres el asistente de un gimnasio. Ofreces planes de membresía, horarios de clases (funcional, yoga, pilates, etc), instructor y precios. Captas leads para clase de prueba pidiendo nombre, teléfono y objetivo. Sé motivador y claro.",
    cannedResponses: JSON.stringify([
      { shortcut: "/prueba", content: "¡Te invitamos a una clase gratis! Pasame tu nombre y teléfono." },
      { shortcut: "/precios", content: "Tenemos planes mensuales, trimestrales y anuales con descuento. Te paso detalles." },
      { shortcut: "/horarios", content: "Te paso la grilla de clases de la semana." },
    ]),
    knowledgeEntries: JSON.stringify([
      { question: "¿Cuánto sale la cuota?", answer: "Plan mensual desde $X. Trimestral 10% off. Anual 20% off. Incluye todas las clases.", category: "faq" },
      { question: "¿Hay clase de prueba?", answer: "Sí, tu primera clase es gratis. Solo necesitás reservar previamente.", category: "faq" },
    ]),
    suggestedTags: JSON.stringify(["lead", "prueba", "membresia", "consulta", "clases"]),
    consultationOptions: JSON.stringify(["Clase de prueba", "Ver planes", "Horarios y clases", "Hablar con un asesor"]),
  },
  {
    slug: "abogado",
    name: "Abogado / Estudio jurídico",
    description: "Consultas legales y agenda de reuniones",
    icon: "Scale",
    emoji: "⚖️",
    color: "#6366F1",
    sortOrder: 7,
    welcomeMessage: "Buenas, soy el asistente del estudio. ¿En qué te puedo ayudar?",
    welcomeSubtitle: "Atención cordial y profesional.",
    botContext: "Eres el asistente de un estudio jurídico. Calificas consultas preguntando el tipo de caso (laboral, civil, familia, comercial), urgencia y datos de contacto. NUNCA das asesoramiento legal específico. Agendas una primera reunión con el abogado correspondiente. Tono formal pero cercano.",
    cannedResponses: JSON.stringify([
      { shortcut: "/consulta", content: "Contame brevemente tu caso así te derivo con el abogado correcto." },
      { shortcut: "/reunion", content: "Para agendar una reunión necesito: tu nombre, teléfono y disponibilidad horaria." },
      { shortcut: "/honorarios", content: "Los honorarios se conversan en la primera entrevista, sin costo." },
    ]),
    knowledgeEntries: JSON.stringify([
      { question: "¿La primera consulta es paga?", answer: "La primera entrevista es sin cargo. Allí evaluamos el caso y conversamos los honorarios.", category: "policy" },
      { question: "¿Qué materias atienden?", answer: "Derecho laboral, civil, de familia, sucesiones y comercial.", category: "faq" },
    ]),
    suggestedTags: JSON.stringify(["consulta", "reunion", "laboral", "familia", "lead"]),
    consultationOptions: JSON.stringify(["Hacer una consulta", "Agendar reunión", "Honorarios", "Hablar con el abogado"]),
  },
  {
    slug: "agencia-digital",
    name: "Agencia digital / Marketing",
    description: "Servicios, presupuestos y captación de leads",
    icon: "Megaphone",
    emoji: "📈",
    color: "#A855F7",
    sortOrder: 8,
    welcomeMessage: "¡Hola! 📈 ¿Querés llevar tu marca al siguiente nivel?",
    welcomeSubtitle: "Te contamos cómo te podemos ayudar.",
    botContext: "Eres el asistente de una agencia de marketing digital. Ofreces servicios (SEO, SEM, redes sociales, web, branding, performance). Calificas leads preguntando: rubro, objetivo, presupuesto mensual y plazo. Agendas reunión con el equipo comercial.",
    cannedResponses: JSON.stringify([
      { shortcut: "/servicios", content: "Hacemos: gestión de redes, ads en Meta/Google, SEO, sitios web y branding." },
      { shortcut: "/presupuesto", content: "Para armar un presupuesto necesito: rubro, objetivo y presupuesto aprox mensual." },
      { shortcut: "/casos", content: "Te paso casos de éxito de clientes en tu rubro." },
    ]),
    knowledgeEntries: JSON.stringify([
      { question: "¿Cuánto cuesta gestionar redes?", answer: "Depende del alcance: desde $X/mes para 1 red hasta planes integrales con ads.", category: "faq" },
      { question: "¿Trabajan con marcas pequeñas?", answer: "Sí, tenemos planes para emprendedores, pymes y empresas grandes.", category: "faq" },
    ]),
    suggestedTags: JSON.stringify(["lead", "presupuesto", "consulta", "calificado", "redes", "ads"]),
    consultationOptions: JSON.stringify(["Pedir presupuesto", "Ver servicios", "Casos de éxito", "Hablar con un asesor"]),
  },
  {
    slug: "hotel",
    name: "Hotel / Hospedaje",
    description: "Reservas, disponibilidad y servicios",
    icon: "BedDouble",
    emoji: "🏨",
    color: "#0284C7",
    sortOrder: 9,
    welcomeMessage: "¡Bienvenido! 🏨 ¿Te ayudo a reservar?",
    welcomeSubtitle: "Disponibilidad y tarifas en el momento.",
    botContext: "Eres el asistente de un hotel. Ayudas a reservar preguntando: fechas de check-in/out, cantidad de personas, tipo de habitación. Informas servicios (desayuno, spa, pileta, wifi), tarifas y políticas de cancelación. Tono cordial y profesional.",
    cannedResponses: JSON.stringify([
      { shortcut: "/reserva", content: "Para reservar necesito: fechas, cantidad de personas y tipo de habitación." },
      { shortcut: "/servicios", content: "Tenemos desayuno buffet, pileta climatizada, spa y wifi gratuito." },
      { shortcut: "/cancelacion", content: "Cancelación gratuita hasta 48hs antes del check-in." },
    ]),
    knowledgeEntries: JSON.stringify([
      { question: "¿Incluye desayuno?", answer: "Sí, todas las tarifas incluyen desayuno buffet de 7 a 10:30h.", category: "faq" },
      { question: "¿Aceptan mascotas?", answer: "Aceptamos mascotas pequeñas con un cargo adicional. Avisanos al reservar.", category: "policy" },
    ]),
    suggestedTags: JSON.stringify(["reserva", "consulta", "cancelacion", "grupo"]),
    consultationOptions: JSON.stringify(["Reservar habitación", "Ver tarifas", "Servicios", "Hablar con recepción"]),
  },
  {
    slug: "escuela",
    name: "Escuela / Academia",
    description: "Inscripciones, cursos y aranceles",
    icon: "GraduationCap",
    emoji: "🎓",
    color: "#F59E0B",
    sortOrder: 10,
    welcomeMessage: "¡Hola! 🎓 ¿Te interesa un curso o programa?",
    welcomeSubtitle: "Te respondemos en el día.",
    botContext: "Eres el asistente de una escuela/academia. Informas sobre cursos disponibles, modalidad (presencial/online), duración, aranceles y formas de pago. Captas leads pidiendo nombre, teléfono y curso de interés. Coordinas charla informativa con coordinación.",
    cannedResponses: JSON.stringify([
      { shortcut: "/inscripcion", content: "Pasame tu nombre, teléfono y el curso que te interesa para iniciar la inscripción." },
      { shortcut: "/cursos", content: "Te paso el listado de cursos disponibles este cuatrimestre." },
      { shortcut: "/becas", content: "Tenemos becas y planes de pago. Te derivo con coordinación." },
    ]),
    knowledgeEntries: JSON.stringify([
      { question: "¿Cuánto sale la cuota?", answer: "Varía según el curso. Te paso el detalle de la carrera que te interesa.", category: "faq" },
      { question: "¿Hay clases online?", answer: "Sí, ofrecemos modalidad presencial, online y semipresencial.", category: "faq" },
    ]),
    suggestedTags: JSON.stringify(["lead", "inscripcion", "consulta", "becas", "calificado"]),
    consultationOptions: JSON.stringify(["Inscribirme", "Ver cursos", "Becas y financiación", "Hablar con coordinación"]),
  },
  {
    slug: "automotriz",
    name: "Automotriz / Taller",
    description: "Service, repuestos, turnos y presupuestos",
    icon: "Car",
    emoji: "🚗",
    color: "#64748B",
    sortOrder: 11,
    welcomeMessage: "¡Hola! 🚗 ¿Necesitás un service, repuesto o presupuesto?",
    welcomeSubtitle: "Te respondemos rápido.",
    botContext: "Eres el asistente de un taller mecánico/automotriz. Tomas pedidos de turno preguntando: marca, modelo, año, problema/service que necesita. Das presupuestos estimados aclarando que se confirma con revisión. Atendés consultas de repuestos.",
    cannedResponses: JSON.stringify([
      { shortcut: "/turno", content: "Para sacar un turno necesito: marca, modelo, año y qué necesitás." },
      { shortcut: "/service", content: "El service básico incluye cambio de aceite, filtros y revisión general." },
      { shortcut: "/repuesto", content: "Decime marca, modelo, año y qué repuesto necesitás para cotizarlo." },
    ]),
    knowledgeEntries: JSON.stringify([
      { question: "¿Cuánto sale un service?", answer: "El service básico arranca desde $X según modelo. Incluye aceite, filtros y revisión.", category: "faq" },
      { question: "¿Atienden todas las marcas?", answer: "Sí, atendemos todas las marcas. Para algunos modelos importados consultá primero.", category: "faq" },
    ]),
    suggestedTags: JSON.stringify(["turno", "presupuesto", "service", "repuesto", "garantia"]),
    consultationOptions: JSON.stringify(["Sacar turno", "Pedir presupuesto", "Consultar repuesto", "Hablar con el taller"]),
  },
  {
    slug: "servicios-profesionales",
    name: "Servicios profesionales",
    description: "Genérico para freelancers y consultores",
    icon: "Briefcase",
    emoji: "💼",
    color: "#7669E9",
    sortOrder: 12,
    welcomeMessage: "¡Hola! 💼 ¿En qué te puedo ayudar?",
    welcomeSubtitle: "Te respondemos a la brevedad.",
    botContext: "Eres el asistente virtual de un profesional/consultor. Atendés consultas, calificás leads pidiendo nombre, contacto y motivo, y agendás reuniones. Tono profesional y cercano. Sé conciso.",
    cannedResponses: JSON.stringify([
      { shortcut: "/contacto", content: "Pasame tu nombre, teléfono y motivo así te respondemos a la brevedad." },
      { shortcut: "/reunion", content: "Te puedo agendar una reunión. ¿Qué día y hora te queda cómodo?" },
      { shortcut: "/servicios", content: "Te paso un detalle de los servicios que ofrecemos." },
    ]),
    knowledgeEntries: JSON.stringify([
      { question: "¿Cómo trabajan?", answer: "Trabajamos por proyecto o por hora según el caso. Hacemos una primera reunión para entender tu necesidad.", category: "faq" },
      { question: "¿Hacen reuniones online?", answer: "Sí, hacemos reuniones presenciales y por Zoom/Meet.", category: "faq" },
    ]),
    suggestedTags: JSON.stringify(["lead", "consulta", "reunion", "presupuesto"]),
    consultationOptions: JSON.stringify(["Hacer una consulta", "Agendar reunión", "Ver servicios", "Hablar con el equipo"]),
  },
];

async function seedIndustryTemplates() {
  try {
    for (const tpl of INDUSTRY_TEMPLATES_DATA) {
      try {
        const existing = await db.select().from(industryTemplates).where(sql`slug = ${tpl.slug}`);
        if (existing.length === 0) {
          await db.insert(industryTemplates).values(tpl as any);
        } else {
          // Update non-destructively (refresh meta but don't kill custom edits — only if defaults)
          await db.update(industryTemplates).set({
            name: tpl.name,
            description: tpl.description,
            icon: tpl.icon,
            emoji: tpl.emoji,
            color: tpl.color,
            sortOrder: tpl.sortOrder,
          }).where(sql`slug = ${tpl.slug}`);
        }
      } catch (err: any) {
        log(`Template seed warn (${tpl.slug}): ${err.message}`, "seed");
      }
    }
    log(`Seeded ${INDUSTRY_TEMPLATES_DATA.length} industry templates`, "seed");
  } catch (error: any) {
    log(`Industry templates seed error: ${error.message}`, "seed");
  }
}

export async function seedDatabase() {
  try {
    await applyMigrations();

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_sessions_user_email ON sessions(user_email)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_sessions_last_message_at ON sessions(last_message_at DESC)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_messages_session_timestamp ON messages(session_id, timestamp DESC)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_contact_requests_email ON contact_requests(LOWER(user_email))`);

    await seedIndustryTemplates();

    const existing = await db.select({ count: sql<number>`count(*)` }).from(messages);
    if (Number(existing[0].count) > 0) {
      return;
    }

    const demoEmail = "demo@example.com";
    const now = new Date();

    const seedMessages = [
      {
        userEmail: demoEmail,
        userName: "Usuario Demo",
        sender: "user" as const,
        content: "Hola, necesito ayuda con la configuraci\u00f3n de mi cuenta.",
        timestamp: new Date(now.getTime() - 300000),
      },
      {
        userEmail: demoEmail,
        userName: "Soporte",
        sender: "support" as const,
        content: "\u00a1Hola! Con gusto te ayudo con tu cuenta. \u00bfQu\u00e9 cambios necesitas realizar?",
        timestamp: new Date(now.getTime() - 240000),
      },
      {
        userEmail: demoEmail,
        userName: "Usuario Demo",
        sender: "user" as const,
        content: "Quiero cambiar mis preferencias de notificaciones",
        timestamp: new Date(now.getTime() - 180000),
      },
      {
        userEmail: demoEmail,
        userName: "Soporte",
        sender: "support" as const,
        content: "\u00a1Claro! Puedes encontrar las preferencias de notificaci\u00f3n en Perfil > Preferencias > Notificaciones. Ah\u00ed puedes activar o desactivar correos, push y SMS individualmente.",
        timestamp: new Date(now.getTime() - 120000),
      },
    ];

    await db.insert(messages).values(seedMessages);
    log("Base de datos sembrada con mensajes demo", "seed");
  } catch (error: any) {
    log(`Error en seed: ${error.message}`, "seed");
  }
}
