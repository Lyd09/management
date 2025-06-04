
"use client";

import React, { useMemo } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, Users, FolderKanban, AlertTriangle, PieChartIcon, BarChart3 } from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { differenceInDays, parseISO, startOfDay, isBefore, format } from 'date-fns';
import type { Client, Project, ProjectType } from '@/types';
import { PROJECT_TYPES } from '@/lib/constants'; // Import PROJECT_TYPES

const COLORS_PIE = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
const EXCLUDED_PROJECT_NAMES = ["SITE LOGS", "MY BROKER"];

export default function DashboardMetricsPage() {
  const { clients, loading } = useAppData();

  const allProjects = useMemo(() => {
    return clients.reduce((acc, client) => {
      const clientProjects = client.projetos
        .filter(p => !EXCLUDED_PROJECT_NAMES.includes(p.nome.toUpperCase()))
        .map(p => ({ ...p, clientName: client.nome }));
      return acc.concat(clientProjects);
    }, [] as (Project & { clientName: string })[]);
  }, [clients]);

  const activeProjectsCount = useMemo(() => {
    return allProjects.filter(p => p.status !== "Projeto Concluído").length;
  }, [allProjects]);

  const completedProjectsCount = useMemo(() => {
    return allProjects.filter(p => p.status === "Projeto Concluído").length;
  }, [allProjects]);

  const clientsByProjectCount = useMemo(() => {
    // This metric might still include clients whose only projects are the excluded ones,
    // but those projects won't count towards their projectCount here if `allProjects` is used.
    // If the goal is to also filter clients who *only* have excluded projects,
    // this logic would need to be more complex. For now, assuming projectCount reflects non-excluded projects.
    return clients
      .map(client => ({
        id: client.id,
        name: client.nome,
        projectCount: client.projetos.filter(p => !EXCLUDED_PROJECT_NAMES.includes(p.nome.toUpperCase())).length,
      }))
      .filter(client => client.projectCount > 0) // Only show clients with non-excluded projects
      .sort((a, b) => b.projectCount - a.projectCount)
      .slice(0, 5); // Top 5
  }, [clients]);

  const overdueProjects = useMemo(() => {
    const today = startOfDay(new Date());
    return allProjects // allProjects is already filtered
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
          return null; // Invalid date
        }
      })
      .filter(p => p !== null)
      .sort((a, b) => b!.overdueDays - a!.overdueDays)
      .slice(0, 5); // Top 5
  }, [allProjects]);

  const projectsByTypeChartData = useMemo(() => {
    const counts = allProjects.reduce((acc, project) => { // allProjects is already filtered
      acc[project.tipo] = (acc[project.tipo] || 0) + 1;
      return acc;
    }, {} as Record<ProjectType, number>);

    return PROJECT_TYPES.map(type => ({
      name: type,
      value: counts[type] || 0,
      fill: COLORS_PIE[PROJECT_TYPES.indexOf(type) % COLORS_PIE.length],
    })).filter(item => item.value > 0);
  }, [allProjects]);

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
            <p className="text-xs text-muted-foreground">Total de projetos em andamento (excluindo SITE LOGS, MY BROKER)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Concluídos</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProjectsCount}</div>
             <p className="text-xs text-muted-foreground">Total de projetos finalizados (excluindo SITE LOGS, MY BROKER)</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
             <p className="text-xs text-muted-foreground">Total de clientes cadastrados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary" />Top 5 Clientes por Nº de Projetos</CardTitle>
             <CardDescription>Contagem exclui projetos "SITE LOGS" e "MY BROKER".</CardDescription>
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
            <CardDescription>Apenas projetos não concluídos com prazo vencido (excluindo SITE LOGS, MY BROKER).</CardDescription>
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
              <p className="text-sm text-muted-foreground">Nenhum projeto atrasado (não excluído) para exibir.</p>
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
                <p className="text-sm text-muted-foreground">Nenhum projeto (não excluído) para exibir no gráfico.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

