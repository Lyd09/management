export type PriorityType = "Baixa" | "Média" | "Alta";

export interface ChecklistItem {
  id: string;
  item: string;
  feito: boolean;
}

export type ProjectType = "Produção de Vídeo" | "Programação" | "Animação de Logomarca" | "Gravação" | "Edição" | "Instagram" | "Fotos Profissionais";

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
  creatorUserId: string; // ID do usuário que criou o projeto
  assignedUserId?: string; // ID do usuário designado para o projeto
  dataConclusao?: string; // ISO date string: "YYYY-MM-DD"
}

export interface Client {
  id: string;
  nome: string;
  projetos: Project[];
  prioridade?: PriorityType;
  creatorUserId: string; // ID do usuário que criou o cliente
  createdAt?: any; // Firestore Timestamp
}

// Definição do tipo User
export interface User {
  id: string;
  username: string;
  email?: string; // O email é opcional
  role: 'admin' | 'user'; // Papéis definidos
  createdAt: any; // Firestore Timestamp
}

export interface AppData {
  clientes: Client[];
  users?: User[];
}
