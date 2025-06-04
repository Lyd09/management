
export type PriorityType = "Baixa" | "Média" | "Alta";

export interface ChecklistItem {
  id: string;
  item: string;
  feito: boolean;
}

export type ProjectType = "Produção de Vídeo" | "Programação" | "Animação de Logomarca";

export interface Project {
  id: string;
  nome: string;
  tipo: ProjectType;
  status: string;
  descricao?: string;
  prazo?: string; // ISO date string: "YYYY-MM-DD"
  notas?: string;
  checklist: ChecklistItem[];
  prioridade?: PriorityType;
  valor?: number;
  creatorUserId: string;
  assignedUserId?: string;
  dataConclusao?: string; // ISO date string: "YYYY-MM-DD"
}

export interface Client {
  id: string;
  nome: string;
  projetos: Project[];
  prioridade?: PriorityType;
  creatorUserId: string;
  createdAt?: any; // Firestore Timestamp
}

export interface User {
  id: string;
  username: string;
  email?: string;
  role: 'admin' | 'user';
  createdAt?: any; // Firestore Timestamp for users in DB
}

export interface AppData {
  clientes: Client[];
  users?: User[]; // users might not always be part of top-level app data structure for export/import
}
