
"use client";

import React, { useMemo } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, Users, FolderKanban, AlertTriangle, PieChartIcon } from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { differenceInDays, parseISO, startOfDay, isBefore } from 'date-fns';
import type { Project, ProjectType } from '@/types';
import { PROJECT_TYPES } from '@/lib/constants';

const COLORS_PIE = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const EXCLUDE_PROJECT_NAMES_GENERAL = ["SITE LOGS", "MY BROKER"]; // Projetos a excluir de contagens gerais e tipos por nome do projeto
const EXCLUDE_CLIENT_NAME_GENERAL = "SITE LOGS"; // Cliente cujos projetos devem ser excluídos de contagens gerais e tipos

const EXCLUDE_CLIENT_NAMES_FOR_TOP_CLIENTS = ["SITE LOGS", "MY BROKER"]; // Nomes de clientes a excluir do Top 5
const EXCLUDE_PROJECT_NAMES_FOR_TOP_CLIENTS = ["SITE LOGS", "MY BROKER"]; // Nomes de projetos a excluir da contagem para Top 5

const EXCLUDE_CLIENT_NAMES_FOR_TOTAL_CLIENTS = ["SITE LOGS"]; // Nomes de clientes a excluir do Total de Clientes
const EXCLUDE_PROJECT_NAMES_FOR_TOTAL_CLIENTS_FILTER = ["SITE LOGS"]; // Projetos a excluir se forem os *únicos* de um cliente para Total de Clientes

const EXCLUDE_PROJECT_NAMES_FOR_OVERDUE = ["SITE LOGS"]; // Projetos a excluir da lista de atrasados


export default function DashboardMetricsPage() {
  const { clients, loading } = useAppData();

  const rawAllProjectsWithClientName = useMemo(() => {
    return clients.reduce((acc, client) => {
      const clientProjects = client.projetos.map(p => ({ ...p, clientName: client.nome }));
      return acc.concat(clientProjects);
    }, [] as (Project & { clientName: string })[]);
  }, [clients]);

  const generalFilteredProjects = useMemo(() => {
    return rawAllProjectsWithClientName.filter(p => {
      const projectNameUpper = p.nome.trim().toUpperCase();
      const clientNameUpper = p.clientName.trim().toUpperCase();

      // Exclude if project name is in EXCLUDE_PROJECT_NAMES_GENERAL
      if (EXCLUDE_PROJECT_NAMES_GENERAL.some(excluded => projectNameUpper === excluded.toUpperCase())) {
        return false;
      }
      // Exclude if client name is EXCLUDE_CLIENT_NAME_GENERAL
      if (clientNameUpper === EXCLUDE_CLIENT_NAME_GENERAL.toUpperCase()) {
        return false;
      }
      return true;
    });
  }, [rawAllProjectsWithClientName]);

  const activeProjectsCount = useMemo(() => {
    return generalFilteredProjects.filter(p => p.status !== "Projeto Concluído").length;
  }, [generalFilteredProjects]);

  const completedProjectsCount = useMemo(() => {
    return generalFilteredProjects.filter(p => p.status === "Projeto Concluído").length;
  }, [generalFilteredProjects]);

  const totalClientsCount = useMemo(() => {
    return clients
      .filter(client => {
        const clientNameUpper = client.nome.trim().toUpperCase();
        return !EXCLUDE_CLIENT_NAMES_FOR_TOTAL_CLIENTS.some(excludedClientName =>
          clientNameUpper === excludedClientName.toUpperCase()
        );
      })
      .filter(client => {
        if (client.projetos.length === 0) return true;

        const allProjectsAreExcludedType = client.projetos.every(p =>
          EXCLUDE_PROJECT_NAMES_FOR_TOTAL_CLIENTS_FILTER.some(excludedProjectName =>
              p.nome.trim().toUpperCase() === excludedProjectName.toUpperCase()
          )
        );
        return !allProjectsAreExcludedType;
      }).length;
  }, [clients]);

  const clientsByProjectCount = useMemo(() => {
    return clients
      .filter(client => {
        const clientNameUpper = client.nome.trim().toUpperCase();
        return !EXCLUDE_CLIENT_NAMES_FOR_TOP_CLIENTS.some(excludedClientName =>
          clientNameUpper === excludedClientName.toUpperCase()
        );
      })
      .map(client => ({
        id: client.id,
        name: client.nome,
        projectCount: client.projetos.filter(p =>
            !EXCLUDE_PROJECT_NAMES_FOR_TOP_CLIENTS.some(excludedProjectName => // Use specific list for this metric
              p.nome.trim().toUpperCase() === excludedProjectName.toUpperCase()
            )
        ).length,
      }))
      .filter(client => client.projectCount > 0)
      .sort((a, b) => b.projectCount - a.projectCount)
      .slice(0, 5);
  }, [clients]);

  const overdueProjects = useMemo(() => {
    const today = startOfDay(new Date());
    return rawAllProjectsWithClientName
      .filter(p =>
        !EXCLUDE_PROJECT_NAMES_FOR_OVERDUE.some(excluded => p.nome.trim().toUpperCase() === excluded.toUpperCase())
      )
      .filter(p => p.status !== "Projeto Concluído" && p.prazo)
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
            <p className="text-xs text-muted-foreground">Exclui projetos do cliente "{EXCLUDE_CLIENT_NAME_GENERAL}" e projetos nomeados "{EXCLUDE_PROJECT_NAMES_GENERAL.join('" ou "')}".</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Concluídos</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProjectsCount}</div>
             <p className="text-xs text-muted-foreground">Exclui projetos do cliente "{EXCLUDE_CLIENT_NAME_GENERAL}" e projetos nomeados "{EXCLUDE_PROJECT_NAMES_GENERAL.join('" ou "')}".</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClientsCount}</div>
             <p className="text-xs text-muted-foreground">Excluindo clientes nomeados "{EXCLUDE_CLIENT_NAMES_FOR_TOTAL_CLIENTS.join('", "')}".</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary" />Top 5 Clientes por Nº de Projetos</CardTitle>
             <CardDescription>Exclui clientes e projetos chamados "{EXCLUDE_CLIENT_NAMES_FOR_TOP_CLIENTS.join('" ou "')}".</CardDescription>
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
              <p className="text-sm text-muted-foreground">Nenhum cliente (após exclusões) para exibir.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center"><AlertTriangle className="mr-2 h-5 w-5 text-destructive" />Top 5 Projetos Mais Atrasados</CardTitle>
            <CardDescription>Apenas projetos não concluídos com prazo vencido (excluindo projetos "{EXCLUDE_PROJECT_NAMES_FOR_OVERDUE.join('", "')}").</CardDescription>
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
              <p className="text-sm text-muted-foreground">Nenhum projeto atrasado (após exclusões) para exibir.</p>
            )}
          </CardContent>
        </Card>
      </div>
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><PieChartIcon className="mr-2 h-5 w-5 text-primary" />Distribuição de Projetos por Tipo</CardTitle>
          <CardDescription>Exclui projetos do cliente "{EXCLUDE_CLIENT_NAME_GENERAL}" e projetos nomeados "{EXCLUDE_PROJECT_NAMES_GENERAL.join('" ou "')}".</CardDescription>
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
                <p className="text-sm text-muted-foreground">Nenhum projeto (após exclusões) para exibir no gráfico.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
