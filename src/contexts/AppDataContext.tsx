
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { AppData, Client, Project, ProjectType } from '@/types';
import { v4 as uuidv4 } from 'uuid'; // Assuming uuid is available or install it: npm install uuid @types/uuid

const LOCAL_STORAGE_KEY = 'projetexData';

interface AppDataContextType {
  clients: Client[];
  loading: boolean;
  addClient: (nome: string) => void;
  updateClient: (clientId: string, nome: string) => void;
  deleteClient: (clientId: string) => void;
  getClientById: (clientId: string) => Client | undefined;
  addProject: (clientId: string, projectData: Omit<Project, 'id' | 'checklist'> & { checklist?: Partial<Project['checklist']> }) => void;
  updateProject: (clientId: string, projectId: string, projectData: Partial<Project>) => void;
  deleteProject: (clientId: string, projectId: string) => void;
  getProjectById: (clientId: string, projectId: string) => Project | undefined;
  importData: (jsonData: AppData) => boolean;
  exportData: () => AppData;
}

export const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        const parsedData: AppData = JSON.parse(storedData);
        setClients(parsedData.clientes || []);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
      setClients([]); // Initialize with empty array on error
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) { // Only save if initial load is complete
      try {
        const appData: AppData = { clientes };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appData));
      } catch (error) {
        console.error("Failed to save data to localStorage:", error);
      }
    }
  }, [clients, loading]);

  const addClient = useCallback((nome: string) => {
    const newClient: Client = { id: uuidv4(), nome, projetos: [] };
    setClients((prevClients) => [...prevClients, newClient]);
  }, []);

  const updateClient = useCallback((clientId: string, nome: string) => {
    setClients((prevClients) =>
      prevClients.map((client) =>
        client.id === clientId ? { ...client, nome } : client
      )
    );
  }, []);

  const deleteClient = useCallback((clientId: string) => {
    setClients((prevClients) => prevClients.filter((client) => client.id !== clientId));
  }, []);
  
  const getClientById = useCallback((clientId: string) => {
    return clients.find(c => c.id === clientId);
  }, [clients]);

  const addProject = useCallback((clientId: string, projectData: Omit<Project, 'id' | 'checklist'> & { checklist?: Partial<Project['checklist']> }) => {
    const newProject: Project = {
      ...projectData,
      id: uuidv4(),
      checklist: (projectData.checklist || []).map(item => ({...item, id: uuidv4()})) as Project['checklist'],
    };
    setClients((prevClients) =>
      prevClients.map((client) =>
        client.id === clientId
          ? { ...client, projetos: [...client.projetos, newProject] }
          : client
      )
    );
  }, []);

  const updateProject = useCallback((clientId: string, projectId: string, projectData: Partial<Project>) => {
    setClients((prevClients) =>
      prevClients.map((client) =>
        client.id === clientId
          ? {
              ...client,
              projetos: client.projetos.map((project) =>
                project.id === projectId ? { ...project, ...projectData } : project
              ),
            }
          : client
      )
    );
  }, []);

  const deleteProject = useCallback((clientId: string, projectId: string) => {
    setClients((prevClients) =>
      prevClients.map((client) =>
        client.id === clientId
          ? { ...client, projetos: client.projetos.filter((p) => p.id !== projectId) }
          : client
      )
    );
  }, []);

  const getProjectById = useCallback((clientId: string, projectId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.projetos.find(p => p.id === projectId);
  }, [clients]);

  const importData = useCallback((jsonData: AppData) => {
    try {
      // Basic validation could be added here
      if (jsonData && Array.isArray(jsonData.clientes)) {
        setClients(jsonData.clientes);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(jsonData)); // Ensure imported data is persisted
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error importing data:", error);
      return false;
    }
  }, []);

  const exportData = useCallback((): AppData => {
    return { clientes };
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
