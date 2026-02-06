import type { Express } from "express";
import { type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import { sendContactNotification } from "./email";
import { log } from "./index";
import { z } from "zod";

const socketMessageSchema = insertMessageSchema.extend({
  content: z.string().min(1).max(2000),
  userEmail: z.string().email().max(200),
  userName: z.string().min(1).max(100),
  sender: z.enum(["user", "support"]),
});

const contactSchema = z.object({
  userEmail: z.string().email(),
  userName: z.string().min(1),
  pageUrl: z.string().optional(),
  pageTitle: z.string().optional(),
});

interface UserSession {
  email: string;
  name: string;
  pageUrl?: string;
  pageTitle?: string;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
    cookie: false,
  });

  const userSessions = new Map<string, UserSession>();

  app.get("/api/messages/:email", async (req, res) => {
    try {
      const emailSchema = z.string().email();
      const parsed = emailSchema.safeParse(req.params.email);
      if (!parsed.success) {
        return res.status(400).json({ message: "Email inválido" });
      }
      const messages = await storage.getMessagesByEmail(parsed.data);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener mensajes" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const parsed = socketMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos de mensaje inválidos" });
      }

      const message = await storage.createMessage({
        userEmail: parsed.data.userEmail,
        userName: parsed.data.userName,
        sender: parsed.data.sender,
        content: parsed.data.content,
      });

      io.to(`user:${parsed.data.userEmail}`).emit("new_message", message);

      if (parsed.data.sender === "user") {
        const pageUrl = req.body.pageUrl || "";
        const pageTitle = req.body.pageTitle || "";
        setTimeout(async () => {
          try {
            const autoReply = await storage.createMessage({
              userEmail: parsed.data.userEmail,
              userName: "Soporte",
              sender: "support",
              content: getAutoReply(parsed.data.content, pageTitle, pageUrl),
            });
            io.to(`user:${parsed.data.userEmail}`).emit("new_message", autoReply);
          } catch (err: any) {
            log(`Error en auto-respuesta: ${err.message}`, "api");
          }
        }, 1500);
      }

      res.json(message);
    } catch (error: any) {
      log(`Error al guardar mensaje: ${error.message}`, "api");
      res.status(500).json({ message: "Error al enviar mensaje" });
    }
  });

  app.post("/api/contact-executive", async (req, res) => {
    try {
      const parsed = contactSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Datos inválidos" });
      }

      const recentMessages = await storage.getMessagesByEmail(parsed.data.userEmail);
      const lastMessages = recentMessages.slice(-10);
      const chatSummary = lastMessages
        .map((m) => `${m.sender === "user" ? parsed.data.userName : "Soporte"}: ${m.content}`)
        .join("\n");

      const contactRequest = await storage.createContactRequest({
        userEmail: parsed.data.userEmail,
        userName: parsed.data.userName,
        pageUrl: parsed.data.pageUrl || null,
        pageTitle: parsed.data.pageTitle || null,
        chatSummary: chatSummary || null,
      });

      const emailSent = await sendContactNotification({
        userName: parsed.data.userName,
        userEmail: parsed.data.userEmail,
        pageUrl: parsed.data.pageUrl,
        pageTitle: parsed.data.pageTitle,
        chatSummary,
      });

      const confirmMsg = await storage.createMessage({
        userEmail: parsed.data.userEmail,
        userName: "Soporte",
        sender: "support",
        content: emailSent
          ? "Tu solicitud ha sido enviada. Un ejecutivo se pondrá en contacto contigo por correo electrónico lo antes posible."
          : "Hemos registrado tu solicitud. Un ejecutivo se comunicará contigo pronto.",
      });

      io.to(`user:${parsed.data.userEmail}`).emit("new_message", confirmMsg);
      log(`Solicitud de contacto de ${parsed.data.userName} (${parsed.data.userEmail}) - Email: ${emailSent ? "enviado" : "no enviado"}`, "contact");
      res.json({ confirmed: true });
    } catch (error: any) {
      log(`Error en solicitud de contacto: ${error.message}`, "api");
      res.status(500).json({ message: "Error al procesar solicitud" });
    }
  });

  io.on("connection", (socket) => {
    const { email, name } = socket.handshake.auth as { email: string; name: string };

    if (!email || !name) {
      socket.disconnect(true);
      return;
    }

    log(`Usuario conectado: ${name} (${email})`, "socket.io");
    socket.join(`user:${email}`);

    userSessions.set(socket.id, { email, name });

    storage.getMessagesByEmail(email).then((history) => {
      socket.emit("chat_history", history);
    }).catch((err) => {
      log(`Error al cargar historial: ${err.message}`, "socket.io");
      socket.emit("chat_history", []);
    });

    socket.on("page_info", (data: { url?: string; title?: string }) => {
      const session = userSessions.get(socket.id);
      if (session) {
        session.pageUrl = data.url || "";
        session.pageTitle = data.title || "";
        userSessions.set(socket.id, session);
      }
    });

    socket.on("send_message", async (data: unknown) => {
      const parsed = socketMessageSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit("error", { message: "Datos de mensaje inv\u00e1lidos" });
        return;
      }

      try {
        const message = await storage.createMessage({
          userEmail: parsed.data.userEmail,
          userName: parsed.data.userName,
          sender: parsed.data.sender,
          content: parsed.data.content,
        });

        io.to(`user:${parsed.data.userEmail}`).emit("new_message", message);

        if (parsed.data.sender === "user") {
          const session = userSessions.get(socket.id);
          setTimeout(async () => {
            try {
              const autoReply = await storage.createMessage({
                userEmail: parsed.data.userEmail,
                userName: "Soporte",
                sender: "support",
                content: getAutoReply(parsed.data.content, session?.pageTitle, session?.pageUrl),
              });
              io.to(`user:${parsed.data.userEmail}`).emit("new_message", autoReply);
            } catch (err: any) {
              log(`Error en auto-respuesta: ${err.message}`, "socket.io");
            }
          }, 1500);
        }
      } catch (error: any) {
        log(`Error al guardar mensaje: ${error.message}`, "socket.io");
        socket.emit("error", { message: "Error al enviar mensaje" });
      }
    });

    socket.on("contact_executive", async (data: unknown) => {
      const parsed = contactSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit("error", { message: "Datos inv\u00e1lidos" });
        return;
      }

      try {
        const recentMessages = await storage.getMessagesByEmail(parsed.data.userEmail);
        const lastMessages = recentMessages.slice(-10);
        const chatSummary = lastMessages
          .map((m) => `${m.sender === "user" ? parsed.data.userName : "Soporte"}: ${m.content}`)
          .join("\n");

        const contactRequest = await storage.createContactRequest({
          userEmail: parsed.data.userEmail,
          userName: parsed.data.userName,
          pageUrl: parsed.data.pageUrl || null,
          pageTitle: parsed.data.pageTitle || null,
          chatSummary: chatSummary || null,
        });

        const emailSent = await sendContactNotification({
          userName: parsed.data.userName,
          userEmail: parsed.data.userEmail,
          pageUrl: parsed.data.pageUrl,
          pageTitle: parsed.data.pageTitle,
          chatSummary,
        });

        socket.emit("contact_confirmed");

        const confirmMsg = await storage.createMessage({
          userEmail: parsed.data.userEmail,
          userName: "Soporte",
          sender: "support",
          content: emailSent
            ? "Tu solicitud ha sido enviada. Un ejecutivo se pondr\u00e1 en contacto contigo por correo electr\u00f3nico lo antes posible."
            : "Hemos registrado tu solicitud. Un ejecutivo se comunicar\u00e1 contigo pronto.",
        });

        io.to(`user:${parsed.data.userEmail}`).emit("new_message", confirmMsg);
        log(`Solicitud de contacto de ${parsed.data.userName} (${parsed.data.userEmail}) - Email: ${emailSent ? "enviado" : "no enviado"}`, "contact");
      } catch (error: any) {
        log(`Error en solicitud de contacto: ${error.message}`, "socket.io");
        socket.emit("error", { message: "Error al procesar solicitud" });
      }
    });

    socket.on("disconnect", () => {
      userSessions.delete(socket.id);
      log(`Usuario desconectado: ${name} (${email})`, "socket.io");
    });
  });

  return httpServer;
}

function getAutoReply(userMessage: string, pageTitle?: string, pageUrl?: string): string {
  const msg = userMessage.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const url = (pageUrl || "").toLowerCase();
  const title = (pageTitle || "").toLowerCase();

  const pageContext = pageTitle ? ` Veo que estas navegando en "${pageTitle}".` : "";

  const isPlayStation = msg.includes("ps4") || msg.includes("ps5") || msg.includes("playstation") || msg.includes("play station") || msg.includes("sony") || url.includes("ps4") || url.includes("ps5") || url.includes("playstation") || title.includes("ps4") || title.includes("ps5");
  const isXbox = msg.includes("xbox") || msg.includes("microsoft") || msg.includes("game pass") || msg.includes("gamepass") || url.includes("xbox") || title.includes("xbox");

  if (msg.includes("hola") || msg.includes("buenas") || msg.includes("hey") || msg.includes("hello") || msg.includes("hi") || msg.includes("buen dia") || msg.includes("buenos dias")) {
    if (isPlayStation) {
      return `¡Hola! Bienvenido a nuestra tienda de juegos digitales.${pageContext} Tenemos un amplio catalogo de juegos y suscripciones para PS4 y PS5. ¿Que estas buscando? Puedo ayudarte con juegos, tarjetas PlayStation, o suscripciones PS Plus.`;
    }
    if (isXbox) {
      return `¡Hola! Bienvenido a nuestra tienda de juegos digitales.${pageContext} Contamos con juegos y suscripciones para Xbox One y Xbox Series S|X. ¿Te interesa algun juego, tarjeta Xbox, o suscripcion Game Pass?`;
    }
    return `¡Hola! Bienvenido a nuestra tienda de juegos digitales.${pageContext} Tenemos juegos y suscripciones para PS4, PS5, Xbox One y Xbox Series. ¿En que puedo ayudarte hoy?`;
  }

  if (msg.includes("plus essential") || msg.includes("ps plus essential") || msg.includes("psplus essential") || (msg.includes("essential") && (msg.includes("plus") || isPlayStation))) {
    const duration = extractDuration(msg);
    if (duration) {
      return `¡Excelente eleccion! La suscripcion PS Plus Essential de ${duration} te da acceso a juego online multijugador, 2-3 juegos gratis cada mes, descuentos exclusivos en PlayStation Store y almacenamiento en la nube. ¿Quieres que te ayude con el proceso de compra o necesitas mas informacion sobre la entrega?`;
    }
    return `PS Plus Essential es el plan base de PlayStation. Incluye juego online multijugador, juegos mensuales gratis, y descuentos en PS Store. Tenemos disponible en planes de 1 mes, 3 meses y 12 meses. ¿Cual te interesa?`;
  }

  if (msg.includes("plus extra") || msg.includes("ps plus extra") || msg.includes("psplus extra") || (msg.includes("extra") && (msg.includes("plus") || isPlayStation))) {
    const duration = extractDuration(msg);
    if (duration) {
      return `¡Buena eleccion! PS Plus Extra de ${duration} incluye todo lo de Essential MAS un catalogo de hasta 400 juegos de PS4 y PS5 para descargar y jugar. Es como tener Netflix de juegos. ¿Te gustaria proceder con la compra?`;
    }
    return `PS Plus Extra incluye todo lo de Essential mas acceso a un catalogo de ~400 juegos descargables de PS4 y PS5. Disponible en 1, 3 y 12 meses. ¿De cual duracion te gustaria saber el precio?`;
  }

  if (msg.includes("plus premium") || msg.includes("ps plus premium") || msg.includes("psplus premium") || msg.includes("plus deluxe") || (msg.includes("premium") && (msg.includes("plus") || isPlayStation))) {
    const duration = extractDuration(msg);
    if (duration) {
      return `PS Plus Premium de ${duration} es el plan mas completo. Incluye todo lo de Extra mas streaming de juegos en la nube, juegos clasicos de PS1/PS2/PS3/PSP, y pruebas de juegos por tiempo limitado. ¿Quieres mas detalles sobre la compra?`;
    }
    return `PS Plus Premium es el plan mas completo de PlayStation. Incluye todo de Extra mas juegos clasicos, streaming en la nube y pruebas de juegos. Disponible en 1, 3 y 12 meses. ¿Cual duracion te interesa?`;
  }

  if (msg.includes("ps plus") || msg.includes("psplus") || msg.includes("playstation plus") || (msg.includes("plus") && isPlayStation)) {
    return `Tenemos los 3 niveles de PS Plus disponibles:\n\n• Essential - Juego online + juegos mensuales gratis\n• Extra - Todo de Essential + catalogo de ~400 juegos\n• Premium - Todo de Extra + clasicos + streaming\n\nCada uno disponible en 1, 3 y 12 meses. ¿Cual nivel te interesa?`;
  }

  if (msg.includes("game pass") || msg.includes("gamepass") || msg.includes("xbox pass")) {
    if (msg.includes("ultimate")) {
      const duration = extractDuration(msg);
      if (duration) {
        return `¡Game Pass Ultimate de ${duration} es la mejor opcion! Incluye acceso a cientos de juegos en consola, PC y nube, juego online (Xbox Live Gold), EA Play, y juegos de Xbox Studios desde el dia de lanzamiento. ¿Te ayudo con la compra?`;
      }
      return `Xbox Game Pass Ultimate incluye juegos en consola + PC + nube, Xbox Live Gold, EA Play y juegos day-one de Microsoft. Tenemos planes de 1, 3 y 12 meses. ¿Cual te interesa?`;
    }
    if (msg.includes("core")) {
      return `Xbox Game Pass Core reemplaza a Xbox Live Gold. Incluye juego online multijugador y acceso a un catalogo selecto de juegos. Es el plan base para jugar online en Xbox. ¿Quieres saber los precios disponibles?`;
    }
    return `Tenemos suscripciones Xbox Game Pass disponibles:\n\n• Game Pass Core - Juego online + catalogo selecto\n• Game Pass Standard - Catalogo de cientos de juegos\n• Game Pass Ultimate - Todo incluido + PC + nube + EA Play\n\n¿Cual plan te interesa?`;
  }

  if (msg.includes("xbox live") || msg.includes("live gold") || (msg.includes("gold") && isXbox)) {
    return `Xbox Live Gold fue reemplazado por Xbox Game Pass Core, que incluye juego online multijugador y un catalogo de juegos seleccionados. ¿Te gustaria saber mas sobre Game Pass Core u otro plan de Game Pass?`;
  }

  if (msg.includes("tarjeta") || msg.includes("gift card") || msg.includes("giftcard") || msg.includes("codigo") || msg.includes("saldo") || msg.includes("recarga") || msg.includes("wallet")) {
    const duration = extractDuration(msg);
    if (duration) {
      if (isPlayStation || msg.includes("psn") || msg.includes("playstation") || msg.includes("ps store")) {
        return `¡Tenemos tarjetas de suscripcion PlayStation de ${duration}! Disponible en PS Plus Essential, Extra y Premium. ¿Cual nivel te interesa? Te puedo dar mas detalles de lo que incluye cada uno.`;
      }
      if (isXbox || msg.includes("xbox")) {
        return `¡Tenemos tarjetas de suscripcion Xbox de ${duration}! Disponible en Game Pass Core, Standard y Ultimate. ¿Cual plan te interesa?`;
      }
      return `¡Tenemos tarjetas de suscripcion de ${duration}! ¿Para cual plataforma la necesitas?\n\n• PlayStation: PS Plus Essential, Extra o Premium\n• Xbox: Game Pass Core, Standard o Ultimate\n\nTambien contamos con tarjetas de saldo.`;
    }
    if (msg.includes("psn") || msg.includes("playstation") || msg.includes("ps store") || isPlayStation) {
      const amount = extractMoneyAmount(msg);
      if (amount) {
        return `¡Tenemos tarjetas PSN de $${amount}! Las tarjetas de PlayStation Store te permiten agregar saldo a tu cuenta para comprar juegos, DLCs, y contenido digital. La entrega es digital e inmediata por correo. ¿Quieres proceder con la compra?`;
      }
      return `Contamos con tarjetas de saldo para PlayStation Store (PSN) en varias denominaciones. Puedes usarlas para comprar juegos, DLCs, y contenido en PS Store. ¿De cuanto saldo necesitas?`;
    }
    if (msg.includes("xbox") || isXbox) {
      const amount = extractMoneyAmount(msg);
      if (amount) {
        return `¡Tenemos tarjetas Xbox de $${amount}! Te permite agregar saldo a tu cuenta Microsoft para comprar juegos y contenido en la tienda Xbox. Entrega digital inmediata. ¿Quieres que te ayude con la compra?`;
      }
      return `Tenemos tarjetas de saldo Xbox en varias denominaciones. Sirven para comprar juegos, DLCs y contenido en la Microsoft Store. ¿Que monto necesitas?`;
    }
    return `Tenemos tarjetas digitales para PlayStation y Xbox:\n\n• Tarjetas de saldo PSN (PlayStation Store)\n• Tarjetas de saldo Xbox (Microsoft Store)\n• Suscripciones PS Plus (Essential/Extra/Premium)\n• Suscripciones Xbox Game Pass\n\n¿Cual te interesa?`;
  }

  if (msg.includes("1 mes") || msg.includes("un mes") || msg.includes("mensual")) {
    if (isPlayStation) {
      return `Tenemos suscripciones de 1 mes para PS Plus en los 3 niveles: Essential, Extra y Premium. ¿Cual nivel te interesa? Te puedo dar mas detalles de lo que incluye cada uno.`;
    }
    if (isXbox) {
      return `Tenemos suscripciones de 1 mes para Xbox Game Pass: Core, Standard y Ultimate. ¿Cual plan te interesa? Puedo explicarte las diferencias.`;
    }
    return `Tenemos suscripciones de 1 mes tanto para PlayStation (PS Plus) como para Xbox (Game Pass). ¿Para cual plataforma necesitas?`;
  }

  if (msg.includes("3 mes") || msg.includes("tres mes") || msg.includes("trimestral")) {
    if (isPlayStation) {
      return `¡La suscripcion de 3 meses de PS Plus es muy popular! Disponible en Essential, Extra y Premium. Es mejor relacion precio/mes que la mensual. ¿Cual nivel te interesa?`;
    }
    if (isXbox) {
      return `Tenemos Game Pass de 3 meses disponible. Ofrece mejor valor que el plan mensual. ¿Te interesa Core, Standard o Ultimate?`;
    }
    return `Las suscripciones de 3 meses estan disponibles para PlayStation y Xbox. Ofrecen mejor precio por mes que la opcion mensual. ¿Para que plataforma la necesitas?`;
  }

  if (msg.includes("12 mes") || msg.includes("doce mes") || msg.includes("un ano") || msg.includes("1 ano") || msg.includes("anual")) {
    if (isPlayStation) {
      return `El plan anual de PS Plus es el que ofrece el mejor ahorro. Disponible en Essential, Extra y Premium con 12 meses de acceso. ¿Cual nivel te gustaria?`;
    }
    if (isXbox) {
      return `El plan anual de Game Pass te da el mejor precio por mes. ¿Te interesa la version Core, Standard o Ultimate?`;
    }
    return `Los planes anuales (12 meses) son los que ofrecen el mejor ahorro. Disponibles para PS Plus y Xbox Game Pass. ¿Para cual plataforma?`;
  }

  if (msg.includes("juego") || msg.includes("game") || msg.includes("titulo")) {
    if (isPlayStation) {
      return `Tenemos un amplio catalogo de juegos digitales para PS4 y PS5.${pageContext} ¿Buscas algun titulo en particular? Tambien tenemos ofertas y lanzamientos recientes.`;
    }
    if (isXbox) {
      return `Contamos con juegos digitales para Xbox One y Xbox Series S|X.${pageContext} ¿Tienes algun titulo en mente? Puedo verificar disponibilidad y precio.`;
    }
    return `Vendemos juegos digitales para PS4, PS5, Xbox One y Xbox Series.${pageContext} ¿Para que plataforma buscas? ¿Algun titulo especifico?`;
  }

  if (msg.includes("precio") || msg.includes("costo") || msg.includes("cuanto") || msg.includes("cuanto vale") || msg.includes("cuanto cuesta") || msg.includes("valor") || msg.includes("tarifa") || msg.includes("$")) {
    return `Los precios varian segun el producto.${pageContext} ¿Podrias indicarme que producto especifico te interesa? Por ejemplo: una suscripcion PS Plus, Game Pass, tarjeta de saldo, o un juego en particular. Asi te doy el precio exacto.`;
  }

  if (msg.includes("pago") || msg.includes("pagar") || msg.includes("transferencia") || msg.includes("webpay") || msg.includes("debito") || msg.includes("credito") || msg.includes("metodo") || msg.includes("forma de pago")) {
    return `Aceptamos varios metodos de pago para tu comodidad. Puedes consultar las opciones disponibles en la pagina del producto. Si tienes alguna duda sobre un metodo de pago especifico, un ejecutivo puede ayudarte. ¿Necesitas asistencia adicional?`;
  }

  if (msg.includes("entrega") || msg.includes("envio") || msg.includes("llega") || msg.includes("demora") || msg.includes("tiempo") || msg.includes("cuando llega") || msg.includes("inmediato") || msg.includes("rapido")) {
    return `¡Nuestras entregas son digitales e inmediatas! Una vez confirmado el pago, recibiras tu codigo o credenciales por correo electronico en minutos. No hay envio fisico, todo es 100% digital.`;
  }

  if (msg.includes("cuenta") || msg.includes("compartida") || msg.includes("primaria") || msg.includes("secundaria")) {
    if (msg.includes("plus") || isPlayStation) {
      return `Nuestras cuentas PS Plus son cuentas principales que se configuran en tu consola para que puedas disfrutar de todos los beneficios. Si necesitas ayuda con la configuracion, un ejecutivo puede guiarte paso a paso. ¿Quieres mas detalles?`;
    }
    return `Trabajamos con cuentas digitales que se configuran facilmente en tu consola. Si tienes dudas sobre como funciona, un ejecutivo puede explicarte el proceso completo. ¿Necesitas ayuda con algo mas?`;
  }

  if (msg.includes("devolucion") || msg.includes("reembolso") || msg.includes("garantia") || msg.includes("cambio") || msg.includes("reclamo")) {
    return `Todas nuestras ventas cuentan con garantia. Si tienes algun problema con tu compra, por favor contacta a un ejecutivo usando el boton "Contactar un Ejecutivo" y te ayudaremos a resolverlo lo antes posible.`;
  }

  if (msg.includes("oferta") || msg.includes("descuento") || msg.includes("promocion") || msg.includes("promo") || msg.includes("rebaja") || msg.includes("barato")) {
    return `¡Siempre tenemos ofertas disponibles! Te recomiendo revisar nuestra pagina web para ver las promociones actuales.${pageContext} Si buscas algo especifico, dime que producto te interesa y verifico si hay algun descuento disponible.`;
  }

  if (msg.includes("seguro") || msg.includes("confiable") || msg.includes("estafa") || msg.includes("confianza") || msg.includes("legal") || msg.includes("legitimo")) {
    return `¡Somos una tienda 100% confiable! Trabajamos con codigos y cuentas digitales oficiales. Puedes revisar nuestras resenas y testimonios de clientes satisfechos. Si tienes cualquier duda, un ejecutivo puede atenderte personalmente.`;
  }

  if (msg.includes("ayuda") || msg.includes("help") || msg.includes("soporte") || msg.includes("asistencia")) {
    return `¡Estoy aqui para ayudarte!${pageContext} Puedo asistirte con:\n\n• Informacion sobre juegos y suscripciones\n• PS Plus (Essential/Extra/Premium)\n• Xbox Game Pass (Core/Standard/Ultimate)\n• Tarjetas de saldo PSN y Xbox\n• Proceso de compra y entrega\n\n¿Que necesitas?`;
  }

  if (msg.includes("gracias") || msg.includes("thank") || msg.includes("genial") || msg.includes("perfecto") || msg.includes("excelente")) {
    return "¡De nada! Si necesitas algo mas, no dudes en escribirme. Estoy aqui para ayudarte.";
  }

  if (msg.includes("problema") || msg.includes("error") || msg.includes("falla") || msg.includes("bug") || msg.includes("no funciona") || msg.includes("no puedo") || msg.includes("no me deja")) {
    return `Lamento que estes teniendo problemas.${pageContext} Para poder ayudarte mejor, ¿podrias describir que esta pasando exactamente? Si prefieres atencion personalizada, puedes contactar a un ejecutivo con el boton "Contactar un Ejecutivo".`;
  }

  if (msg.includes("contacto") || msg.includes("ejecutivo") || msg.includes("persona") || msg.includes("humano") || msg.includes("agente") || msg.includes("hablar con")) {
    return `Para hablar directamente con un ejecutivo, usa el boton "Contactar un Ejecutivo" que aparece arriba del campo de mensaje. Un miembro de nuestro equipo se comunicara contigo por correo electronico.`;
  }

  if (msg.includes("horario") || msg.includes("hora") || msg.includes("cuando") || msg.includes("abierto") || msg.includes("atienden")) {
    return `Nuestra tienda online esta disponible 24/7. Las entregas digitales son inmediatas y automaticas. Para atencion personalizada con un ejecutivo, nuestro horario es de lunes a viernes de 9:00 AM a 6:00 PM (hora Chile). ¿Puedo ayudarte en algo mas?`;
  }

  if (msg.includes("chile") || msg.includes("region") || msg.includes("pais") || msg.includes("latam") || msg.includes("latinoamerica")) {
    return `¡Somos una tienda de juegos digitales que opera en Chile! Nuestros productos funcionan con cuentas de la region. Si tienes dudas sobre compatibilidad con tu cuenta, un ejecutivo puede asesorarte.`;
  }

  if (msg.includes("ea play") || msg.includes("ea access")) {
    return `EA Play esta incluido en Xbox Game Pass Ultimate. Te da acceso a juegos de Electronic Arts como FIFA, Battlefield, Need for Speed y mas. Si lo quieres por separado, tambien tenemos opciones. ¿Que prefieres?`;
  }

  if (msg.includes("fifa") || msg.includes("fc 24") || msg.includes("fc24") || msg.includes("ea fc") || msg.includes("fc 25") || msg.includes("fc25")) {
    return `¡Tenemos EA FC disponible para PS4, PS5 y Xbox!${pageContext} ¿Para que plataforma lo necesitas? Te verifico el precio y disponibilidad.`;
  }

  if (msg.includes("gta") || msg.includes("grand theft") || msg.includes("rockstar")) {
    return `¡Buena eleccion! ¿Buscas GTA V, GTA Online, o el nuevo GTA VI?${pageContext} Dime para que plataforma y te doy toda la informacion.`;
  }

  if (msg.includes("cod") || msg.includes("call of duty") || msg.includes("warzone")) {
    return `Tenemos Call of Duty disponible para varias plataformas.${pageContext} ¿Cual edicion te interesa y para que consola? Te busco el mejor precio.`;
  }

  if (msg.includes("fortnite") || msg.includes("v-bucks") || msg.includes("vbucks")) {
    return `¡Fortnite es gratis! Pero tenemos tarjetas de V-Bucks para que compres skins, pases de batalla y contenido. ¿Cuantos V-Bucks necesitas?`;
  }

  if (pageContext && msg.length > 3) {
    return `Gracias por tu consulta.${pageContext} Puedo ayudarte con informacion sobre juegos, suscripciones PS Plus o Game Pass, tarjetas de saldo, precios, y proceso de compra. ¿Que te gustaria saber?`;
  }

  return `Gracias por tu mensaje.${pageContext} Puedo ayudarte con:\n\n• Juegos digitales para PS4, PS5, Xbox\n• Suscripciones PS Plus y Game Pass\n• Tarjetas de saldo PSN y Xbox\n• Precios y disponibilidad\n• Proceso de compra y entrega\n\n¿Sobre que te gustaria saber mas?`;
}

function extractDuration(msg: string): string | null {
  if (msg.includes("1 mes") || msg.includes("un mes") || msg.includes("mensual")) return "1 mes";
  if (msg.includes("3 mes") || msg.includes("tres mes") || msg.includes("trimestral")) return "3 meses";
  if (msg.includes("6 mes") || msg.includes("seis mes") || msg.includes("semestral")) return "6 meses";
  if (msg.includes("12 mes") || msg.includes("doce mes") || msg.includes("un ano") || msg.includes("1 ano") || msg.includes("anual")) return "12 meses";
  return null;
}

function extractMoneyAmount(msg: string): string | null {
  const dollarMatch = msg.match(/\$\s*(\d+(?:[.,]\d+)?)/);
  if (dollarMatch) return dollarMatch[1];
  const currencyMatch = msg.match(/(\d+(?:[.,]\d+)?)\s*(?:dolares|pesos|clp|usd)/i);
  if (currencyMatch) return currencyMatch[1];
  return null;
}
