
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { AppData, Client, Project, ProjectType, ChecklistItem, PriorityType } from '@/types';
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
  Timestamp
} from 'firebase/firestore';

interface FirebaseClientDoc {
  nome: string;
  createdAt: Timestamp;
  prioridade?: PriorityType;
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
}

interface AppDataContextType {
  clients: Client[];
  loading: boolean;
  addClient: (nome: string, prioridade?: PriorityType) => Promise<void>;
  updateClient: (clientId: string, nome: string, prioridade?: PriorityType) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  getClientById: (clientId: string) => Client | undefined;
  addProject: (clientId: string, projectData: Omit<Project, 'id' | 'checklist' | 'clientId'> & { checklist?: Partial<Project['checklist']>, prioridade?: PriorityType }) => Promise<void>;
  updateProject: (clientId: string, projectId: string, projectData: Partial<Project>) => Promise<void>;
  deleteProject: (clientId: string, projectId: string) => Promise<void>;
  getProjectById: (clientId: string, projectId: string) => Project | undefined;
  duplicateProject: (clientId: string, projectIdToDuplicate: string) => Promise<void>;
  importData: (jsonData: AppData) => boolean; 
  exportData: () => AppData; 
}

export const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const clientsCollectionRef = collection(db, 'clients');
    const q = query(clientsCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const clientsData: Client[] = [];
      for (const clientDoc of querySnapshot.docs) {
        const clientFirebaseData = clientDoc.data() as FirebaseClientDoc;
        const client: Client = {
          id: clientDoc.id,
          nome: clientFirebaseData.nome,
          prioridade: clientFirebaseData.prioridade,
          createdAt: clientFirebaseData.createdAt, // Mantém o timestamp se precisar
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
      setLoading(false);
    }, (error) => {
      console.error("Error fetching clients from Firestore:", error);
      setClients([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addClient = useCallback(async (nome: string, prioridade?: PriorityType) => {
    try {
      await addDoc(collection(db, 'clients'), {
        nome,
        prioridade: prioridade || "Média", // Default priority
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding client to Firestore:", error);
    }
  }, []);

  const updateClient = useCallback(async (clientId: string, nome: string, prioridade?: PriorityType) => {
    try {
      const clientDocRef = doc(db, 'clients', clientId);
      const updateData: Partial<FirebaseClientDoc> = { nome };
      if (prioridade) {
        updateData.prioridade = prioridade;
      }
      await updateDoc(clientDocRef, updateData);
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

  const addProject = useCallback(async (clientId: string, projectData: Omit<Project, 'id' | 'checklist'> & { checklist?: Partial<Project['checklist']>, prioridade?: PriorityType }) => {
    try {
      const projectsCollectionRef = collection(db, 'clients', clientId, 'projects');
      const newProjectData: Omit<FirebaseProjectDoc, 'createdAt'> = { // createdAt will be serverTimestamp
        nome: projectData.nome,
        tipo: projectData.tipo,
        status: projectData.status,
        descricao: projectData.descricao,
        prazo: projectData.prazo,
        notas: projectData.notas,
        prioridade: projectData.prioridade || "Média", // Default priority
        checklist: (projectData.checklist || []).map(item => ({...item, id: item.id || uuidv4()})) as ChecklistItem[],
      };
      await addDoc(projectsCollectionRef, {
        ...newProjectData,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding project to Firestore:", error);
    }
  }, []);

  const updateProject = useCallback(async (clientId: string, projectId: string, projectData: Partial<Project>) => {
    try {
      const projectDocRef = doc(db, 'clients', clientId, 'projects', projectId);
      const dataToUpdate = {...projectData};
      if (dataToUpdate.checklist) {
        dataToUpdate.checklist = dataToUpdate.checklist.map(item => ({
          ...item,
          id: item.id || uuidv4(),
        }));
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
    const originalProject = getProjectById(clientId, projectIdToDuplicate);
    if (!originalProject) {
      console.error("Projeto original não encontrado para duplicação.");
      return;
    }

    const duplicatedProjectData: Omit<Project, 'id' | 'checklist'> & { checklist?: Partial<Project['checklist']>, prioridade?: PriorityType } = {
      nome: `${originalProject.nome} (Cópia)`,
      tipo: originalProject.tipo,
      status: originalProject.status, // Mantém o status original
      descricao: originalProject.descricao,
      prazo: originalProject.prazo, // Mantém o prazo original
      notas: originalProject.notas,
      prioridade: originalProject.prioridade, // Mantém a prioridade original
      checklist: originalProject.checklist.map(item => ({
        id: uuidv4(), // Novo ID para o item do checklist
        item: item.item,
        feito: item.feito, // Mantém o estado 'feito' original
      })),
    };

    try {
      await addProject(clientId, duplicatedProjectData);
    } catch (error) {
      console.error("Erro ao duplicar projeto no Firestore:", error);
    }
  }, [addProject, getProjectById]);

  const importData = useCallback((jsonData: AppData): boolean => {
    console.warn("Data import from JSON is deprecated. Data is now managed in Firestore.");
      return false;
  }, []);

  const exportData = useCallback((): AppData => {
    console.warn("Data export to JSON is deprecated. Data is now managed in Firestore.");
    return { clientes: clients };
  }, [clients]);

  return (
    <AppDataContext.Provider
      value={{
        clients,
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
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};
