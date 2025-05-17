
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { AppData, Client, Project, ProjectType, ChecklistItem } from '@/types';
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

// const LOCAL_STORAGE_KEY = 'projetexData'; // No longer used

interface FirebaseClientDoc {
  nome: string;
  createdAt: Timestamp;
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
}

interface AppDataContextType {
  clients: Client[];
  loading: boolean;
  addClient: (nome: string) => Promise<void>;
  updateClient: (clientId: string, nome: string) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  getClientById: (clientId: string) => Client | undefined;
  addProject: (clientId: string, projectData: Omit<Project, 'id' | 'checklist' | 'clientId'> & { checklist?: Partial<Project['checklist']> }) => Promise<void>;
  updateProject: (clientId: string, projectId: string, projectData: Partial<Project>) => Promise<void>;
  deleteProject: (clientId: string, projectId: string) => Promise<void>;
  getProjectById: (clientId: string, projectId: string) => Project | undefined;
  importData: (jsonData: AppData) => boolean; // Will be deprecated
  exportData: () => AppData; // Will be deprecated
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
        const client = {
          id: clientDoc.id,
          ...(clientDoc.data() as FirebaseClientDoc),
          projetos: [],
        } as Client;

        const projectsCollectionRef = collection(db, 'clients', clientDoc.id, 'projects');
        const projectsQuery = query(projectsCollectionRef, orderBy('createdAt', 'desc'));
        const projectsSnapshot = await getDocs(projectsQuery);
        
        client.projetos = projectsSnapshot.docs.map(projectDoc => ({
          id: projectDoc.id,
          ...(projectDoc.data() as FirebaseProjectDoc),
        } as Project));
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

  // localStorage saving logic removed

  const addClient = useCallback(async (nome: string) => {
    try {
      await addDoc(collection(db, 'clients'), {
        nome,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding client to Firestore:", error);
    }
  }, []);

  const updateClient = useCallback(async (clientId: string, nome: string) => {
    try {
      const clientDocRef = doc(db, 'clients', clientId);
      await updateDoc(clientDocRef, { nome });
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

  const addProject = useCallback(async (clientId: string, projectData: Omit<Project, 'id' | 'checklist'> & { checklist?: Partial<Project['checklist']> }) => {
    try {
      const projectsCollectionRef = collection(db, 'clients', clientId, 'projects');
      const newProjectData: FirebaseProjectDoc = {
        ...projectData,
        checklist: (projectData.checklist || []).map(item => ({...item, id: item.id || uuidv4()})) as ChecklistItem[],
        createdAt: serverTimestamp() as Timestamp, // Firestore will convert this
      };
      await addDoc(projectsCollectionRef, newProjectData);
    } catch (error) {
      console.error("Error adding project to Firestore:", error);
    }
  }, []);

  const updateProject = useCallback(async (clientId: string, projectId: string, projectData: Partial<Project>) => {
    try {
      const projectDocRef = doc(db, 'clients', clientId, 'projects', projectId);
      // Ensure checklist items have IDs if they are being updated
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

  // Import/Export data functions are now less relevant with cloud persistence.
  // They could be adapted to backup/restore from Firestore if needed, but that's a more complex feature.
  const importData = useCallback((jsonData: AppData): boolean => {
    console.warn("Data import from JSON is deprecated. Data is now managed in Firestore.");
    // setLoading(true);
    // // This would require a more complex logic to write to Firestore,
    // // handling existing data, IDs, subcollections etc.
    // // For now, we'll just log a warning.
    // try {
    //   // Example: A very basic import, would overwrite everything or fail on duplicates
    //   // jsonData.clientes.forEach(async client => {
    //   //   const clientRef = doc(db, 'clients', client.id); // This assumes IDs are maintained
    //   //   await setDoc(clientRef, { nome: client.nome, createdAt: serverTimestamp() });
    //   //   client.projetos.forEach(async project => {
    //   //     const projectRef = doc(db, 'clients', client.id, 'projects', project.id);
    //   //     await setDoc(projectRef, { ...project, createdAt: serverTimestamp() });
    //   //   });
    //   // });
    //   // setClients(jsonData.clientes); // Optimistically update UI or wait for onSnapshot
    //   // setLoading(false);
    //   return false; // Mark as not successful for now
    // } catch (error) {
    //   console.error("Error attempting to import data to Firestore:", error);
    //   setLoading(false);
      return false;
    // }
  }, []);

  const exportData = useCallback((): AppData => {
    console.warn("Data export to JSON is deprecated. Data is now managed in Firestore.");
    return { clientes: clients }; // Returns current local state, might not be a full representation
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
        importData,
        exportData,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};
