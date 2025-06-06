
"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppData } from '@/hooks/useAppData';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ClientForm } from "@/components/ClientForm";
import type { ClientFormValues } from "@/components/ClientForm";
import { PlusCircle, Edit2, Trash2, Search, Filter, ExternalLink, Loader2, Users, FolderKanban, Percent, CalendarClock } from "lucide-react";
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
import type { PriorityType, Client, Project } from '@/types';
import { PRIORITIES } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { differenceInDays, startOfDay, isBefore, isValid } from 'date-fns';
import { parseDateStringAsLocalAtMidnight } from "@/lib/utils"; // Importado de utils


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

const getProjectDeadlineText = (prazo?: string): string | null => {
  if (!prazo) return null;
  const deadlineDate = parseDateStringAsLocalAtMidnight(prazo);
  if (!deadlineDate || !isValid(deadlineDate)) return null;
  
  const today = startOfDay(new Date());
  const daysRemaining = differenceInDays(deadlineDate, today);

  if (isBefore(deadlineDate, today)) {
    return `| Atrasado (${Math.abs(daysRemaining)}d)`;
  }
  if (daysRemaining === 0) {
    return "| Hoje!";
  }
  if (daysRemaining > 0) {
      return `| ${daysRemaining}d restantes`;
  }
  return null;
};

const projectHasImminentDeadline = (project: Project): boolean => {
  if (!project.prazo || project.status === "Projeto Concluído") return false;
  const deadlineDate = parseDateStringAsLocalAtMidnight(project.prazo);
  if (!deadlineDate || !isValid(deadlineDate)) return false;
  
  const today = startOfDay(new Date());
  const daysRemaining = differenceInDays(deadlineDate, today);
  return isBefore(deadlineDate, today) || daysRemaining <= 3;
};

const clientHasImminentProject = (client: Client): boolean => {
  return client.projetos.some(project => project.status !== "Projeto Concluído" && projectHasImminentDeadline(project));
};

const getProjectCompletionPercentage = (project: Project): number | null => {
  if (project.status === "Aguardando Início") {
    return 0;
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

type DeadlineProximityFilterType = "Todos" | "Urgentes" | "NaoUrgentes" | "SemPrazosAtivos";

const DEADLINE_PROXIMITY_FILTER_OPTIONS: { value: DeadlineProximityFilterType; label: string }[] = [
  { value: "Todos", label: "Todos os Clientes" },
  { value: "Urgentes", label: "Com Prazos Urgentes (<=3d ou Atrasado)" },
  { value: "NaoUrgentes", label: "Com Prazos Não Urgentes (>3d)" },
  { value: "SemPrazosAtivos", label: "Sem Prazos Ativos" },
];

export default function DashboardPage() {
  const { clients, addClient, updateClient, deleteClient, loading } = useAppData();
  const { toast } = useToast();
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [isEditClientDialogOpen, setIsEditClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<PriorityType | "Todas">("Todas");
  const [deadlineProximityFilter, setDeadlineProximityFilter] = useState<DeadlineProximityFilterType>("Todos");


  const handleAddClient = (data: ClientFormValues) => {
    addClient(data.nome, data.prioridade);
    setIsAddClientDialogOpen(false);
    toast({ title: "Cliente Adicionado", description: `O cliente ${data.nome} foi adicionado com sucesso.` });
  };

  const handleEditClient = (data: ClientFormValues) => {
    if (editingClient) {
      updateClient(editingClient.id, data.nome, data.prioridade);
      setIsEditClientDialogOpen(false);
      setEditingClient(null);
      toast({ title: "Cliente Atualizado", description: `O cliente ${data.nome} foi atualizado.` });
    }
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setIsEditClientDialogOpen(true);
  };

  const confirmDeleteClient = (clientId: string) => {
    setClientToDelete(clientId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteClient = () => {
    if (clientToDelete) {
      const client = clients.find(c => c.id === clientToDelete);
      deleteClient(clientToDelete);
      toast({ title: "Cliente Excluído", description: `Cliente ${client?.nome} foi excluído.`});
      setClientToDelete(null);
    }
    setShowDeleteConfirm(false);
  };

  const filteredClients = useMemo(() => {
    let tempClients = [...clients];

    if (priorityFilter !== "Todas") {
      tempClients = tempClients.filter(client => client.prioridade === priorityFilter);
    }

    if (deadlineProximityFilter !== "Todos") {
      tempClients = tempClients.filter(client => {
        const nonCompletedProjects = client.projetos.filter(p => p.status !== "Projeto Concluído");

        if (deadlineProximityFilter === "SemPrazosAtivos") {
          const hasActiveDeadlines = nonCompletedProjects.some(p => {
            const deadline = parseDateStringAsLocalAtMidnight(p.prazo);
            return deadline && isValid(deadline);
          });
          return !hasActiveDeadlines;
        }

        const activeProjectsWithDeadline = nonCompletedProjects.filter(p => {
            const deadline = parseDateStringAsLocalAtMidnight(p.prazo);
            return deadline && isValid(deadline);
        });

        if (activeProjectsWithDeadline.length === 0) {
          return false; 
        }

        let clientIsUrgent = false;
        let clientHasNonUrgentActiveDeadline = false;

        for (const project of activeProjectsWithDeadline) {
          const deadlineDate = parseDateStringAsLocalAtMidnight(project.prazo!); // Sabemos que prazo existe e é válido aqui
          if(!deadlineDate) continue;

          const today = startOfDay(new Date());
          const daysRemaining = differenceInDays(deadlineDate, today);

          if (isBefore(deadlineDate, today) || daysRemaining <= 3) {
            clientIsUrgent = true;
          }
          if (daysRemaining > 3) { 
            clientHasNonUrgentActiveDeadline = true;
          }
        }

        if (deadlineProximityFilter === "Urgentes") return clientIsUrgent;
        if (deadlineProximityFilter === "NaoUrgentes") return !clientIsUrgent && clientHasNonUrgentActiveDeadline;
        
        return false; 
      });
    }

    if (searchTerm) {
        tempClients = tempClients.filter(client =>
            client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.projetos.some(project => project.status !== "Projeto Concluído" && project.nome.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }

    tempClients.sort((a, b) => {
      const aHasImminent = clientHasImminentProject(a);
      const bHasImminent = clientHasImminentProject(b);
      
      const aHasActiveNonCompletedProjects = a.projetos.some(p => p.status !== "Projeto Concluído");
      const bHasActiveNonCompletedProjects = b.projetos.some(p => p.status !== "Projeto Concluído");

      if (aHasImminent && !bHasImminent) return -1;
      if (!aHasImminent && bHasImminent) return 1;

      if (aHasActiveNonCompletedProjects && !bHasActiveNonCompletedProjects) return -1;
      if (!aHasActiveNonCompletedProjects && bHasActiveNonCompletedProjects) return 1;
      
      return 0; 
    });

    return tempClients;
  }, [clients, searchTerm, priorityFilter, deadlineProximityFilter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-xl">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-primary">Painel de Clientes</h1>
        </div>
        <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <ClientForm onSubmit={handleAddClient} onClose={() => setIsAddClientDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div className="relative md:col-span-1">
          <Input
            type="search"
            placeholder="Buscar cliente ou projeto..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
        <div className="md:col-span-1">
            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as PriorityType | "Todas")}>
                <SelectTrigger className="w-full">
                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Prioridade do Cliente" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Todas">Todas Prioridades</SelectItem>
                    {PRIORITIES.map(priority => (
                    <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="md:col-span-1">
            <Select value={deadlineProximityFilter} onValueChange={(value) => setDeadlineProximityFilter(value as DeadlineProximityFilterType)}>
                <SelectTrigger className="w-full">
                    <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Proximidade de Prazos" />
                </SelectTrigger>
                <SelectContent>
                    {DEADLINE_PROXIMITY_FILTER_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>

      {filteredClients.length === 0 && !loading && (
        <Card className="text-center py-10">
          <CardHeader>
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4 text-2xl">Nenhum cliente encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              {searchTerm || priorityFilter !== "Todas" || deadlineProximityFilter !== "Todos"
                ? "Nenhum cliente corresponde à sua busca/filtros."
                : "Você ainda não adicionou nenhum cliente."}
            </CardDescription>
          </CardContent>
          {!(searchTerm || priorityFilter !== "Todas" || deadlineProximityFilter !== "Todos") && (
             <CardFooter className="justify-center">
                <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="lg">
                    <PlusCircle className="mr-2 h-5 w-5" /> Adicionar seu primeiro cliente
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <ClientForm onSubmit={handleAddClient} onClose={() => setIsAddClientDialogOpen(false)} />
                </DialogContent>
                </Dialog>
             </CardFooter>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => {
          const nonCompletedProjects = client.projetos.filter(p => p.status !== "Projeto Concluído");
          const projectsToDisplay = nonCompletedProjects.slice(0, 3); 
          const remainingNonCompletedProjectsCount = nonCompletedProjects.length - projectsToDisplay.length;

          return (
          <Card key={client.id} className="flex flex-col hover:shadow-primary/20 hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{client.nome}</CardTitle>
                <div className="flex items-center gap-2">
                    {client.prioridade && (
                        <Badge variant={getPriorityBadgeVariant(client.prioridade)} className="text-xs">
                            {client.prioridade}
                        </Badge>
                    )}
                    <Link href={`/clients/${client.id}`} passHref legacyBehavior>
                        <Button variant="ghost" size="icon" aria-label={`Ver detalhes de ${client.nome}`} className="group">
                            <ExternalLink className="h-5 w-5 text-primary group-hover:text-accent-foreground" />
                        </Button>
                    </Link>
                </div>
              </div>
              <CardDescription>
                {nonCompletedProjects.length > 0
                    ? `${nonCompletedProjects.length} projeto(s) em andamento`
                    : (client.projetos.length > 0 ? "Todos os projetos concluídos" : "Nenhum projeto")
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              {projectsToDisplay.length > 0 ? (
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {projectsToDisplay.map(p => {
                    const deadlineText = getProjectDeadlineText(p.prazo);
                    const completionPercentage = getProjectCompletionPercentage(p);
                    const badgeStyle = getCompletionBadgeStyle(completionPercentage);

                    return (
                      <li key={p.id} className="flex flex-col items-start">
                        <div className="flex items-center">
                          <FolderKanban className="h-4 w-4 mr-2 text-primary/70 shrink-0"/>
                          <span>{p.nome}</span>
                           {p.status !== "Projeto Concluído" && deadlineText && <span className="ml-1 text-xs text-muted-foreground/80">{deadlineText}</span>}
                        </div>
                        {p.status !== "Aguardando Início" && completionPercentage !== null && p.checklist && p.checklist.length > 0 && (
                           <Badge
                            variant={badgeStyle.variant}
                            className={`text-xs mt-1 ml-6 ${badgeStyle.className}`}
                           >
                            <span role="img" aria-label="target" className="mr-1">🎯</span> {completionPercentage}%
                           </Badge>
                        )}
                        {p.status === "Aguardando Início" && (
                            <Badge variant="secondary" className="text-xs mt-1 ml-6">
                                <span role="img" aria-label="target" className="mr-1">🎯</span> 0%
                            </Badge>
                        )}
                      </li>
                    );
                  })}
                  {remainingNonCompletedProjectsCount > 0 && <li className="mt-1 ml-6">E mais {remainingNonCompletedProjectsCount}...</li>}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {client.projetos.length > 0 ? "Nenhum projeto em andamento para exibir." : "Nenhum projeto cadastrado para este cliente."}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => openEditDialog(client)}>
                <Edit2 className="mr-1 h-3 w-3" /> Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => confirmDeleteClient(client.id)}>
                <Trash2 className="mr-1 h-3 w-3" /> Excluir
              </Button>
            </CardFooter>
          </Card>
        );
      })}
      </div>

      {editingClient && (
        <Dialog open={isEditClientDialogOpen} onOpenChange={setIsEditClientDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <ClientForm client={editingClient} onSubmit={handleEditClient} onClose={() => { setIsEditClientDialogOpen(false); setEditingClient(null); }} />
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente e todos os seus projetos? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClientToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
