
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
  valor?: number; // Novo campo para o valor do projeto
}

export interface Client {
  id: string;
  nome: string;
  projetos: Project[];
  prioridade?: PriorityType;
}

export interface AppData {
  clientes: Client[];
}
