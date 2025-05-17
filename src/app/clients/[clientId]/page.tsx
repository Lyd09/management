
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAppData } from '@/hooks/useAppData';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ProjectForm } from "@/components/ProjectForm";
import type { ProjectFormValues } from "@/components/ProjectForm";
import { PlusCircle, Edit2, Trash2, ArrowLeft, Loader2, FolderKanban, ExternalLink } from "lucide-react";
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
import type { Client, Project } from '@/types';
import { Badge } from '@/components/ui/badge';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = typeof params.clientId === 'string' ? params.clientId : '';
  
  const { getClientById, addProject, deleteProject, loading } = useAppData();
  const { toast } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && clientId) {
      const foundClient = getClientById(clientId);
      if (foundClient) {
        setClient(foundClient);
      } else {
        // Optional: redirect or show not found message
        toast({variant: "destructive", title: "Cliente não encontrado"});
        router.push('/');
      }
    }
  }, [clientId, getClientById, loading, router, toast]);

  const handleAddProject = (data: ProjectFormValues) => {
    if (!client) return;
    const projectData = {
      nome: data.nome,
      tipo: data.tipo,
      status: data.status,
      descricao: data.descricao,
      prazo: data.prazo ? data.prazo.toISOString().split('T')[0] : undefined, // format date correctly
      notas: data.notas,
      checklist: data.checklist || [],
    };
    addProject(client.id, projectData as any); // type assertion for checklist Partial
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
            {/* DialogHeader and Title are part of ProjectForm now */}
            <ProjectForm onSubmit={handleAddProject} onClose={() => setIsAddProjectDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <h2 className="text-2xl font-semibold">Projetos</h2>
      {client.projetos.length === 0 ? (
        <Card className="text-center py-10">
          <CardHeader>
             <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4 text-2xl">Nenhum projeto cadastrado</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Este cliente ainda não possui projetos.</CardDescription>
          </CardContent>
           <CardFooter className="justify-center">
              <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="lg">
                    <PlusCircle className="mr-2 h-5 w-5" /> Adicionar primeiro projeto
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
          {client.projetos.map((project) => (
            <Card key={project.id} className="flex flex-col hover:shadow-primary/20 hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{project.nome}</CardTitle>
                    <Link href={`/clients/${client.id}/projects/${project.id}`} passHref legacyBehavior>
                        <Button variant="ghost" size="icon" aria-label={`Editar projeto ${project.nome}`}>
                            <ExternalLink className="h-5 w-5 text-primary" />
                        </Button>
                    </Link>
                </div>
                <CardDescription>{project.tipo}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-2">
                <Badge variant={project.status === "Projeto Concluído" ? "default" : "secondary"} className={project.status === "Projeto Concluído" ? "bg-green-600/80 text-white" : ""}>
                  {project.status}
                </Badge>
                <p className="text-sm text-muted-foreground line-clamp-2">{project.descricao || "Sem descrição."}</p>
                {project.prazo && <p className="text-xs text-muted-foreground">Prazo: {new Date(project.prazo + "T00:00:00").toLocaleDateString('pt-BR')}</p>}
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Link href={`/clients/${client.id}/projects/${project.id}`} passHref legacyBehavior>
                  <Button variant="outline" size="sm">
                    <Edit2 className="mr-1 h-3 w-3" /> Detalhes/Editar
                  </Button>
                </Link>
                <Button variant="destructive" size="sm" onClick={() => confirmDeleteProject(project.id)}>
                  <Trash2 className="mr-1 h-3 w-3" /> Excluir
                </Button>
              </CardFooter>
            </Card>
          ))}
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
