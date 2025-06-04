
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

// Base Zod schema for username (reusable)
const usernameSchema = z.string().min(3, {
  message: "O nome de usuário deve ter pelo menos 3 caracteres.",
}).max(20, {
  message: "O nome de usuário não pode exceder 20 caracteres.",
}).regex(/^[a-zA-Z0-9_.-]+$/, {
  message: "Nome de usuário pode conter apenas letras, números, '.', '_' ou '-'.",
});

// Base Zod schema for role (reusable)
const roleSchema = z.enum(['admin', 'user'], { required_error: "Selecione um papel para o usuário." });

// Schema for ADDING a new user
const userFormSchemaAdd = z.object({
  username: usernameSchema,
  email: z.string().trim().min(1, { message: "Email é obrigatório." }).email({ message: "Email inválido." }),
  role: roleSchema,
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  confirmPassword: z.string().min(6, { message: "Confirmação de senha é obrigatória e deve ter pelo menos 6 caracteres." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"], // Apply error to confirmPassword field
});

// Schema for EDITING an existing user
const userFormSchemaEdit = z.object({
  username: usernameSchema,
  email: z.string().trim().email({ message: "Email inválido." }).optional().or(z.literal("")), // Email can be empty (to signify no change) or a valid email
  role: roleSchema,
  // Password fields are not included for editing in this form
});

// Comprehensive type for form values
export type UserFormValues = {
  username: string;
  email: string; // Will be validated by Zod (required for add, optional/empty for edit)
  role: 'admin' | 'user';
  password?: string; // Only relevant and validated for 'add'
  confirmPassword?: string; // Only relevant and validated for 'add'
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
      email: user?.email || "", // Email defaults to empty, Zod validation handles requirement for add
      role: user?.role || "user",
      password: "", // Always default to empty
      confirmPassword: "", // Always default to empty
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
  }, [user]);


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
    // For "add" (isEditing is false), password will be present in data due to userFormSchemaAdd
    // For "edit" (isEditing is true), password fields are not in userFormSchemaEdit, so data.password will be from defaultValues (empty string) or undefined
    // The onSubmit prop function (handleAddUserSubmit or handleEditUserSubmit) will decide what to do with the password field
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
