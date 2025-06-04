
"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import type { User } from "@/types";
import { useEffect, useRef } from "react";

export type UserFormValues = {
  username: string;
  email: string;
  role: 'admin' | 'user';
  password?: string;
  confirmPassword?: string;
};

const userFormSchemaForAdd = z.object({
  username: z.string({ required_error: "Nome de usuário é obrigatório." })
    .trim()
    .nonempty({ message: "Nome de usuário não pode ser vazio." })
    .min(3, { message: "O nome de usuário deve ter pelo menos 3 caracteres."})
    .max(20, { message: "O nome de usuário não pode exceder 20 caracteres."})
    .regex(/^[a-zA-Z0-9_.-]+$/, { message: "Nome de usuário pode conter apenas letras, números, '.', '_' ou '-'."}),
  email: z.string({ required_error: "Email é obrigatório." })
    .trim()
    .nonempty({ message: "Email não pode ser vazio." })
    .email({ message: "Email inválido." }),
  role: z.enum(['admin', 'user'], { required_error: "Selecione um papel para o usuário." }),
  password: z.string({ required_error: "Senha é obrigatória." })
    .trim()
    .nonempty({ message: "Senha não pode ser vazia."})
    .min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  confirmPassword: z.string({ required_error: "Confirmação de senha é obrigatória." })
    .trim()
    .nonempty({ message: "Confirmação de senha não pode ser vazia."})
    .min(6, { message: "A confirmação de senha deve ter pelo menos 6 caracteres." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

const userFormSchemaForEdit = z.object({
  username: z.string({ required_error: "Nome de usuário é obrigatório." })
    .trim()
    .nonempty({ message: "Nome de usuário não pode ser vazio." })
    .min(3, { message: "O nome de usuário deve ter pelo menos 3 caracteres."})
    .max(20, { message: "O nome de usuário não pode exceder 20 caracteres."})
    .regex(/^[a-zA-Z0-9_.-]+$/, { message: "Nome de usuário pode conter apenas letras, números, '.', '_' ou '-'."}),
  email: z.string().trim().email({message: "Email inválido."}).optional().or(z.literal("")),
  role: z.enum(['admin', 'user'], { required_error: "Selecione um papel para o usuário." }),
});


interface UserFormProps {
  user?: User | null;
  onSubmit: (data: UserFormValues) => Promise<void>;
  onClose: () => void;
  currentUserIsAdmin?: boolean;
  editingSelf?: boolean;
}

export function UserForm({ user, onSubmit, onClose, currentUserIsAdmin, editingSelf }: UserFormProps) {
  const isEditing = !!user;
  const isEditingFfAdmin = user?.username === 'ff.admin';

  const form = useForm<UserFormValues>({
    resolver: zodResolver(isEditing ? userFormSchemaForEdit : userFormSchemaForAdd),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      role: user?.role || "user",
      password: "",
      confirmPassword: "",
    },
  });

  const prevUserRef = useRef<User | null | undefined>(user);

  useEffect(() => {
    if (prevUserRef.current !== user) {
      form.reset({
          username: user?.username || "",
          email: user?.email || "",
          role: user?.role || "user",
          password: "",
          confirmPassword: "",
      });
      prevUserRef.current = user;
    }
  }, [user, form, form.reset]);


  const handleSubmit = async (data: UserFormValues) => {
    console.log('UserForm handleSubmit data (raw from RHF):', JSON.stringify(data, null, 2));

    if (!isEditing) {
      const trimmedPassword = data.password?.trim() ?? "";
      if (trimmedPassword === "" || trimmedPassword.length < 6) {
        console.error("MANUAL CHECK FAIL (UserForm): Password is empty or too short BEFORE calling onSubmit prop.", { passwordValue: data.password });
        form.setError("password", { type: "manual", message: "A senha é obrigatória e deve ter pelo menos 6 caracteres." });
        if (data.password !== data.confirmPassword) {
             form.setError("confirmPassword", { type: "manual", message: "As senhas não coincidem." });
        }
        return;
      }
    }

    if (isEditingFfAdmin) {
      if (data.username !== 'ff.admin') {
        form.setError("username", { message: "O nome de usuário 'ff.admin' não pode ser alterado."});
        return;
      }
      if (data.role !== 'admin') {
         form.setError("role", { message: "O papel de 'ff.admin' não pode ser alterado."});
        return;
      }
    }

    try {
      await onSubmit(data);
      if (!isEditing) {
          form.reset({
              username: "",
              email: "",
              role: "user",
              password: "",
              confirmPassword: ""
          });
      }
    } catch (error) {
      console.error("Error during UserForm onSubmit prop call:", error);
      // Errors from onSubmit (e.g., from AppDataContext) should be handled by the parent component (AdminUsersPage) to show toasts.
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuário" : "Adicionar Novo Usuário"}</DialogTitle>
          <DialogDescription>
            {user ? "Atualize os dados do usuário." : "Preencha os dados para adicionar um novo usuário."}
            {!isEditing && " A senha é obrigatória para novos usuários."}
          </DialogDescription>
        </DialogHeader>

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="username">Nome de Usuário</FormLabel>
              <FormControl>
                <Input id="username" placeholder="Ex: joao.silva" {...field} disabled={isEditingFfAdmin} autoComplete="username" />
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
              <FormLabel htmlFor="email">Email (para login)</FormLabel>
              <FormControl>
                <Input id="email" type="email" placeholder="Ex: usuario@dominio.com" {...field} autoComplete="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isEditing && (
          <>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="password">Senha</FormLabel>
                  <FormControl>
                    <Input id="password" type="password" placeholder="Mínimo 6 caracteres" {...field} autoComplete="new-password" />
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
                  <FormLabel htmlFor="confirmPassword">Confirmar Senha</FormLabel>
                  <FormControl>
                    <Input id="confirmPassword" type="password" placeholder="Repita a senha" {...field} autoComplete="new-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Papel (Role)</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isEditingFfAdmin || (editingSelf && !currentUserIsAdmin)}
              >
                <FormControl>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Selecione o papel" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter className="mt-8">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={() => {
                onClose();
            }}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : (user ? "Salvar Alterações" : "Adicionar Usuário")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
