
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { AppData, Client, Project, ProjectType, ChecklistItem, PriorityType, User } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { db, auth } from '@/lib/firebase'; // Import auth
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
  where,
  setDoc // Import setDoc for specific ID
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateEmail as firebaseUpdateEmail, deleteUser as firebaseDeleteUser, type User as FirebaseUser } from 'firebase/auth';
import { useAuth } from '@/hooks/useAuth';

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
  updateUser: (userId: string, userData: Partial<Omit<User, 'id' | 'createdAt' | 'username' >> & {username?: string}) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  fetchUsers: () => void;
}

export const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser: loggedInUser } = useAuth(); // Renamed to avoid conflict

  // Fetch Users
  useEffect(() => {
    // setLoading(true); // Already set true initially or by clients
    const usersCollectionRef = collection(db, 'users');
    const qUsers = query(usersCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribeUsers = onSnapshot(qUsers, (querySnapshot) => {
      const usersData: User[] = querySnapshot.docs.map(doc => ({
        id: doc.id, // Firestore document ID is the Firebase Auth UID
        ...(doc.data() as FirebaseUserDoc),
      }));
      setUsers(usersData);
      // setLoading(false); // Consider combined loading state
    }, (error) => {
      console.error("Error fetching users from Firestore:", error);
      setUsers([]);
      // setLoading(false);
    });
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
      setLoading(false);
    }, (error) => {
      console.error("Error fetching clients from Firestore:", error);
      setClients([]);
      setLoading(false);
    });

    return () => unsubscribeClients();
  }, []);

  const addClient = useCallback(async (nome: string, prioridade?: PriorityType) => {
    if (!loggedInUser) {
        console.error("Não é possível adicionar cliente: usuário não logado.");
        return;
    }
    try {
      await addDoc(collection(db, 'clients'), {
        nome,
        prioridade: prioridade || "Média",
        creatorUserId: loggedInUser.id,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding client to Firestore:", error);
    }
  }, [loggedInUser]);

  const updateClient = useCallback(async (clientId: string, nome: string, prioridade?: PriorityType) => {
    try {
      const clientDocRef = doc(db, 'clients', clientId);
      const updateData: Partial<FirebaseClientDoc> = { nome };
      if (prioridade) {
        updateData.prioridade = prioridade;
      }
      await updateDoc(clientDocRef, updateData as any);
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
    if (!loggedInUser) {
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
        creatorUserId: loggedInUser.id,
        checklist: (projectData.checklist || []).map(item => ({...item, id: item.id || uuidv4()})) as ChecklistItem[],
      };
      await addDoc(projectsCollectionRef, {
        ...newProjectData,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding project to Firestore:", error);
    }
  }, [loggedInUser]);

  const updateProject = useCallback(async (clientId: string, projectId: string, projectData: Partial<Omit<Project, 'creatorUserId'>>) => {
    try {
      const projectDocRef = doc(db, 'clients', clientId, 'projects', projectId);
      const dataToUpdate = {...projectData} as any;
      delete dataToUpdate.creatorUserId;

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
    if (!loggedInUser) {
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
  }, [addProject, getProjectById, loggedInUser]);

  const importData = useCallback((jsonData: AppData): boolean => {
    console.warn("Data import from JSON is deprecated. Data is now managed in Firestore.");
      return false;
  }, []);

  const exportData = useCallback((): AppData => {
    console.warn("Data export to JSON is deprecated. Data is now managed in Firestore.");
    return { clientes: clients, users: users };
  }, [clients, users]);

  const addUser = useCallback(async (userData: Omit<User, 'id' | 'createdAt'> & { password?: string }) => {
    // The pre-check for email and password has been removed.
    // We now rely on Zod validation in UserForm and Firebase's own error handling.
    // userData.email and userData.password SHOULD be non-empty strings if UserForm validation passed.
    
    // Ensure email and password are not undefined before destructuring.
    // If they are still undefined/empty here, Firebase Auth will throw an appropriate error.
    const email = userData.email || ""; // Default to empty string if undefined, Firebase will catch this
    const password = userData.password || ""; // Default to empty string, Firebase will catch this
    
    // Destructure to get other data, excluding the local email/password which might have been defaulted
    const { email: _emailField, password: _passwordField, ...firestoreData } = userData;

    try {
      // 1. Create user in Firebase Authentication
      // Firebase will throw an error if email or password are empty or invalid.
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 2. Create user document in Firestore using the UID from Firebase Auth as document ID
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, {
        ...firestoreData, // username, role
        email: email, // Store the (validated by Firebase) email in Firestore
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
         throw new Error("A senha não foi preenchida.");
      }
      throw new Error("Não foi possível adicionar o usuário: " + error.message);
    }
  }, []);

  const updateUser = useCallback(async (userId: string, userData: Partial<Omit<User, 'id' | 'createdAt' | 'username' >> & {username?: string}) => {
    try {
      const userToUpdate = users.find(u => u.id === userId);
      if (!userToUpdate) {
        throw new Error("Usuário não encontrado para atualização.");
      }

      if (userToUpdate.username === 'ff.admin') {
        if (userData.username && userData.username !== 'ff.admin') {
          console.warn("Attempted to change username of ff.admin. Operation denied.");
          throw new Error("O nome de usuário 'ff.admin' não pode ser alterado.");
        }
        if (userData.role && userData.role !== 'admin') {
          console.warn("Attempted to change role of ff.admin. Operation denied.");
          throw new Error("O papel (role) de 'ff.admin' não pode ser alterado.");
        }
      }
      
      const userDocRef = doc(db, 'users', userId);
      const dataToUpdateInFirestore: Partial<FirebaseUserDoc> = {
        email: userData.email,
        role: userData.role,
        username: userData.username, 
      };

      Object.keys(dataToUpdateInFirestore).forEach(key => 
        dataToUpdateInFirestore[key as keyof typeof dataToUpdateInFirestore] === undefined && delete dataToUpdateInFirestore[key as keyof typeof dataToUpdateInFirestore]
      );

      if (userData.email && userData.email !== userToUpdate.email) {
        console.warn(`Firestore email for user ${userId} updated to ${userData.email}. Firebase Auth email update for other users from client-side is complex and may require re-authentication or admin privileges. Ensure to update manually in Firebase Auth console if needed, or if the current user is editing their own email, they might need to re-authenticate.`);
         if (auth.currentUser && auth.currentUser.uid === userId) {
            try {
                await firebaseUpdateEmail(auth.currentUser, userData.email);
                console.log("Firebase Auth email updated successfully for current user.");
            } catch (authError: any) {
                 console.error("Error updating email in Firebase Auth for current user:", authError);
                 // Potentially re-throw or show a specific toast, e.g., if re-authentication is required.
                 // For now, we allow Firestore update to proceed.
            }
         }
      }
      
      if (Object.keys(dataToUpdateInFirestore).length > 0) {
        await updateDoc(userDocRef, dataToUpdateInFirestore);
      }

    } catch (error: any) {
      console.error("Error updating user in Firestore:", error);
      throw error;
    }
  }, [users]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      const userToDelete = users.find(u => u.id === userId);
      if (userToDelete && userToDelete.username === 'ff.admin') {
        console.error("Cannot delete the 'ff.admin' user.");
        throw new Error("O usuário 'ff.admin' não pode ser excluído.");
      }

      const userDocRef = doc(db, 'users', userId);
      await deleteDoc(userDocRef);
      
      console.warn(`User ${userId} deleted from Firestore. Manual deletion from Firebase Authentication console may be required for full removal, as client-side deletion of other Firebase Auth users is restricted for security reasons.`);

    } catch (error:any) {
      console.error("Error deleting user from Firestore:", error);
      throw error;
    }
  }, [users]);
  
  const fetchUsers = useCallback(() => {
    console.log("fetchUsers called - onSnapshot handles live updates.");
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


    