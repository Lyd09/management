
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { AppData, Client, Project, ProjectType, ChecklistItem, PriorityType, User } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/firebase';
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
  where
} from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth'; // Import useAuth

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
  users: User[]; // Add users to context
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
  // User specific functions
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (userId: string, userData: Partial<Omit<User, 'id' | 'createdAt'>>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  fetchUsers: () => void; // Added to explicitly fetch users if needed, though onSnapshot is used
}

export const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]); // State for users
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth(); // Get currentUser for creatorUserId

  // Fetch Users
  useEffect(() => {
    setLoading(true);
    const usersCollectionRef = collection(db, 'users');
    const qUsers = query(usersCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribeUsers = onSnapshot(qUsers, (querySnapshot) => {
      const usersData: User[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as FirebaseUserDoc),
      }));
      setUsers(usersData);
      // Consider loading state completed after both clients and users are fetched or handled separately
    }, (error) => {
      console.error("Error fetching users from Firestore:", error);
      setUsers([]);
    });
    // setLoading(false) here might be premature if clients are still loading
    return () => unsubscribeUsers();
  }, []);


  useEffect(() => {
    setLoading(true);
    const clientsCollectionRef = collection(db, 'clients');
    const q = query(clientsCollectionRef, orderBy('createdAt', 'desc'));

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
          projetos: [],
        };

        const projectsCollectionRef = collection(db, 'clients', clientDoc.id, 'projects');
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
      setLoading(false); // Set loading to false after all data is fetched
    }, (error) => {
      console.error("Error fetching clients from Firestore:", error);
      setClients([]);
      setLoading(false);
    });

    return () => unsubscribeClients();
  }, []);

  const addClient = useCallback(async (nome: string, prioridade?: PriorityType) => {
    if (!currentUser) {
        console.error("Não é possível adicionar cliente: usuário não logado.");
        return;
    }
    try {
      await addDoc(collection(db, 'clients'), {
        nome,
        prioridade: prioridade || "Média",
        creatorUserId: currentUser.id, // Set creatorUserId
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding client to Firestore:", error);
    }
  }, [currentUser]);

  const updateClient = useCallback(async (clientId: string, nome: string, prioridade?: PriorityType) => {
    try {
      const clientDocRef = doc(db, 'clients', clientId);
      const updateData: Partial<FirebaseClientDoc> = { nome };
      if (prioridade) {
        updateData.prioridade = prioridade;
      }
      // creatorUserId should not be updated
      await updateDoc(clientDocRef, updateData as any); // Use 'as any' if TS complains about creatorUserId
    } catch (error) {
      console.error("Error updating client in Firestore:", error);
    }
  }, []);

  const deleteClient = useCallback(async (clientId: string) => {
    try {
      const clientDocRef = doc(db, 'clients', clientId);
      const projectsCollectionRef = collection(db, 'clients', clientId, 'projects');
      const projectsSnapshot = await getDocs(projectsCollectionRef);

      const batch = writeBatch(db);
      projectsSnapshot.docs.forEach(projectDoc => {
        batch.delete(doc(db, 'clients', clientId, 'projects', projectDoc.id));
      });
      batch.delete(clientDocRef);
      await batch.commit();
    } catch (error) {
      console.error("Error deleting client and their projects from Firestore:", error);
    }
  }, []);
  
  const getClientById = useCallback((clientId: string) => {
    return clients.find(c => c.id === clientId);
  }, [clients]);

  const addProject = useCallback(async (clientId: string, projectData: Omit<Project, 'id' | 'checklist' | 'clientId' | 'creatorUserId'> & { checklist?: Partial<Project['checklist']>, prioridade?: PriorityType, valor?: number }) => {
    if (!currentUser) {
        console.error("Não é possível adicionar projeto: usuário não logado.");
        return;
    }
    try {
      const projectsCollectionRef = collection(db, 'clients', clientId, 'projects');
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
        creatorUserId: currentUser.id, // Set creatorUserId
        checklist: (projectData.checklist || []).map(item => ({...item, id: item.id || uuidv4()})) as ChecklistItem[],
      };
      await addDoc(projectsCollectionRef, {
        ...newProjectData,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding project to Firestore:", error);
    }
  }, [currentUser]);

  const updateProject = useCallback(async (clientId: string, projectId: string, projectData: Partial<Omit<Project, 'creatorUserId'>>) => {
    try {
      const projectDocRef = doc(db, 'clients', clientId, 'projects', projectId);
      const dataToUpdate = {...projectData} as any; // Use any to avoid creatorUserId conflict if present
      delete dataToUpdate.creatorUserId; // Ensure creatorUserId is not part of the update

      if (dataToUpdate.checklist) {
        dataToUpdate.checklist = dataToUpdate.checklist.map(item => ({
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
    }
  }, []);

  const deleteProject = useCallback(async (clientId: string, projectId: string) => {
    try {
      const projectDocRef = doc(db, 'clients', clientId, 'projects', projectId);
      await deleteDoc(projectDocRef);
    } catch (error) {
      console.error("Error deleting project from Firestore:", error);
    }
  }, []);

  const getProjectById = useCallback((clientId: string, projectId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.projetos.find(p => p.id === projectId);
  }, [clients]);

  const duplicateProject = useCallback(async (clientId: string, projectIdToDuplicate: string) => {
    if (!currentUser) {
        console.error("Não é possível duplicar projeto: usuário não logado.");
        return;
    }
    const originalProject = getProjectById(clientId, projectIdToDuplicate);
    if (!originalProject) {
      console.error("Projeto original não encontrado para duplicação.");
      return;
    }

    const duplicatedProjectData: Omit<Project, 'id' | 'checklist' | 'clientId' | 'creatorUserId'> & { checklist?: Partial<Project['checklist']>, prioridade?: PriorityType, valor?: number } = {
      nome: `${originalProject.nome} (Cópia)`,
      tipo: originalProject.tipo,
      status: originalProject.status,
      descricao: originalProject.descricao,
      prazo: originalProject.prazo,
      dataConclusao: originalProject.dataConclusao,
      notas: originalProject.notas,
      prioridade: originalProject.prioridade,
      valor: originalProject.valor,
      // creatorUserId will be set by addProject using current logged-in user
      checklist: originalProject.checklist.map(item => ({
        id: uuidv4(),
        item: item.item,
        feito: item.feito,
      })),
    };

    try {
      await addProject(clientId, duplicatedProjectData);
    } catch (error) {
      console.error("Erro ao duplicar projeto no Firestore:", error);
    }
  }, [addProject, getProjectById, currentUser]);

  const importData = useCallback((jsonData: AppData): boolean => {
    console.warn("Data import from JSON is deprecated. Data is now managed in Firestore.");
      return false;
  }, []);

  const exportData = useCallback((): AppData => {
    console.warn("Data export to JSON is deprecated. Data is now managed in Firestore.");
    return { clientes: clients, users: users }; // Include users in export if needed
  }, [clients, users]);

  // User Management Functions
  const addUser = useCallback(async (userData: Omit<User, 'id' | 'createdAt'>) => {
    try {
      // Check if username already exists
      const usersCollectionRef = collection(db, 'users');
      const q = query(usersCollectionRef, where("username", "==", userData.username));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        console.error("Username already exists.");
        throw new Error("Username already exists."); // Or handle this more gracefully in UI
      }

      await addDoc(collection(db, 'users'), {
        ...userData,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding user to Firestore:", error);
      throw error; // Re-throw to be caught by caller
    }
  }, []);

  const updateUser = useCallback(async (userId: string, userData: Partial<Omit<User, 'id' | 'createdAt'>>) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      // Ensure ff.admin role and username are not changed through this function
      const userToUpdate = users.find(u => u.id === userId);
      if (userToUpdate && userToUpdate.username === 'ff.admin') {
        if (userData.username && userData.username !== 'ff.admin') {
          console.warn("Attempted to change username of ff.admin. Operation denied.");
          delete userData.username; // Do not change username
        }
        if (userData.role && userData.role !== 'admin') {
          console.warn("Attempted to change role of ff.admin. Operation denied.");
          delete userData.role; // Do not change role
        }
      }
      await updateDoc(userDocRef, userData);
    } catch (error) {
      console.error("Error updating user in Firestore:", error);
      throw error;
    }
  }, [users]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      const userToDelete = users.find(u => u.id === userId);
      if (userToDelete && userToDelete.username === 'ff.admin') {
        console.error("Cannot delete the 'ff.admin' user.");
        throw new Error("Cannot delete the 'ff.admin' user.");
      }
      const userDocRef = doc(db, 'users', userId);
      await deleteDoc(userDocRef);
    } catch (error) {
      console.error("Error deleting user from Firestore:", error);
      throw error;
    }
  }, [users]);
  
  const fetchUsers = useCallback(() => {
    // This function is kept for potential explicit fetching,
    // but onSnapshot in useEffect already handles live updates.
    // If called, it would re-trigger the snapshot listener setup
    // by causing a re-render if its dependency array changes,
    // or you could implement a direct getDocs here if needed for one-time fetch.
    console.log("fetchUsers called - onSnapshot handles live updates.");
  }, []);


  return (
    <AppDataContext.Provider
      value={{
        clients,
        users, // Provide users
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
        addUser,     // Provide user functions
        updateUser,
        deleteUser,
        fetchUsers,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};
