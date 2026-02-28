import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { guestFormSchema, type GuestForm } from "@shared/schema";
import { Mail, ArrowRight, Headphones, X, AlertCircle, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
}

const PROBLEM_TYPES = [
  { value: "compra", label: "Quiero comprar un producto" },
  { value: "codigo_verificacion", label: "Necesito un nuevo codigo de verificacion" },
  { value: "candado_juego", label: "Me aparece un candado en mi juego" },
  { value: "estado_pedido", label: "Quiero saber el estado de mi pedido" },
  { value: "problema_plus", label: "Tengo problemas con mi plus" },
  { value: "otro", label: "Otro" },
];

export function WelcomeForm({ onSubmit, onClose, brandColor, brandName, welcomeMessage }: WelcomeFormProps) {
  const form = useForm<GuestForm>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {
      name: "",
      email: "",
      problemType: "",
      gameName: "",
    },
  });

  const handleSubmit = (data: GuestForm) => {
    onSubmit(data.email, data.name, data.problemType, data.gameName);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: brandColor || "#6200EA" }}>
        <div className="flex items-center gap-2">
          <Headphones className="w-4 h-4 text-white" />
          <span className="text-sm font-semibold text-white">{brandName || "Chat de Soporte"}</span>
        </div>
        <button
          data-testid="button-close-welcome"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center transition-colors hover:bg-white/25"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
      <div className="flex flex-col items-center pt-3 pb-2 px-4 sm:px-6">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#6200EA]/20 flex items-center justify-center mb-2 sm:mb-3 border border-[#6200EA]/30">
          <Headphones className="w-6 h-6 sm:w-7 sm:h-7 text-[#6200EA]" />
        </div>
        <h2 data-testid="text-welcome-title" className="text-base sm:text-lg font-bold text-white mb-0.5 sm:mb-1">{welcomeMessage || "Bienvenido"}</h2>
        <p data-testid="text-welcome-subtitle" className="text-[11px] sm:text-xs text-white/50 text-center">
          Completa tus datos para iniciar la conversacion
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-2.5 sm:gap-3 px-4 sm:px-6 pb-3 sm:pb-4 flex-1 overflow-y-auto chat-scrollbar">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="text-[11px] font-medium text-white/60 uppercase tracking-wider">
                  Correo electronico
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 z-10" />
                    <Input
                      data-testid="input-email"
                      type="email"
                      {...field}
                      placeholder="tu@correo.com"
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-[#6200EA] focus-visible:border-[#6200EA]"
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-red-400" data-testid="error-email" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="problemType"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="text-[11px] font-medium text-white/60 uppercase tracking-wider">
                  Tipo de consulta
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger
                      data-testid="select-problem-type"
                      className="bg-white/5 border-white/10 text-white focus:ring-[#6200EA] focus:border-[#6200EA] [&>span]:text-white/25 [&[data-state=closed]>span:not(:empty)]:text-white"
                    >
                      <SelectValue placeholder="Selecciona una opcion" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-[#2a2a2a] border-white/10">
                    {PROBLEM_TYPES.map((type) => (
                      <SelectItem
                        key={type.value}
                        value={type.value}
                        data-testid={`option-problem-${type.value}`}
                        className="text-white/80 focus:bg-[#6200EA]/20 focus:text-white"
                      >
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs text-red-400" data-testid="error-problem-type" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gameName"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="text-[11px] font-medium text-white/60 uppercase tracking-wider">
                  Seleccionar juego
                </FormLabel>
                <FormControl>
                  <ProductSelector
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Buscar juego o producto..."
                    dataTestId="input-game-name"
                  />
                </FormControl>
                <FormMessage className="text-xs text-red-400" data-testid="error-game-name" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1">
                <FormLabel className="text-[11px] font-medium text-white/60 uppercase tracking-wider">
                  Tu nombre
                </FormLabel>
                <FormControl>
                  <Input
                    data-testid="input-name"
                    type="text"
                    {...field}
                    placeholder="Nombre"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-[#6200EA] focus-visible:border-[#6200EA]"
                  />
                </FormControl>
                <FormMessage className="text-xs text-red-400" data-testid="error-name" />
              </FormItem>
            )}
          />

          <div className="flex-1 min-h-2" />

          <Button
            data-testid="button-start-chat"
            type="submit"
            className="w-full text-white"
            style={{ backgroundColor: brandColor || "#6200EA", borderColor: brandColor || "#6200EA" }}
          >
            Iniciar Chat
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>
      </Form>
    </div>
  );
}
