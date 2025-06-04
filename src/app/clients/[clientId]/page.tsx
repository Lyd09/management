
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
import { PlusCircle, Edit2, Trash2, ArrowLeft, Loader2, FolderKanban, ExternalLink, CalendarClock, Percent, Copy } from "lucide-react";
import { Label } from "@/components/ui/label";
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
import type { Client, Project, ProjectType, PriorityType } from '@/types';
import { Badge } from '@/components/ui/badge';
import { differenceInDays, parseISO, startOfDay, isBefore } from 'date-fns';
import { PRIORITIES } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    try {
        const today = startOfDay(new Date());
        const deadlineDate = startOfDay(parseISO(prazo));
        const daysRemaining = differenceInDays(deadlineDate, today);

        if (isBefore(deadlineDate, today)) {
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
    } catch (error) {
        console.error("Error parsing prazo for deadline badge:", error);
        return null;
    }
};

const categorizeDeadline = (prazo?: string): DeadlineFilterCategory => {
  if (!prazo) return "Sem Prazo";
  try {
    const today = startOfDay(new Date());
    const deadlineDate = startOfDay(parseISO(prazo));
    const daysRemaining = differenceInDays(deadlineDate, today);

    if (isBefore(deadlineDate, today) || daysRemaining <= 3) {
      return "Muito Próximos/Atrasados";
    }
    if (daysRemaining <= 7) {
      return "Próximos";
    }
    return "Distantes";
  } catch (error) {
    return "Sem Prazo";
  }
};

const getProjectCompletionPercentage = (project: Project): number | null => {
  if (project.status === "Aguardando Início") {
    return 0;
  }
  // "Projeto Concluído" is handled by the main status badge, so no percentage badge needed for it.
  // Or, if we wanted to show "100%" specifically for it, we'd handle it here.
  // For now, if status is "Projeto Concluído", this function effectively won't be called
  // for the percentage badge in the UI logic below.

  if (!project.checklist || project.checklist.length === 0) {
    return null; // No checklist items, so no percentage to show
  }
  const totalItems = project.checklist.length;
  const completedItems = project.checklist.filter(item => item.feito).length;
  return Math.round((completedItems / totalItems) * 100);
};

const getCompletionBadgeStyle = (percentage: number | null): { variant: "secondary" | "default"; className: string } => {
  if (percentage === null) return { variant: "secondary", className: "" };
  if (percentage >= 50) return { variant: "default", className: "" }; // Red (primary)
  return { variant: "secondary", className: "" }; // Gray
};


export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = typeof params.clientId === 'string' ? params.clientId : '';

  const { getClientById, addProject, deleteProject, duplicateProject, loading } = useAppData();
  const { toast } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

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

  const handleAddProject = (data: ProjectFormValues) => {
    if (!client) return;
    const projectPayload: Omit<Project, 'id' | 'checklist'> & { checklist?: Partial<Project['checklist']>, prioridade?: PriorityType } = {
      nome: data.nome,
      tipo: data.tipo as ProjectType,
      status: data.status,
      prioridade: data.prioridade,
      descricao: data.descricao,
      prazo: data.prazo as (string | undefined),
      notas: data.notas,
      checklist: data.checklist,
    };
    addProject(client.id, projectPayload);
    setIsAddProjectDialogOpen(false);
    toast({ title: "Projeto Adicionado", description: `O projeto ${data.nome} foi adicionado.` });
  };

  const confirmDeleteProject = (projectId: string) => {
    setProjectToDelete(projectId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteProject = () => {
    if (projectToDelete && client) {
      const project = client.projetos.find(p => p.id === projectToDelete);
      deleteProject(client.id, projectToDelete);
      toast({ title: "Projeto Excluído", description: `Projeto ${project?.nome} foi excluído.`});
      setProjectToDelete(null);
    }
    setShowDeleteConfirm(false);
  };

  const handleDuplicateProject = async (projectId: string) => {
    if (!client) return;
    const projectToDuplicate = client.projetos.find(p => p.id === projectId);
    if (projectToDuplicate) {
      await duplicateProject(client.id, projectId);
      toast({ title: "Projeto Duplicado", description: `O projeto "${projectToDuplicate.nome}" foi duplicado com sucesso.` });
    }
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
      const typeMatch = typeFilter === "Todos" || project.tipo === typeFilter;
      const statusMatch = statusFilter === "Todos" || project.status === statusFilter;
      const priorityMatch = priorityFilter === "Todos" || project.prioridade === priorityFilter;
      const deadlineMatch = deadlineFilter === "Todos" || categorizeDeadline(project.prazo) === deadlineFilter;
      return typeMatch && statusMatch && priorityMatch && deadlineMatch;
    });
  }, [client, typeFilter, statusFilter, priorityFilter, deadlineFilter]);


  if (loading || !client) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-xl">Carregando dados do cliente...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push('/')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Painel
      </Button>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-primary">{client.nome}</h1>
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

      <h2 className="text-2xl font-semibold">Projetos</h2>

      {client.projetos.length > 0 && (
         <Card className="p-4">
            <CardContent className="p-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <Label htmlFor="typeFilter">Filtrar por Tipo</Label>
                        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ProjectType | "Todos")}>
                            <SelectTrigger id="typeFilter">
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
                            <SelectTrigger id="statusFilter">
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
                            <SelectTrigger id="priorityFilter">
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
                            <SelectTrigger id="deadlineFilter">
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
            const deadlineInfo = getDeadlineBadgeInfo(project.prazo);
            const completionPercentage = getProjectCompletionPercentage(project);
            const completionBadgeStyle = getCompletionBadgeStyle(completionPercentage);

            return (
            <Card key={project.id} className="flex flex-col hover:shadow-primary/20 hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{project.nome}</CardTitle>
                    <Link href={`/clients/${client.id}/projects/${project.id}/view`} passHref legacyBehavior>
                        <Button variant="ghost" size="icon" aria-label={`Visualizar projeto ${project.nome}`}>
                            <ExternalLink className="h-5 w-5 text-primary" />
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
                    {project.status !== "Projeto Concluído" && deadlineInfo && (
                        <Badge variant={deadlineInfo.variant} className="text-xs flex items-center">
                           <CalendarClock className="mr-1 h-3 w-3" /> {deadlineInfo.text}
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
                {project.prazo && <p className="text-xs text-muted-foreground">Prazo: {new Date(project.prazo + "T00:00:00").toLocaleDateString('pt-BR')}</p>}
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
                <Button variant="destructive" size="sm" onClick={() => confirmDeleteProject(project.id)}>
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
              Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProjectToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive hover:bg-destructive/90">Excluir Projeto</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
