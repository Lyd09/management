
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
import type { Client, PriorityType } from "@/types";
import { PRIORITIES } from "@/lib/constants";

const clientFormSchema = z.object({
  nome: z.string().min(2, {
    message: "O nome do cliente deve ter pelo menos 2 caracteres.",
  }),
  prioridade: z.enum(PRIORITIES, {required_error: "Selecione uma prioridade"}).optional(),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

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
      prioridade: client?.prioridade || "Média",
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

        <FormField
          control={form.control}
          name="prioridade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prioridade</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || "Média"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
