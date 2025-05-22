
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
import { PlusCircle, Edit2, Trash2, Search, Filter, ExternalLink, Loader2, Users, FolderKanban, Percent, History } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
import { PRIORITIES, CHANGELOG_DATA } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { differenceInDays, parseISO, startOfDay, isBefore } from 'date-fns';


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
  try {
    const today = startOfDay(new Date());
    const deadlineDate = startOfDay(parseISO(prazo));
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
  } catch (error) {
    return null;
  }
};

const projectHasImminentDeadline = (project: Project): boolean => {
  if (!project.prazo) return false;
  try {
    const today = startOfDay(new Date());
    const deadlineDate = startOfDay(parseISO(project.prazo));
    const daysRemaining = differenceInDays(deadlineDate, today);
    return isBefore(deadlineDate, today) || daysRemaining <= 3;
  } catch (error) {
    return false;
  }
};

const clientHasImminentProject = (client: Client): boolean => {
  return client.projetos.some(project => project.status !== "Projeto Concluído" && projectHasImminentDeadline(project));
};

// Calculate project completion percentage
const getProjectCompletionPercentage = (project: Project): number | null => {
  if (project.status === "Projeto Concluído") {
    return 100;
  }
  if (!project.checklist || project.checklist.length === 0) {
    return null; 
  }
  const totalItems = project.checklist.length;
  const completedItems = project.checklist.filter(item => item.feito).length;
  if (totalItems === 0) return 0;
  return Math.round((completedItems / totalItems) * 100);
};

// Determine badge variant and class based on completion percentage
const getCompletionBadgeStyle = (percentage: number | null): { variant: "secondary" | "default"; className: string } => {
  if (percentage === null) return { variant: "secondary", className: "" };
  if (percentage === 100) return { variant: "default", className: "bg-green-600/80 hover:bg-green-600/70 text-white" };
  if (percentage >= 50) return { variant: "default", className: "" };
  return { variant: "secondary", className: "" };
};


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

    if (searchTerm) {
        tempClients = tempClients.filter(client =>
            client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.projetos.some(project => project.nome.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }

    // Prioritize clients with imminent project deadlines, then clients with any active projects, then clients with no projects.
    tempClients.sort((a, b) => {
      const aHasImminent = clientHasImminentProject(a);
      const bHasImminent = clientHasImminentProject(b);
      const aHasActiveProjects = a.projetos.some(p => p.status !== "Projeto Concluído");
      const bHasActiveProjects = b.projetos.some(p => p.status !== "Projeto Concluído");

      if (aHasImminent && !bHasImminent) return -1;
      if (!aHasImminent && bHasImminent) return 1;

      if (aHasActiveProjects && !bHasActiveProjects) return -1;
      if (!aHasActiveProjects && bHasActiveProjects) return 1;
      
      // Fallback for clients with no active projects or no imminent deadlines - could be creation date or name
      // For now, Firestore's default ordering by createdAt (desc) or name might be sufficient if no other criteria match.
      // If we used Firebase's `createdAt` which is a Timestamp, we could sort by that more explicitly here.
      // Since `createdAt` is not directly on the `Client` type in JS (it's part of Firestore data),
      // we'll rely on the initial fetch order or other filters for now.
      return 0;
    });

    return tempClients;
  }, [clients, searchTerm, priorityFilter]);

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

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full sm:w-auto">
          <Input
            type="search"
            placeholder="Buscar cliente ou projeto..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
        <div className="w-full sm:w-auto sm:min-w-[200px]">
            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as PriorityType | "Todas")}>
                <SelectTrigger className="w-full">
                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Filtrar por prioridade" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Todas">Todas Prioridades</SelectItem>
                    {PRIORITIES.map(priority => (
                    <SelectItem key={priority} value={priority}>{priority}</SelectItem>
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
              {searchTerm || priorityFilter !== "Todas" ? `Nenhum cliente corresponde à sua busca/filtro.` : "Você ainda não adicionou nenhum cliente."}
            </CardDescription>
          </CardContent>
          {!(searchTerm || priorityFilter !== "Todas") && (
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
          const remainingProjectsCount = nonCompletedProjects.length - projectsToDisplay.length;

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
                        <Button variant="ghost" size="icon" aria-label={`Ver detalhes de ${client.nome}`}>
                            <ExternalLink className="h-5 w-5 text-primary" />
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
                    const completionBadgeStyle = getCompletionBadgeStyle(completionPercentage);
                    return (
                      <li key={p.id} className="flex flex-col items-start">
                        <div className="flex items-center">
                          <FolderKanban className="h-4 w-4 mr-2 text-primary/70 shrink-0"/>
                          <span>{p.nome}</span>
                          {deadlineText && <span className="ml-1 text-xs text-muted-foreground/80">{deadlineText}</span>}
                        </div>
                        {completionPercentage !== null && p.status !== "Projeto Concluído" && (
                           <Badge
                            variant={completionBadgeStyle.variant}
                            className={`text-xs mt-1 ml-6 ${completionBadgeStyle.className}`}
                           >
                            <Percent className="mr-1 h-3 w-3" /> {completionPercentage}
                           </Badge>
                        )}
                      </li>
                    );
                  })}
                  {remainingProjectsCount > 0 && <li className="mt-1 ml-6">E mais {remainingProjectsCount}...</li>}
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
    
    
