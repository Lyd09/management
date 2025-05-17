
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
import { PlusCircle, Edit2, Trash2, Search, Filter, ExternalLink, Loader2, Users, FolderKanban } from "lucide-react";
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

export default function DashboardPage() {
  const { clients, addClient, updateClient, deleteClient, loading } = useAppData();
  const { toast } = useToast();
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [isEditClientDialogOpen, setIsEditClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ReturnType<typeof useAppData>['clients'][0] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);


  const handleAddClient = (data: ClientFormValues) => {
    addClient(data.nome);
    setIsAddClientDialogOpen(false);
    toast({ title: "Cliente Adicionado", description: `O cliente ${data.nome} foi adicionado com sucesso.` });
  };

  const handleEditClient = (data: ClientFormValues) => {
    if (editingClient) {
      updateClient(editingClient.id, data.nome);
      setIsEditClientDialogOpen(false);
      setEditingClient(null);
      toast({ title: "Cliente Atualizado", description: `O cliente ${data.nome} foi atualizado.` });
    }
  };
  
  const openEditDialog = (client: ReturnType<typeof useAppData>['clients'][0]) => {
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
    if (!searchTerm) return clients;
    return clients.filter(client =>
      client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.projetos.some(project => project.nome.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [clients, searchTerm]);

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
        <h1 className="text-3xl font-bold text-primary">Painel de Clientes</h1>
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

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Input
            type="search"
            placeholder="Buscar cliente ou projeto..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
        {/* Placeholder for filter button */}
        {/* <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" /> Filtros
        </Button> */}
      </div>

      {filteredClients.length === 0 && !loading && (
        <Card className="text-center py-10">
          <CardHeader>
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4 text-2xl">Nenhum cliente encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              {searchTerm ? `Nenhum cliente corresponde à sua busca "${searchTerm}".` : "Você ainda não adicionou nenhum cliente."}
            </CardDescription>
          </CardContent>
          {!searchTerm && (
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
        {filteredClients.map((client) => (
          <Card key={client.id} className="flex flex-col hover:shadow-primary/20 hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{client.nome}</CardTitle>
                <Link href={`/clients/${client.id}`} passHref legacyBehavior>
                  <Button variant="ghost" size="icon" aria-label={`Ver detalhes de ${client.nome}`}>
                    <ExternalLink className="h-5 w-5 text-primary" />
                  </Button>
                </Link>
              </div>
              <CardDescription>{client.projetos.length} projeto(s)</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              {client.projetos.length > 0 ? (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {client.projetos.slice(0, 3).map(p => (
                    <li key={p.id} className="flex items-center">
                      <FolderKanban className="h-4 w-4 mr-2 text-primary/70 shrink-0"/> 
                      {p.nome}
                    </li>
                  ))}
                  {client.projetos.length > 3 && <li>E mais {client.projetos.length - 3}...</li>}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">Nenhum projeto cadastrado para este cliente.</p>
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
        ))}
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
