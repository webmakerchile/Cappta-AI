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
import { Loader2, UserPlus, Building2 } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Ingresa un correo valido"),
  companyName: z.string().min(2, "El nombre de la empresa debe tener al menos 2 caracteres"),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirma tu contrasena"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contrasenas no coinciden",
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
      const res = await apiRequest("POST", "/api/tenants/register", {
        name: data.name,
        email: data.email,
        companyName: data.companyName,
        password: data.password,
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-register-title">
            Crear cuenta
          </h1>
          <p className="text-sm text-muted-foreground text-center" data-testid="text-register-subtitle">
            Registra tu empresa y comienza a usar el chat de soporte con IA
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registro</CardTitle>
            <CardDescription>Completa los datos para crear tu cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre completo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Juan Perez"
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electronico</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="tu@empresa.com"
                          data-testid="input-register-email"
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
                    <FormItem>
                      <FormLabel>Nombre de la empresa</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Mi Empresa S.A."
                          data-testid="input-register-company"
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
                          placeholder="Minimo 6 caracteres"
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
                    <FormItem>
                      <FormLabel>Confirmar contrasena</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Repite tu contrasena"
                          data-testid="input-register-confirm-password"
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
                  disabled={registerMutation.isPending}
                  data-testid="button-register-submit"
                >
                  {registerMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  {registerMutation.isPending ? "Creando cuenta..." : "Crear cuenta"}
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              <span data-testid="text-register-login-link">
                Ya tienes cuenta?{" "}
                <a href="/login" className="text-primary font-medium" data-testid="link-go-to-login">
                  Inicia sesion
                </a>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}