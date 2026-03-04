import { useState } from "react";
import { Bot, Zap, Globe, MessageSquare, BarChart3, Shield, Sparkles, ArrowRight, CheckCircle2, Play, ExternalLink } from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Instalación en 2 minutos",
    desc: "Copia un script, pégalo en tu web. Sin código, sin complicaciones.",
    color: "#f59e0b",
  },
  {
    icon: Bot,
    title: "IA Ultra-Inteligente",
    desc: "Extrae automáticamente la info de tu sitio web. Zero configuración manual.",
    color: "#10b981",
  },
  {
    icon: Globe,
    title: "Compatible con todo",
    desc: "WordPress, Shopify, WooCommerce, React, Next.js, HTML... cualquier plataforma.",
    color: "#06b6d4",
  },
  {
    icon: MessageSquare,
    title: "Panel de Chats en Vivo",
    desc: "Interviene conversaciones en tiempo real cuando tu cliente lo necesite.",
    color: "#8b5cf6",
  },
  {
    icon: BarChart3,
    title: "Analítica Completa",
    desc: "Métricas de conversación, satisfacción y rendimiento del bot en un dashboard.",
    color: "#ec4899",
  },
  {
    icon: Shield,
    title: "Multi-Tenant Seguro",
    desc: "Cada negocio tiene su propio espacio aislado, datos privados y configuración.",
    color: "#14b8a6",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "Gratis",
    period: "",
    features: ["100 mensajes/mes", "1 bot", "Widget personalizable", "Soporte por email"],
    cta: "Comenzar Gratis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29.990",
    period: "/mes",
    features: ["Mensajes ilimitados", "Bots ilimitados", "Panel de chats en vivo", "Catálogo de productos", "Analítica avanzada", "Soporte prioritario"],
    cta: "Comenzar Ahora",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Conversemos",
    period: "",
    features: ["Todo en Pro", "API personalizada", "Integración a medida", "SLA garantizado", "Soporte dedicado"],
    cta: "Contactar",
    highlighted: false,
  },
];

export default function FoxBotPromoSection() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <section
      id="foxbot"
      style={{
        background: "#0a0a0f",
        color: "#e2e8f0",
        fontFamily: "'Inter', 'Space Grotesk', sans-serif",
        padding: "0",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "radial-gradient(ellipse at 30% 20%, rgba(16,185,129,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(245,158,11,0.04) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 24px", position: "relative", zIndex: 1 }}>

        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              borderRadius: "999px",
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.2)",
              marginBottom: "24px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#10b981",
              letterSpacing: "0.5px",
            }}
          >
            <Sparkles style={{ width: "14px", height: "14px" }} />
            NUEVO PRODUCTO
          </div>

          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 56px)",
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: "20px",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            <span style={{ color: "#e2e8f0" }}>Chatbot con IA para</span>
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #10b981, #34d399)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              tu negocio
            </span>
          </h2>

          <p
            style={{
              fontSize: "18px",
              color: "rgba(226,232,240,0.6)",
              maxWidth: "600px",
              margin: "0 auto 32px",
              lineHeight: 1.6,
            }}
          >
            FoxBot extrae la información de tu sitio web automáticamente y crea un asistente
            inteligente que atiende a tus clientes 24/7. Sin código, sin complicaciones.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="https://foxbot.cl/register"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 28px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "15px",
                textDecoration: "none",
                transition: "all 0.2s",
                boxShadow: "0 4px 20px rgba(16,185,129,0.3)",
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.transform = "translateY(-2px)";
                (e.target as HTMLElement).style.boxShadow = "0 8px 30px rgba(16,185,129,0.4)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.transform = "translateY(0)";
                (e.target as HTMLElement).style.boxShadow = "0 4px 20px rgba(16,185,129,0.3)";
              }}
            >
              Crear mi FoxBot Gratis
              <ArrowRight style={{ width: "16px", height: "16px" }} />
            </a>
            <a
              href="https://foxbot.cl/#demo"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 28px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(226,232,240,0.8)",
                fontWeight: 500,
                fontSize: "15px",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.1)",
                transition: "all 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = "rgba(255,255,255,0.08)";
                (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
              }}
            >
              <Play style={{ width: "14px", height: "14px" }} />
              Ver Demo
            </a>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px",
            marginBottom: "80px",
          }}
        >
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            const isHovered = hoveredFeature === i;
            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
                style={{
                  padding: "28px",
                  borderRadius: "16px",
                  background: isHovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isHovered ? `${f.color}30` : "rgba(255,255,255,0.06)"}`,
                  transition: "all 0.3s ease",
                  cursor: "default",
                  transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: `${f.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                  }}
                >
                  <Icon style={{ width: "22px", height: "22px", color: f.color }} />
                </div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    marginBottom: "8px",
                    color: "#e2e8f0",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ fontSize: "14px", color: "rgba(226,232,240,0.5)", lineHeight: 1.6, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div style={{ marginBottom: "80px" }}>
          <div
            style={{
              borderRadius: "20px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              overflow: "hidden",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0",
            }}
          >
            <div style={{ padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <h3
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  marginBottom: "16px",
                  fontFamily: "'Space Grotesk', sans-serif",
                  lineHeight: 1.2,
                }}
              >
                ¿Cómo funciona?
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {[
                  { step: "1", title: "Regístrate gratis", desc: "Crea tu cuenta en foxbot.cl en menos de 30 segundos." },
                  { step: "2", title: "Agrega tu URL", desc: "FoxBot analiza tu sitio web con IA y aprende todo sobre tu negocio automáticamente." },
                  { step: "3", title: "Instala el widget", desc: "Copia un script, pégalo en tu web. Tu chatbot está listo para atender clientes." },
                ].map((s) => (
                  <div key={s.step} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #10b981, #059669)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "14px",
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      {s.step}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "15px", marginBottom: "4px", color: "#e2e8f0" }}>{s.title}</p>
                      <p style={{ fontSize: "13px", color: "rgba(226,232,240,0.5)", margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(245,158,11,0.05))",
                padding: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderLeft: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: "300px",
                  borderRadius: "16px",
                  background: "#1a1a2e",
                  border: "1px solid rgba(255,255,255,0.08)",
                  overflow: "hidden",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                }}
              >
                <div
                  style={{
                    padding: "16px 20px",
                    background: "#10b981",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Bot style={{ width: "18px", height: "18px", color: "#fff" }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "14px", color: "#fff", margin: 0 }}>Tu Negocio Bot</p>
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", margin: 0 }}>● En línea</p>
                  </div>
                </div>
                <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div
                    style={{
                      alignSelf: "flex-start",
                      padding: "10px 14px",
                      borderRadius: "14px 14px 14px 4px",
                      background: "rgba(255,255,255,0.06)",
                      fontSize: "13px",
                      color: "rgba(226,232,240,0.8)",
                      maxWidth: "85%",
                      lineHeight: 1.4,
                    }}
                  >
                    ¡Hola! 👋 Soy el asistente de Tu Negocio. ¿En qué puedo ayudarte hoy?
                  </div>
                  <div
                    style={{
                      alignSelf: "flex-end",
                      padding: "10px 14px",
                      borderRadius: "14px 14px 4px 14px",
                      background: "#10b981",
                      fontSize: "13px",
                      color: "#fff",
                      maxWidth: "85%",
                    }}
                  >
                    ¿Cuáles son sus horarios?
                  </div>
                  <div
                    style={{
                      alignSelf: "flex-start",
                      padding: "10px 14px",
                      borderRadius: "14px 14px 14px 4px",
                      background: "rgba(255,255,255,0.06)",
                      fontSize: "13px",
                      color: "rgba(226,232,240,0.8)",
                      maxWidth: "85%",
                      lineHeight: 1.4,
                    }}
                  >
                    Nuestro horario es de Lunes a Viernes de 9:00 a 18:00. ¿Necesitas agendar una cita? 📅
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "80px" }}>
          <h3
            style={{
              textAlign: "center",
              fontSize: "28px",
              fontWeight: 700,
              marginBottom: "12px",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Planes simples, sin sorpresas
          </h3>
          <p
            style={{
              textAlign: "center",
              fontSize: "15px",
              color: "rgba(226,232,240,0.5)",
              marginBottom: "40px",
            }}
          >
            Empieza gratis y escala cuando lo necesites
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
              maxWidth: "960px",
              margin: "0 auto",
            }}
          >
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                style={{
                  padding: "32px 28px",
                  borderRadius: "16px",
                  background: plan.highlighted
                    ? "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.03))"
                    : "rgba(255,255,255,0.02)",
                  border: plan.highlighted
                    ? "1px solid rgba(16,185,129,0.3)"
                    : "1px solid rgba(255,255,255,0.06)",
                  position: "relative",
                  transition: "all 0.3s",
                }}
              >
                {plan.highlighted && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-12px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      padding: "4px 16px",
                      borderRadius: "999px",
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#fff",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                    }}
                  >
                    Popular
                  </div>
                )}
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: plan.highlighted ? "#10b981" : "rgba(226,232,240,0.6)",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {plan.name}
                </p>
                <div style={{ marginBottom: "20px" }}>
                  <span
                    style={{
                      fontSize: "36px",
                      fontWeight: 700,
                      fontFamily: "'Space Grotesk', sans-serif",
                      color: "#e2e8f0",
                    }}
                  >
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span style={{ fontSize: "14px", color: "rgba(226,232,240,0.4)" }}>{plan.period}</span>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                  {plan.features.map((feat) => (
                    <div key={feat} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <CheckCircle2
                        style={{
                          width: "16px",
                          height: "16px",
                          color: plan.highlighted ? "#10b981" : "rgba(226,232,240,0.3)",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: "14px", color: "rgba(226,232,240,0.7)" }}>{feat}</span>
                    </div>
                  ))}
                </div>
                <a
                  href="https://foxbot.cl/register"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "12px",
                    borderRadius: "10px",
                    background: plan.highlighted
                      ? "linear-gradient(135deg, #10b981, #059669)"
                      : "rgba(255,255,255,0.06)",
                    color: plan.highlighted ? "#fff" : "rgba(226,232,240,0.7)",
                    fontWeight: 600,
                    fontSize: "14px",
                    textDecoration: "none",
                    border: plan.highlighted ? "none" : "1px solid rgba(255,255,255,0.1)",
                    transition: "all 0.2s",
                    cursor: "pointer",
                  }}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            padding: "48px 32px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(245,158,11,0.05))",
            border: "1px solid rgba(16,185,129,0.15)",
          }}
        >
          <h3
            style={{
              fontSize: "24px",
              fontWeight: 700,
              marginBottom: "12px",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            ¿Listo para automatizar la atención de tu negocio?
          </h3>
          <p
            style={{
              fontSize: "15px",
              color: "rgba(226,232,240,0.6)",
              marginBottom: "24px",
              maxWidth: "500px",
              margin: "0 auto 24px",
            }}
          >
            Únete a los negocios que ya usan FoxBot para atender clientes 24/7 con inteligencia artificial.
          </p>
          <a
            href="https://foxbot.cl"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "14px 32px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#fff",
              fontWeight: 600,
              fontSize: "15px",
              textDecoration: "none",
              boxShadow: "0 4px 20px rgba(16,185,129,0.3)",
              transition: "all 0.2s",
              cursor: "pointer",
            }}
          >
            Ir a foxbot.cl
            <ExternalLink style={{ width: "16px", height: "16px" }} />
          </a>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #foxbot [style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          #foxbot [style*="border-left"] {
            border-left: none !important;
            border-top: 1px solid rgba(255,255,255,0.06) !important;
          }
        }
      `}</style>
    </section>
  );
}
