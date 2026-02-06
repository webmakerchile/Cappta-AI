import { Resend } from "resend";
import { log } from "./index";

const resend = new Resend(process.env.RESEND_API_KEY);
const NOTIFICATION_EMAIL = "cjmdigitales@gmail.com";

interface ContactEmailData {
  userName: string;
  userEmail: string;
  pageUrl?: string | null;
  pageTitle?: string | null;
  chatSummary?: string | null;
  problemType?: string | null;
  gameName?: string | null;
}

function getProblemTypeLabel(problemType: string): string {
  const labels: Record<string, string> = {
    compra: "Quiero comprar un producto",
    problema_cuenta: "Problema con mi cuenta",
    entrega: "No he recibido mi producto",
    devolucion: "Solicitar devoluci\u00f3n o cambio",
    info_producto: "Informaci\u00f3n sobre un producto",
    precio: "Consulta de precios",
    otro: "Otro",
  };
  return labels[problemType] || problemType;
}

export async function sendContactNotification(data: ContactEmailData): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: "Chat Widget <onboarding@resend.dev>",
      to: NOTIFICATION_EMAIL,
      subject: `Solicitud de contacto: ${data.userName}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #ffffff; border-radius: 8px; overflow: hidden;">
          <div style="background: #6200EA; padding: 24px 32px;">
            <h1 style="margin: 0; font-size: 20px; color: #ffffff;">Nueva Solicitud de Contacto</h1>
          </div>
          <div style="padding: 32px;">
            <p style="color: #cccccc; margin-top: 0;">Un visitante ha solicitado hablar con un ejecutivo desde el chat.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #333; color: #999; width: 120px;">Nombre:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #333; color: #fff; font-weight: 600;">${data.userName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #333; color: #999;">Correo:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #333;"><a href="mailto:${data.userEmail}" style="color: #9d6fff; text-decoration: none;">${data.userEmail}</a></td>
              </tr>
              ${data.problemType ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #333; color: #999;">En qu\u00e9 necesitas ayuda?:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #333; color: #fff; font-weight: 600;">${getProblemTypeLabel(data.problemType)}</td>
              </tr>` : ""}
              ${data.gameName ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #333; color: #999;">Juego/Producto:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #333; color: #fff; font-weight: 600;">${data.gameName}</td>
              </tr>` : ""}
              ${data.pageTitle ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #333; color: #999;">P\u00e1gina:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #333; color: #fff;">${data.pageTitle}</td>
              </tr>` : ""}
              ${data.pageUrl ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #333; color: #999;">URL:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #333;"><a href="${data.pageUrl}" style="color: #9d6fff; text-decoration: none; word-break: break-all;">${data.pageUrl}</a></td>
              </tr>` : ""}
            </table>

            ${data.chatSummary ? `
            <div style="margin-top: 20px;">
              <h3 style="color: #999; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Resumen del chat</h3>
              <div style="background: #222; border-radius: 6px; padding: 16px; color: #ccc; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${data.chatSummary}</div>
            </div>` : ""}

            <div style="margin-top: 32px; text-align: center;">
              <a href="mailto:${data.userEmail}" style="display: inline-block; background: #6200EA; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">Responder al Cliente</a>
            </div>
          </div>
          <div style="padding: 16px 32px; background: #111; text-align: center; color: #666; font-size: 12px;">
            Notificaci\u00f3n enviada desde Chat Widget
          </div>
        </div>
      `,
    });

    if (error) {
      log(`Error sending email: ${JSON.stringify(error)}`, "resend");
      return false;
    }

    log(`Contact notification sent to ${NOTIFICATION_EMAIL} for user ${data.userEmail}`, "resend");
    return true;
  } catch (err: any) {
    log(`Failed to send email: ${err.message}`, "resend");
    return false;
  }
}
