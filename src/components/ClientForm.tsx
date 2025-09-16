
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import type { Client, PriorityType } from "@/types";
import { PRIORITIES } from "@/lib/constants";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const clientFormSchema = z.object({
  nome: z.string().min(2, {
    message: "O nome do cliente deve ter pelo menos 2 caracteres.",
  }),
  prioridade: z.enum(PRIORITIES, {required_error: "Selecione uma prioridade"}).optional(),
  responsavel: z.string().optional(),
  contato: z.object({
    email: z.string().email({ message: "Por favor, insira um email válido." }).optional().or(z.literal('')),
    whatsapp: z.string().optional(),
    social: z.string().optional(),
    local: z.string().optional(),
    municipio: z.string().optional(),
  }).optional(),
  documento: z.string().optional(),
  segmento: z.string().optional(),
  observacoes: z.string().optional(),
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
      responsavel: client?.responsavel || "",
      contato: {
        email: client?.contato?.email || "",
        whatsapp: client?.contato?.whatsapp || "",
        social: client?.contato?.social || "",
        local: client?.contato?.local || "",
        municipio: client?.contato?.municipio || "",
      },
      documento: client?.documento || "",
      segmento: client?.segmento || "",
      observacoes: client?.observacoes || "",
    },
  });

  const handleSubmit = (data: ClientFormValues) => {
    onSubmit(data);
    if (!client) { // Only reset if it's for adding a new client
        form.reset();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>{client ? "Editar Cliente" : "Adicionar Novo Cliente"}</DialogTitle>
          <DialogDescription>
            {client ? "Atualize os dados e o perfil do cliente." : "Preencha os dados para adicionar um novo cliente."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
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
                <Select onValueChange={field.onChange} value={field.value || "Média"}>
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
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Perfil Detalhado (Opcional)</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                 <FormField
                  control={form.control}
                  name="responsavel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável Principal</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do contato principal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="contato.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de Contato</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@cliente.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="contato.whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp</FormLabel>
                      <FormControl>
                        <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contato.social"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rede Social (Link)</FormLabel>
                      <FormControl>
                        <Input placeholder="Link do Instagram, LinkedIn, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contato.local"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local (Endereço)</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, Número, Bairro..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contato.municipio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Município</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade, Estado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="documento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ / CPF</FormLabel>
                      <FormControl>
                        <Input placeholder="Número do documento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="segmento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Segmento / Nicho</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Marketing Digital, Imobiliária" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações Internas</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Notas importantes sobre o cliente..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <DialogFooter className="pt-4">
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

    