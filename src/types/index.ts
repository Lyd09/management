
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
}

export interface Client {
  id: string;
  nome: string;
  projetos: Project[];
}

export interface AppData {
  clientes: Client[];
}
