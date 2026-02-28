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
import { Loader2, UserPlus, ArrowLeft, Shield, Zap, Bot, Sparkles } from "lucide-react";
import { GoogleSignIn } from "@/components/GoogleSignIn";
import logoSinFondo from "@assets/Logo_sin_fondo_1772247619250.png";

const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Ingresa un correo válido"),
  companyName: z.string().min(2, "El nombre de la empresa debe tener al menos 2 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirma tu contraseña"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const { toast } = useToast();

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      companyName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = urlParams.get("ref") || "";
      const res = await apiRequest("POST", "/api/tenants/register", {
        name: data.name,
        email: data.email,
        companyName: data.companyName,
        password: data.password,
        ...(referralCode ? { referralCode } : {}),
      });
      return res.json();
    },
    onSuccess: (data: { token: string }) => {
      localStorage.setItem("tenant_token", data.token);
      toast({
        title: "Cuenta creada",
        description: "Tu cuenta ha sido creada exitosamente.",
      });
      window.location.href = "/dashboard";
    },
    onError: (error: Error) => {
      toast({
        title: "Error al registrar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: RegisterForm) {
    registerMutation.mutate(data);
  }

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full animate-orb-drift" style={{ background: "radial-gradient(circle, hsl(142, 72%, 40%, 0.07) 0%, transparent 60%)" }} />
        <div className="absolute bottom-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full animate-orb-drift" style={{ background: "radial-gradient(circle, hsl(30, 90%, 52%, 0.05) 0%, transparent 60%)", animationDelay: "-10s" }} />
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-primary/20 animate-float" />
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 rounded-full bg-accent/20 animate-float" style={{ animationDelay: "-3s" }} />
        <div className="absolute top-2/3 left-1/4 w-1 h-1 rounded-full bg-primary/10 animate-float" style={{ animationDelay: "-7s" }} />
      </div>

      <div className="hidden lg:flex w-[45%] relative items-center justify-center p-12">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(245, 158, 11, 0.02) 0%, transparent 50%, rgba(16, 185, 129, 0.03) 100%)" }} />
        <div className="absolute top-0 right-0 w-px h-full" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(16,185,129,0.1) 30%, rgba(16,185,129,0.1) 70%, transparent 100%)" }} />

        <div className="relative max-w-sm text-center">
          <div className="relative mb-10 mx-auto w-fit animate-dash-fade-up">
            <div className="w-32 h-32 rounded-3xl glass-card flex items-center justify-center animate-float" style={{ boxShadow: "0 0 80px rgba(245, 158, 11, 0.06)" }}>
              <img src={logoSinFondo} alt="FoxBot" className="w-24 h-24 object-contain" />
            </div>
            <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg animate-icon-pop dash-stagger-3" style={{ background: "linear-gradient(135deg, hsl(30, 90%, 52%) 0%, hsl(35, 90%, 45%) 100%)" }}>
              <Zap className="w-6 h-6 text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-black mb-4 animate-dash-fade-up dash-stagger-1">
            <span className="text-gradient-green">Fox</span><span className="text-gradient-orange">Bot</span>
          </h2>
          <p className="text-white/40 text-sm leading-relaxed mb-8 animate-dash-fade-up dash-stagger-2">
            Crea tu cuenta gratis y en 5 minutos tendras tu asistente de ventas con IA funcionando en tu sitio web.
          </p>

          <div className="space-y-4">
            {[
              { text: "Sin tarjeta de credito", icon: Shield },
              { text: "Listo en 5 minutos", icon: Zap },
              { text: "IA que aprende de tu negocio", icon: Sparkles },
              { text: "Funciona con cualquier plataforma", icon: Bot },
            ].map(({ text, icon: Icon }, i) => (
              <div key={text} className={`flex items-center gap-3 glass-card glass-card-glow-orange rounded-xl px-4 py-3 animate-dash-slide-right dash-stagger-${i + 2} group cursor-default`}>
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <Icon className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors duration-300">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          <a href="/" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-primary transition-all duration-300 mb-8 group animate-dash-fade-in" data-testid="link-back-home">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
            Volver al inicio
          </a>

          <div className="lg:hidden flex items-center gap-3 mb-8 animate-dash-fade-up">
            <img src={logoSinFondo} alt="FoxBot" className="w-12 h-12 object-contain animate-float" style={{ animationDuration: "8s" }} />
            <span className="text-2xl font-extrabold">
              <span className="text-gradient-green">Fox</span><span className="text-gradient-orange">Bot</span>
            </span>
          </div>

          <div className="mb-8 animate-dash-fade-up dash-stagger-1">
            <h1 className="text-3xl font-black text-foreground mb-2" data-testid="text-register-title">
              Crea tu cuenta
            </h1>
            <p className="text-white/40" data-testid="text-register-subtitle">
              Registra tu empresa y comienza a usar FoxBot gratis
            </p>
          </div>

          <div className="rounded-2xl glass-card p-7 animate-dash-scale-in dash-stagger-2 relative overflow-hidden">
            <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full animate-subtle-breathe" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.06), transparent 60%)" }} />

            <div className="relative mb-5 animate-dash-fade-up dash-stagger-2">
              <GoogleSignIn
                onSuccess={(token) => {
                  localStorage.setItem("tenant_token", token);
                  toast({ title: "Cuenta creada", description: "Tu cuenta ha sido creada con Google." });
                  window.location.href = "/dashboard";
                }}
              />
              <div className="flex items-center gap-3 mt-5">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-xs text-white/20 font-medium">o registrate con email</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 relative">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="animate-dash-fade-up dash-stagger-2">
                        <FormLabel className="text-white/60 text-sm font-medium">Nombre completo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Juan Perez"
                            className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40 text-white placeholder:text-white/20 transition-all duration-300 focus:shadow-[0_0_20px_rgba(16,185,129,0.08)]"
                            data-testid="input-register-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem className="animate-dash-fade-up dash-stagger-3">
                        <FormLabel className="text-white/60 text-sm font-medium">Empresa</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Mi Empresa"
                            className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40 text-white placeholder:text-white/20 transition-all duration-300 focus:shadow-[0_0_20px_rgba(16,185,129,0.08)]"
                            data-testid="input-register-company"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="animate-dash-fade-up dash-stagger-4">
                      <FormLabel className="text-white/60 text-sm font-medium">Correo electrónico</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="tu@empresa.com"
                          className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40 text-white placeholder:text-white/20 transition-all duration-300 focus:shadow-[0_0_20px_rgba(16,185,129,0.08)]"
                          data-testid="input-register-email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="animate-dash-fade-up dash-stagger-5">
                        <FormLabel className="text-white/60 text-sm font-medium">Contraseña</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Min. 6 caracteres"
                            className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40 text-white placeholder:text-white/20 transition-all duration-300 focus:shadow-[0_0_20px_rgba(16,185,129,0.08)]"
                            data-testid="input-register-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem className="animate-dash-fade-up dash-stagger-6">
                        <FormLabel className="text-white/60 text-sm font-medium">Confirmar</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Repite la contraseña"
                            className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] focus:border-primary/40 text-white placeholder:text-white/20 transition-all duration-300 focus:shadow-[0_0_20px_rgba(16,185,129,0.08)]"
                            data-testid="input-register-confirm-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="animate-dash-fade-up dash-stagger-6 pt-1">
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary/15 hover:shadow-primary/25 transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group"
                    disabled={registerMutation.isPending}
                    data-testid="button-register-submit"
                  >
                    <span className="absolute inset-0 animate-shimmer-line opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                    {registerMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <UserPlus className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
                    )}
                    {registerMutation.isPending ? "Creando cuenta..." : "Crear cuenta gratis"}
                  </Button>
                </div>
              </form>
            </Form>

            <div className="mt-6 pt-5 border-t border-white/[0.06] text-center text-sm text-white/30 animate-dash-fade-in dash-stagger-6">
              <span data-testid="text-register-login-link">
                Ya tienes cuenta?{" "}
                <a href="/login" className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="link-go-to-login">
                  Inicia sesión
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
