
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAppData } from '@/hooks/useAppData';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ProjectForm } from "@/components/ProjectForm";
import type { ProjectFormValues } from "@/components/ProjectForm";
import { PlusCircle, Edit2, Trash2, ArrowLeft, Loader2, FolderKanban, ExternalLink, CalendarClock, Percent, Copy, CheckCircle2, Share2, Search, User, Mail, Phone, Link2, FileText, Briefcase, StickyNote, Building } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import type { Client, Project, ProjectType, PriorityType, User as AppUser } from '@/types';
import { Badge } from '@/components/ui/badge';
import { differenceInDays, startOfDay, isBefore, format, getYear, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PRIORITIES } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, parseDateStringAsLocalAtMidnight } from "@/lib/utils";
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DelegateClientDialog } from '@/components/DelegateClientDialog';


type DeadlineFilterCategory = "Todos" | "Muito Próximos/Atrasados" | "Próximos" | "Distantes" | "Sem Prazo";

const DEADLINE_FILTER_OPTIONS: DeadlineFilterCategory[] = [
  "Todos",
  "Muito Próximos/Atrasados",
  "Próximos",
  "Distantes",
  "Sem Prazo",
];

const getPriorityBadgeVariant = (priority?: PriorityType) => {
  switch (priority) {
    case "Alta":
      return "destructive";
    case "Média":
      return "secondary";
    case "Baixa":
      return "outline";
    default:
      return "default";
  }
};

const getDeadlineBadgeInfo = (prazo?: string): { text: string; variant: "default" | "secondary" | "destructive" | "outline" } | null => {
    if (!prazo) return null;
    const deadlineDate = parseDateStringAsLocalAtMidnight(prazo);
    if (!deadlineDate || !isValid(deadlineDate)) return null;
    
    const today = startOfDay(new Date());
    const deadlineDay = startOfDay(deadlineDate);
    const daysRemaining = differenceInDays(deadlineDay, today);

    if (isBefore(deadlineDay, today)) {
        return { text: `Atrasado (${Math.abs(daysRemaining)}d)`, variant: "destructive" };
    }
    if (daysRemaining === 0) {
        return { text: "Hoje!", variant: "destructive" };
    }
    if (daysRemaining <= 3) {
        return { text: `${daysRemaining}d restantes`, variant: "destructive" };
    }
    if (daysRemaining <= 7) {
        return { text: `${daysRemaining}d restantes`, variant: "secondary" };
    }
    return null; 
};

const formatProjectDateForCard = (
  prazo?: string,
  dataConclusao?: string,
  status?: string
): {
  prefix: string;
  formattedDate: string;
  remainingText: string | null;
  isConclusion: boolean;
  variant: "default" | "secondary" | "destructive" | "outline" | null;
  icon: LucideIcon | null;
  iconColorClass: string;
} | null => {
  if (status === "Projeto Concluído") {
    const conclusionDate = parseDateStringAsLocalAtMidnight(dataConclusao);
    if (conclusionDate && isValid(conclusionDate)) {
      const currentYear = getYear(new Date());
      const conclusionYear = getYear(conclusionDate);
      const dateFormatString = conclusionYear === currentYear ? "d 'de' MMMM" : "d 'de' MMMM 'de' yyyy";
      return {
        prefix: "Concluído em:",
        formattedDate: format(conclusionDate, dateFormatString, { locale: ptBR }),
        remainingText: null,
        isConclusion: true,
        variant: "default", 
        icon: CheckCircle2,
        iconColorClass: 'text-green-500',
      };
    }
    return null; 
  }

  const deadlineDate = parseDateStringAsLocalAtMidnight(prazo);
  if (!deadlineDate || !isValid(deadlineDate)) return null;

  const today = startOfDay(new Date());
  const deadlineDay = startOfDay(deadlineDate);
  const currentYear = getYear(today);
  const deadlineYear = getYear(deadlineDate);

  const dateFormatString = deadlineYear === currentYear ? "d 'de' MMMM" : "d 'de' MMMM 'de' yyyy";
  const formattedDate = format(deadlineDay, dateFormatString, { locale: ptBR });

  const daysRemaining = differenceInDays(deadlineDay, today);
  let remainingText: string | null = null;
  let variantForBadge: "default" | "secondary" | "destructive" | "outline" | null = "default";

  if (isBefore(deadlineDay, today)) {
    remainingText = `Atrasado (${Math.abs(daysRemaining)}d)`;
    variantForBadge = "destructive";
  } else if (daysRemaining === 0) {
    remainingText = "Hoje!";
    variantForBadge = "destructive";
  } else {
    remainingText = `${daysRemaining}d restantes`;
    if (daysRemaining <= 3) variantForBadge = "destructive";
    else if (daysRemaining <= 7) variantForBadge = "secondary";
  }

  return {
    prefix: "Prazo:",
    formattedDate,
    remainingText,
    isConclusion: false,
    variant: variantForBadge, 
    icon: CalendarClock,
    iconColorClass: 'text-destructive', 
  };
};


const categorizeDeadline = (prazo?: string): DeadlineFilterCategory => {
  if (!prazo) return "Sem Prazo";
  const deadlineDate = parseDateStringAsLocalAtMidnight(prazo);
  if (!deadlineDate || !isValid(deadlineDate)) return "Sem Prazo";

  const today = startOfDay(new Date());
  const deadlineDay = startOfDay(deadlineDate);
  const daysRemaining = differenceInDays(deadlineDay, today);

  if (isBefore(deadlineDay, today) || daysRemaining <= 3) {
    return "Muito Próximos/Atrasados";
  }
  if (daysRemaining <= 7) {
    return "Próximos";
  }
  return "Distantes";
};

const getProjectCompletionPercentage = (project: Project): number | null => {
  if (project.status === "Aguardando Início") {
    return 0;
  }
  if (project.status === "Projeto Concluído") {
      return 100;
  }
  if (!project.checklist || project.checklist.length === 0) {
    return null;
  }
  const totalItems = project.checklist.length;
  const completedItems = project.checklist.filter(item => item.feito).length;
  return Math.round((completedItems / totalItems) * 100);
};

const getCompletionBadgeStyle = (percentage: number | null): { variant: "secondary" | "default"; className: string } => {
  if (percentage === null) return { variant: "secondary", className: "" };
  if (percentage >= 50) return { variant: "default", className: "" };
  return { variant: "secondary", className: "" };
};


export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = typeof params.clientId === 'string' ? params.clientId : '';

  const { getClientById, addProject, deleteProject, duplicateProject, loading, users, assignClientCopyToUser } = useAppData();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDelegateDialogOpen, setIsDelegateDialogOpen] = useState(false);

  const [projectSearchTerm, setProjectSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<ProjectType | "Todos">("Todos");
  const [statusFilter, setStatusFilter] = useState<string | "Todos">("Todos");
  const [priorityFilter, setPriorityFilter] = useState<PriorityType | "Todos">("Todos");
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilterCategory>("Todos");


  useEffect(() => {
    if (!loading && clientId) {
      const foundClient = getClientById(clientId);
      if (foundClient) {
        setClient(foundClient);
      } else {
        toast({variant: "destructive", title: "Cliente não encontrado"});
        router.push('/');
      }
    }
  }, [clientId, getClientById, loading, router, toast]);

  const handleAddProject = async (data: ProjectFormValues) => {
    if (!client) return;
    
    const submissionData = {
      nome: data.nome,
      tipo: data.tipo,
      status: data.status,
      prioridade: data.prioridade,
      descricao: data.descricao,
      notas: data.notas,
      checklist: data.checklist || [],
      valor: data.valor,
      prazo: data.prazo ? format(data.prazo, "yyyy-MM-dd") : undefined,
      dataConclusao: data.dataConclusao ? format(data.dataConclusao, "yyyy-MM-dd") : undefined,
      tags: data.tags,
    };

    const success = await addProject(client.id, submissionData as Omit<Project, 'id' | 'clientId' | 'creatorUserId'>);
    if (success) {
      setIsAddProjectDialogOpen(false);
      toast({ title: "Projeto Adicionado", description: `O projeto ${data.nome} foi adicionado.` });
    }
  };

  const confirmDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };

  const handleDeleteProject = () => {
    if (projectToDelete && client) {
      deleteProject(client.id, projectToDelete.id);
      toast({ title: "Projeto Excluído", description: `Projeto ${projectToDelete.nome} foi excluído.`});
      setProjectToDelete(null);
    }
    setShowDeleteConfirm(false);
  };

  const handleDuplicateProject = async (projectId: string) => {
    if (!client) return;
    const projectToDuplicate = client.projetos.find(p => p.id === projectId);
    if (projectToDuplicate) {
      const success = await duplicateProject(client.id, projectId);
      if (success) {
        toast({ title: "Projeto Duplicado", description: `O projeto "${projectToDuplicate.nome}" foi duplicado com sucesso.` });
      }
    }
  };

  const handleDelegateClient = async (targetUserId: string, selectedProjectIds: string[], newClientName?: string) => {
    if (!client || !currentUser || currentUser.role !== 'admin') {
      toast({ variant: "destructive", title: "Ação não permitida" });
      return false;
    }
    const success = await assignClientCopyToUser(client.id, targetUserId, selectedProjectIds, newClientName);
    if (success) {
      setIsDelegateDialogOpen(false);
    }
    return success;
  };


  const uniqueProjectTypes = useMemo(() => {
    if (!client) return [];
    const types = new Set(client.projetos.map(p => p.tipo));
    return Array.from(types);
  }, [client]);

  const uniqueProjectStatuses = useMemo(() => {
    if (!client) return [];
    const statuses = new Set(client.projetos.map(p => p.status));
    return Array.from(statuses);
  }, [client]);

  const filteredProjects = useMemo(() => {
    if (!client) return [];
    return client.projetos.filter(project => {
      const searchTermMatch = !projectSearchTerm || project.nome.toLowerCase().includes(projectSearchTerm.toLowerCase());
      const typeMatch = typeFilter === "Todos" || project.tipo === typeFilter;
      const statusMatch = statusFilter === "Todos" || project.status === statusFilter;
      const priorityMatch = priorityFilter === "Todos" || project.prioridade === priorityFilter;
      const deadlineMatch = deadlineFilter === "Todos" || categorizeDeadline(project.prazo) === deadlineFilter;
      return searchTermMatch && typeMatch && statusMatch && priorityMatch && deadlineMatch;
    }).sort((a, b) => { 
        const priorityOrder: Record<PriorityType, number> = { "Alta": 1, "Média": 2, "Baixa": 3 };
        const aPriority = priorityOrder[a.prioridade || "Baixa"] || 3;
        const bPriority = priorityOrder[b.prioridade || "Baixa"] || 3;
        if (aPriority !== bPriority) return aPriority - bPriority;

        const aDeadline = a.prazo ? parseDateStringAsLocalAtMidnight(a.prazo) : null;
        const bDeadline = b.prazo ? parseDateStringAsLocalAtMidnight(b.prazo) : null;
        if (aDeadline && bDeadline && isValid(aDeadline) && isValid(bDeadline)) return differenceInDays(aDeadline, bDeadline);
        if (aDeadline && isValid(aDeadline)) return -1; 
        if (bDeadline && isValid(bDeadline)) return 1;  
        return 0;
    });
  }, [client, projectSearchTerm, typeFilter, statusFilter, priorityFilter, deadlineFilter]);


  if (loading || !client) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-xl">Carregando dados do cliente...</p>
      </div>
    );
  }

  const clientHasProfileData = client.responsavel || client.contato?.email || client.contato?.telefone || client.contato?.social || client.documento || client.segmento || client.observacoes;

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/')} className="mb-0 sm:mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Painel
            </Button>
            {currentUser?.role === 'admin' && (
              <Button variant="outline" onClick={() => setIsDelegateDialogOpen(true)}>
                  <Share2 className="mr-2 h-4 w-4" /> Delegar Cópia para Usuário
              </Button>
            )}
        </div>


      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-3"><Building className="h-8 w-8" /> {client.nome}</h1>
        <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
            <ProjectForm onSubmit={handleAddProject} onClose={() => setIsAddProjectDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {clientHasProfileData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="text-primary"/> Perfil do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {client.responsavel && (
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-normal text-muted-foreground">Responsável</Label>
                    <p className="font-semibold">{client.responsavel}</p>
                  </div>
                </div>
              )}
              {client.contato?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-normal text-muted-foreground">Email</Label>
                    <a href={`mailto:${client.contato.email}`} className="font-semibold text-primary hover:underline">{client.contato.email}</a>
                  </div>
                </div>
              )}
              {client.contato?.telefone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-normal text-muted-foreground">Telefone</Label>
                    <p className="font-semibold">{client.contato.telefone}</p>
                  </div>
                </div>
              )}
              {client.contato?.social && (
                <div className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-normal text-muted-foreground">Rede Social</Label>
                    <a href={client.contato.social} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline line-clamp-1">{client.contato.social}</a>
                  </div>
                </div>
              )}
              {client.documento && (
                 <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-normal text-muted-foreground">Documento (CNPJ/CPF)</Label>
                    <p className="font-semibold">{client.documento}</p>
                  </div>
                </div>
              )}
              {client.segmento && (
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-normal text-muted-foreground">Segmento</Label>
                    <p className="font-semibold">{client.segmento}</p>
                  </div>
                </div>
              )}
            </div>
            {client.observacoes && (
              <div className="pt-4">
                <div className="flex items-start gap-2">
                  <StickyNote className="w-5 h-5 text-muted-foreground mt-1" />
                  <div>
                    <Label className="text-sm font-normal text-muted-foreground">Observações Internas</Label>
                    <p className="font-semibold whitespace-pre-wrap">{client.observacoes}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}


      <h2 className="text-2xl font-semibold pt-4">Projetos</h2>

      {client.projetos.length > 0 && (
         <Card className="p-4">
            <CardContent className="p-0">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="sm:col-span-2 lg:col-span-4">
                        <Label htmlFor="projectSearch">Buscar Projeto por Nome</Label>
                        <div className="relative mt-1">
                            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="projectSearch"
                                type="search"
                                placeholder="Filtrar projetos por nome..."
                                className="w-full pl-10"
                                value={projectSearchTerm}
                                onChange={(e) => setProjectSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="typeFilter">Filtrar por Tipo</Label>
                        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ProjectType | "Todos")}>
                            <SelectTrigger id="typeFilter" className="mt-1">
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Todos">Todos os Tipos</SelectItem>
                                {uniqueProjectTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="statusFilter">Filtrar por Status</Label>
                        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as string | "Todos")}>
                            <SelectTrigger id="statusFilter" className="mt-1">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Todos">Todos os Status</SelectItem>
                                {uniqueProjectStatuses.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="priorityFilter">Filtrar por Prioridade</Label>
                        <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as PriorityType | "Todos")}>
                            <SelectTrigger id="priorityFilter" className="mt-1">
                                <SelectValue placeholder="Prioridade" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Todos">Todas Prioridades</SelectItem>
                                {PRIORITIES.map(priority => (
                                <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label htmlFor="deadlineFilter">Filtrar por Prazo</Label>
                        <Select value={deadlineFilter} onValueChange={(value) => setDeadlineFilter(value as DeadlineFilterCategory)}>
                            <SelectTrigger id="deadlineFilter" className="mt-1">
                                <SelectValue placeholder="Prazo" />
                            </SelectTrigger>
                            <SelectContent>
                                {DEADLINE_FILTER_OPTIONS.map(option => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
              </div>
            </CardContent>
         </Card>
      )}

      {filteredProjects.length === 0 ? (
        <Card className="text-center py-10">
          <CardHeader>
             <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4 text-2xl">
                {client.projetos.length === 0 ? "Nenhum projeto cadastrado" : "Nenhum projeto corresponde aos filtros"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
                {client.projetos.length === 0 ? "Este cliente ainda não possui projetos." : "Tente ajustar os filtros ou adicione um novo projeto."}
            </CardDescription>
          </CardContent>
           <CardFooter className="justify-center">
              <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="lg">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    {client.projetos.length === 0 ? "Adicionar primeiro projeto" : "Adicionar Novo Projeto"}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <ProjectForm onSubmit={handleAddProject} onClose={() => setIsAddProjectDialogOpen(false)} />
                </DialogContent>
                </Dialog>
           </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const deadlineBadgeDisplayInfo = getDeadlineBadgeInfo(project.prazo); 
            const projectDateDisplayInfo = formatProjectDateForCard(project.prazo, project.dataConclusao, project.status);
            const completionPercentage = getProjectCompletionPercentage(project);
            const completionBadgeStyle = getCompletionBadgeStyle(completionPercentage);

            return (
            <Card key={project.id} className="flex flex-col hover:shadow-primary/20 hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{project.nome}</CardTitle>
                    <Link href={`/clients/${client.id}/projects/${project.id}/view`} passHref legacyBehavior>
                        <Button variant="ghost" size="icon" aria-label={`Visualizar projeto ${project.nome}`} className="group">
                            <ExternalLink className="h-5 w-5 text-primary group-hover:text-accent-foreground" />
                        </Button>
                    </Link>
                </div>
                <CardDescription>{project.tipo}</CardDescription>
                <div className="flex flex-wrap gap-2 mt-2">
                    {project.prioridade && (
                        <Badge variant={getPriorityBadgeVariant(project.prioridade)} className="text-xs">
                            {project.prioridade}
                        </Badge>
                    )}
                    <Badge
                      variant={project.status === "Projeto Concluído" ? "default" : "secondary"}
                      className={`${project.status === "Projeto Concluído" ? "bg-green-600 hover:bg-green-600/90 text-white" : ""} text-xs`}
                    >
                        {project.status}
                    </Badge>
                    {project.status !== "Projeto Concluído" && deadlineBadgeDisplayInfo && (
                        <Badge variant={deadlineBadgeDisplayInfo.variant} className="text-xs flex items-center">
                           <CalendarClock className="mr-1 h-3 w-3" /> {deadlineBadgeDisplayInfo.text}
                        </Badge>
                    )}
                    {project.status !== "Projeto Concluído" && project.status !== "Aguardando Início" && completionPercentage !== null && project.checklist && project.checklist.length > 0 && (
                       <Badge
                        variant={completionBadgeStyle.variant}
                        className={`text-xs ${completionBadgeStyle.className}`}
                       >
                        <span role="img" aria-label="target" className="mr-1">🎯</span> {completionPercentage}%
                       </Badge>
                    )}
                     {project.status === "Aguardando Início" && (
                        <Badge variant="secondary" className="text-xs">
                            <span role="img" aria-label="target" className="mr-1">🎯</span> 0%
                        </Badge>
                    )}
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-2 mt-1">
                <p className="text-sm text-muted-foreground line-clamp-2">{project.descricao || "Sem descrição."}</p>
                
                {projectDateDisplayInfo && projectDateDisplayInfo.isConclusion && (
                  <p className="text-xs flex items-center mt-1">
                    {projectDateDisplayInfo.icon && (
                      <projectDateDisplayInfo.icon className={`mr-1 h-3.5 w-3.5 ${projectDateDisplayInfo.iconColorClass}`} />
                    )}
                    <span className='text-green-600 font-medium'>
                      {projectDateDisplayInfo.prefix} {projectDateDisplayInfo.formattedDate}
                    </span>
                  </p>
                )}

                {projectDateDisplayInfo && !projectDateDisplayInfo.isConclusion && (
                  <p className="text-xs flex items-center mt-1">
                    {projectDateDisplayInfo.icon && (
                      <projectDateDisplayInfo.icon className={`mr-1 h-3.5 w-3.5 ${projectDateDisplayInfo.iconColorClass}`} />
                    )}
                    <>
                      <span className='text-muted-foreground'>
                        {projectDateDisplayInfo.prefix} {projectDateDisplayInfo.formattedDate}
                      </span>
                      {projectDateDisplayInfo.remainingText && (
                        <span className="ml-1 text-muted-foreground/80">
                          | {projectDateDisplayInfo.remainingText}
                        </span>
                      )}
                    </>
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleDuplicateProject(project.id)}>
                  <Copy className="mr-1 h-3 w-3" /> Duplicar
                </Button>
                <Link href={`/clients/${client.id}/projects/${project.id}`} passHref legacyBehavior>
                  <Button variant="outline" size="sm">
                    <Edit2 className="mr-1 h-3 w-3" /> Editar
                  </Button>
                </Link>
                <Button variant="destructive" size="sm" onClick={() => confirmDeleteProject(project)}>
                  <Trash2 className="mr-1 h-3 w-3" /> Excluir
                </Button>
              </CardFooter>
            </Card>
          );
        })}
        </div>
      )}
       <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão de Projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o projeto <span className="font-semibold text-foreground">{projectToDelete?.nome}</span>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProjectToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive hover:bg-destructive/90">Excluir Projeto</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {currentUser?.role === 'admin' && client && (
        <DelegateClientDialog
          isOpen={isDelegateDialogOpen}
          onOpenChange={setIsDelegateDialogOpen}
          client={client}
          projects={client.projetos} 
          users={users.filter(u => u.id !== currentUser.id)}
          onConfirm={handleDelegateClient}
        />
      )}
    </div>
  );
}
