
import type { ProjectType, PriorityType } from '@/types';

export const PROJECT_TYPES: ProjectType[] = ["Produção de Vídeo", "Programação", "Animação de Logomarca", "Gravação", "Edição", "Instagram", "Fotos Profissionais"];

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
  "Gravação": [
    "Aguardando Agendamento",
    "Pré-produção e Planejamento",
    "Gravação Agendada",
    "Em Gravação",
    "Gravação Concluída",
    "Material Bruto Entregue",
    "Revisão de Material",
    "Refação Agendada",
    "Projeto Concluído",
  ],
  "Edição": [
    "Aguardando Material Bruto",
    "Material Recebido e Organizado",
    "Decupagem e Seleção de Takes",
    "Primeira Montagem (Rough Cut)",
    "Edição Detalhada (Fine Cut)",
    "Aplicação de Efeitos Visuais e Transições",
    "Tratamento de Cor (Color Grading/Correction)",
    "Mixagem de Áudio e Sound Design",
    "Adição de Trilha Sonora e Efeitos Sonoros (SFX)",
    "Criação e Inserção de Legendas/Gráficos",
    "Versão para Revisão Interna",
    "Versão para Revisão do Cliente",
    "Ajustes Finais Pós-Revisão",
    "Exportação Final (Masterização)",
    "Projeto Concluído",
  ],
  "Instagram": [
    "Planejamento Estratégico Mensal/Semanal",
    "Criação de Pauta de Conteúdo",
    "Design de Criativos Estáticos (Posts, Stories)",
    "Roteirização de Vídeos (Reels, Stories)",
    "Captação/Produção de Vídeos",
    "Edição de Vídeos para Instagram",
    "Redação de Legendas (Copywriting) e Pesquisa de Hashtags",
    "Agendamento de Publicações",
    "Publicação Realizada",
    "Monitoramento de Engajamento e Interação",
    "Análise de Métricas e Relatório de Performance",
    "Ciclo de Conteúdo Concluído",
  ],
  "Fotos Profissionais": [
    "Aguardando Agendamento",
    "Sessão Agendada",
    "Sessão Realizada",
    "Fotos em Tratamento",
    "Fotos Entregues",
    "Projeto Concluído",
  ],
};

export const INITIAL_PROJECT_STATUS = (type: ProjectType): string => {
    const statuses = PROJECT_STATUS_OPTIONS[type];
    if (statuses.includes("Aguardando Início")) {
      return "Aguardando Início";
    }
    if (type === "Gravação" && statuses.includes("Aguardando Agendamento")) {
      return "Aguardando Agendamento";
    }
    if (type === "Edição" && statuses.includes("Aguardando Material Bruto")) {
      return "Aguardando Material Bruto";
    }
     if (type === "Instagram" && statuses.includes("Planejamento Estratégico Mensal/Semanal")) {
      return "Planejamento Estratégico Mensal/Semanal";
    }
    if (type === "Fotos Profissionais" && statuses.includes("Aguardando Agendamento")) {
      return "Aguardando Agendamento";
    }
    return statuses.length > 0 ? statuses[0] : "";
}

export const PREDEFINED_CHECKLISTS: Record<ProjectType, string[]> = {
  "Produção de Vídeo": [
    "Briefing e Roteiro definidos",
    "Equipamentos reservados/preparados",
    "Locações definidas e liberadas",
    "Agendamento de equipe e talentos",
    "Captação de imagens e áudio",
    "Backup de material bruto",
    "Decupagem do material",
    "Primeira montagem (offline)",
    "Trilha sonora e efeitos sonoros",
    "Colorização e tratamento de imagem",
    "Motion graphics e legendas (se houver)",
    "Exportação para revisão interna",
    "Ajustes pós-revisão interna",
    "Exportação para revisão do cliente",
    "Ajustes pós-revisão do cliente",
    "Exportação final e entrega",
  ],
  "Programação": [
    "Levantamento de requisitos concluído",
    "Definição da arquitetura do sistema",
    "Design de UI/UX aprovado",
    "Configuração do ambiente de desenvolvimento",
    "Desenvolvimento do backend (APIs, banco de dados)",
    "Desenvolvimento do frontend (interfaces)",
    "Integração frontend-backend",
    "Testes unitários",
    "Testes de integração",
    "Testes de usabilidade (QA)",
    "Correção de bugs",
    "Preparação do ambiente de produção",
    "Deploy em ambiente de homologação/staging",
    "Testes finais em homologação",
    "Deploy em produção",
    "Documentação técnica e do usuário",
    "Treinamento (se aplicável)",
  ],
  "Animação de Logomarca": [
    "Recebimento e análise do briefing",
    "Pesquisa de referências e estilos",
    "Criação de storyboard/animatic",
    "Aprovação do storyboard pelo cliente",
    "Design dos elementos gráficos (se necessário)",
    "Animação dos elementos",
    "Sincronização com áudio (trilha/efeitos)",
    "Renderização prévia para revisão",
    "Ajustes pós-revisão interna/cliente",
    "Renderização final em alta qualidade",
    "Entrega dos arquivos nos formatos solicitados",
  ],
  "Gravação": [
    "Briefing e roteiro/shotlist recebidos e analisados",
    "Locações definidas, vistoriadas e liberadas",
    "Equipamentos de gravação (câmeras, lentes, áudio, iluminação) checados e preparados",
    "Equipe técnica (cinegrafista, assistente, técnico de som) confirmada",
    "Talentos, atores ou apresentadores confirmados e alinhados",
    "Agendamento de diárias de gravação e cronograma detalhado",
    "Transporte e logística de equipamentos e equipe organizados",
    "Permissões de gravação e autorizações de imagem obtidas (se necessário)",
    "Captação de todas as cenas, takes e ângulos planejados",
    "Captação de áudio de alta qualidade (ambiente, entrevistas, etc.)",
    "Realização de backups do material bruto em diferentes mídias",
    "Organização inicial e nomeação dos arquivos de mídia",
    "Envio ou entrega física do material bruto para a equipe de edição ou cliente",
  ],
  "Edição": [
    "Recebimento completo do material bruto (vídeo, áudio, fotos) e assets (logos, fontes)",
    "Briefing de edição compreendido (referências, estilo, objetivos)",
    "Organização do projeto de edição (pastas, sequências, proxies se necessário)",
    "Sincronização de áudio e vídeo (se gravados separadamente)",
    "Decupagem e seleção dos melhores takes e momentos",
    "Montagem da estrutura principal da narrativa (rough cut)",
    "Refinamento de cortes, ritmo, timing e continuidade (fine cut)",
    "Aplicação de correções de cor primárias e secundárias (color grading)",
    "Tratamento de áudio (limpeza, equalização, normalização de níveis)",
    "Design de som (adição de efeitos sonoros, ambientação)",
    "Inclusão e sincronização de trilha sonora licenciada/aprovada",
    "Criação e inserção de letterings, legendas, lower thirds e outros gráficos",
    "Renderização da primeira versão para revisão (baixa resolução, se necessário)",
    "Coleta e organização do feedback do cliente/diretor",
    "Implementação precisa das revisões solicitadas",
    "Checagem final de qualidade (áudio, vídeo, sincronia, legendas)",
    "Exportação nos formatos e especificações finais solicitados",
    "Entrega dos arquivos finalizados e do projeto de edição (se acordado)",
  ],
  "Instagram": [
    "Definição de objetivos para o período (ex: aumento de seguidores, engajamento, vendas)",
    "Análise do público-alvo e persona",
    "Pesquisa de temas, tendências e concorrentes",
    "Criação do calendário editorial (datas, horários, formatos, temas, pilares de conteúdo)",
    "Aprovação do calendário editorial pelo cliente",
    "Brainstorm de ideias para posts estáticos (imagens únicas, carrosséis, quotes)",
    "Criação ou seleção de imagens/vídeos de banco (se aplicável)",
    "Design dos criativos utilizando identidade visual do cliente",
    "Redação das legendas para posts estáticos, CTAs (Call to Action) e hashtags relevantes",
    "Revisão interna de design e texto (estático)",
    "Aprovação dos posts estáticos pelo cliente",
    "Brainstorm e roteirização dos vídeos (Reels/Stories)",
    "Planejamento de cenas para vídeos, áudios em alta e efeitos",
    "Captação/Gravação do material bruto para vídeos",
    "Edição dos vídeos (cortes, transições, música, texto sobreposto, legendas)",
    "Redação das legendas para vídeos, CTAs e hashtags",
    "Revisão interna do vídeo",
    "Aprovação dos vídeos pelo cliente",
    "Agendamento dos posts em ferramenta de gerenciamento ou manualmente",
    "Verificação final de links, tags e detalhes antes da publicação",
    "Confirmação da publicação no horário agendado",
    "Monitorar comentários e mensagens diretas (DMs)",
    "Responder dúvidas e interagir com a audiência de forma ágil e adequada",
    "Fomentar a participação em enquetes, caixas de perguntas, etc.",
    "Coleta de dados de performance (alcance, impressões, engajamento, cliques, etc.)",
    "Análise dos resultados em relação aos objetivos definidos",
    "Elaboração do relatório de performance com insights e recomendações",
    "Apresentação ou envio do relatório ao cliente",
  ],
  "Fotos Profissionais": [
    "Alinhamento de expectativas e briefing com o cliente.",
    "Definição e agendamento da data, horário e local da sessão.",
    "Confirmação da sessão com o cliente.",
    "Realização da sessão fotográfica.",
    "Backup das fotos e seleção das melhores imagens.",
    "Tratamento básico das fotos selecionadas (ajustes de cor, luz, contraste, enquadramento).",
    "Envio do link ou galeria com as fotos tratadas para o cliente.",
    "Confirmação de recebimento e aprovação pelo cliente.",
  ],
};


// Changelog data
export type ChangelogEntryItem = {
  date: string; // e.g., "2024-05-21"
  version?: string; // Optional version number
  description: string; // Main description for this entry/version
  details: string[]; // Array of specific change descriptions
};

export const CHANGELOG_DATA: ChangelogEntryItem[] = [
  {
    date: "2024-06-25",
    version: "1.6.0",
    description: "Correções de Bugs Críticos, Melhorias de UI e Estabilidade",
    details: [
      "Resolvidos conflitos críticos de dependência que impediam a implantação da aplicação, estabilizando as versões do Next.js, React e Genkit.",
      "Corrigido um bug de fuso horário que fazia com que as datas de prazo dos projetos fossem exibidas como o dia anterior ao selecionado.",
      "Adicionada uma barra de pesquisa na página de detalhes do cliente, permitindo filtrar projetos por nome para melhor organização.",
      "Pequenos ajustes na interface para melhorar a experiência do usuário.",
    ],
  },
  {
    date: "2024-06-04",
    version: "1.5.0",
    description: "Expansão de Funcionalidades, Calendário e Melhorias de Admin",
    details: [
      "Adicionados novos tipos de projeto: 'Gravação', 'Edição', 'Instagram' e 'Fotos Profissionais', cada um com seus próprios status e checklists padrão, otimizando o fluxo de trabalho.",
      "Introduzida página de 'Calendário de Projetos' para visualização clara dos prazos dos projetos em andamento.",
      "Implementado filtro por proximidade de prazos no painel de clientes, ajudando a identificar demandas urgentes.",
      "Adicionada funcionalidade para carregar checklists pré-definidos em projetos com base no tipo selecionado, agilizando a configuração.",
      "Administradores agora podem delegar cópias de clientes para outros usuários, com a opção de selecionar projetos específicos (dados sensíveis são omitidos e checklists resetados).",
      "Incluído link 'Orçamentos/Contratos' no menu lateral, visível apenas para administradores, para acesso rápido à plataforma de orçamentos.",
      "Sistema agora sugere prioridade 'Alta' para novos projetos com prazos muito próximos ou vencidos.",
      "Novo widget 'Total do Mês R$' na página de Métricas, exibindo a soma dos valores de projetos concluídos no mês corrente, com opção de ocultar/mostrar o valor e exclusão do cliente 'BALCÃO 360' da contagem.",
      "Melhorias na funcionalidade de duplicar projetos, proporcionando feedback mais claro em caso de sucesso ou falha na operação.",
    ],
  },
   {
    date: "2024-05-24",
    version: "1.4.0",
    description: "Visualização de Projeto, Progresso e Melhorias de UX",
    details: [
      "Implementada página de visualização de projeto (somente leitura).",
      "Adicionada porcentagem de conclusão de projeto (🎯 X%) baseada no checklist.",
      "Modal de confirmação ao marcar projeto como 'Concluído' com itens de checklist pendentes.",
      "Indicadores de prazo (como 'Hoje!', 'X dias restantes') não são mais exibidos para projetos com status 'Projeto Concluído'.",
      "Projetos concluídos não são exibidos na lista de projetos do painel de clientes (agora painel principal).",
      "Atualizada lista de status para 'Produção de Vídeo'.",
    ],
  },
  {
    date: "2024-05-23",
    version: "1.3.0",
    description: "Melhorias na Ordenação e Feedback Visual",
    details: [
      "Painel de clientes agora prioriza clientes com projetos de prazo iminente.",
      "Contagem de dias restantes para projetos exibida nos cards de cliente no painel principal.",
    ],
  },
  {
    date: "2024-05-22",
    version: "1.2.0",
    description: "Novos Filtros e Melhorias na Interface",
    details: [
      "Aprimoramentos gerais na interface do usuário.",
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
    ],
  },
  {
    date: "2024-05-20",
    version: "1.0.1",
    description: "Implementação de Login e Ajustes de UI",
    details: [
      "Ajustes na interface da tela de login e nome da aplicação.",
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
];
