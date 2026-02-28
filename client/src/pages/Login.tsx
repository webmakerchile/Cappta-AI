import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Loader2, LogIn, ArrowLeft, Sparkles, Bot } from "lucide-react";
import logoSinFondo from "@assets/Logo_sin_fondo_1772247619250.png";

const loginSchema = z.object({
  email: z.string().email("Ingresa un correo valido"),
  password: z.string().min(1, "Ingresa tu contrasena"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const res = await apiRequest("POST", "/api/tenants/login", data);
      return res.json();
    },
    onSuccess: (data: { token: string }) => {
      localStorage.setItem("tenant_token", data.token);
      toast({
        title: "Sesion iniciada",
        description: "Bienvenido de vuelta.",
      });
      window.location.href = "/dashboard";
    },
    onError: (error: Error) => {
      toast({
        title: "Error al iniciar sesion",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: LoginForm) {
    loginMutation.mutate(data);
  }

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full animate-orb-drift" style={{ background: "radial-gradient(circle, hsl(142, 72%, 40%, 0.07) 0%, transparent 60%)" }} />
        <div className="absolute bottom-[-200px] left-[-100px] w-[500px] h-[500px] rounded-full animate-orb-drift" style={{ background: "radial-gradient(circle, hsl(30, 90%, 52%, 0.05) 0%, transparent 60%)", animationDelay: "-10s" }} />
        <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 rounded-full bg-primary/20 animate-float" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 rounded-full bg-accent/20 animate-float" style={{ animationDelay: "-3s" }} />
      </div>

      <div className="hidden lg:flex w-[45%] relative items-center justify-center p-12">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, transparent 50%, rgba(245, 158, 11, 0.02) 100%)" }} />
        <div className="absolute top-0 right-0 w-px h-full" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(16,185,129,0.1) 30%, rgba(16,185,129,0.1) 70%, transparent 100%)" }} />

        <div className="relative max-w-sm text-center">
          <div className="relative mb-10 mx-auto w-fit">
            <div className="w-32 h-32 rounded-3xl glass-card flex items-center justify-center animate-float" style={{ boxShadow: "0 0 80px rgba(16, 185, 129, 0.08)" }}>
              <img src={logoSinFondo} alt="FoxBot" className="w-24 h-24 object-contain" />
            </div>
            <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, hsl(142, 72%, 32%) 0%, hsl(150, 60%, 28%) 100%)" }}>
              <Bot className="w-6 h-6 text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-black mb-4">
            <span className="text-gradient-green">Fox</span><span className="text-gradient-orange">Bot</span>
          </h2>
          <p className="text-white/40 text-sm leading-relaxed mb-8">
            Tu asistente de ventas con IA que nunca duerme. Atiende, recomienda y cierra ventas automaticamente.
          </p>

          <div className="space-y-4">
            {[
              { text: "IA que entiende a tus clientes", icon: Sparkles },
              { text: "Conecta cualquier plataforma", icon: Bot },
            ].map(({ text, icon: Icon }) => (
              <div key={text} className="flex items-center gap-3 glass-card rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-white/50">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          <a href="/" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-primary transition-colors mb-8 group" data-testid="link-back-home">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver al inicio
          </a>

          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src={logoSinFondo} alt="FoxBot" className="w-12 h-12 object-contain" />
            <span className="text-2xl font-extrabold">
              <span className="text-gradient-green">Fox</span><span className="text-gradient-orange">Bot</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-foreground mb-2" data-testid="text-login-title">
              Bienvenido de vuelta
            </h1>
            <p className="text-white/40" data-testid="text-login-subtitle">
              Inicia sesion para acceder a tu panel de FoxBot
            </p>
          </div>

          <div className="rounded-2xl glass-card p-7">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/60 text-sm font-medium">Correo electronico</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="tu@empresa.com"
                          className="h-12 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40 text-white placeholder:text-white/20"
                          data-testid="input-login-email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/60 text-sm font-medium">Contrasena</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Tu contrasena"
                          className="h-12 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40 text-white placeholder:text-white/20"
                          data-testid="input-login-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary/15 hover:shadow-primary/25 transition-all duration-300 hover:scale-[1.01]"
                  disabled={loginMutation.isPending}
                  data-testid="button-login-submit"
                >
                  {loginMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <LogIn className="w-4 h-4 mr-2" />
                  )}
                  {loginMutation.isPending ? "Iniciando sesion..." : "Iniciar sesion"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 pt-5 border-t border-white/[0.06] text-center text-sm text-white/30">
              <span data-testid="text-login-register-link">
                No tienes cuenta?{" "}
                <a href="/register" className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="link-go-to-register">
                  Registrate gratis
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
