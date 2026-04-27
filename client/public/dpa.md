# Acuerdo de Procesamiento de Datos (DPA) — Cappta AI

**Versión:** 1.0
**Vigente desde:** Abril 2026
**Operador:** Web Maker Chile
**Contacto:** security@cappta.ai (alias en provisionamiento; mientras tanto se reenvía a webmakerchile@gmail.com)
**Versión publicada en:** https://cappta.ai/dpa

---

## 1. Partes y objeto

Este Acuerdo de Procesamiento de Datos (en adelante, "DPA") se celebra entre Web Maker Chile, en su carácter de Encargado de Tratamiento (en adelante, "Cappta AI"), y el cliente que ha contratado los servicios de Cappta AI (en adelante, el "Responsable"). El presente DPA forma parte integrante de los Términos de Uso de Cappta AI y aplica al tratamiento de datos personales que Cappta AI realiza por cuenta del Responsable a través de la plataforma.

## 2. Marco regulatorio aplicable

Este DPA se interpreta de buena fe en el marco de la legislación aplicable en la jurisdicción del Responsable, incluyendo:

- Reglamento (UE) 2016/679 — RGPD (cuando aplique a residentes europeos).
- Ley 19.628 sobre Protección de la Vida Privada de Chile.
- Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) de México.
- Lei Geral de Proteção de Dados (LGPD) de Brasil.
- Ley 25.326 de Protección de los Datos Personales de Argentina.

## 3. Roles

El Responsable determina los fines y medios del tratamiento de los datos personales que carga en la plataforma o que recolecta a través del chatbot. Cappta AI actúa como Encargado y trata los datos personales únicamente conforme a las instrucciones documentadas del Responsable, incluidas las contenidas en este DPA y en la configuración de la plataforma.

## 4. Categorías de datos y titulares

**Titulares:** visitantes y clientes finales del Responsable que interactúan con el chatbot, así como usuarios internos que el Responsable da de alta en la plataforma.

**Categorías de datos:** datos de contacto (nombre, email, teléfono), contenido de las conversaciones, adjuntos compartidos voluntariamente, metadatos técnicos (IP, navegador, dispositivo, página de origen) e identificadores de sesión.

Cappta AI no solicita ni promueve la carga de categorías especiales de datos (datos de salud, biométricos, ideológicos, judiciales). Si el Responsable los carga, lo hace bajo su exclusiva responsabilidad.

## 5. Finalidades del tratamiento

- Operar la plataforma de chatbot, atención al cliente y motor de ventas contratada.
- Generar respuestas automatizadas mediante modelos de inteligencia artificial.
- Permitir el handoff a agentes humanos del Responsable.
- Enviar notificaciones operativas al Responsable y a los visitantes (cuando el Responsable lo configure).
- Generar métricas y estadísticas de uso para el Responsable.

Cappta AI no usa los datos personales del Responsable para fines propios de marketing ni para entrenar modelos de IA generales.

## 6. Obligaciones de Cappta AI

- Tratar los datos exclusivamente conforme a las instrucciones del Responsable.
- Garantizar la confidencialidad mediante acuerdos de confidencialidad con su personal y proveedores con acceso.
- Implementar medidas técnicas y organizativas razonables descritas en la sección 8.
- Asistir al Responsable, en la medida de lo posible y a costo razonable, para responder a solicitudes de titulares.
- Notificar al Responsable, sin demora indebida y a más tardar dentro de las 72 horas, cualquier brecha de seguridad que afecte datos personales del Responsable.
- Devolver o eliminar los datos personales al finalizar el servicio, conforme a la sección 11.

## 7. Subprocesadores

El Responsable autoriza a Cappta AI a contratar subprocesadores para la prestación del servicio. La lista actualizada está publicada en https://cappta.ai/subprocesadores. Cappta AI mantendrá con cada subprocesador obligaciones contractuales equivalentes a las de este DPA en materia de protección de datos.

Cappta AI notificará al Responsable cualquier alta o cambio de subprocesador con al menos 30 días de antelación, mediante actualización pública en la página de subprocesadores y, cuando el Responsable se haya suscrito al canal correspondiente, también por email. El Responsable podrá objetar el cambio por motivos razonables relacionados con protección de datos; si las partes no llegan a un acuerdo, el Responsable podrá rescindir el servicio sin penalidad.

## 8. Medidas técnicas y organizativas

- Cifrado en tránsito mediante TLS 1.2+ en todos los endpoints públicos.
- Cifrado en reposo (AES-256) administrado por los proveedores de base de datos y almacenamiento de objetos.
- Hashing seguro de contraseñas con bcrypt y salt único por usuario.
- Aislamiento lógico multi-tenant: todas las consultas se filtran por identificador de tenant en el backend.
- Control de acceso basado en roles (administrador, agente, operador) y expiración de sesiones.
- Registro de auditoría de acciones administrativas relevantes.
- Backups automáticos diarios gestionados por el proveedor de base de datos.
- Política de respuesta a incidentes con triage en menos de 24 horas hábiles.
- Detalle público y vigente en https://cappta.ai/seguridad.

## 9. Transferencias internacionales

La infraestructura principal de Cappta AI se aloja en Estados Unidos (proveedores Neon Postgres, almacenamiento de objetos, OpenAI). Cuando el Responsable se rige por una jurisdicción que requiere garantías específicas para transferencias internacionales (por ejemplo, cláusulas contractuales tipo del RGPD), las partes acordarán por escrito el mecanismo apropiado.

## 10. Asistencia al Responsable

Cappta AI asistirá al Responsable, en la medida razonable y mediante las funciones disponibles en la plataforma o solicitudes específicas, para:

- Responder a solicitudes de acceso, rectificación, oposición, portabilidad y supresión de los titulares.
- Garantizar el cumplimiento de las obligaciones del Responsable bajo la legislación aplicable.
- Colaborar en evaluaciones de impacto en la protección de datos.

## 11. Devolución y eliminación de datos

Al terminar la relación contractual y previa solicitud del Responsable, Cappta AI eliminará o devolverá los datos personales en un plazo de 60 días. Quedan exceptuadas las copias requeridas por obligaciones legales de retención, las cuales permanecerán protegidas hasta su eliminación segura.

## 12. Auditoría

El Responsable podrá auditar el cumplimiento de este DPA mediante:
(a) la documentación pública en https://cappta.ai/seguridad y https://cappta.ai/subprocesadores;
(b) los reportes de terceros que Cappta AI ponga a disposición; y
(c) auditorías acordadas con razonable anticipación, no más de una vez al año salvo causa justificada, durante horario hábil y bajo confidencialidad. Los costos de auditorías presenciales son a cargo del Responsable.

## 13. Limitación de responsabilidad

La responsabilidad de las partes bajo este DPA se rige por las limitaciones establecidas en los Términos de Uso de Cappta AI, salvo que la ley aplicable disponga lo contrario para infracciones a la normativa de protección de datos.

## 14. Vigencia, modificaciones y ley aplicable

Este DPA permanece vigente mientras Cappta AI trate datos personales por cuenta del Responsable. Cappta AI podrá actualizarlo cuando lo exija la regulación o la evolución del servicio, notificando al Responsable con razonable antelación. Para clientes regidos por jurisdicciones distintas a Chile, las partes podrán suscribir adendas específicas. La ley aplicable en defecto de acuerdo distinto es la de la República de Chile.

## 15. Aceptación

La contratación y uso de los servicios de Cappta AI por parte del Responsable implica la aceptación íntegra de este DPA. Para clientes que requieran un DPA firmado bilateralmente, escribir a security@cappta.ai con el asunto "DPA firmable" (alias en provisionamiento; mientras tanto se reenvía a webmakerchile@gmail.com).

---

> **Aviso:** este DPA es un documento legal pero no constituye asesoría jurídica. El Responsable debe evaluar si este DPA se ajusta a sus obligaciones específicas bajo la legislación aplicable y, en caso de duda, consultar con su asesor legal.
