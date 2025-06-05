
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Client, User, Project } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface DelegateClientDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  client: Client;
  projects: Project[]; // Lista de projetos do cliente original
  users: User[]; // Lista de usuários para quem delegar
  onConfirm: (targetUserId: string, selectedProjectIds: string[], newClientName?: string) => Promise<boolean>;
}

export function DelegateClientDialog({
  isOpen,
  onOpenChange,
  client,
  projects,
  users,
  onConfirm,
}: DelegateClientDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [newClientName, setNewClientName] = useState<string>('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setNewClientName(client.nome); // Pré-popula com o nome original ao abrir
      // Inicializa todos os projetos como não selecionados
      const initialSelectedProjects: Record<string, boolean> = {};
      projects.forEach(p => initialSelectedProjects[p.id] = false);
      setSelectedProjectIds(initialSelectedProjects);
      setSelectedUserId(''); // Reseta o usuário selecionado
    }
  }, [isOpen, client.nome, projects]);

  const handleProjectSelectionChange = (projectId: string, checked: boolean) => {
    setSelectedProjectIds(prev => ({ ...prev, [projectId]: checked }));
  };

  const getFinalSelectedProjectIds = (): string[] => {
    return Object.entries(selectedProjectIds)
      .filter(([, isSelected]) => isSelected)
      .map(([projectId]) => projectId);
  };

  const handleConfirm = async () => {
    if (!selectedUserId) {
      toast({ variant: "destructive", title: "Seleção Necessária", description: "Por favor, selecione um usuário de destino." });
      return;
    }
    if (!newClientName.trim()) {
        toast({ variant: "destructive", title: "Nome Inválido", description: "Por favor, forneça um nome válido para o cliente delegado." });
        return;
    }

    const finalProjectIdsToDelegate = getFinalSelectedProjectIds();
    // Opcional: Adicionar um toast se nenhum projeto for selecionado, mas ainda prosseguir
    if (finalProjectIdsToDelegate.length === 0) {
        toast({ title: "Aviso", description: `Nenhum projeto selecionado. Apenas o cliente "${newClientName.trim()}" será delegado.`, duration: 4000 });
    }

    const success = await onConfirm(selectedUserId, finalProjectIdsToDelegate, newClientName.trim());
    if (success) {
      onOpenChange(false); 
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Delegar Cópia do Cliente: {client.nome}</DialogTitle>
          <DialogDescription>
            Selecione um usuário, os projetos a serem copiados (opcional) e um nome para o cliente delegado.
            Campos como descrição, valor e notas gerais dos projetos não serão incluídos.
            O checklist dos projetos copiados será resetado e o status será o inicial.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2 flex-grow overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="targetUser">Usuário de Destino</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="targetUser">
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                {users.length > 0 ? (
                  users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username} ({user.email || 'Sem email'})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-users" disabled>
                    Nenhum outro usuário disponível
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newClientName">Nome para o Cliente Delegado</Label>
            <Input
                id="newClientName"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Nome do cliente para o usuário destino"
            />
          </div>

          {projects.length > 0 && (
            <div className="space-y-2">
              <Label>Selecionar Projetos para Delegar (Opcional)</Label>
              <ScrollArea className="h-[200px] w-full rounded-md border p-3">
                <div className="space-y-2">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                      <Checkbox
                        id={`project-select-${project.id}`}
                        checked={selectedProjectIds[project.id] || false}
                        onCheckedChange={(checked) => handleProjectSelectionChange(project.id, !!checked)}
                      />
                      <Label htmlFor={`project-select-${project.id}`} className="font-normal cursor-pointer flex-grow">
                        {project.nome} <span className="text-xs text-muted-foreground">({project.tipo})</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          {projects.length === 0 && (
            <p className="text-sm text-muted-foreground">Este cliente não possui projetos para delegar.</p>
          )}
        </div>

        <DialogFooter className="mt-auto pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleConfirm} 
            disabled={!selectedUserId || users.length === 0 || !newClientName.trim()}
          >
            Confirmar Delegação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
