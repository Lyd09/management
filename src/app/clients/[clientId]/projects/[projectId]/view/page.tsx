
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppData } from '@/hooks/useAppData';
import { ProjectDisplay } from '@/components/ProjectDisplay';
import { Loader2 } from "lucide-react";
import type { Project, Client } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function ProjectViewPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = typeof params.clientId === 'string' ? params.clientId : '';
  const projectId = typeof params.projectId === 'string' ? params.projectId : '';

  const { getProjectById, getClientById, loading } = useAppData();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    if (!loading && clientId && projectId) {
      const foundProject = getProjectById(clientId, projectId);
      const foundClient = getClientById(clientId);

      if (foundProject && foundClient) {
        setProject(foundProject);
        setClient(foundClient);
      } else {
        if (!foundClient) {
            toast({variant: "destructive", title: "Cliente não encontrado"});
            router.push('/');
        } else if (!foundProject) {
            toast({variant: "destructive", title: "Projeto não encontrado"});
            router.push(clientId ? `/clients/${clientId}` : '/');
        }
      }
    }
  }, [clientId, projectId, getProjectById, getClientById, loading, router, toast]);

  if (loading || !project || !client) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-xl">Carregando dados do projeto...</p>
      </div>
    );
  }

  return <ProjectDisplay project={project} client={client} />;
}

    