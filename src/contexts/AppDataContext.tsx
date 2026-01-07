
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
  where,
  getDoc,
  documentId
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
import { INITIAL_PROJECT_STATUS, PRIORITIES } from '@/lib/constants';

interface FirebaseClientDoc {
  nome: string;
  createdAt: Timestamp;
  prioridade?: PriorityType;
  creatorUserId: string;
  responsavel?: string;
  contato?: {
    email?: string;
    whatsapp?: string;
    socials?: string[];
    local?: string;
    municipio?: string;
  };
  documento?: string;
  segmento?: string;
  observacoes?: string;
}

interface FirebaseProjectDoc {
  nome: string;
  tipo: ProjectType;
  status: string;
  descricao?: string;
  prazo?: string; // ISO date string: "YYYY-MM-DD"
  notas?: string;
  checklist: ChecklistItem[];
  createdAt: Timestamp;
  prioridade?: PriorityType;
  valor?: number;
  creatorUserId: string;
  assignedUserId?: string;
  dataConclusao?: string; // ISO date string: "YYYY-MM-DD"
  googleCalendarEventId?: string;
  tags?: string[];
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
  addClient: (clientData: Omit<Client, 'id' | 'projetos' | 'creatorUserId' | 'createdAt'>) => Promise<void>;
  updateClient: (clientId: string, clientData: Partial<Omit<Client, 'id' | 'projetos' | 'creatorUserId' | 'createdAt'>>) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  getClientById: (clientId: string) => Client | undefined;
  addProject: (clientId: string, projectData: Omit<Project, 'id' | 'clientId' | 'creatorUserId'>) => Promise<boolean>;
  updateProject: (clientId: string, projectId: string, projectData: Partial<Omit<Project, 'creatorUserId'>>) => Promise<void>;
  deleteProject: (clientId: string, projectId: string) => Promise<void>;
  getProjectById: (clientId: string, projectId: string) => Project | undefined;
  duplicateProject: (clientId: string, projectIdToDuplicate: string) => Promise<boolean>;
  importData: (jsonData: AppData) => boolean;
  exportData: () => AppData;
  addUser: (userData: Omit<User, 'id' | 'createdAt'> & { password?: string }) => Promise<void>;
  updateUser: (userId: string, userData: Partial<Omit<User, 'id' | 'createdAt'>> & { newPassword?: string }) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  fetchUsers: () => void;
  assignClientCopyToUser: (originalClientId: string, targetUserId: string, selectedProjectIds: string[], newClientName?: string) => Promise<boolean>;
  clearAllData: () => Promise<void>;
}

export const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

const COLLECTION_NAME = 'clients'; 

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
      setUsers([]);
    });
    return () => unsubscribeUsers();
  }, []);


  useEffect(() => {
    if (!loggedInUserFromAuthContext || !loggedInUserFromAuthContext.id) {
      setClients([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userIdToQuery = loggedInUserFromAuthContext.id;
    const clientesCollectionRef = collection(db, COLLECTION_NAME);
    
    const q = query(
      clientesCollectionRef,
      where('creatorUserId', '==', userIdToQuery),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribeClients = onSnapshot(q, async (querySnapshot) => {
      const clientsData: Client[] = [];
      for (const clientDoc of querySnapshot.docs) {
        const clientFirebaseData = clientDoc.data() as FirebaseClientDoc;

        const client: Client = {
          id: clientDoc.id,
          nome: clientFirebaseData.nome,
          prioridade: clientFirebaseData.prioridade,
          creatorUserId: clientFirebaseData.creatorUserId,
          createdAt: clientFirebaseData.createdAt,
          responsavel: clientFirebaseData.responsavel,
          contato: clientFirebaseData.contato,
          documento: clientFirebaseData.documento,
          segmento: clientFirebaseData.segmento,
          observacoes: clientFirebaseData.observacoes,
          projetos: [],
        };

        const projectsCollectionRef = collection(db, COLLECTION_NAME, clientDoc.id, 'projects');
        const projectsQuery = query(projectsCollectionRef, orderBy('createdAt', 'desc'));
        const projectsSnapshot = await getDocs(projectsQuery);

        client.projetos = projectsSnapshot.docs.map(projectDoc => {
          const projectFirebaseData = projectDoc.data() as FirebaseProjectDoc;
          return {
            id: projectDoc.id,
            ...projectFirebaseData,
          } as Project;
        });
        clientsData.push(client);
      }
      setClients(clientsData);
      setLoading(false);
    }, (error) => {
      toast({ variant: "destructive", title: `Erro ao Carregar ${COLLECTION_NAME}`, description: `Não foi possível buscar os dados. Detalhe: ${error.message}` });
      setClients([]);
      setLoading(false);
    });

    return () => unsubscribeClients();
  }, [loggedInUserFromAuthContext, toast]);

  const addClient = useCallback(async (clientData: Omit<Client, 'id' | 'projetos' | 'creatorUserId' | 'createdAt'>) => {
    if (!loggedInUserFromAuthContext) {
        toast({ variant: "destructive", title: "Erro de Autenticação", description: "Você precisa estar logado para adicionar clientes." });
        return;
    }
    try {
      await addDoc(collection(db, COLLECTION_NAME), {
        ...clientData,
        prioridade: clientData.prioridade || "Média",
        creatorUserId: loggedInUserFromAuthContext.id,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao Adicionar Cliente", description: "Não foi possível adicionar o cliente." });
    }
  }, [loggedInUserFromAuthContext, toast]);

  const updateClient = useCallback(async (clientId: string, clientData: Partial<Omit<Client, 'id' | 'projetos' | 'creatorUserId' | 'createdAt'>>) => {
    try {
      const clientDocRef = doc(db, COLLECTION_NAME, clientId);
      
      const cleanData: Partial<FirebaseClientDoc> = {};
      Object.keys(clientData).forEach(key => {
        const typedKey = key as keyof typeof clientData;
        if (clientData[typedKey] !== undefined) {
           (cleanData as any)[typedKey] = clientData[typedKey];
        }
      });

      await updateDoc(clientDocRef, cleanData);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao Atualizar Cliente", description: "Não foi possível atualizar o cliente." });
    }
  }, [toast]);

  const deleteClient = useCallback(async (clientId: string) => {
    try {
      const clientDocRef = doc(db, COLLECTION_NAME, clientId);
      const projectsCollectionRef = collection(db, COLLECTION_NAME, clientId, 'projects');
      const projectsSnapshot = await getDocs(projectsCollectionRef);

      const batch = writeBatch(db);
      projectsSnapshot.docs.forEach(projectDoc => {
        batch.delete(doc(db, COLLECTION_NAME, clientId, 'projects', projectDoc.id));
      });
      batch.delete(clientDocRef);
      await batch.commit();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao Excluir Cliente", description: "Não foi possível excluir o cliente e seus projetos." });
    }
  }, [toast]);

  const getClientById = useCallback((clientId: string) => {
    return clients.find(c => c.id === clientId);
  }, [clients]);

  const addProject = useCallback(async (clientId: string, projectData: Omit<Project, 'id' | 'clientId' | 'creatorUserId'>): Promise<boolean> => {
    if (!loggedInUserFromAuthContext) {
        toast({ variant: "destructive", title: "Erro de Autenticação", description: "Você precisa estar logado para adicionar projetos." });
        return false;
    }
    try {
      const projectsCollectionRef = collection(db, COLLECTION_NAME, clientId, 'projects');
      
      const newProjectDataForFirebase: Omit<FirebaseProjectDoc, 'createdAt' | 'assignedUserId'> = {
        nome: projectData.nome,
        tipo: projectData.tipo,
        status: projectData.status,
        descricao: projectData.descricao,
        prazo: projectData.prazo,
        dataConclusao: projectData.dataConclusao,
        notas: projectData.notas,
        prioridade: projectData.prioridade || "Média",
        valor: projectData.valor,
        creatorUserId: loggedInUserFromAuthContext!.id,
        checklist: (projectData.checklist || []).map(item => ({
          ...item, 
          id: item.id || uuidv4() 
        })) as ChecklistItem[],
        googleCalendarEventId: projectData.googleCalendarEventId,
        tags: projectData.tags,
      };

      const cleanDataForFirestore: Partial<FirebaseProjectDoc> = {};
      for (const key in newProjectDataForFirebase) {
          if (newProjectDataForFirebase[key as keyof typeof newProjectDataForFirebase] !== undefined) {
              (cleanDataForFirestore as any)[key] = newProjectDataForFirebase[key as keyof typeof newProjectDataForFirebase];
          }
      }
      (cleanDataForFirestore as any).createdAt = serverTimestamp();

      await addDoc(projectsCollectionRef, cleanDataForFirestore);
      return true;
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao Adicionar Projeto", description: `Não foi possível adicionar o projeto. Detalhe: ${error.message || "Erro desconhecido"}` });
      return false;
    }
  }, [loggedInUserFromAuthContext, toast]);

  const updateProject = useCallback(async (clientId: string, projectId: string, projectData: Partial<Omit<Project, 'creatorUserId'>>) => {
    try {
      const projectDocRef = doc(db, COLLECTION_NAME, clientId, 'projects', projectId);
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
      toast({ variant: "destructive", title: "Erro ao Atualizar Projeto", description: "Não foi possível atualizar o projeto." });
    }
  }, [toast]);

  const deleteProject = useCallback(async (clientId: string, projectId: string) => {
    try {
      const projectDocRef = doc(db, COLLECTION_NAME, clientId, 'projects', projectId);
      await deleteDoc(projectDocRef);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao Excluir Projeto", description: "Não foi possível excluir o projeto." });
    }
  }, [toast]);

  const getProjectById = useCallback((clientId: string, projectId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.projetos.find(p => p.id === projectId);
  }, [clients]);

  const duplicateProject = useCallback(async (clientId: string, projectIdToDuplicate: string): Promise<boolean> => {
    if (!loggedInUserFromAuthContext) {
        toast({ variant: "destructive", title: "Erro de Autenticação", description: "Você precisa estar logado para duplicar projetos." });
        return false;
    }
    const originalProject = getProjectById(clientId, projectIdToDuplicate);
    if (!originalProject) {
      toast({ variant: "destructive", title: "Erro ao Duplicar", description: "Projeto original não encontrado." });
      return false;
    }

    const projectPriority: PriorityType = (originalProject.prioridade && PRIORITIES.includes(originalProject.prioridade))
        ? originalProject.prioridade
        : "Média";

    const duplicatedProjectData: Omit<Project, 'id' | 'clientId' | 'creatorUserId'> = {
      nome: `${originalProject.nome} (Cópia)`,
      tipo: originalProject.tipo,
      status: INITIAL_PROJECT_STATUS(originalProject.tipo),
      descricao: originalProject.descricao, 
      prazo: originalProject.prazo,        
      notas: originalProject.notas,          
      prioridade: projectPriority,
      valor: originalProject.valor,          
      dataConclusao: undefined,             
      checklist: (originalProject.checklist || []).map(item => ({
        id: uuidv4(),
        item: item.item,
        feito: false,
      })),
      tags: originalProject.tags
    };

    try {
      const success = await addProject(clientId, duplicatedProjectData);
      return success;
    } catch (error) {
      toast({ variant: "destructive", title: "Erro Interno ao Duplicar", description: "Falha ao processar a duplicação." });
      return false;
    }
  }, [addProject, getProjectById, loggedInUserFromAuthContext, toast]);


  const assignClientCopyToUser = useCallback(async (
    originalClientId: string, 
    targetUserId: string, 
    selectedProjectIds: string[], 
    newClientName?: string
  ): Promise<boolean> => {
    if (!loggedInUserFromAuthContext || loggedInUserFromAuthContext.role !== 'admin') {
      toast({ variant: "destructive", title: "Não Autorizado", description: "Apenas administradores podem delegar clientes." });
      return false;
    }

    const originalClientDocRef = doc(db, COLLECTION_NAME, originalClientId);
    try {
      const originalClientSnapshot = await getDoc(originalClientDocRef);
      if (!originalClientSnapshot.exists()) {
        toast({ variant: "destructive", title: "Erro", description: "Cliente original não encontrado." });
        return false;
      }
      const originalClientData = originalClientSnapshot.data() as FirebaseClientDoc;

      const batch = writeBatch(db);

      const newClientDocRef = doc(collection(db, COLLECTION_NAME)); 
      const clientDataForNewUser: FirebaseClientDoc = {
        nome: newClientName || originalClientData.nome, 
        creatorUserId: targetUserId,
        prioridade: originalClientData.prioridade || "Média", 
        createdAt: serverTimestamp() as Timestamp, 
      };
      batch.set(newClientDocRef, clientDataForNewUser);

      if (selectedProjectIds && selectedProjectIds.length > 0) {
        const originalProjectsColRef = collection(db, COLLECTION_NAME, originalClientId, 'projects');
        const projectsQuery = query(originalProjectsColRef, where(documentId(), 'in', selectedProjectIds));
        const originalProjectsSnapshot = await getDocs(projectsQuery);

        originalProjectsSnapshot.docs.forEach(projectDoc => {
          const originalProjectData = projectDoc.data() as FirebaseProjectDoc;
          const newProjectDocRef = doc(collection(db, COLLECTION_NAME, newClientDocRef.id, 'projects'));

          const defaultPriority: PriorityType = "Média";
          let projectPriorityToSet: PriorityType;

          if (originalProjectData.prioridade && PRIORITIES.includes(originalProjectData.prioridade)) {
            projectPriorityToSet = originalProjectData.prioridade;
          } else {
            projectPriorityToSet = defaultPriority;
          }
          
          const projectDataForBatch: Partial<FirebaseProjectDoc> = {
              nome: originalProjectData.nome,
              tipo: originalProjectData.tipo,
              status: INITIAL_PROJECT_STATUS(originalProjectData.tipo),
              checklist: originalProjectData.checklist.map(item => ({ ...item, id: uuidv4(), feito: false })),
              creatorUserId: targetUserId,
              prioridade: projectPriorityToSet,
              createdAt: serverTimestamp() as Timestamp,
          };
          if (originalProjectData.prazo !== undefined) {
              projectDataForBatch.prazo = originalProjectData.prazo;
          }
          
          const cleanedProjectData: Partial<FirebaseProjectDoc> = {};
          for (const key in projectDataForBatch) {
            if (projectDataForBatch[key as keyof Partial<FirebaseProjectDoc>] !== undefined) {
                (cleanedProjectData as any)[key] = projectDataForBatch[key as keyof Partial<FirebaseProjectDoc>];
            }
          }
          batch.set(newProjectDocRef, cleanedProjectData);
        });
      }

      await batch.commit();
      toast({ title: "Cliente Delegado", description: `Cópia de "${clientDataForNewUser.nome}" ${selectedProjectIds.length > 0 ? `com ${selectedProjectIds.length} projeto(s) selecionado(s)` : ''} enviada para o usuário selecionado.` });
      return true;
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao Delegar", description: error.message || "Não foi possível delegar a cópia do cliente." });
      return false;
    }
  }, [loggedInUserFromAuthContext, toast]);


  const importData = useCallback((jsonData: AppData): boolean => {
    toast({ title: "Funcionalidade Descontinuada", description: "A importação de dados via JSON foi descontinuada."});
    return false;
  }, [toast]);

  const exportData = useCallback((): AppData => {
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
             toast({ title: "Email no Firestore Atualizado", description: `O email de ${userToUpdate.username} foi atualizado nos registros. A alteração do email de login deve ser feita no console do Firebase.`});
         }
      }

      if (newPassword && newPassword.length >= 6) {
        if (auth.currentUser && auth.currentUser.uid === userId) {
          try {
            await firebaseUpdatePassword(auth.currentUser, newPassword);
            toast({ title: "Senha Atualizada", description: "Sua senha foi alterada com sucesso." });
          } catch (authError: any) {
            if (authError.code === 'auth/requires-recent-login') {
              toast({ variant: "destructive", title: "Reautenticação Necessária", description: "Para alterar sua senha, por favor, faça logout e login novamente, depois tente de novo." });
            } else {
              toast({ variant: "destructive", title: "Erro ao Alterar Senha", description: authError.message });
            }
          }
        } else {
          toast({
            variant: "destructive",
            title: "Ação de Senha Não Permitida",
            description: `A senha de '${userToUpdate.username}' não pode ser alterada desta forma. Apenas o próprio usuário pode alterar sua senha.`,
            duration: 7000,
          });
        }
      }

    } catch (error: any) {
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
          throw new Error(`Usuário removido do banco de dados, mas falha ao remover da autenticação: ${authError.message}. Pode ser necessário remover manualmente no console do Firebase.`);
        }
      } else {
        toast({ title: "Usuário Removido do Firestore", description: "Para remoção completa do sistema de autenticação, acesse o console do Firebase."});
      }

    } catch (error:any) {
      throw error;
    }
  }, [users, toast]);

  const fetchUsers = useCallback(() => {
  }, []);

  const clearAllData = useCallback(async () => {
    if (!loggedInUserFromAuthContext) {
      toast({ variant: "destructive", title: "Não autenticado", description: "Você precisa estar logado para realizar esta ação." });
      return;
    }

    try {
      const batch = writeBatch(db);
      const clientsCollectionRef = collection(db, COLLECTION_NAME);
      const q = query(clientsCollectionRef, where('creatorUserId', '==', loggedInUserFromAuthContext.id));
      const clientsSnapshot = await getDocs(q);

      if (clientsSnapshot.empty) {
        toast({ title: "Nenhum dado para limpar", description: "Você não possui clientes ou projetos cadastrados." });
        return;
      }
      
      for (const clientDoc of clientsSnapshot.docs) {
        // Deletar subcoleção de projetos
        const projectsCollectionRef = collection(db, COLLECTION_NAME, clientDoc.id, 'projects');
        const projectsSnapshot = await getDocs(projectsCollectionRef);
        projectsSnapshot.forEach(projectDoc => {
          batch.delete(projectDoc.ref);
        });
        
        // Deletar o documento do cliente
        batch.delete(clientDoc.ref);
      }

      await batch.commit();
      toast({ title: "Dados Limpos!", description: "Todos os seus clientes e projetos foram removidos com sucesso." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao Limpar Dados", description: error.message || "Não foi possível remover todos os dados." });
    }
  }, [loggedInUserFromAuthContext, toast]);


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
        assignClientCopyToUser,
        clearAllData,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};
