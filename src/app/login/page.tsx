
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, LogIn, Loader2, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z.string().min(1, { message: 'Senha é obrigatória.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, loadingAuth } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setLoginError(null);
    try {
      const success = await login(data.email, data.password);
      if (!success) {
        // Error message is now set within the login function of AuthContext
        // setLoginError('Email ou senha inválidos.'); 
      }
      // O redirecionamento é tratado pelo AuthContext via onAuthStateChanged
    } catch (error: any) {
      // Specific error messages are now set by the login function in AuthContext
      // setLoginError(error.message || 'Ocorreu um erro ao tentar fazer login.');
    }
    setIsSubmitting(false);
  };

  if (loadingAuth && !form.formState.isDirty) { // Show loader only if auth is loading and form hasn't been touched
     return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height,0px))] flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/30">
      <Card className="w-full max-w-sm sm:max-w-md shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="text-center bg-card-foreground/5 p-6 sm:p-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
            <LogIn className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Bem-vindo!</CardTitle>
          <CardDescription className="text-muted-foreground">Acesse sua conta para gerenciar clientes e projetos. Novos usuários devem solicitar seu cadastro.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {loginError && ( // loginError will be set by AuthContext now
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="font-semibold">Erro de Login</AlertTitle>
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                autoComplete="email"
                className="text-base"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-medium">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...form.register('password')}
                  autoComplete="current-password"
                  className="text-base pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 flex items-center justify-center h-full px-3 text-foreground hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full text-base py-3" disabled={isSubmitting || loadingAuth}>
              {(isSubmitting || loadingAuth) && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {(isSubmitting || loadingAuth) ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-center text-sm text-muted-foreground p-4 bg-card-foreground/5">
          <p>&copy; {new Date().getFullYear()} Projetex | FastFilms</p>
        </CardFooter>
      </Card>
    </div>
  );
}
