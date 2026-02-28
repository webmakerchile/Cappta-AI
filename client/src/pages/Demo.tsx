import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  ArrowRight,
  Bot,
  Loader2,
  Smartphone,
  UtensilsCrossed,
  Shirt,
  HeartPulse,
  Home,
  MessageSquare,
} from "lucide-react";
import logoSinFondo from "@assets/Logo_sin_fondo_1772247619250.png";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface DemoContext {
  id: string;
  name: string;
  business: string;
  description: string;
  icon: typeof Smartphone;
  color: string;
  colorAccent: string;
  suggestions: string[];
}

const DEMO_CONTEXTS: DemoContext[] = [
  {
    id: "tech",
    name: "Tienda de Tecnologia",
    business: "TechStore Chile",
    description: "Smartphones, laptops, accesorios y gadgets tecnologicos",
    icon: Smartphone,
    color: "#0ea5e9",
    colorAccent: "#38bdf8",
    suggestions: [
      "Que smartphones tienen?",
      "Tienen el iPhone 15 Pro?",
      "Busco un notebook gamer",
      "Precios de audifonos",
    ],
  },
  {
    id: "restaurant",
    name: "Restaurante",
    business: "Sabor Criollo",
    description: "Comida chilena, menu del dia, delivery y reservas",
    icon: UtensilsCrossed,
    color: "#ef4444",
    colorAccent: "#f87171",
    suggestions: [
      "Cual es el menu del dia?",
      "Tienen delivery?",
      "Quiero pedir empanadas",
      "Hacen reservas para grupos?",
    ],
  },
  {
    id: "clothing",
    name: "Tienda de Ropa",
    business: "Moda Urbana",
    description: "Ropa, calzado, accesorios y tendencias de moda",
    icon: Shirt,
    color: "#a855f7",
    colorAccent: "#c084fc",
    suggestions: [
      "Que zapatillas tienen?",
      "Busco jeans talla 32",
      "Tienen descuentos?",
      "Politica de cambios?",
    ],
  },
  {
    id: "health",
    name: "Clinica Dental",
    business: "VidaSana",
    description: "Tratamientos dentales, blanqueamiento y ortodoncia",
    icon: HeartPulse,
    color: "#06b6d4",
    colorAccent: "#22d3ee",
    suggestions: [
      "Cuanto cuesta un blanqueamiento?",
      "Quiero agendar una hora",
      "Tienen ortodoncia invisible?",
      "La primera consulta es gratis?",
    ],
  },
  {
    id: "realestate",
    name: "Corredora de Propiedades",
    business: "Hogar Propiedades",
    description: "Departamentos, casas, arriendo y venta en Santiago",
    icon: Home,
    color: "#f59e0b",
    colorAccent: "#fbbf24",
    suggestions: [
      "Busco depto en Providencia",
      "Tienen casas en arriendo?",
      "Rango de precios en Las Condes?",
      "Puedo agendar una visita?",
    ],
  },
];

const MAX_DEMO_MESSAGES = 30;

function ContextSelector({ onSelect }: { onSelect: (ctx: DemoContext) => void }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" data-testid="demo-context-page">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </a>
            <img src={logoSinFondo} alt="FoxBot" className="w-8 h-8 object-contain" />
            <span className="text-lg font-extrabold">
              <span className="text-primary">Fox</span><span className="text-accent">Bot</span>
            </span>
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5">DEMO</Badge>
          </div>
          <a href="/register">
            <Button size="sm" data-testid="button-context-register">
              Registrarse
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </a>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-10">
            <div className="relative inline-block mb-5">
              <img src={logoSinFondo} alt="FoxBot" className="w-16 h-16 object-contain" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-3" data-testid="text-context-title">
              Elige un tipo de negocio para probar
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              FoxBot se adapta a cualquier negocio. Elige un escenario y comprueba como cambia el chatbot
              segun el contexto: respuestas, tono y tematica se ajustan automaticamente.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <MessageSquare className="w-4 h-4 text-accent" />
              <span className="text-sm text-accent font-medium">
                Tienes {MAX_DEMO_MESSAGES} mensajes de prueba gratuitos
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEMO_CONTEXTS.map((ctx) => (
              <Card
                key={ctx.id}
                className="cursor-pointer group transition-all duration-200 hover:border-white/20"
                onClick={() => onSelect(ctx)}
                data-testid={`card-context-${ctx.id}`}
              >
                <CardContent className="pt-6 pb-5 px-5">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0 transition-transform duration-200 group-hover:scale-110"
                      style={{ backgroundColor: `${ctx.color}20` }}
                    >
                      <ctx.icon className="w-5 h-5" style={{ color: ctx.color }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm mb-0.5">{ctx.name}</h3>
                      <p className="text-[11px] font-medium mb-1" style={{ color: ctx.color }}>{ctx.business}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{ctx.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Esto es solo una muestra. Con FoxBot puedes crear el chatbot perfecto para tu negocio, con tu propia base de conocimiento y catalogo real.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Demo() {
  const [selectedContext, setSelectedContext] = useState<DemoContext | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Demo - FoxBot by Web Maker Chile";
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedContext) {
      inputRef.current?.focus();
    }
  }, [selectedContext]);

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading || !selectedContext) return;

    if (messageCount >= MAX_DEMO_MESSAGES) {
      setError("Has usado tus 30 mensajes de prueba. Registrate gratis para seguir usando FoxBot sin limites.");
      return;
    }

    const userMessage: Message = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/demo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, context: selectedContext.id }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setMessageCount(MAX_DEMO_MESSAGES);
        setError(data.message || "Limite de mensajes alcanzado.");
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.message || "Error al enviar mensaje");
        setIsLoading(false);
        return;
      }

      setMessageCount((c) => c + 1);
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function resetChat() {
    setMessages([]);
    setInput("");
    setError(null);
    inputRef.current?.focus();
  }

  function changeContext() {
    setSelectedContext(null);
    setMessages([]);
    setInput("");
    setError(null);
  }

  if (!selectedContext) {
    return <ContextSelector onSelect={setSelectedContext} />;
  }

  const ctx = selectedContext;
  const remaining = MAX_DEMO_MESSAGES - messageCount;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" data-testid="demo-page">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md" data-testid="demo-nav">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={changeContext} className="flex items-center gap-1" data-testid="button-change-context">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ backgroundColor: `${ctx.color}20` }}>
              <ctx.icon className="w-4 h-4" style={{ color: ctx.color }} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight" style={{ color: ctx.color }}>{ctx.business}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">Powered by FoxBot</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-[10px] px-2 py-0.5"
              data-testid="badge-remaining"
            >
              {remaining} mensajes restantes
            </Badge>
            <Button variant="ghost" size="sm" onClick={resetChat} data-testid="button-reset-chat">
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Nueva
            </Button>
            <a href="/register" className="hidden sm:block">
              <Button size="sm" data-testid="button-demo-register">
                Registrarse
              </Button>
            </a>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4" data-testid="demo-messages">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4">
              <div
                className="flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
                style={{ backgroundColor: `${ctx.color}15` }}
              >
                <ctx.icon className="w-8 h-8" style={{ color: ctx.color }} />
              </div>
              <h2 className="text-xl font-bold mb-2" data-testid="text-demo-title">
                Chatea con el asistente de {ctx.business}
              </h2>
              <p className="text-muted-foreground text-sm mb-6 max-w-md leading-relaxed">
                Este es un ejemplo de como FoxBot atiende clientes en una {ctx.name.toLowerCase()}.
                Prueba preguntando lo que quieras.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {ctx.suggestions.map((s, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(s)}
                    data-testid={`button-suggestion-${i}`}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              data-testid={`message-${msg.role}-${i}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "text-white rounded-br-md"
                    : "bg-card border border-border rounded-bl-md"
                }`}
                style={msg.role === "user" ? { backgroundColor: ctx.color } : undefined}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Bot className="w-3.5 h-3.5" style={{ color: ctx.color }} />
                    <span className="text-[11px] font-semibold" style={{ color: ctx.color }}>{ctx.business}</span>
                  </div>
                )}
                <span className="whitespace-pre-wrap">{msg.content}</span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: ctx.color }} />
                  <span className="text-sm text-muted-foreground">Escribiendo...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-xl" data-testid="text-demo-error">
                {error}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border px-4 py-3 bg-background/80 backdrop-blur-sm">
          {remaining <= 0 ? (
            <div className="text-center py-3">
              <p className="text-sm text-muted-foreground mb-3">
                Has usado tus {MAX_DEMO_MESSAGES} mensajes de prueba
              </p>
              <a href="/register">
                <Button data-testid="button-limit-register">
                  Registrate Gratis para Continuar
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </a>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="flex items-center gap-2" data-testid="form-demo-chat">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Pregunta algo a ${ctx.business}...`}
                  maxLength={500}
                  disabled={isLoading}
                  className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-50"
                  style={{ "--tw-ring-color": `${ctx.color}40` } as React.CSSProperties}
                  data-testid="input-demo-message"
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="shrink-0"
                  style={{ backgroundColor: ctx.color }}
                  data-testid="button-send-demo"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-[11px] text-muted-foreground">
                  {remaining} de {MAX_DEMO_MESSAGES} mensajes restantes
                </span>
                <a href="/register" className="text-[11px] text-primary hover:underline">
                  Registrate gratis para mensajes ilimitados
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
