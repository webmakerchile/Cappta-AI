import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, LogIn } from "lucide-react";
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-6">
          <a href="/">
            <img src={logoSinFondo} alt="FoxBot" className="w-16 h-16 object-contain" data-testid="img-login-logo" />
          </a>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-login-title">
            Iniciar sesion
          </h1>
          <p className="text-sm text-muted-foreground text-center" data-testid="text-login-subtitle">
            Accede a tu panel de FoxBot
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Login</CardTitle>
            <CardDescription>Ingresa tus credenciales para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electronico</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="tu@empresa.com"
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
                      <FormLabel>Contrasena</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Tu contrasena"
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
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-login-submit"
                >
                  {loginMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  {loginMutation.isPending ? "Iniciando sesion..." : "Iniciar sesion"}
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              <span data-testid="text-login-register-link">
                No tienes cuenta?{" "}
                <a href="/register" className="text-primary font-medium" data-testid="link-go-to-register">
                  Registrate
                </a>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}