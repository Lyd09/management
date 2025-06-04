
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
    if (!userData.email || !userData.password) {
      console.error("Email e senha são obrigatórios para criar um novo usuário autenticado.");
      throw new Error("Email e senha são obrigatórios.");
    }
    const { email, password, ...firestoreData } = userData;

    try {
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 2. Create user document in Firestore using the UID from Firebase Auth as document ID
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, {
        ...firestoreData, // username, role
        email: email, // Store email in Firestore as well
        createdAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error("Error adding user to Firebase Auth or Firestore:", error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("Este email já está em uso por outra conta.");
      } else if (error.code === 'auth/weak-password') {
        throw new Error("A senha fornecida é muito fraca.");
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

      // Prevent username and role change for ff.admin
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
        email: userData.email, // email can be undefined if not changed
        role: userData.role, // role can be undefined if not changed
        username: userData.username, // username can be undefined if not changed
      };

      // Filter out undefined fields before updating Firestore
      Object.keys(dataToUpdateInFirestore).forEach(key => 
        dataToUpdateInFirestore[key as keyof typeof dataToUpdateInFirestore] === undefined && delete dataToUpdateInFirestore[key as keyof typeof dataToUpdateInFirestore]
      );


      // Attempt to update email in Firebase Auth if it has changed
      if (userData.email && userData.email !== userToUpdate.email && auth.currentUser) {
        // Firebase Auth's current user must match the user being edited, or be an admin with sufficient rights.
        // For simplicity here, we assume an admin is performing this.
        // Direct email update might require re-authentication for security reasons.
        // This is a simplified attempt.
        try {
            // This part is tricky because updating another user's email directly as admin is not straightforward
            // For the user themselves to update their email, they'd call firebaseUpdateEmail(auth.currentUser, newEmail)
            // We'll update Firestore for now and log a warning for Auth email update.
            console.warn(`Firestore email for user ${userId} updated to ${userData.email}. Manual update in Firebase Auth console might be needed if this isn't the logged-in user.`);
             if (auth.currentUser && auth.currentUser.uid === userId) {
                await firebaseUpdateEmail(auth.currentUser, userData.email);
             }
        } catch (authError: any) {
          console.error("Error updating email in Firebase Auth for user:", userId, authError);
          // Decide if this should throw or just warn. For now, it warns and proceeds with Firestore update.
          // throw new Error("Não foi possível atualizar o email na autenticação: " + authError.message);
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

      // 1. Delete from Firestore
      const userDocRef = doc(db, 'users', userId);
      await deleteDoc(userDocRef);

      // 2. Delete from Firebase Authentication
      // This is complex because deleting a user from Auth requires admin privileges
      // or the user to be currently signed in and deleting themselves.
      // For an admin deleting another user, you'd typically use the Firebase Admin SDK on a backend.
      // A client-side direct deletion of another user is not typically allowed for security reasons.
      // For this prototype, we'll log a warning and skip Auth deletion from client-side.
      // In a real app, this would be a backend/cloud function call.
      console.warn(`User ${userId} deleted from Firestore. Manual deletion from Firebase Authentication console is required for full removal.`);
      // If you had an admin SDK setup on a backend:
      // await admin.auth().deleteUser(userId);
      
      // If the currently logged-in user is deleting themselves (not typical for an admin panel)
      // if (auth.currentUser && auth.currentUser.uid === userId) {
      //   await firebaseDeleteUser(auth.currentUser);
      // }


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
