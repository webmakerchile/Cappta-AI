import { useState } from "react";
import { Mail, ArrowRight, Headphones, X, User, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductSelector } from "@/components/ProductSelector";

interface WelcomeFormProps {
  onSubmit: (email: string, name: string, problemType: string, gameName: string) => void;
  onClose: () => void;
  brandColor?: string;
  brandName?: string;
  welcomeMessage?: string;
  welcomeSubtitle?: string;
  consultationOptions?: string;
  showProductSearch?: number;
  productSearchLabel?: string;
}

export function WelcomeForm({
  onSubmit,
  onClose,
  brandColor,
  brandName,
  welcomeMessage,
  welcomeSubtitle,
  consultationOptions: consultationOptionsJson,
  showProductSearch = 0,
  productSearchLabel,
}: WelcomeFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [problemType, setProblemType] = useState("");
  const [gameName, setGameName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const color = brandColor || "#10b981";

  let parsedOptions: { value: string; label: string }[] = [];
  try {
    if (consultationOptionsJson) {
      parsedOptions = JSON.parse(consultationOptionsJson);
    }
  } catch {}

  const hasConsultationField = parsedOptions.length > 0;
  const hasProductSearch = showProductSearch === 1;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Ingresa un correo valido";
    }
    if (!name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    }
    if (hasConsultationField && !problemType) {
      newErrors.problemType = "Selecciona una opcion";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(email, name, problemType, gameName);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between shrink-0" style={{ background: color }}>
        <div className="flex items-center gap-2 min-w-0">
          <Headphones className="w-4 h-4 text-white shrink-0" />
          <span className="text-sm font-semibold text-white truncate">{brandName || "Chat de Soporte"}</span>
        </div>
        <button
          data-testid="button-close-welcome"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center transition-colors hover:bg-white/25 shrink-0"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
      <div className="flex flex-col items-center pt-3 pb-2 px-4 sm:px-6 shrink-0">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-2 sm:mb-3 border" style={{ backgroundColor: `${color}20`, borderColor: `${color}30` }}>
          <Headphones className="w-6 h-6 sm:w-7 sm:h-7" style={{ color }} />
        </div>
        <h2 data-testid="text-welcome-title" className="text-base sm:text-lg font-bold text-white mb-0.5 sm:mb-1">
          {welcomeMessage || "Hola, ¿en que podemos ayudarte?"}
        </h2>
        <p data-testid="text-welcome-subtitle" className="text-[11px] sm:text-xs text-white/50 text-center">
          {welcomeSubtitle || "Completa tus datos para iniciar la conversacion"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 sm:gap-3 px-4 sm:px-6 pb-3 sm:pb-4 flex-1 overflow-y-auto chat-scrollbar">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-white/60 uppercase tracking-wider">
            Correo electronico
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 z-10" />
            <Input
              data-testid="input-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/25"
              style={{ "--tw-ring-color": color } as React.CSSProperties}
            />
          </div>
          {errors.email && <span className="text-xs text-red-400">{errors.email}</span>}
        </div>

        {hasConsultationField && (
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-white/60 uppercase tracking-wider">
              Tipo de consulta
            </label>
            <Select onValueChange={setProblemType} value={problemType}>
              <SelectTrigger
                data-testid="select-problem-type"
                className="bg-white/5 border-white/10 text-white [&>span]:text-white/25 [&[data-state=closed]>span:not(:empty)]:text-white"
              >
                <SelectValue placeholder="Selecciona una opcion" />
              </SelectTrigger>
              <SelectContent className="bg-[#2a2a2a] border-white/10">
                {parsedOptions.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    data-testid={`option-${opt.value}`}
                    className="text-white/80 focus:bg-white/10 focus:text-white"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.problemType && <span className="text-xs text-red-400">{errors.problemType}</span>}
          </div>
        )}

        {hasProductSearch && (
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-white/60 uppercase tracking-wider">
              {productSearchLabel || "Buscar producto"}
            </label>
            <ProductSelector
              value={gameName}
              onChange={setGameName}
              placeholder={productSearchLabel || "Buscar producto..."}
              dataTestId="input-game-name"
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-white/60 uppercase tracking-wider">
            Tu nombre
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 z-10" />
            <Input
              data-testid="input-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre"
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/25"
              style={{ "--tw-ring-color": color } as React.CSSProperties}
            />
          </div>
          {errors.name && <span className="text-xs text-red-400">{errors.name}</span>}
        </div>

        <div className="flex-1 min-h-2" />

        <Button
          data-testid="button-start-chat"
          type="submit"
          className="w-full text-white shrink-0"
          style={{ backgroundColor: color, borderColor: color }}
        >
          Iniciar Chat
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </form>
    </div>
  );
}
