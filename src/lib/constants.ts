
import type { ProjectType, PriorityType } from '@/types';

export const PROJECT_TYPES: ProjectType[] = ["Produção de Vídeo", "Programação", "Animação de Logomarca"];

export const PRIORITIES: PriorityType[] = ["Baixa", "Média", "Alta"];

export const PROJECT_STATUS_OPTIONS: Record<ProjectType, string[]> = {
  "Produção de Vídeo": [
    "Gravação Agendada",
    "Gravação Concluída",
    "Edição em Andamento",
    "Edição Finalizada",
    "Revisão do Cliente",
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
