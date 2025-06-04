
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { AppData, Client, Project, ProjectType, ChecklistItem, PriorityType, User } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { db, auth } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  writeBatch,
  getDocs,
  serverTimestamp,
  Timestamp,
  setDoc,
  where
} from 'firebase/firestore';
import { 
    createUserWithEmailAndPassword, 
    updateEmail as firebaseUpdateEmail, 
    updatePassword as firebaseUpdatePassword,
    deleteUser as firebaseDeleteUser, 
    type User as FirebaseUser 
} from 'firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface FirebaseClientDoc {
  nome: string;
  createdAt: Timestamp;
  prioridade?: PriorityType;
  creatorUserId: string;
}

interface FirebaseProjectDoc {
  nome: string;
  tipo: ProjectType;
  status: string;
  descricao?: string;
  prazo?: string;
  notas?: string;
  checklist: ChecklistItem[];
  createdAt: Timestamp;
  prioridade?: PriorityType;
  valor?: number;
  creatorUserId: string;
  assignedUserId?: string;
  dataConclusao?: string;
}

interface FirebaseUserDoc {
    username: string;
    email?: string;
    role: 'admin' | 'user';
    createdAt: Timestamp;
}


interface AppDataContextType {
  clients: Client[];
  users: User[];
  loading: boolean;
  addClient: (nome: string, prioridade?: PriorityType) => Promise<void>;
  updateClient: (clientId: string, nome: string, prioridade?: PriorityType) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  getClientById: (clientId: string) => Client | undefined;
  addProject: (clientId: string, projectData: Omit<Project, 'id' | 'checklist' | 'clientId' | 'creatorUserId'> & { checklist?: Partial<Project['checklist']>, prioridade?: PriorityType, valor?: number }) => Promise<void>;
  updateProject: (clientId: string, projectId: string, projectData: Partial<Omit<Project, 'creatorUserId'>>) => Promise<void>;
  deleteProject: (clientId: string, projectId: string) => Promise<void>;
  getProjectById: (clientId: string, projectId: string) => Project | undefined;
  duplicateProject: (clientId: string, projectIdToDuplicate: string) => Promise<void>;
  importData: (jsonData: AppData) => boolean;
  exportData: () => AppData;
  addUser: (userData: Omit<User, 'id' | 'createdAt'> & { password?: string }) => Promise<void>;
  updateUser: (userId: string, userData: Partial<Omit<User, 'id' | 'createdAt'>> & { newPassword?: string }) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  fetchUsers: () => void;
}

export const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser: loggedInUserFromAuthContext } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const usersCollectionRef = collection(db, 'users');
    const qUsers = query(usersCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribeUsers = onSnapshot(qUsers, (querySnapshot) => {
      const usersData: User[] = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id, 
        ...(docSnap.data() as FirebaseUserDoc),
      }));
      setUsers(usersData);
    }, (error) => {
      console.error("Error fetching users from Firestore:", error);
      setUsers([]);
    });
    return () => unsubscribeUsers();
  }, []);


  useEffect(() => {
    console.log('[AppDataContext] useEffect for clientes. LoggedInUser ID:', loggedInUserFromAuthContext?.id);
    
    if (!loggedInUserFromAuthContext || !loggedInUserFromAuthContext.id) {
      setClients([]);
      setLoading(false); 
      console.log('[AppDataContext] No logged in user or no user ID, clearing clients.');
      return; 
    }

    setLoading(true);
    const clientesCollectionRef = collection(db, 'clientes'); 
    
    console.log(`[AppDataContext] Querying 'clientes' where 'creatorUserId' == '${loggedInUserFromAuthContext.id}' and ordered by 'createdAt' desc.`);
    const q = query(
      clientesCollectionRef, 
      where('creatorUserId', '==', loggedInUserFromAuthContext.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeClients = onSnapshot(q, async (querySnapshot) => {
      console.log('[AppDataContext] Raw querySnapshot docs for clientes:', querySnapshot.docs.length, 'docs found.');
      querySnapshot.docs.forEach(doc => console.log('[AppDataContext] Client doc data from Firestore:', doc.id, doc.data()));
      
      const clientsData: Client[] = [];
      for (const clientDoc of querySnapshot.docs) {
        const clientFirebaseData = clientDoc.data() as FirebaseClientDoc;
        
        const client: Client = {
          id: clientDoc.id,
          nome: clientFirebaseData.nome,
          prioridade: clientFirebaseData.prioridade,
          creatorUserId: clientFirebaseData.creatorUserId,
          createdAt: clientFirebaseData.createdAt,
          projetos: [],
        };

        const projectsCollectionRef = collection(db, 'clientes', clientDoc.id, 'projects'); 
        const projectsSnapshot = await getDocs(projectsCollectionRef);
        
        client.projetos = projectsSnapshot.docs.map(projectDoc => {
          const projectFirebaseData = projectDoc.data() as FirebaseProjectDoc;
          return {
            id: projectDoc.id,
            ...projectFirebaseData,
          } as Project;
        });
        clientsData.push(client);
      }
      console.log('[AppDataContext] Processed clientsData to be set:', clientsData);
      setClients(clientsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching clientes from Firestore:", error);
      toast({ variant: "destructive", title: "Erro ao Carregar Clientes", description: `Não foi possível buscar os dados dos clientes. Detalhe: ${error.message}` });
      setClients([]);
      setLoading(false);
    });

    return () => unsubscribeClients();
  }, [loggedInUserFromAuthContext, toast]); 

  const addClient = useCallback(async (nome: string, prioridade?: PriorityType) => {
    if (!loggedInUserFromAuthContext) {
        console.error("Não é possível adicionar cliente: usuário não logado.");
        toast({ variant: "destructive", title: "Erro de Autenticação", description: "Você precisa estar logado para adicionar clientes." });
        return;
    }
    try {
      await addDoc(collection(db, 'clientes'), { 
        nome,
        prioridade: prioridade || "Média",
        creatorUserId: loggedInUserFromAuthContext.id,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding client to Firestore:", error);
      toast({ variant: "destructive", title: "Erro ao Adicionar Cliente", description: "Não foi possível adicionar o cliente." });
    }
  }, [loggedInUserFromAuthContext, toast]);

  const updateClient = useCallback(async (clientId: string, nome: string, prioridade?: PriorityType) => {
    try {
      const clientDocRef = doc(db, 'clientes', clientId); 
      const updateData: Partial<FirebaseClientDoc> = { nome };
      if (prioridade) {
        updateData.prioridade = prioridade;
      }
      await updateDoc(clientDocRef, updateData as any);
    } catch (error) {
      console.error("Error updating client in Firestore:", error);
      toast({ variant: "destructive", title: "Erro ao Atualizar Cliente", description: "Não foi possível atualizar o cliente." });
    }
  }, [toast]);

  const deleteClient = useCallback(async (clientId: string) => {
    try {
      const clientDocRef = doc(db, 'clientes', clientId); 
      const projectsCollectionRef = collection(db, 'clientes', clientId, 'projects'); 
      const projectsSnapshot = await getDocs(projectsCollectionRef);

      const batch = writeBatch(db);
      projectsSnapshot.docs.forEach(projectDoc => {
        batch.delete(doc(db, 'clientes', clientId, 'projects', projectDoc.id)); 
      });
      batch.delete(clientDocRef);
      await batch.commit();
    } catch (error) {
      console.error("Error deleting client and their projects from Firestore:", error);
      toast({ variant: "destructive", title: "Erro ao Excluir Cliente", description: "Não foi possível excluir o cliente e seus projetos." });
    }
  }, [toast]);
  
  const getClientById = useCallback((clientId: string) => {
    return clients.find(c => c.id === clientId);
  }, [clients]);

  const addProject = useCallback(async (clientId: string, projectData: Omit<Project, 'id' | 'checklist' | 'clientId' | 'creatorUserId'> & { checklist?: Partial<Project['checklist']>, prioridade?: PriorityType, valor?: number }) => {
    if (!loggedInUserFromAuthContext) {
        console.error("Não é possível adicionar projeto: usuário não logado.");
        toast({ variant: "destructive", title: "Erro de Autenticação", description: "Você precisa estar logado para adicionar projetos." });
        return;
    }
    try {
      const projectsCollectionRef = collection(db, 'clientes', clientId, 'projects'); 
      const newProjectData: Omit<FirebaseProjectDoc, 'createdAt' | 'assignedUserId'> = {
        nome: projectData.nome,
        tipo: projectData.tipo,
        status: projectData.status,
        descricao: projectData.descricao,
        prazo: projectData.prazo,
        dataConclusao: projectData.dataConclusao,
        notas: projectData.notas,
        prioridade: projectData.prioridade || "Média",
        valor: projectData.valor,
        creatorUserId: loggedInUserFromAuthContext.id,
        checklist: (projectData.checklist || []).map(item => ({...item, id: item.id || uuidv4()})) as ChecklistItem[],
      };
      await addDoc(projectsCollectionRef, {
        ...newProjectData,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding project to Firestore:", error);
      toast({ variant: "destructive", title: "Erro ao Adicionar Projeto", description: "Não foi possível adicionar o projeto." });
    }
  }, [loggedInUserFromAuthContext, toast]);

  const updateProject = useCallback(async (clientId: string, projectId: string, projectData: Partial<Omit<Project, 'creatorUserId'>>) => {
    try {
      const projectDocRef = doc(db, 'clientes', clientId, 'projects', projectId); 
      const dataToUpdate = {...projectData} as any;
      delete dataToUpdate.creatorUserId;

      if (dataToUpdate.checklist) {
        dataToUpdate.checklist = dataToUpdate.checklist.map((item: ChecklistItem) => ({
          ...item,
          id: item.id || uuidv4(),
        }));
      }
      if ('valor' in dataToUpdate && (dataToUpdate.valor === undefined || dataToUpdate.valor === null || isNaN(Number(dataToUpdate.valor)))) {
         dataToUpdate.valor = undefined;
      } else if ('valor'in dataToUpdate) {
         dataToUpdate.valor = Number(dataToUpdate.valor);
      }

      await updateDoc(projectDocRef, dataToUpdate);
    } catch (error) {
      console.error("Error updating project in Firestore:", error);
      toast({ variant: "destructive", title: "Erro ao Atualizar Projeto", description: "Não foi possível atualizar o projeto." });
    }
  }, [toast]);

  const deleteProject = useCallback(async (clientId: string, projectId: string) => {
    try {
      const projectDocRef = doc(db, 'clientes', clientId, 'projects', projectId); 
      await deleteDoc(projectDocRef);
    } catch (error) {
      console.error("Error deleting project from Firestore:", error);
      toast({ variant: "destructive", title: "Erro ao Excluir Projeto", description: "Não foi possível excluir o projeto." });
    }
  }, [toast]);

  const getProjectById = useCallback((clientId: string, projectId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.projetos.find(p => p.id === projectId);
  }, [clients]);

  const duplicateProject = useCallback(async (clientId: string, projectIdToDuplicate: string) => {
    if (!loggedInUserFromAuthContext) {
        console.error("Não é possível duplicar projeto: usuário não logado.");
        toast({ variant: "destructive", title: "Erro de Autenticação", description: "Você precisa estar logado para duplicar projetos." });
        return;
    }
    const originalProject = getProjectById(clientId, projectIdToDuplicate);
    if (!originalProject) {
      console.error("Projeto original não encontrado para duplicação.");
      toast({ variant: "destructive", title: "Erro ao Duplicar", description: "Projeto original não encontrado." });
      return;
    }

    const duplicatedProjectData: Omit<Project, 'id' | 'checklist' | 'clientId' | 'creatorUserId'> & { checklist?: Partial<Project['checklist']>, prioridade?: PriorityType, valor?: number } = {
      nome: `${originalProject.nome} (Cópia)`,
      tipo: originalProject.tipo,
      status: originalProject.status, 
      descricao: originalProject.descricao,
      prazo: originalProject.prazo, 
      dataConclusao: undefined, 
      notas: originalProject.notas,
      prioridade: originalProject.prioridade,
      valor: originalProject.valor,
      checklist: originalProject.checklist.map(item => ({
        id: uuidv4(),
        item: item.item,
        feito: false, 
      })),
    };

    try {
      await addProject(clientId, duplicatedProjectData);
    } catch (error) {
      console.error("Erro ao duplicar projeto no Firestore:", error);
    }
  }, [addProject, getProjectById, loggedInUserFromAuthContext, toast]);

  const importData = useCallback((jsonData: AppData): boolean => {
    console.warn("Data import from JSON is deprecated. Data is now managed in Firestore.");
    toast({ title: "Funcionalidade Descontinuada", description: "A importação de dados via JSON foi descontinuada."});
    return false;
  }, [toast]);

  const exportData = useCallback((): AppData => {
    console.warn("Data export to JSON is deprecated. Data is now managed in Firestore.");
    toast({ title: "Funcionalidade Descontinuada", description: "A exportação de dados via JSON foi descontinuada."});
    return { clientes: clients, users: users };
  }, [clients, users, toast]);

  const addUser = useCallback(async (userData: Omit<User, 'id' | 'createdAt'> & { password?: string }) => {
    const email = userData.email || ""; 
    const password = userData.password || ""; 

    const { password: _passwordVal, ...firestoreData } = userData; 

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, {
        ...firestoreData, 
        email: email, 
        createdAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error("Error adding user to Firebase Auth or Firestore:", error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("Este email já está em uso por outra conta.");
      } else if (error.code === 'auth/weak-password') {
        throw new Error("A senha fornecida é muito fraca. Deve ter pelo menos 6 caracteres.");
      } else if (error.code === 'auth/invalid-email') {
         throw new Error("O email fornecido é inválido ou não foi preenchido.");
      } else if (error.code === 'auth/missing-password') { 
         throw new Error("A senha não foi preenchida ou é inválida.");
      } else {
        throw new Error("Não foi possível adicionar o usuário: " + error.message);
      }
    }
  }, []);

  const updateUser = useCallback(async (userId: string, userData: Partial<Omit<User, 'id' | 'createdAt'>> & { newPassword?: string }) => {
    try {
      const userToUpdate = users.find(u => u.id === userId);
      if (!userToUpdate) {
        throw new Error("Usuário não encontrado para atualização.");
      }

      const { newPassword, ...firestoreUpdates } = userData;

      if (userToUpdate.username === 'ff.admin') {
        if (firestoreUpdates.username && firestoreUpdates.username !== 'ff.admin') {
          throw new Error("O nome de usuário 'ff.admin' não pode ser alterado.");
        }
        if (firestoreUpdates.role && firestoreUpdates.role !== 'admin') {
          throw new Error("O papel (role) de 'ff.admin' não pode ser alterado.");
        }
      }
      
      const userDocRef = doc(db, 'users', userId);
      const dataToUpdateInFirestore: Partial<FirebaseUserDoc> = {};

      if (firestoreUpdates.username !== undefined) dataToUpdateInFirestore.username = firestoreUpdates.username;
      if (firestoreUpdates.email !== undefined) dataToUpdateInFirestore.email = firestoreUpdates.email;
      if (firestoreUpdates.role !== undefined) dataToUpdateInFirestore.role = firestoreUpdates.role;
      
      Object.keys(dataToUpdateInFirestore).forEach(key => 
        (dataToUpdateInFirestore as any)[key] === undefined && delete (dataToUpdateInFirestore as any)[key]
      );
      
      if (Object.keys(dataToUpdateInFirestore).length > 0) {
        await updateDoc(userDocRef, dataToUpdateInFirestore);
      }

      if (firestoreUpdates.email && firestoreUpdates.email !== userToUpdate.email) {
         if (auth.currentUser && auth.currentUser.uid === userId) { 
            try {
                await firebaseUpdateEmail(auth.currentUser, firestoreUpdates.email);
                toast({ title: "Email de Autenticação Atualizado", description: "Seu email de login foi atualizado." });
            } catch (authError: any) {
                 if (authError.code === 'auth/requires-recent-login') {
                     toast({ variant: "destructive", title: "Reautenticação Necessária", description: "Para atualizar seu email de login, por favor, faça logout e login novamente, depois tente de novo." });
                 } else {
                     toast({ variant: "destructive", title: "Erro ao Atualizar Email de Login", description: authError.message });
                 }
            }
         } else { 
             console.warn(`Admin is changing email for user ${userId}. This only updates Firestore. Firebase Auth email must be updated separately (e.g., via Admin SDK or Firebase console).`);
             toast({ title: "Email no Firestore Atualizado", description: `O email de ${userToUpdate.username} foi atualizado nos registros. A alteração do email de login deve ser feita no console do Firebase.`});
         }
      }

      if (newPassword && newPassword.length >= 6) {
        if (auth.currentUser && auth.currentUser.uid === userId) { 
          try {
            await firebaseUpdatePassword(auth.currentUser, newPassword);
            toast({ title: "Senha Atualizada", description: "Sua senha foi alterada com sucesso." });
          } catch (authError: any) {
            console.error("Error updating password in Firebase Auth for current user:", authError);
            if (authError.code === 'auth/requires-recent-login') {
              toast({ variant: "destructive", title: "Reautenticação Necessária", description: "Para alterar sua senha, por favor, faça logout e login novamente, depois tente de novo." });
            } else {
              toast({ variant: "destructive", title: "Erro ao Alterar Senha", description: authError.message });
            }
          }
        } else { 
          console.warn(`Attempt to change password for user ${userId} by another user/admin (${auth.currentUser?.uid}). This action is not directly supported by client SDKs for other users and should have been prevented by UI.`);
          toast({
            variant: "destructive", 
            title: "Ação de Senha Não Permitida",
            description: `A senha de '${userToUpdate.username}' não pode ser alterada desta forma. Apenas o próprio usuário pode alterar sua senha.`,
            duration: 7000,
          });
        }
      }

    } catch (error: any) {
      console.error("Error updating user in Firestore/Auth:", error);
      throw error; 
    }
  }, [users, toast]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      const userToDelete = users.find(u => u.id === userId);
      if (userToDelete && userToDelete.username === 'ff.admin') {
        throw new Error("O usuário 'ff.admin' não pode ser excluído.");
      }

      const userDocRef = doc(db, 'users', userId);
      await deleteDoc(userDocRef);
      
      if (auth.currentUser && auth.currentUser.uid === userId) {
        try {
          await firebaseDeleteUser(auth.currentUser);
          toast({ title: "Usuário Removido da Autenticação", description: "Sua conta foi removida do sistema de autenticação."});
        } catch (authError: any) {
          console.error(`Error deleting user ${userId} from Firebase Authentication:`, authError);
          throw new Error(`Usuário removido do banco de dados, mas falha ao remover da autenticação: ${authError.message}. Pode ser necessário remover manualmente no console do Firebase.`);
        }
      } else {
        console.warn(`User ${userId} deleted from Firestore. Manual deletion from Firebase Authentication console is required for full removal if this user was not the currently logged-in user.`);
        toast({ title: "Usuário Removido do Firestore", description: "Para remoção completa do sistema de autenticação, acesse o console do Firebase."});
      }

    } catch (error:any) {
      console.error("Error deleting user from Firestore:", error);
      throw error;
    }
  }, [users, toast]);
  
  const fetchUsers = useCallback(() => {
    // console.log("fetchUsers called - onSnapshot provides live updates.");
  }, []);


  return (
    <AppDataContext.Provider
      value={{
        clients,
        users,
        loading,
        addClient,
        updateClient,
        deleteClient,
        getClientById,
        addProject,
        updateProject,
        deleteProject,
        getProjectById,
        duplicateProject,
        importData,
        exportData,
        addUser,
        updateUser,
        deleteUser,
        fetchUsers,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

    
