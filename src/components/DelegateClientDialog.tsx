
"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
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
import type { Client, User } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface DelegateClientDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  client: Client;
  users: User[]; // Lista de usuários para quem delegar (excluindo o admin atual)
  onConfirm: (targetUserId: string, newClientName?: string) => Promise<boolean>;
}

export function DelegateClientDialog({
  isOpen,
  onOpenChange,
  client,
  users,
  onConfirm,
}: DelegateClientDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [newClientName, setNewClientName] = useState<string>(client.nome); // Pré-popula com o nome original
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (!selectedUserId) {
      toast({ variant: "destructive", title: "Seleção Necessária", description: "Por favor, selecione um usuário de destino." });
      return;
    }
    if (!newClientName.trim()) {
        toast({ variant: "destructive", title: "Nome Inválido", description: "Por favor, forneça um nome válido para o cliente delegado." });
        return;
    }

    const success = await onConfirm(selectedUserId, newClientName.trim());
    if (success) {
      onOpenChange(false); // Fecha o diálogo em caso de sucesso
      setSelectedUserId(''); // Reset
      setNewClientName(client.nome); // Reset
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedUserId('');
    setNewClientName(client.nome);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delegar Cópia do Cliente: {client.nome}</DialogTitle>
          <DialogDescription>
            Selecione um usuário para receber uma cópia deste cliente e seus projetos.
            Campos como descrição, valor e notas gerais dos projetos não serão incluídos na cópia.
            O checklist dos projetos será resetado (todos os itens como não feitos) e o status será o inicial.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!selectedUserId || users.length === 0 || !newClientName.trim()}>
            Confirmar Delegação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
