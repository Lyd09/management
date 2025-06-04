
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
  password?: string; // Used for new password in add mode, or new password in edit mode
  confirmPassword?: string; // Used for confirm password in add mode, or confirm new password in edit mode
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

// Schema for editing an existing user (password is optional)
const userFormSchemaForEdit = z.object({
  username: z.string({ required_error: "Nome de usuário é obrigatório." })
    .trim()
    .nonempty({ message: "Nome de usuário não pode ser vazio." })
    .min(3, { message: "O nome de usuário deve ter pelo menos 3 caracteres."})
    .max(20, { message: "O nome de usuário não pode exceder 20 caracteres."})
    .regex(/^[a-zA-Z0-9_.-]+$/, { message: "Nome de usuário pode conter apenas letras, números, '.', '_' ou '-'."}),
  email: z.string().trim().email({message: "Email inválido."}).optional().or(z.literal("")),
  role: z.enum(['admin', 'user'], { required_error: "Selecione um papel para o usuário." }),
  password: z.string().optional(), // For new password, optional
  confirmPassword: z.string().optional(), // For confirming new password, optional
}).superRefine((data, ctx) => {
  const newPassword = data.password?.trim();
  const confirmNewPassword = data.confirmPassword?.trim();

  if (newPassword && newPassword.length > 0) { // If newPassword is provided
    if (newPassword.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 6,
        type: "string",
        inclusive: true,
        message: "A nova senha deve ter pelo menos 6 caracteres.",
        path: ["password"], // Path for new password field
      });
    }
    if (!confirmNewPassword || confirmNewPassword.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Confirmação de nova senha é obrigatória.",
        path: ["confirmPassword"], // Path for confirm new password field
      });
    } else if (newPassword !== confirmNewPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "As novas senhas não coincidem.",
        path: ["confirmPassword"], // Path for confirm new password field
      });
    }
  } else if (confirmNewPassword && confirmNewPassword.length > 0) { // If only confirmNewPassword is provided
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Nova senha é obrigatória se a confirmação for preenchida.",
      path: ["password"], // Path for new password field
    });
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

  const form = useForm<UserFormValues>({
    resolver: zodResolver(isEditing ? userFormSchemaForEdit : userFormSchemaForAdd),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      role: user?.role || "user",
      password: "", // Will serve as 'new password' in edit mode
      confirmPassword: "", // Will serve as 'confirm new password' in edit mode
    },
  });

  const prevUserRef = useRef<User | null | undefined>(user);

  useEffect(() => {
    if (prevUserRef.current !== user) {
      form.reset({
          username: user?.username || "",
          email: user?.email || "",
          role: user?.role || "user",
          password: "", // Reset password fields for new/edit
          confirmPassword: "",
      });
      prevUserRef.current = user;
    }
  }, [user, form, form.reset]);


  const handleSubmit = async (data: UserFormValues) => {
    // console.log('UserForm handleSubmit data (raw from RHF):', JSON.stringify(data, null, 2));
    
    // This manual check was for add mode; Zod now handles it.
    // if (!isEditing) {
    //   const trimmedPassword = data.password?.trim() ?? "";
    //   if (trimmedPassword === "" || trimmedPassword.length < 6) {
    //     console.error("MANUAL CHECK FAIL (UserForm): Password is empty or too short BEFORE calling onSubmit prop.", { passwordValue: data.password });
    //     form.setError("password", { type: "manual", message: "A senha é obrigatória e deve ter pelo menos 6 caracteres." });
    //     if (data.password !== data.confirmPassword) {
    //          form.setError("confirmPassword", { type: "manual", message: "As senhas não coincidem." });
    //     }
    //     return;
    //   }
    // }

    if (isEditingFfAdmin) {
      if (data.username !== 'ff.admin') {
        form.setError("username", { message: "O nome de usuário 'ff.admin' não pode ser alterado."});
        return;
      }
      if (data.role !== 'admin') {
         form.setError("role", { message: "O papel de 'ff.admin' não pode ser alterado."});
        return;
      }
      if (data.password && data.password.length > 0) {
        form.setError("password", {message: "A senha de 'ff.admin' não pode ser alterada através deste formulário."});
        return;
      }
    }
    
    try {
      await onSubmit(data); // data will include password and confirmPassword if user is adding/editing password
      // Reset logic:
      // If adding: reset all fields to blank.
      // If editing: the dialog closes, so the form instance is unmounted/re-mounted with new defaults if opened again.
      // Explicit reset here for adding is fine. For editing, it's less critical due to dialog lifecycle.
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
      // Errors from onSubmit (e.g., from AppDataContext) should be handled by the parent component (AdminUsersPage) to show toasts.
      console.error("Error during UserForm onSubmit prop call:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuário" : "Adicionar Novo Usuário"}</DialogTitle>
          <DialogDescription>
            {user ? "Atualize os dados do usuário. Para alterar a senha, preencha os campos de nova senha." : "Preencha os dados para adicionar um novo usuário."}
            {!isEditing && " A senha é obrigatória para novos usuários."}
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

        {/* Password fields: always shown for add, shown for edit (for new password) unless editing ff.admin */}
        {( !isEditing || (isEditing && !isEditingFfAdmin) ) && (
          <>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="password-input">{isEditing ? "Nova Senha (deixe em branco para não alterar)" : "Senha"}</FormLabel>
                  <FormControl>
                    <Input id="password-input" type="password" placeholder={isEditing ? "Mínimo 6 caracteres" : "Mínimo 6 caracteres"} {...field} autoComplete={isEditing ? "new-password" : "new-password"} />
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
                  <FormLabel htmlFor="confirmPassword-input">{isEditing ? "Confirmar Nova Senha" : "Confirmar Senha"}</FormLabel>
                  <FormControl>
                    <Input id="confirmPassword-input" type="password" placeholder={isEditing ? "Repita a nova senha" : "Repita a senha"} {...field} autoComplete={isEditing ? "new-password" : "new-password"} />
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
                disabled={isEditingFfAdmin || (editingSelf && !currentUserIsAdmin)}
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

