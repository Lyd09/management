
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppData } from '@/hooks/useAppData';
import { ProjectForm } from '@/components/ProjectForm';
import type { ProjectFormValues } from "@/components/ProjectForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { Project } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function ProjectEditPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = typeof params.clientId === 'string' ? params.clientId : '';
  const projectId = typeof params.projectId === 'string' ? params.projectId : '';

  const { getProjectById, updateProject, loading } = useAppData();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!loading && clientId && projectId) {
      const foundProject = getProjectById(clientId, projectId);
      if (foundProject) {
        setProject(foundProject);
      } else {
        toast({variant: "destructive", title: "Projeto não encontrado"});
        router.push(clientId ? `/clients/${clientId}` : '/');
      }
    }
  }, [clientId, projectId, getProjectById, loading, router, toast]);

  const handleUpdateProject = (data: ProjectFormValues) => {
    if (!project || !clientId) return;

    const updatedProjectData: Partial<Project> = {
      nome: data.nome,
      tipo: data.tipo,
      status: data.status,
      descricao: data.descricao,
      prazo: data.prazo ? data.prazo.toISOString().split('T')[0] : undefined,
      notas: data.notas,
      checklist: data.checklist || [],
    };
    
    updateProject(clientId, project.id, updatedProjectData);
    toast({ title: "Projeto Atualizado", description: `O projeto ${data.nome} foi atualizado com sucesso.` });
    router.push(`/clients/${clientId}`);
  };

  if (loading || !project) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-xl">Carregando dados do projeto...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push(`/clients/${clientId}`)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para {project ? `Cliente: ${getProjectById(clientId, project.id) ? 'Detalhes' : ''}` : 'Cliente'}
      </Button>
      <ProjectForm project={project} onSubmit={handleUpdateProject} isPage={true} />
    </div>
  );
}
