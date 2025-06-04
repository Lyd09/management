
"use client";

import React, { useMemo } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, Users, FolderKanban, AlertTriangle, PieChartIcon } from "lucide-react"; // Removido BarChart3 pois não é usado
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { differenceInDays, parseISO, startOfDay, isBefore } from 'date-fns';
import type { Project, ProjectType } from '@/types';
import { PROJECT_TYPES } from '@/lib/constants';

const COLORS_PIE = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

// Nomes de projetos a serem excluídos para diferentes métricas (case-insensitive)
const EXCLUDE_BOTH_FOR_COUNTS_AND_TYPES = ["SITE LOGS", "MY BROKER"];
const EXCLUDE_SITE_LOGS_FOR_TOTAL_CLIENTS = ["SITE LOGS"];
const EXCLUDE_SITE_LOGS_FOR_OVERDUE = ["SITE LOGS"];

export default function DashboardMetricsPage() {
  const { clients, loading } = useAppData();

  // 1. Lista bruta de todos os projetos, cada um com o nome do cliente associado.
  const rawAllProjectsWithClientName = useMemo(() => {
    return clients.reduce((acc, client) => {
      const clientProjects = client.projetos.map(p => ({ ...p, clientName: client.nome }));
      return acc.concat(clientProjects);
    }, [] as (Project & { clientName: string })[]);
  }, [clients]);

  // 2. Projetos filtrados para contagens gerais (ativos, concluídos) e gráfico de tipos
  //    Exclui "SITE LOGS" e "MY BROKER".
  const generalFilteredProjects = useMemo(() => {
    return rawAllProjectsWithClientName.filter(p => 
      !EXCLUDE_BOTH_FOR_COUNTS_AND_TYPES.some(excluded => p.nome.toUpperCase() === excluded.toUpperCase())
    );
  }, [rawAllProjectsWithClientName]);

  const activeProjectsCount = useMemo(() => {
    return generalFilteredProjects.filter(p => p.status !== "Projeto Concluído").length;
  }, [generalFilteredProjects]);

  const completedProjectsCount = useMemo(() => {
    return generalFilteredProjects.filter(p => p.status === "Projeto Concluído").length;
  }, [generalFilteredProjects]);

  // 3. Contagem total de clientes, excluindo aqueles que SÓ têm projetos "SITE LOGS"
  const totalClientsCount = useMemo(() => {
    return clients.filter(client => {
      if (client.projetos.length === 0) return true; // Cliente sem projetos é contado
      // Cliente é contado se tiver pelo menos um projeto que NÃO seja "SITE LOGS"
      return client.projetos.some(p => 
        !EXCLUDE_SITE_LOGS_FOR_TOTAL_CLIENTS.some(excluded => p.nome.toUpperCase() === excluded.toUpperCase())
      );
    }).length;
  }, [clients]);

  // 4. Top 5 clientes por número de projetos (excluindo "SITE LOGS" e "MY BROKER" da contagem de projetos)
  const clientsByProjectCount = useMemo(() => {
    return clients
      .map(client => ({
        id: client.id,
        name: client.nome,
        projectCount: client.projetos.filter(p => 
            !EXCLUDE_BOTH_FOR_COUNTS_AND_TYPES.some(excluded => p.nome.toUpperCase() === excluded.toUpperCase())
        ).length,
      }))
      .filter(client => client.projectCount > 0)
      .sort((a, b) => b.projectCount - a.projectCount)
      .slice(0, 5);
  }, [clients]);

  // 5. Top 5 projetos mais atrasados (excluindo APENAS "SITE LOGS")
  const overdueProjects = useMemo(() => {
    const today = startOfDay(new Date());
    return rawAllProjectsWithClientName // Começa com todos os projetos brutos
      .filter(p => // Filtra APENAS "SITE LOGS"
        !EXCLUDE_SITE_LOGS_FOR_OVERDUE.some(excluded => p.nome.toUpperCase() === excluded.toUpperCase())
      )
      .filter(p => p.status !== "Projeto Concluído" && p.prazo) // Filtra não concluídos e com prazo
      .map(p => {
        try {
          const deadlineDate = startOfDay(parseISO(p.prazo!));
          if (isBefore(deadlineDate, today)) {
            return {
              ...p,
              overdueDays: differenceInDays(today, deadlineDate),
            };
          }
          return null;
        } catch (e) {
          return null; 
        }
      })
      .filter(p => p !== null)
      .sort((a, b) => b!.overdueDays - a!.overdueDays)
      .slice(0, 5);
  }, [rawAllProjectsWithClientName]);

  // 6. Dados para o gráfico de pizza (baseado em generalFilteredProjects)
  const projectsByTypeChartData = useMemo(() => {
    const counts = generalFilteredProjects.reduce((acc, project) => {
      acc[project.tipo] = (acc[project.tipo] || 0) + 1;
      return acc;
    }, {} as Record<ProjectType, number>);

    return PROJECT_TYPES.map(type => ({
      name: type,
      value: counts[type] || 0,
      fill: COLORS_PIE[PROJECT_TYPES.indexOf(type) % COLORS_PIE.length],
    })).filter(item => item.value > 0);
  }, [generalFilteredProjects]);

  const projectsByTypeChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    PROJECT_TYPES.forEach(type => {
      config[type] = {
        label: type,
        color: COLORS_PIE[PROJECT_TYPES.indexOf(type) % COLORS_PIE.length],
      };
    });
    return config;
  }, []);


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-xl">Carregando métricas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Dashboard de Métricas</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjectsCount}</div>
            <p className="text-xs text-muted-foreground">Total de projetos em andamento (excluindo "SITE LOGS" e "MY BROKER").</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Concluídos</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProjectsCount}</div>
             <p className="text-xs text-muted-foreground">Total de projetos finalizados (excluindo "SITE LOGS" e "MY BROKER").</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClientsCount}</div>
             <p className="text-xs text-muted-foreground">Total de clientes (excluindo clientes que possuem apenas projetos "SITE LOGS").</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary" />Top 5 Clientes por Nº de Projetos</CardTitle>
             <CardDescription>Contagem de projetos por cliente exclui "SITE LOGS" e "MY BROKER".</CardDescription>
          </CardHeader>
          <CardContent>
            {clientsByProjectCount.length > 0 ? (
              <ul className="space-y-2">
                {clientsByProjectCount.map(client => (
                  <li key={client.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted/50">
                    <span>{client.name}</span>
                    <span className="font-semibold">{client.projectCount} projeto(s)</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum cliente com projetos (não excluídos) para exibir.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center"><AlertTriangle className="mr-2 h-5 w-5 text-destructive" />Top 5 Projetos Mais Atrasados</CardTitle>
            <CardDescription>Apenas projetos não concluídos com prazo vencido (excluindo "SITE LOGS").</CardDescription>
          </CardHeader>
          <CardContent>
            {overdueProjects.length > 0 ? (
              <ul className="space-y-2">
                {overdueProjects.map(project => (
                  <li key={project.id} className="flex flex-col sm:flex-row justify-between sm:items-center text-sm p-2 rounded-md hover:bg-muted/50">
                    <div>
                      <span className="font-semibold">{project.nome}</span>
                      <span className="text-xs text-muted-foreground"> (Cliente: {project.clientName})</span>
                    </div>
                    <span className="text-destructive">{project.overdueDays} dia(s) atrasado</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum projeto atrasado (considerando exclusões) para exibir.</p>
            )}
          </CardContent>
        </Card>
      </div>
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><PieChartIcon className="mr-2 h-5 w-5 text-primary" />Distribuição de Projetos por Tipo</CardTitle>
          <CardDescription>Exclui projetos "SITE LOGS" e "MY BROKER".</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] w-full">
          {projectsByTypeChartData.length > 0 ? (
            <ChartContainer config={projectsByTypeChartConfig} className="h-full w-full">
              <RechartsPieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={projectsByTypeChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + (radius + 15) * Math.cos(-midAngle * RADIAN);
                    const y = cy + (radius + 15) * Math.sin(-midAngle * RADIAN);
                    return (
                      <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs">
                        {`${name} (${(percent * 100).toFixed(0)}%)`}
                      </text>
                    );
                  }}
                >
                  {projectsByTypeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </RechartsPieChart>
            </ChartContainer>
          ) : (
             <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">Nenhum projeto (considerando exclusões) para exibir no gráfico.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

