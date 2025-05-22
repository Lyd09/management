
"use client";

import type { Project, Client } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Edit, CalendarClock, Percent, Info, StickyNote, ListChecks } from "lucide-react";
import { PRIORITIES, PROJECT_TYPES, PROJECT_STATUS_OPTIONS } from "@/lib/constants";
import type { PriorityType, ProjectType } from '@/types';
import { differenceInDays, parseISO, startOfDay, isBefore, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const getPriorityBadgeVariant = (priority?: PriorityType) => {
  switch (priority) {
    case "Alta":
      return "destructive";
    case "Média":
      return "secondary";
    case "Baixa":
      return "outline";
    default:
      return "default";
  }
};

const getDeadlineBadgeInfo = (prazo?: string): { text: string; variant: "default" | "secondary" | "destructive" | "outline" } | null => {
    if (!prazo) return null;
    try {
        const today = startOfDay(new Date());
        const deadlineDate = startOfDay(parseISO(prazo));
        const daysRemaining = differenceInDays(deadlineDate, today);

        if (isBefore(deadlineDate, today)) {
            return { text: `Atrasado (${Math.abs(daysRemaining)}d)`, variant: "destructive" };
        }
        if (daysRemaining === 0) {
            return { text: "Hoje!", variant: "destructive" };
        }
        if (daysRemaining <= 3) {
            return { text: `${daysRemaining}d restantes`, variant: "destructive" };
        }
        if (daysRemaining <= 7) {
            return { text: `${daysRemaining}d restantes`, variant: "secondary" };
        }
        return null;
    } catch (error) {
        console.error("Error parsing prazo for deadline badge:", error);
        return null;
    }
};

const getProjectCompletionPercentage = (project: Project): number | null => {
  if (project.status === "Projeto Concluído") {
    return 100;
  }
  if (project.status === "Aguardando Início") {
    return 0;
  }
  if (!project.checklist || project.checklist.length === 0) {
    return null;
  }
  const totalItems = project.checklist.length;
  const completedItems = project.checklist.filter(item => item.feito).length;
  return Math.round((completedItems / totalItems) * 100);
};

interface ProjectDisplayProps {
  project: Project;
  client: Client;
}

export function ProjectDisplay({ project, client }: ProjectDisplayProps) {
  const deadlineInfo = getDeadlineBadgeInfo(project.prazo);
  const completionPercentage = getProjectCompletionPercentage(project);

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <Button variant="outline" onClick={() => window.history.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para {client.nome}
                </Button>
                <h1 className="text-3xl font-bold text-primary">{project.nome}</h1>
                <p className="text-muted-foreground">Detalhes do Projeto</p>
            </div>
            <Link href={`/clients/${client.id}/projects/${project.id}`} passHref>
                <Button>
                    <Edit className="mr-2 h-4 w-4" /> Editar Projeto
                </Button>
            </Link>
        </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5 text-primary" />Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Tipo de Projeto</Label>
              <p className="text-base font-semibold">{project.tipo}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
              <Badge
                variant={project.status === "Projeto Concluído" ? "default" : "secondary"}
                className={`${project.status === "Projeto Concluído" ? "bg-green-600 hover:bg-green-600/90 text-white" : ""} text-base px-3 py-1`}
              >
                {project.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Prioridade</Label>
              {project.prioridade ? (
                <Badge variant={getPriorityBadgeVariant(project.prioridade)} className="text-base px-3 py-1">
                  {project.prioridade}
                </Badge>
              ) : (
                <p className="text-base">Não definida</p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Prazo de Entrega</Label>
              {project.prazo ? (
                <div className="flex items-center gap-2">
                    <p className="text-base font-semibold">{format(parseISO(project.prazo), "PPP", { locale: ptBR })}</p>
                    {deadlineInfo && (
                        <Badge variant={deadlineInfo.variant} className="text-xs flex items-center">
                        <CalendarClock className="mr-1 h-3 w-3" /> {deadlineInfo.text}
                        </Badge>
                    )}
                </div>
              ) : (
                <p className="text-base">Não definido</p>
              )}
            </div>
          </div>
          
          {project.status !== "Projeto Concluído" && completionPercentage !== null && (
            <div>
                <Label className="text-sm font-medium text-muted-foreground">Progresso do Checklist</Label>
                <Badge
                    variant={completionPercentage < 50 ? "secondary" : "default"}
                    className={`text-base px-3 py-1 ${completionPercentage === 100 && project.status !== "Projeto Concluído" ? "bg-primary hover:bg-primary/90" : ""}`}
                >
                    <span role="img" aria-label="target" className="mr-1">🎯</span> {completionPercentage}%
                </Badge>
            </div>
          )}

        </CardContent>
      </Card>

      {project.descricao && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><StickyNote className="h-5 w-5 text-primary" />Descrição do Projeto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base whitespace-pre-wrap">{project.descricao}</p>
          </CardContent>
        </Card>
      )}

      {project.notas && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><StickyNote className="h-5 w-5 text-primary" />Notas Gerais</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base whitespace-pre-wrap">{project.notas}</p>
          </CardContent>
        </Card>
      )}

      {project.checklist && project.checklist.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" />Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {project.checklist.map((item) => (
                <li key={item.id} className="flex items-center gap-2 p-2 border rounded-md bg-card-foreground/5">
                  <Checkbox id={`view-checklist-${item.id}`} checked={item.feito} disabled aria-label={item.item}/>
                  <Label htmlFor={`view-checklist-${item.id}`} className={`flex-grow ${item.feito ? "line-through text-muted-foreground" : ""}`}>
                    {item.item}
                  </Label>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    