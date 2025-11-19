
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CalendarIcon, PlusCircle, Loader2, DollarSign, Eye, EyeOff, Sparkles } from "lucide-react";
import { cn, parseDateStringAsLocalAtMidnight } from "@/lib/utils";
import { format, isValid, differenceInDays, isBefore, startOfDay } from "date-fns";
import { ptBR } from 'date-fns/locale';
import type { Project, ChecklistItem, ProjectType, PriorityType } from "@/types";
import { PROJECT_TYPES, PROJECT_STATUS_OPTIONS, INITIAL_PROJECT_STATUS, PRIORITIES, PREDEFINED_CHECKLISTS } from "@/lib/constants";
import { ChecklistItemInput } from "./ChecklistItemInput";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect, useCallback, useRef } from "react";

const projectFormSchema = z.object({
  nome: z.string().min(2, "O nome do projeto é obrigatório."),
  tipo: z.enum(PROJECT_TYPES, { required_error: "Selecione um tipo de projeto." }),
  status: z.string().min(1, "O status é obrigatório."),
  prioridade: z.enum(PRIORITIES, {required_error: "Selecione uma prioridade."}).optional(),
  descricao: z.string().optional(),
  prazo: z.date().optional(),
  valor: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = parseFloat(String(val).replace(",", ".")); // Trata vírgula como decimal
      return isNaN(num) ? val : num;
    },
    z.number({ invalid_type_error: "O valor deve ser um número." })
      .positive({ message: "O valor do projeto deve ser positivo." })
      .optional()
  ),
  notas: z.string().optional(),
  checklist: z.array(
    z.object({
      id: z.string(),
      item: z.string().min(1, "A descrição do item é obrigatória."),
      feito: z.boolean(),
    })
  ).optional(),
  dataConclusao: z.date().optional(),
  tags: z.array(z.string()).optional(),
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

  const [showCompleteConfirmation, setShowCompleteConfirmation] = useState(false);
  const initialStatusOnLoadRef = useRef<string>(project?.status || (project?.tipo ? INITIAL_PROJECT_STATUS(project.tipo) : ""));

  const [showPrioritySuggestionDialog, setShowPrioritySuggestionDialog] = useState(false);
  const [prioritySuggestionDetails, setPrioritySuggestionDetails] = useState<{ suggested: PriorityType; reason: string } | null>(null);
  const lastPrazoRef = useRef<Date | undefined | null>(null);

  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(null);

  const [isValueInputVisible, setIsValueInputVisible] = useState(false);
  const [showLoadPredefinedChecklistConfirm, setShowLoadPredefinedChecklistConfirm] = useState(false);


  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      nome: project?.nome || "",
      tipo: project?.tipo,
      status: project?.status || (project?.tipo ? INITIAL_PROJECT_STATUS(project.tipo) : ""),
      prioridade: project?.prioridade || "Média",
      descricao: project?.descricao || "",
      prazo: parseDateStringAsLocalAtMidnight(project?.prazo),
      valor: project?.valor || undefined,
      notas: project?.notas || "",
      checklist: project?.checklist || [],
      dataConclusao: parseDateStringAsLocalAtMidnight(project?.dataConclusao),
      tags: project?.tags || [],
    },
  });

  const watchedTipo = form.watch('tipo');
  const watchedStatus = form.watch('status');
  const watchedPrazo = form.watch('prazo');
  const { formState } = form;

  useEffect(() => {
    initialStatusOnLoadRef.current = project?.status || (project?.tipo ? INITIAL_PROJECT_STATUS(project.tipo) : "");
    lastPrazoRef.current = parseDateStringAsLocalAtMidnight(project?.prazo);
    form.reset({
      nome: project?.nome || "",
      tipo: project?.tipo,
      status: project?.status || (project?.tipo ? INITIAL_PROJECT_STATUS(project.tipo) : ""),
      prioridade: project?.prioridade || "Média",
      descricao: project?.descricao || "",
      prazo: parseDateStringAsLocalAtMidnight(project?.prazo),
      valor: project?.valor || undefined,
      notas: project?.notas || "",
      checklist: project?.checklist || [],
      dataConclusao: parseDateStringAsLocalAtMidnight(project?.dataConclusao),
      tags: project?.tags || [],
    });
    if(project?.tipo) {
        setSelectedProjectType(project.tipo);
        const defaultStatuses = PROJECT_STATUS_OPTIONS[project.tipo] || [];
        setStatusOptions(defaultStatuses);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  const { fields, append, remove, update, move, replace } = useFieldArray({
    control: form.control,
    name: "checklist",
  });

  useEffect(() => {
    if (project?.tipo && !project.status) {
        const initialStatus = INITIAL_PROJECT_STATUS(project.tipo);
        form.setValue("status", initialStatus);
        initialStatusOnLoadRef.current = initialStatus;
    }

    const formChecklist = form.getValues('checklist');
    const hasIncompleteItems = formChecklist?.some(item => !item.feito);

    if (
      watchedStatus === "Projeto Concluído" &&
      initialStatusOnLoadRef.current !== "Projeto Concluído" &&
      hasIncompleteItems &&
      !showCompleteConfirmation
    ) {
      setShowCompleteConfirmation(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedStatus, form, project, showCompleteConfirmation]);


  useEffect(() => {
    if (!project && lastPrazoRef.current !== watchedPrazo && !formState.dirtyFields.prioridade) {
        const currentFormPriority = form.getValues('prioridade');
        let shouldShowDialog = false;
        let newSuggestion: { suggested: PriorityType; reason: string } | null = null;

        if (watchedPrazo && isValid(new Date(watchedPrazo))) {
            const today = startOfDay(new Date());
            const deadlineDate = startOfDay(new Date(watchedPrazo));
            const daysRemaining = differenceInDays(deadlineDate, today);
            const isDeadlineUrgent = isBefore(deadlineDate, today) || daysRemaining <= 3;

            if (isDeadlineUrgent && currentFormPriority !== 'Alta') {
                newSuggestion = { suggested: 'Alta', reason: 'O prazo definido é muito próximo ou está vencido.' };
                shouldShowDialog = true;
            } else if (!isDeadlineUrgent && currentFormPriority === 'Alta' && (!project || project.prioridade !== 'Alta')) {
                newSuggestion = { suggested: 'Média', reason: 'O prazo não é mais considerado urgente.' };
                shouldShowDialog = true;
            }
        } else if (!watchedPrazo && currentFormPriority === 'Alta' && (!project || project.prioridade !== 'Alta')) {
            newSuggestion = { suggested: 'Média', reason: 'O prazo foi removido.' };
            shouldShowDialog = true;
        }

        if (shouldShowDialog && newSuggestion) {
            setPrioritySuggestionDetails(newSuggestion);
            setShowPrioritySuggestionDialog(true);
        }
        lastPrazoRef.current = watchedPrazo;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedPrazo, project, formState.dirtyFields.prioridade]);


  const handleTypeChange = (value: string) => {
    const newType = value as ProjectType;
    setSelectedProjectType(newType);
    form.setValue("tipo", newType);
    const defaultStatuses = PROJECT_STATUS_OPTIONS[newType] || [];
    const newInitialStatus = defaultStatuses.length > 0 ? INITIAL_PROJECT_STATUS(newType) : "";
    setStatusOptions(defaultStatuses);
    form.setValue("status", newInitialStatus);
    initialStatusOnLoadRef.current = newInitialStatus;
  };

  const handleSubmitLogic = (data: ProjectFormValues) => {
    onSubmit(data); 
    if (!isPage && onClose) {
      form.reset({
        nome: "",
        tipo: undefined,
        status: "",
        prioridade: "Média",
        descricao: "",
        prazo: undefined,
        valor: undefined,
        notas: "",
        checklist: [],
        dataConclusao: undefined,
        tags: [],
      });
      setSelectedProjectType(undefined);
      setStatusOptions([]);
      initialStatusOnLoadRef.current = "";
      lastPrazoRef.current = undefined;
      setIsValueInputVisible(false);
    } else if (isPage) {
        initialStatusOnLoadRef.current = data.status;
        lastPrazoRef.current = data.prazo;
    }
  };

  const handleMarkAllAndProceed = () => {
    const currentChecklistValues = form.getValues('checklist');
    if (currentChecklistValues) {
      const updatedChecklist = currentChecklistValues.map(item => ({ ...item, feito: true }));
      form.setValue('checklist', updatedChecklist, { shouldDirty: true, shouldValidate: true });
    }
    form.setValue('dataConclusao', new Date(), { shouldDirty: true, shouldValidate: true });
    initialStatusOnLoadRef.current = "Projeto Concluído";
    setShowCompleteConfirmation(false);
  };

  const handleProceedWithoutMarking = () => {
    form.setValue('dataConclusao', new Date(), { shouldDirty: true, shouldValidate: true });
    initialStatusOnLoadRef.current = "Projeto Concluído";
    setShowCompleteConfirmation(false);
  };

  const handleCancelCompletionChange = () => {
    form.setValue('status', initialStatusOnLoadRef.current);
    form.setValue('dataConclusao', parseDateStringAsLocalAtMidnight(project?.dataConclusao), { shouldDirty: true });
    setShowCompleteConfirmation(false);
  };

  const handlePrioritySuggestionAccept = () => {
    if (prioritySuggestionDetails?.suggested) {
      form.setValue('prioridade', prioritySuggestionDetails.suggested, { shouldDirty: false, shouldValidate: true });
    }
    setShowPrioritySuggestionDialog(false);
    setPrioritySuggestionDetails(null);
  };

  const handlePrioritySuggestionDecline = () => {
    setShowPrioritySuggestionDialog(false);
    setPrioritySuggestionDetails(null);
  };

  const handleLoadPredefinedChecklist = () => {
    const projectType = form.getValues('tipo');
    if (!projectType) {
      toast({ variant: "destructive", title: "Tipo de Projeto Não Selecionado", description: "Por favor, selecione um tipo de projeto primeiro." });
      return;
    }

    const predefinedItems = PREDEFINED_CHECKLISTS[projectType];
    if (!predefinedItems || predefinedItems.length === 0) {
      toast({ title: "Sem Checklist Padrão", description: `Nenhum checklist padrão encontrado para "${projectType}".` });
      return;
    }

    const newChecklistItems = predefinedItems.map(itemText => ({
      id: uuidv4(),
      item: itemText,
      feito: false,
    }));

    replace(newChecklistItems); // Substitui todos os itens existentes
    toast({ title: "Checklist Padrão Carregado", description: `O checklist para "${projectType}" foi carregado e substituiu o atual.` });
    setShowLoadPredefinedChecklistConfirm(false);
  };


  const handleChecklistItemDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleChecklistItemDragOver = (event: React.DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    if (index !== draggedItemIndex) {
      setDragOverItemIndex(index);
    }
  };

  const handleChecklistItemDrop = (targetIndex: number) => {
    if (draggedItemIndex !== null && draggedItemIndex !== targetIndex) {
      move(draggedItemIndex, targetIndex);
    }
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
  };

  const handleChecklistItemDragEnd = () => {
    setDraggedItemIndex(null);
    setDragOverItemIndex(null);
  };

  const handleChecklistItemDragLeave = () => {
    // Handled by dragEnd and Drop
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
              <Select onValueChange={handleTypeChange} value={field.value || ""} defaultValue={field.value}>
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
              </FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                }}
                value={field.value}
                disabled={!selectedProjectType}
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
                <Select onValueChange={field.onChange} value={field.value || "Média"} defaultValue={field.value || "Média"}>
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
                        disabled={watchedStatus === "Projeto Concluído"}
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
                    onSelect={(date) => {
                        field.onChange(date);
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) || watchedStatus === "Projeto Concluído" }
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
       {watchedStatus === "Projeto Concluído" && (
        <FormField
          control={form.control}
          name="dataConclusao"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Conclusão</FormLabel>
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
                        <span>Escolha a data de conclusão</span>
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
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="valor"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
                <FormLabel>Valor do Projeto (R$)</FormLabel>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsValueInputVisible(!isValueInputVisible)}
                    className="h-7 w-7"
                    aria-label={isValueInputVisible ? "Ocultar valor" : "Mostrar valor"}
                >
                    {isValueInputVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
            </div>
            <FormControl>
              {isValueInputVisible ? (
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Ex: 1500.00"
                    step="0.01"
                    {...field}
                    value={field.value === undefined ? "" : String(field.value)}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || val === null) {
                        field.onChange(undefined);
                      } else {
                        field.onChange(e.target.valueAsNumber !== undefined && !isNaN(e.target.valueAsNumber) ? e.target.valueAsNumber : e.target.value);
                      }
                    }}
                    className="pl-9"
                  />
                </div>
              ) : (
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    value="••••••"
                    readOnly
                    disabled
                    className="pl-9 text-muted-foreground"
                    aria-label="Valor oculto"
                  />
                </div>
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />


      <FormField
        control={form.control}
        name="descricao"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição do Projeto</FormLabel>
            <FormControl>
              <Textarea placeholder="Detalhes sobre o projeto..." {...field} value={field.value || ""} />
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
              <Textarea placeholder="Observações, ideias, etc." {...field} value={field.value || ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div>
        <div className="flex justify-between items-center mb-2">
            <FormLabel>Checklist (Arraste para reordenar)</FormLabel>
            <AlertDialog open={showLoadPredefinedChecklistConfirm} onOpenChange={setShowLoadPredefinedChecklistConfirm}>
                <AlertDialogTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!watchedTipo}
                        title={!watchedTipo ? "Selecione um Tipo de Projeto para habilitar" : "Carregar checklist padrão para o tipo selecionado"}
                    >
                        <Sparkles className="mr-2 h-4 w-4" /> Carregar Padrão
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Carregar Checklist Padrão?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Isso substituirá todos os itens do checklist atual pelos itens padrão para o tipo de projeto "{watchedTipo}". Deseja continuar?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLoadPredefinedChecklist}>Sim, Substituir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        {fields.map((fieldItem, index) => (
          <ChecklistItemInput
            key={fieldItem.id}
            item={fieldItem as ChecklistItem}
            index={index}
            onChange={(updatedSubItem) => update(index, updatedSubItem)}
            onRemove={() => remove(index)}
            onItemDragStart={handleChecklistItemDragStart}
            onItemDragOver={handleChecklistItemDragOver}
            onItemDrop={handleChecklistItemDrop}
            onItemDragEnd={handleChecklistItemDragEnd}
            onItemDragLeave={handleChecklistItemDragLeave}
            isDraggingThisItem={index === draggedItemIndex}
            isDropTarget={index === dragOverItemIndex && index !== draggedItemIndex}
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
      <form onSubmit={form.handleSubmit(handleSubmitLogic)} className={cn("space-y-6", isPage ? "" : "")}>
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
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {project ? "Salvar Alterações" : "Criar Projeto"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-0">
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
                        valor: undefined,
                        notas: "",
                        checklist: [],
                        dataConclusao: undefined,
                        tags: [],
                      });
                      setSelectedProjectType(undefined);
                      setStatusOptions([]);
                      initialStatusOnLoadRef.current = "";
                      lastPrazoRef.current = undefined;
                      setIsValueInputVisible(false);
                      if(onClose) onClose();
                    }}>
                    Cancelar
                  </Button>
                </DialogClose>
              )}
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {project ? "Salvar Alterações" : "Criar Projeto"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </form>

      <AlertDialog open={showCompleteConfirmation} onOpenChange={setShowCompleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Conclusão do Projeto</AlertDialogTitle>
            <AlertDialogDescription>
              O projeto tem itens pendentes no checklist. Deseja marcar todos os itens como concluídos e definir hoje como data de conclusão?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={handleCancelCompletionChange}>Cancelar Mudança de Status</Button>
            <AlertDialogAction onClick={handleProceedWithoutMarking}>Concluir Assim Mesmo</AlertDialogAction>
            <AlertDialogAction onClick={handleMarkAllAndProceed} className="bg-primary hover:bg-primary/90">Marcar Todos e Concluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {prioritySuggestionDetails && (
        <AlertDialog open={showPrioritySuggestionDialog} onOpenChange={setShowPrioritySuggestionDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sugestão de Prioridade</AlertDialogTitle>
              <AlertDialogDescription>
                {prioritySuggestionDetails.reason} Sugerimos alterar a prioridade para "{prioritySuggestionDetails.suggested}". Deseja aplicar esta sugestão?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handlePrioritySuggestionDecline}>Não, Manter Atual</AlertDialogCancel>
              <AlertDialogAction onClick={handlePrioritySuggestionAccept}>Sim, Aplicar Sugestão</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Form>
  );
}
