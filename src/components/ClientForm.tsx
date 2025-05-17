
"use client";

import type * as z from "zod";
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
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import type { Client } from "@/types";

const clientFormSchema = z.object({
  nome: z.string().min(2, {
    message: "O nome do cliente deve ter pelo menos 2 caracteres.",
  }),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: ClientFormValues) => void;
  onClose: () => void;
}

export function ClientForm({ client, onSubmit, onClose }: ClientFormProps) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      nome: client?.nome || "",
    },
  });

  const handleSubmit = (data: ClientFormValues) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <DialogHeader>
          <DialogTitle>{client ? "Editar Cliente" : "Adicionar Novo Cliente"}</DialogTitle>
          <DialogDescription>
            {client ? "Atualize os dados do cliente." : "Preencha os dados para adicionar um novo cliente."}
          </DialogDescription>
        </DialogHeader>
        
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Cliente</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Empresa Acme" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit">{client ? "Salvar Alterações" : "Adicionar Cliente"}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
