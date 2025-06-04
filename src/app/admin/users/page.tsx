
"use client";

import React, { useState, useEffect } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { UserForm } from "@/components/UserForm";
import type { UserFormValues } from "@/components/UserForm";
import { PlusCircle, Edit2, Trash2, Loader2, Users as UsersIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from '@/hooks/useAuth';

export default function AdminUsersPage() {
  const { users, addUser, updateUser, deleteUser, loading: appDataLoading } = useAppData();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const isLoading = appDataLoading;

  const handleAddUserSubmit = async (data: UserFormValues) => {
    try {
      await addUser({
        username: data.username,
        email: data.email,
        role: data.role,
        password: data.password, // ADICIONADO: Passar a senha
      });
      setIsUserFormOpen(false);
      toast({ title: "Usuário Adicionado", description: `O usuário ${data.username} foi adicionado.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao Adicionar", description: error.message || "Não foi possível adicionar o usuário." });
    }
  };

  const handleEditUserSubmit = async (data: UserFormValues) => {
    if (editingUser) {
      try {
        let dataToUpdate: Partial<User> = { email: data.email };
         // UserForm component itself disables username/role for ff.admin.
         // Context handles backend prevention.
        dataToUpdate.username = data.username;
        dataToUpdate.role = data.role;

        await updateUser(editingUser.id, dataToUpdate);
        setIsUserFormOpen(false);
        setEditingUser(null);
        toast({ title: "Usuário Atualizado", description: `O usuário ${data.username} foi atualizado.` });
      } catch (error: any) {
        toast({ variant: "destructive", title: "Erro ao Atualizar", description: error.message || "Não foi possível atualizar o usuário." });
      }
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setIsUserFormOpen(true);
  };

  const confirmDeleteUser = (user: User) => {
    if (user.username === 'ff.admin') {
        toast({ variant: "destructive", title: "Ação não permitida", description: "O usuário 'ff.admin' não pode ser excluído."});
        return;
    }
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const handleDeleteUser = async () => {
    if (userToDelete) {
      try {
        await deleteUser(userToDelete.id);
        toast({ title: "Usuário Excluído", description: `Usuário ${userToDelete.username} foi excluído.` });
        setUserToDelete(null);
      } catch (error: any) {
        toast({ variant: "destructive", title: "Erro ao Excluir", description: error.message || "Não foi possível excluir o usuário." });
      }
    }
    setShowDeleteConfirm(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-xl">Carregando usuários...</p>
      </div>
    );
  }

  const displayUsers = users;


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">Gestão de Usuários</h1>
        </div>
        <Dialog open={isUserFormOpen} onOpenChange={(isOpen) => {
          setIsUserFormOpen(isOpen);
          if (!isOpen) setEditingUser(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <UserForm
              user={editingUser}
              onSubmit={editingUser ? handleEditUserSubmit : handleAddUserSubmit}
              onClose={() => {
                setIsUserFormOpen(false);
                setEditingUser(null);
              }}
              currentUserIsAdmin={currentUser?.role === 'admin'}
              editingSelf={editingUser?.id === currentUser?.id}
            />
          </DialogContent>
        </Dialog>
      </div>
      <CardDescription>
        Adicione, edite ou remova usuários do sistema. O usuário 'ff.admin' possui restrições de edição e não pode ser excluído.
      </CardDescription>

      {displayUsers.length === 0 ? (
        <Card className="text-center py-10">
          <CardHeader>
            <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle className="mt-4 text-2xl">Nenhum usuário cadastrado</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Não há usuários cadastrados no sistema.
            </CardDescription>
          </CardContent>
           <CardFooter className="justify-center">
             <Dialog open={isUserFormOpen} onOpenChange={(isOpen) => {
                setIsUserFormOpen(isOpen);
                if (!isOpen) setEditingUser(null);
             }}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <PlusCircle className="mr-2 h-5 w-5" /> Adicionar primeiro usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <UserForm
                  onSubmit={handleAddUserSubmit}
                  onClose={() => setIsUserFormOpen(false)}
                  currentUserIsAdmin={currentUser?.role === 'admin'}
                />
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayUsers.map((user) => {
                  const isFfAdmin = user.username === 'ff.admin';
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                          className="mr-2"
                        >
                          <Edit2 className="mr-1 h-3 w-3" /> Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => confirmDeleteUser(user)}
                          disabled={isFfAdmin}
                        >
                          <Trash2 className="mr-1 h-3 w-3" /> Excluir
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {userToDelete && (
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                Tem certeza que deseja excluir o usuário {userToDelete?.username}? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">Excluir Usuário</AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
