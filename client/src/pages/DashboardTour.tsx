import { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart3,
  Palette,
  Code,
  Download,
  BookOpen,
  CreditCard,
  Headphones,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  MousePointer,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourStep {
  targetTestId: string;
  title: string;
  description: string;
  icon: typeof BarChart3;
  position: "right" | "bottom" | "left";
}

const TOUR_STEPS: TourStep[] = [
  {
    targetTestId: "nav-stats",
    title: "Estadísticas",
    description: "Aquí puedes ver las métricas de tu chatbot en tiempo real: sesiones, mensajes, calificaciones y sesiones activas.",
    icon: BarChart3,
    position: "right",
  },
  {
    targetTestId: "nav-config",
    title: "Configuración",
    description: "Personaliza los colores, logo, mensajes y opciones de tu widget de chat. Los cambios se reflejan en vivo.",
    icon: Palette,
    position: "right",
  },
  {
    targetTestId: "nav-embed",
    title: "Integración",
    description: "Copia el código para instalar el chat en tu sitio web. Funciona con WordPress, Shopify, Wix y cualquier página HTML.",
    icon: Code,
    position: "right",
  },
  {
    targetTestId: "nav-download",
    title: "Descargar App",
    description: "Instala Nexia AI como aplicación en tu celular o computador para recibir notificaciones y responder más rápido.",
    icon: Download,
    position: "right",
  },
  {
    targetTestId: "nav-guides",
    title: "Guías",
    description: "Manuales paso a paso para instalar el chat en cada plataforma: WordPress, Shopify, Wix, Squarespace y más.",
    icon: BookOpen,
    position: "right",
  },
  {
    targetTestId: "nav-plan",
    title: "Plan",
    description: "Gestiona tu suscripción. Mejora tu plan para obtener más sesiones, mensajes y funciones avanzadas.",
    icon: CreditCard,
    position: "right",
  },
  {
    targetTestId: "nav-panel",
    title: "Panel de Soporte",
    description: "Tu centro de operaciones: chats en vivo, atajos de respuesta, etiquetas, productos, base de conocimiento y entrenamiento del bot.",
    icon: Headphones,
    position: "right",
  },
];

interface DashboardTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function DashboardTour({ onComplete, onSkip }: DashboardTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<Record<string, string | number>>({});
  const [highlightStyle, setHighlightStyle] = useState<Record<string, string | number>>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const step = TOUR_STEPS[currentStep];
    const target = document.querySelector(`[data-testid="${step.targetTestId}"]`);
    if (!target) {
      setHighlightStyle({ top: "50%", left: "50%", width: 0, height: 0, borderRadius: "12px", opacity: 0 });
      setTooltipStyle({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" });
      return;
    }

    const rect = target.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    setHighlightStyle({
      top: rect.top - 4,
      left: rect.left - 4,
      width: rect.width + 8,
      height: rect.height + 8,
      borderRadius: "12px",
      opacity: 1,
    });

    let tooltipTop = rect.top - 8;
    let tooltipLeft = rect.right + 16;

    if (tooltipLeft + 320 > vw) {
      tooltipLeft = rect.left - 336;
      if (tooltipLeft < 16) {
        tooltipLeft = Math.max(16, rect.left);
        tooltipTop = rect.bottom + 16;
      }
    }
    if (tooltipTop + 200 > vh) {
      tooltipTop = Math.max(16, vh - 220);
    }
    if (tooltipTop < 16) tooltipTop = 16;

    setTooltipStyle({ top: tooltipTop, left: tooltipLeft });
  }, [currentStep]);

  useEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    const id = setInterval(updatePosition, 500);
    return () => {
      window.removeEventListener("resize", updatePosition);
      clearInterval(id);
    };
  }, [updatePosition]);

  useEffect(() => {
    const step = TOUR_STEPS[currentStep];
    const target = document.querySelector(`[data-testid="${step.targetTestId}"]`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentStep]);

  const next = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[9999]" data-testid="dashboard-tour-overlay">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onSkip} />

      <div
        className="absolute border-2 border-primary transition-all duration-300 pointer-events-none"
        style={{
          ...highlightStyle,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.55), 0 0 20px rgba(16,185,129,0.3)",
        }}
      />

      <div
        ref={tooltipRef}
        className="absolute w-80 max-w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-left-3 duration-300 z-[10000]"
        style={tooltipStyle}
        key={currentStep}
        data-testid={`tour-tooltip-${currentStep}`}
      >
        <div className="rounded-2xl glass-card p-5 space-y-3 border border-primary/20 shadow-xl shadow-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/25 shrink-0">
              <step.icon className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white">{step.title}</h3>
              <span className="text-[10px] text-white/30">{currentStep + 1} de {TOUR_STEPS.length}</span>
            </div>
            <button
              onClick={onSkip}
              className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.12] transition-colors shrink-0"
              data-testid="tour-close"
            >
              <X className="w-3.5 h-3.5 text-white/40" />
            </button>
          </div>

          <p className="text-xs text-white/60 leading-relaxed">{step.description}</p>

          <div className="flex items-center gap-2 pt-1">
            <div className="flex gap-1 flex-1">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === currentStep ? "w-4 bg-primary" : i < currentStep ? "w-2 bg-primary/40" : "w-2 bg-white/10"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={prev}
                  className="h-8 rounded-lg px-3 text-xs border-white/[0.08]"
                  data-testid="tour-prev"
                >
                  <ArrowLeft className="w-3 h-3" />
                </Button>
              )}
              <Button
                onClick={next}
                className="h-8 rounded-lg px-4 text-xs font-bold"
                data-testid="tour-next"
              >
                {currentStep === TOUR_STEPS.length - 1 ? (
                  <><Sparkles className="w-3 h-3 mr-1" /> Listo!</>
                ) : (
                  <>Siguiente <ArrowRight className="w-3 h-3 ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TourPrompt({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="tour-prompt-overlay">
      <div className="rounded-2xl glass-card p-8 max-w-md w-full mx-4 space-y-5 animate-in fade-in zoom-in-95 duration-300 border border-primary/15">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20 animate-float">
            <MousePointer className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-lg font-bold mb-1">¿Quieres un recorrido rápido?</h2>
          <p className="text-sm text-white/40">Te mostramos cada sección del dashboard en 30 segundos</p>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={onStart}
            className="h-12 rounded-xl font-bold text-base w-full"
            data-testid="tour-start"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Si, mostrame!
          </Button>
          <Button
            variant="outline"
            onClick={onSkip}
            className="h-10 rounded-xl border-white/[0.08] text-white/40 w-full"
            data-testid="tour-skip"
          >
            No, ya se como funciona
          </Button>
        </div>
      </div>
    </div>
  );
}
