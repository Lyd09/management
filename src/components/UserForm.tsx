
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

// Schema para validação do formulário de usuário
// NOTA: Este formulário NÃO gerencia senhas. A criação de usuários com senha
// deve ser integrada com o Firebase Authentication.
const userFormSchema = z.object({
  username: z.string().min(3, {
    message: "O nome de usuário deve ter pelo menos 3 caracteres.",
  }).max(20, {
    message: "O nome de usuário não pode exceder 20 caracteres.",
  }).regex(/^[a-zA-Z0-9_.-]+$/, {
    message: "Nome de usuário pode conter apenas letras, números, '.', '_' ou '-'.",
  }),
  email: z.string().email({ message: "Formato de email inválido." }).optional().or(z.literal("")),
  role: z.enum(['admin', 'user'], { required_error: "Selecione um papel para o usuário." }),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  user?: User | null; // Usuário existente para edição, ou null/undefined para adição
  onSubmit: (data: UserFormValues) => Promise<void>; // onSubmit é assíncrono
  onClose: () => void; // Função para fechar o diálogo/modal
  currentUserIsAdmin?: boolean; // O usuário logado é admin?
  editingSelf?: boolean; // O usuário logado está editando o próprio perfil?
}

export function UserForm({ user, onSubmit, onClose, currentUserIsAdmin, editingSelf }: UserFormProps) {
  const isEditingFfAdmin = user?.username === 'ff.admin';

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      role: user?.role || "user",
    },
  });
  
  useEffect(() => {
    // Reseta o formulário quando o 'user' prop muda (ex: ao abrir para editar outro usuário)
    form.reset({
        username: user?.username || "",
        email: user?.email || "",
        role: user?.role || "user",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);


  const handleSubmit = async (data: UserFormValues) => {
    // Verificação do lado do cliente, embora o lado do servidor (regras do Firestore/contexto) seja primário
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
    // form.reset() é geralmente tratado pelo onOpenChange do Dialog, ou chame onClose que pode resetar
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuário" : "Adicionar Novo Usuário"}</DialogTitle>
          <DialogDescription>
            {user ? "Atualize os dados do usuário." : "Preencha os dados para adicionar um novo usuário."}
          </DialogDescription>
        </DialogHeader>
        
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome de Usuário</FormLabel>
              <FormControl>
                <Input placeholder="Ex: joao.silva" {...field} disabled={isEditingFfAdmin || (!!user && user.username !== 'ff.admin')} />
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Ex: usuario@dominio.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
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
