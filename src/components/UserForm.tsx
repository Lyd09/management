
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
import { useEffect } from "react";

// Esquema base para campos comuns que podem ter requisitos diferentes
const usernameSchema = z.string().min(3, {
  message: "O nome de usuário deve ter pelo menos 3 caracteres.",
}).max(20, {
  message: "O nome de usuário não pode exceder 20 caracteres.",
}).regex(/^[a-zA-Z0-9_.-]+$/, {
  message: "Nome de usuário pode conter apenas letras, números, '.', '_' ou '-'.",
});

const roleSchema = z.enum(['admin', 'user'], { required_error: "Selecione um papel para o usuário." });

// Esquema para ADICIONAR um novo usuário
const userFormSchemaAdd = z.object({
  username: usernameSchema,
  email: z.string().email({ message: "Email inválido." }).min(1, { message: "Email é obrigatório." }), // Email obrigatório e não vazio
  role: roleSchema,
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

// Esquema para EDITAR um usuário existente
const userFormSchemaEdit = z.object({
  username: usernameSchema, // Username ainda validado, mas pode ser desabilitado para edição exceto ff.admin
  email: z.string().email({ message: "Email inválido." }).optional().or(z.literal("")), // Email opcional na edição
  role: roleSchema,
  // Campos de senha não estão presentes para edição neste formulário
});

// Tipo para os valores do formulário, englobando todos os campos possíveis.
// A validação Zod específica (Add ou Edit) cuidará dos requisitos.
export type UserFormValues = {
  username: string;
  email?: string;
  role: 'admin' | 'user';
  password?: string;
  confirmPassword?: string;
};

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
    resolver: zodResolver(isEditing ? userFormSchemaEdit : userFormSchemaAdd),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      role: user?.role || "user",
      password: "",
      confirmPassword: "",
    },
  });
  
  useEffect(() => {
    form.reset({
        username: user?.username || "",
        email: user?.email || "",
        role: user?.role || "user",
        password: "", 
        confirmPassword: "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, form.reset]);


  const handleSubmit = async (data: UserFormValues) => {
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
    await onSubmit(data);
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
              <FormLabel>Nome de Usuário</FormLabel>
              <FormControl>
                <Input placeholder="Ex: joao.silva" {...field} disabled={isEditingFfAdmin} />
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
              <FormLabel>Email (para login)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Ex: usuario@dominio.com" {...field} />
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
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
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
                  <FormLabel>Confirmar Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Repita a senha" {...field} />
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
                defaultValue={field.value}
                value={field.value}
                disabled={isEditingFfAdmin || (editingSelf && !currentUserIsAdmin)} 
              >
                <FormControl>
                  <SelectTrigger>
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
            <Button type="button" variant="outline" onClick={onClose}>
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
