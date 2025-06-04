
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

// Schema for EDITING an existing user (no password fields)
const userFormSchemaForEdit = z.object({
  username: z.string().trim().min(3, {
    message: "O nome de usuário deve ter pelo menos 3 caracteres.",
  }).max(20, {
    message: "O nome de usuário não pode exceder 20 caracteres.",
  }).regex(/^[a-zA-Z0-9_.-]+$/, {
    message: "Nome de usuário pode conter apenas letras, números, '.', '_' ou '-'.",
  }),
  email: z.string().trim().email({ message: "Email inválido." }).optional().or(z.literal("")).or(z.string().trim().nonempty({message: "Email é obrigatório se fornecido."}).email({message: "Email inválido."})), // Allows empty for "no change" or valid email
  role: z.enum(['admin', 'user'], { required_error: "Selecione um papel para o usuário." }),
});

// Schema for ADDING a new user (includes password fields)
const userFormSchemaForAdd = z.object({
  username: z.string().trim().min(3, {
    message: "O nome de usuário deve ter pelo menos 3 caracteres.",
  }).max(20, {
    message: "O nome de usuário não pode exceder 20 caracteres.",
  }).regex(/^[a-zA-Z0-9_.-]+$/, {
    message: "Nome de usuário pode conter apenas letras, números, '.', '_' ou '-'.",
  }),
  email: z.string().trim().nonempty({ message: "Email é obrigatório." }).email({ message: "Email inválido." }),
  role: z.enum(['admin', 'user'], { required_error: "Selecione um papel para o usuário." }),
  password: z.string()
    .trim()
    .refine(val => val !== "", { message: "Senha é obrigatória e não pode ser vazia." })
    .pipe(z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." })),
  confirmPassword: z.string()
    .trim()
    .refine(val => val !== "", { message: "Confirmação de senha é obrigatória e não pode ser vazia." })
    .pipe(z.string().min(6, { message: "Confirmação de senha deve ter pelo menos 6 caracteres." })),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

export type UserFormValues = {
  username: string;
  email: string; // Email is always string, Zod handles if it's empty for edit
  role: 'admin' | 'user';
  password: string; // Always string, Zod handles if it's required for add
  confirmPassword: string; // Always string, Zod handles if it's required for add
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
    resolver: zodResolver(isEditing ? userFormSchemaForEdit : userFormSchemaForAdd),
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
    
    // For editing, if email is an empty string, treat it as "no change" for the onSubmit prop
    // by converting it to undefined, assuming the onSubmit handler and backend can interpret undefined as "no change".
    // However, AppDataContext.updateUser already handles this by filtering out undefined fields.
    // The main thing is that Zod allows an empty string for email during edit.
    const submissionData = { ...data };
    if (isEditing && submissionData.email === "") {
      // userData.email in AppDataContext will become "", which is fine for Firestore, 
      // but Firebase Auth updateEmail might need special handling or might reject empty string.
      // For now, we pass it as is. AppDataContext is already prepared for an optional email in `updateUser`.
    }
    
    await onSubmit(submissionData);
    
    if (!isEditing) { 
        form.reset({ 
            username: "", 
            email: "", 
            role: "user", 
            password: "", 
            confirmPassword: "" 
        });
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
            <Button type="button" variant="outline" onClick={() => {
                onClose();
                form.reset({ // Ensure form reset uses the same default structure
                    username: user?.username || "",
                    email: user?.email || "",
                    role: user?.role || "user",
                    password: "",
                    confirmPassword: ""
                });
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
