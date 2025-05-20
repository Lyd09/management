
"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { CalendarIcon, PlusCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from 'date-fns/locale';
import type { Project, ChecklistItem, ProjectType, PriorityType } from "@/types";
import { PROJECT_TYPES, PROJECT_STATUS_OPTIONS, INITIAL_PROJECT_STATUS, PRIORITIES } from "@/lib/constants";
import { ChecklistItemInput } from "./ChecklistItemInput";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect, useCallback } from "react";

// Mock function for AI status suggestions
const mockSuggestProjectStatus = async (projectType: ProjectType): Promise<string[]> => {
  console.log(`AI Suggestion: Called for ${projectType}`);
  await new Promise(resolve => setTimeout(resolve, 1000));
  const genericSuggestions = ["Aguardando Início", "Em Pausa", "Bloqueado"];
  return [...new Set([...genericSuggestions, ...PROJECT_STATUS_OPTIONS[projectType]])].sort();
};


const projectFormSchema = z.object({
  nome: z.string().min(2, "O nome do projeto é obrigatório."),
  tipo: z.enum(PROJECT_TYPES, { required_error: "Selecione um tipo de projeto." }),
  status: z.string().min(1, "O status é obrigatório."),
  prioridade: z.enum(PRIORITIES, {required_error: "Selecione uma prioridade."}).optional(),
  descricao: z.string().optional(),
  prazo: z.date().optional(),
  notas: z.string().optional(),
  checklist: z.array(
    z.object({
      id: z.string(),
      item: z.string().min(1, "A descrição do item é obrigatória."),
      feito: z.boolean(),
    })
  ).optional(),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: ProjectFormValues) => void;
  onClose?: () => void; 
  isPage?: boolean; 
}

export function ProjectForm({ project, onSubmit, onClose, isPage = false }: ProjectFormProps) {
  const { toast } = useToast();
  const [selectedProjectType, setSelectedProjectType] = useState<ProjectType | undefined>(project?.tipo);
  const [statusOptions, setStatusOptions] = useState<string[]>(project ? PROJECT_STATUS_OPTIONS[project.tipo] : []);
  const [aiSuggestedStatuses, setAiSuggestedStatuses] = useState<string[]>([]);
  const [isLoadingAiSuggestions, setIsLoadingAiSuggestions] = useState(false);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      nome: project?.nome || "",
      tipo: project?.tipo,
      status: project?.status || (project?.tipo ? INITIAL_PROJECT_STATUS(project.tipo) : ""),
      prioridade: project?.prioridade || "Média",
      descricao: project?.descricao || "",
      prazo: project?.prazo && isValid(parseISO(project.prazo)) ? parseISO(project.prazo) : undefined,
      notas: project?.notas || "",
      checklist: project?.checklist || [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "checklist",
  });

  const fetchAiSuggestions = useCallback(async (projectType: ProjectType) => {
    setIsLoadingAiSuggestions(true);
    setAiSuggestedStatuses([]);
    try {
      const suggestions = await mockSuggestProjectStatus(projectType); 
      setAiSuggestedStatuses(suggestions);
      setStatusOptions(prev => [...new Set([...suggestions, ...PROJECT_STATUS_OPTIONS[projectType]])].sort());
      toast({ title: "Sugestões de Status Carregadas", description: "Novas opções de status foram sugeridas pela IA."});
    } catch (error) {
      console.error("Error fetching AI status suggestions:", error);
      toast({ variant: "destructive", title: "Erro IA", description: "Não foi possível carregar sugestões de status." });
      setStatusOptions(PROJECT_STATUS_OPTIONS[projectType]);
    } finally {
      setIsLoadingAiSuggestions(false);
    }
  }, [toast]);
  
  useEffect(() => {
    if (project?.tipo) {
      setSelectedProjectType(project.tipo);
      const defaultStatuses = PROJECT_STATUS_OPTIONS[project.tipo] || [];
      setStatusOptions(defaultStatuses);
      if (project.status && defaultStatuses.includes(project.status)) {
        form.setValue("status", project.status);
      } else if (defaultStatuses.length > 0) {
        form.setValue("status", defaultStatuses[0]);
      } else {
        form.setValue("status", "");
      }
      fetchAiSuggestions(project.tipo);
    }
     if (project?.prazo) {
      const parsedDate = parseISO(project.prazo);
      if (isValid(parsedDate)) {
        form.setValue("prazo", parsedDate);
      }
    }
    if (project?.prioridade) {
      form.setValue("prioridade", project.prioridade);
    }
  }, [project, form, fetchAiSuggestions]);


  const handleTypeChange = (value: string) => {
    const newType = value as ProjectType;
    setSelectedProjectType(newType);
    form.setValue("tipo", newType);
    const defaultStatuses = PROJECT_STATUS_OPTIONS[newType] || [];
    setStatusOptions(defaultStatuses);
    form.setValue("status", defaultStatuses.length > 0 ? defaultStatuses[0] : "");
    fetchAiSuggestions(newType);
  };

  const handleSubmit = (data: ProjectFormValues) => {
    onSubmit({
      ...data,
      prazo: data.prazo ? format(data.prazo, "yyyy-MM-dd") : undefined,
    } as any); 
    if (!isPage && onClose) { 
      form.reset({
        nome: "",
        tipo: undefined,
        status: "",
        prioridade: "Média",
        descricao: "",
        prazo: undefined,
        notas: "",
        checklist: [],
      });
    }
  };

  const formContainerClass = "max-w-2xl mx-auto p-6 bg-card shadow-lg rounded-lg";
  const formTitle = project ? "Editar Projeto" : "Criar Novo Projeto";
  const formDescription = project ? "Atualize os detalhes deste projeto." : "Preencha os dados para criar um novo projeto.";

  const commonFields = (
    <>
      <FormField
        control={form.control}
        name="nome"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome do Projeto</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Vídeo Institucional XPTO" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Projeto</FormLabel>
              <Select onValueChange={handleTypeChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PROJECT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                Status do Projeto
                {isLoadingAiSuggestions && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={!selectedProjectType || isLoadingAiSuggestions}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
            control={form.control}
            name="prioridade"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Prioridade do Projeto</FormLabel>
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

        <FormField
            control={form.control}
            name="prazo"
            render={({ field }) => (
            <FormItem className="flex flex-col">
                <FormLabel>Prazo de Entrega</FormLabel>
                <Popover>
                <PopoverTrigger asChild>
                    <FormControl>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                        )}
                    >
                        {field.value ? (
                        format(field.value, "PPP", { locale: ptBR })
                        ) : (
                        <span>Escolha uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                    </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) } 
                    initialFocus
                    locale={ptBR}
                    />
                </PopoverContent>
                </Popover>
                <FormMessage />
            </FormItem>
            )}
        />
      </div>


      <FormField
        control={form.control}
        name="descricao"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição do Projeto</FormLabel>
            <FormControl>
              <Textarea placeholder="Detalhes sobre o projeto..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notas"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notas Gerais</FormLabel>
            <FormControl>
              <Textarea placeholder="Observações, ideias, etc." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div>
        <FormLabel>Checklist</FormLabel>
        {fields.map((field, index) => (
          <ChecklistItemInput
            key={field.id}
            item={field as ChecklistItem} // Casting is okay here as we know the structure
            onChange={(updatedItem) => update(index, updatedItem)}
            onRemove={() => remove(index)}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => append({ id: uuidv4(), item: "", feito: false })}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item ao Checklist
        </Button>
      </div>
    </>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={cn("space-y-6", isPage ? "" : "")}>
        {!isPage && (
          <DialogHeader>
            <DialogTitle>{formTitle}</DialogTitle>
            <DialogDescription>{formDescription}</DialogDescription>
          </DialogHeader>
        )}

        {isPage ? (
          <div className={formContainerClass}>
            <h1 className="text-3xl font-bold mb-6 text-primary">
              {formTitle}
            </h1>
            {commonFields}
            <div className="flex justify-end gap-2 mt-8">
              <Button type="submit" disabled={form.formState.isSubmitting || isLoadingAiSuggestions}>
                {(isLoadingAiSuggestions || form.formState.isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {project ? "Salvar Alterações" : "Criar Projeto"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-0"> {/* No extra padding for dialog content as DialogContent has its own */}
            {commonFields}
            <DialogFooter className="mt-6">
              {onClose && (
                <DialogClose asChild>
                  <Button type="button" variant="outline" onClick={() => { 
                      form.reset({
                        nome: "",
                        tipo: undefined,
                        status: "",
                        prioridade: "Média",
                        descricao: "",
                        prazo: undefined,
                        notas: "",
                        checklist: [],
                      }); 
                      if(onClose) onClose(); 
                    }}>
                    Cancelar
                  </Button>
                </DialogClose>
              )}
              <Button type="submit" disabled={form.formState.isSubmitting || isLoadingAiSuggestions}>
                {(isLoadingAiSuggestions || form.formState.isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {project ? "Salvar Alterações" : "Criar Projeto"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </form>
    </Form>
  );
}
