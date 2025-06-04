
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

// Combined type for all possible form values
export type UserFormValues = {
  username: string;
  email: string;
  role: 'admin' | 'user';
  password?: string; // Used for new password in add mode, or new password when editing self
  confirmPassword?: string; // Used for confirm password in add mode, or confirm new password when editing self
};

// Schema for adding a new user (password is required)
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

// Schema for editing an existing user
const userFormSchemaForEdit = z.object({
  username: z.string({ required_error: "Nome de usuário é obrigatório." })
    .trim()
    .nonempty({ message: "Nome de usuário não pode ser vazio." })
    .min(3, { message: "O nome de usuário deve ter pelo menos 3 caracteres."})
    .max(20, { message: "O nome de usuário não pode exceder 20 caracteres."})
    .regex(/^[a-zA-Z0-9_.-]+$/, { message: "Nome de usuário pode conter apenas letras, números, '.', '_' ou '-'."}),
  email: z.string().trim().email({message: "Email inválido."}).optional().or(z.literal("")),
  role: z.enum(['admin', 'user'], { required_error: "Selecione um papel para o usuário." }),
  password: z.string().optional(), // For new password when editing self, optional
  confirmPassword: z.string().optional(), // For confirming new password when editing self, optional
}).superRefine((data, ctx) => {
  const newPassword = data.password?.trim();
  const confirmNewPassword = data.confirmPassword?.trim();

  // This validation logic only applies if password fields are intended to be used (i.e., editing self)
  // The fields themselves will be conditionally rendered, but if they are submitted (e.g. by a bug or future change),
  // this validation should still hold.
  if (newPassword || confirmNewPassword) { // Only validate if either password field is touched
    if (newPassword && newPassword.length > 0) {
      if (newPassword.length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 6,
          type: "string",
          inclusive: true,
          message: "A nova senha deve ter pelo menos 6 caracteres.",
          path: ["password"],
        });
      }
      if (!confirmNewPassword || confirmNewPassword.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Confirmação de nova senha é obrigatória.",
          path: ["confirmPassword"],
        });
      } else if (newPassword !== confirmNewPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "As novas senhas não coincidem.",
          path: ["confirmPassword"],
        });
      }
    } else if (confirmNewPassword && confirmNewPassword.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nova senha é obrigatória se a confirmação for preenchida.",
        path: ["password"],
      });
    }
  }
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
  const showPasswordFieldsForEdit = isEditing && editingSelf && !isEditingFfAdmin;

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
    if (isEditingFfAdmin) {
      if (data.username !== 'ff.admin') {
        form.setError("username", { message: "O nome de usuário 'ff.admin' não pode ser alterado."});
        return;
      }
      if (data.role !== 'admin') {
         form.setError("role", { message: "O papel de 'ff.admin' não pode ser alterado."});
        return;
      }
      // Password for ff.admin is not managed here
    }
    
    try {
      // If not editing self, ensure password fields are not part of the submitted data
      const submissionData = { ...data };
      if (isEditing && !editingSelf) {
        delete submissionData.password;
        delete submissionData.confirmPassword;
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
    } catch (error) {
      console.error("Error during UserForm onSubmit prop call:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuário" : "Adicionar Novo Usuário"}</DialogTitle>
          <DialogDescription>
            {user ? `Atualize os dados do usuário ${user.username}.` : "Preencha os dados para adicionar um novo usuário."}
            {!isEditing && " A senha é obrigatória para novos usuários."}
            {showPasswordFieldsForEdit && " Para alterar sua senha, preencha os campos de nova senha."}
          </DialogDescription>
        </DialogHeader>

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="username-input">Nome de Usuário</FormLabel>
              <FormControl>
                <Input id="username-input" placeholder="Ex: joao.silva" {...field} disabled={isEditingFfAdmin} autoComplete="username" />
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
              <FormLabel htmlFor="email-input">Email (para login)</FormLabel>
              <FormControl>
                <Input id="email-input" type="email" placeholder="Ex: usuario@dominio.com" {...field} autoComplete="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password fields for adding a new user */}
        {!isEditing && (
          <>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="password-input">Senha</FormLabel>
                  <FormControl>
                    <Input id="password-input" type="password" placeholder="Mínimo 6 caracteres" {...field} autoComplete="new-password" />
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
                  <FormLabel htmlFor="confirmPassword-input">Confirmar Senha</FormLabel>
                  <FormControl>
                    <Input id="confirmPassword-input" type="password" placeholder="Repita a senha" {...field} autoComplete="new-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* Password fields for editing self */}
        {showPasswordFieldsForEdit && (
          <>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="new-password-input">Nova Senha (deixe em branco para não alterar)</FormLabel>
                  <FormControl>
                    <Input id="new-password-input" type="password" placeholder="Mínimo 6 caracteres" {...field} autoComplete="new-password" />
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
                  <FormLabel htmlFor="confirm-new-password-input">Confirmar Nova Senha</FormLabel>
                  <FormControl>
                    <Input id="confirm-new-password-input" type="password" placeholder="Repita a nova senha" {...field} autoComplete="new-password" />
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
              <FormLabel htmlFor="role-select">Papel (Role)</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isEditingFfAdmin || (editingSelf && user?.username === 'ff.admin')} // ff.admin cannot change its own role, nor can others change it.
              >
                <FormControl>
                  <SelectTrigger id="role-select">
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
