
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppData } from '@/hooks/useAppData';
import { ProjectForm } from '@/components/ProjectForm';
import type { ProjectFormValues } from "@/components/ProjectForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { Project, ProjectType, PriorityType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function ProjectEditPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = typeof params.clientId === 'string' ? params.clientId : '';
  const projectId = typeof params.projectId === 'string' ? params.projectId : '';

  const { getProjectById, updateProject, loading, getClientById } = useAppData();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [clientName, setClientName] = useState<string>('');

  useEffect(() => {
    if (!loading && clientId && projectId) {
      const foundProject = getProjectById(clientId, projectId);
      const client = getClientById(clientId);
      if (foundProject) {
        setProject(foundProject);
        if (client) {
          setClientName(client.nome);
        }
      } else {
        toast({variant: "destructive", title: "Projeto não encontrado"});
        router.push(clientId ? `/clients/${clientId}` : '/');
      }
    }
  }, [clientId, projectId, getProjectById, getClientById, loading, router, toast]);

  const handleUpdateProject = (data: ProjectFormValues) => { // data.prazo e data.dataConclusao aqui são Date | undefined
    if (!project || !clientId) return;
    
    // ProjectFormValues tem prazo e dataConclusao como Date | undefined.
    // ProjectForm.handleSubmitLogic formata para string "yyyy-MM-dd" ou undefined antes de chamar este onSubmit.
    // Então, o 'data' recebido aqui já tem as datas formatadas como string ou undefined.

    const updatedProjectData: Partial<Project> = {
      nome: data.nome,
      tipo: data.tipo as ProjectType,
      status: data.status,
      prioridade: data.prioridade as PriorityType, 
      descricao: data.descricao,
      prazo: data.prazo, // Já é string "yyyy-MM-dd" ou undefined
      valor: data.valor,
      notas: data.notas,
      checklist: data.checklist || [],
      dataConclusao: data.dataConclusao, // Já é string "yyyy-MM-dd" ou undefined
    };
    
    // Remover campos que são undefined para evitar problemas com o Firestore
    const cleanUpdateData: Partial<Project> = {};
    for (const key in updatedProjectData) {
      if (updatedProjectData[key as keyof Partial<Project>] !== undefined) {
        (cleanUpdateData as any)[key] = updatedProjectData[key as keyof Partial<Project>];
      }
    }
    
    updateProject(clientId, project.id, cleanUpdateData);
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
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para {clientName ? `Cliente: ${clientName}` : 'Detalhes do Cliente'}
      </Button>
      <ProjectForm project={project} onSubmit={handleUpdateProject} isPage={true} />
    </div>
  );
}
