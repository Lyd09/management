
import type { ProjectType, PriorityType } from '@/types';

export const PROJECT_TYPES: ProjectType[] = ["Produção de Vídeo", "Programação", "Animação de Logomarca"];

export const PRIORITIES: PriorityType[] = ["Baixa", "Média", "Alta"];

export const PROJECT_STATUS_OPTIONS: Record<ProjectType, string[]> = {
  "Produção de Vídeo": [
    "Aguardando Início",
    "Gravação Agendada",
    "Gravação Concluída",
    "Edição em Andamento",
    "Edição Finalizada",
    "Revisão do Cliente",
    "Em Pausa",
    "Bloqueado",
    "Projeto Concluído",
  ],
  "Programação": [
    "Estruturação e Design",
    "Codificação em Progresso",
    "Testes e Ajustes",
    "Primeira Versão Disponível",
    "Revisão e Melhorias",
    "Publicação do Projeto",
    "Monitoramento e Suporte",
    "Projeto Concluído",
  ],
  "Animação de Logomarca": [
    "Animação em Produção",
    "Edição e Finalização",
    "Revisão do Cliente",
    "Entrega do Arquivo Final",
    "Projeto Concluído",
  ],
};

export const INITIAL_PROJECT_STATUS = (type: ProjectType): string => {
    const statuses = PROJECT_STATUS_OPTIONS[type];
    return statuses.length > 0 ? statuses[0] : "";
}

// Changelog data
export type ChangelogEntryItem = {
  date: string; // e.g., "2024-05-21"
  version?: string; // Optional version number
  description: string; // Main description for this entry/version
  details: string[]; // Array of specific change descriptions
};

export const CHANGELOG_DATA: ChangelogEntryItem[] = [
  {
    date: "2024-05-23",
    version: "1.3.0",
    description: "Melhorias na Ordenação e Feedback Visual",
    details: [
      "Painel de clientes agora prioriza clientes com projetos de prazo iminente.",
      "Contagem de dias restantes para projetos exibida nos cards de cliente no painel principal.",
      "Atualizada a lista de 'Atualizações Recentes do Projetex'.",
    ],
  },
  {
    date: "2024-05-22",
    version: "1.2.0",
    description: "Novos Filtros e Melhorias na Interface",
    details: [
      "Adicionado filtro por proximidade de prazo na página de detalhes do cliente.",
      "Seção 'Atualizações Recentes' movida para um Popover acionado por ícone no painel de clientes.",
    ],
  },
  {
    date: "2024-05-21",
    version: "1.1.0",
    description: "Funcionalidades de Prioridade, Avisos e Filtros Iniciais",
    details: [
      "Implementada marcação de prioridade para clientes e projetos.",
      "Adicionados avisos visuais para prazos de projetos próximos ou vencidos.",
      "Adicionados filtros por prioridade (cliente) e tipo/status/prioridade (projeto).",
      "Criada seção 'Atualizações Recentes do Projetex' (versão popover).",
    ],
  },
  {
    date: "2024-05-20",
    version: "1.0.1",
    description: "Implementação de Login e Ajustes de UI",
    details: [
      // "Implementada tela de login básica (client-side).", // Removido conforme solicitado
      "Removida funcionalidade de Importar/Exportar JSON do cabeçalho.",
      "Ajustes na interface da tela de login e nome da aplicação.",
      // "Migração de dados para Firebase Firestore.", // Removido conforme solicitado
    ],
  },
  {
    date: "2024-05-19",
    version: "1.0.0",
    description: "Lançamento Inicial com Firebase",
    details: [
      "Funcionalidades básicas de CRUD para Clientes e Projetos.",
      "Persistência de dados implementada com Firebase Firestore.",
      "Estrutura inicial do projeto com Next.js, ShadCN UI e TailwindCSS.",
    ],
  },
  // Adicionar novas entradas sempre no topo para manter a ordem cronológica inversa
];

