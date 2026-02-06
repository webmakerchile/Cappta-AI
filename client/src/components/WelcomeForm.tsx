import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { guestFormSchema, type GuestForm } from "@shared/schema";
import { User, Mail, ArrowRight, Headphones, X } from "lucide-react";
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

interface WelcomeFormProps {
  onSubmit: (email: string, name: string) => void;
  onClose: () => void;
}

export function WelcomeForm({ onSubmit, onClose }: WelcomeFormProps) {
  const form = useForm<GuestForm>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const handleSubmit = (data: GuestForm) => {
    onSubmit(data.email, data.name);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#6200EA" }}>
        <div className="flex items-center gap-2">
          <Headphones className="w-4 h-4 text-white" />
          <span className="text-sm font-semibold text-white">Chat de Soporte</span>
        </div>
        <button
          data-testid="button-close-welcome"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center transition-colors hover:bg-white/25"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
      <div className="flex flex-col items-center pt-6 pb-4 px-6">
        <div className="w-16 h-16 rounded-full bg-[#6200EA]/20 flex items-center justify-center mb-4 border border-[#6200EA]/30">
          <Headphones className="w-8 h-8 text-[#6200EA]" />
        </div>
        <h2 data-testid="text-welcome-title" className="text-xl font-bold text-white mb-1">Bienvenido</h2>
        <p data-testid="text-welcome-subtitle" className="text-sm text-white/50 text-center">
          Ingresa tus datos para iniciar una conversación con nuestro equipo
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 px-6 pb-6 flex-1">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1.5">
                <FormLabel className="text-xs font-medium text-white/60 uppercase tracking-wider">
                  Nombre
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 z-10" />
                    <Input
                      data-testid="input-name"
                      type="text"
                      {...field}
                      placeholder="Tu nombre"
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-[#6200EA] focus-visible:border-[#6200EA]"
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-red-400" data-testid="error-name" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1.5">
                <FormLabel className="text-xs font-medium text-white/60 uppercase tracking-wider">
                  Correo
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

          <div className="flex-1" />

          <Button
            data-testid="button-start-chat"
            type="submit"
            className="w-full bg-[#6200EA] border-[#6200EA] text-white"
          >
            Iniciar Chat
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>
      </Form>
    </div>
  );
}
