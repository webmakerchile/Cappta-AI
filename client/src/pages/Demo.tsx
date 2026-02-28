import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  ArrowRight,
  Bot,
  Loader2,
} from "lucide-react";
import logoSinFondo from "@assets/Logo_sin_fondo_1772247619250.png";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Hola, que productos tienen?",
  "Tienen el iPhone 15 Pro?",
  "Que es FoxBot?",
  "Cuanto cuesta un plan Pro?",
  "Como integro el chatbot en mi tienda?",
];

export default function Demo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Demo - FoxBot by Web Maker Chile";
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading) return;

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
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Error al enviar mensaje");
        setIsLoading(false);
        return;
      }

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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" data-testid="demo-page">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md" data-testid="demo-nav">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </a>
            <img src={logoSinFondo} alt="FoxBot" className="w-8 h-8 object-contain" />
            <span className="text-lg font-extrabold">
              <span className="text-primary">Fox</span><span className="text-accent">Bot</span>
            </span>
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
              DEMO
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={resetChat} data-testid="button-reset-chat">
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Nueva
            </Button>
            <a href="/register">
              <Button size="sm" data-testid="button-demo-register">
                Registrarse
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </a>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4" data-testid="demo-messages">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4">
              <div className="relative mb-6">
                <img src={logoSinFondo} alt="FoxBot" className="w-20 h-20 object-contain" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2" data-testid="text-demo-title">Prueba FoxBot en vivo</h2>
              <p className="text-muted-foreground text-sm mb-8 max-w-md leading-relaxed">
                Este es un chatbot demo simulando una tienda de tecnologia. 
                Pregunta sobre productos, precios, o sobre lo que FoxBot puede hacer por tu negocio.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {SUGGESTIONS.map((s, i) => (
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
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[11px] text-primary font-semibold">FoxBot</span>
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
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">FoxBot esta pensando...</span>
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
          <form onSubmit={handleSubmit} className="flex items-center gap-2" data-testid="form-demo-chat">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              maxLength={500}
              disabled={isLoading}
              className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all disabled:opacity-50"
              data-testid="input-demo-message"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="shrink-0"
              data-testid="button-send-demo"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            Demo limitada a 30 mensajes/hora. <a href="/register" className="text-primary hover:underline">Registrate gratis</a> para usar FoxBot sin limites.
          </p>
        </div>
      </div>
    </div>
  );
}
