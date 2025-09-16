
"use client";

import React, { useState } from 'react'; // Adicionado useState
import type { Project, Client } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Edit, CalendarClock, Percent, Info, StickyNote, ListChecks, DollarSign, Eye, EyeOff, CalendarPlus } from "lucide-react"; // Adicionado Eye, EyeOff e CalendarPlus
import { PRIORITIES, PROJECT_TYPES, PROJECT_STATUS_OPTIONS } from "@/lib/constants";
import type { PriorityType, ProjectType } from '@/types';
import { differenceInDays, startOfDay, isBefore, format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, parseDateStringAsLocalAtMidnight } from "@/lib/utils"; // Importado de utils

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

const getDeadlineBadgeInfo = (prazo?: string): { text: string; variant: "default" | "secondary" | "destructive" | "outline"; colorClass: string; } | null => {
    if (!prazo) return null;
    const deadlineDate = parseDateStringAsLocalAtMidnight(prazo);
    if (!deadlineDate || !isValid(deadlineDate)) return null;
    
    const today = startOfDay(new Date());
    const daysRemaining = differenceInDays(deadlineDate, today);

    if (isBefore(deadlineDate, today)) {
        return { text: `Atrasado (${Math.abs(daysRemaining)}d)`, variant: "destructive", colorClass: "text-destructive" };
    }
    if (daysRemaining === 0) {
        return { text: "Hoje!", variant: "destructive", colorClass: "text-destructive" };
    }
    if (daysRemaining <= 3) {
        return { text: `${daysRemaining}d restantes`, variant: "destructive", colorClass: "text-destructive" };
    }
    if (daysRemaining <= 7) {
        return { text: `${daysRemaining}d restantes`, variant: "secondary", colorClass: "text-secondary-foreground" };
    }
    return { text: `${daysRemaining}d restantes`, variant: "default", colorClass: "text-muted-foreground" };
};

const getProjectCompletionPercentage = (project: Project): number | null => {
  if (project.status === "Aguardando Início") {
    return 0;
  }
   if (project.status === "Projeto Concluído") { 
    return 100;
  }
  if (!project.checklist || project.checklist.length === 0) {
    return null;
  }
  const totalItems = project.checklist.length;
  const completedItems = project.checklist.filter(item => item.feito).length;
  return Math.round((completedItems / totalItems) * 100);
};

const formatGenericDate = (dateInput: any): string | null => {
    if (!dateInput) return null;
    const parsedDate = parseDateStringAsLocalAtMidnight(dateInput);
    if (parsedDate && isValid(parsedDate)) {
        return format(parsedDate, "PPP", { locale: ptBR });
    }
    return null;
};

interface ProjectDisplayProps {
  project: Project;
  client: Client;
}

export function ProjectDisplay({ project, client }: ProjectDisplayProps) {
  const [isValueVisible, setIsValueVisible] = useState(false); 
  const deadlineInfo = getDeadlineBadgeInfo(project.prazo);
  const completionPercentage = getProjectCompletionPercentage(project);

  const completionBadgeStyle = {
    variant: (completionPercentage !== null && completionPercentage >= 50) ? "default" : "secondary",
    className: (completionPercentage !== null && completionPercentage >= 50 && project.status !== "Projeto Concluído") ? "" : ""
  } as { variant: "secondary" | "default"; className: string };

  const toggleValueVisibility = () => {
    setIsValueVisible(!isValueVisible);
  };

  const conclusionDateText = formatGenericDate(project.dataConclusao);
  const creationDateText = formatGenericDate(project.createdAt);


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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creationDateText && (
                <div>
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1"><CalendarPlus className="h-4 w-4"/>Data de Criação</Label>
                    <p className="text-base font-semibold">{creationDateText}</p>
                </div>
            )}
            {project.status === "Projeto Concluído" && conclusionDateText ? (
                 <div>
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1"><CalendarClock className="h-4 w-4"/>Data de Conclusão</Label>
                    <p className="text-base font-semibold text-green-600">{conclusionDateText}</p>
                 </div>
            ) : project.status !== "Projeto Concluído" && project.prazo ? (
                 <div>
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1"><CalendarClock className="h-4 w-4"/>Prazo de Entrega</Label>
                     <div className="flex items-center gap-1">
                        <p className="text-base font-semibold">
                            {(() => {
                                const parsed = parseDateStringAsLocalAtMidnight(project.prazo!);
                                if (parsed && isValid(parsed)) {
                                    return format(parsed, "PPP", { locale: ptBR });
                                }
                                return "Data inválida";
                            })()}
                        </p>
                        {deadlineInfo && deadlineInfo.text && (
                            <span className={cn(
                              "text-sm ml-1", 
                              deadlineInfo.colorClass 
                            )}>
                              | {deadlineInfo.text}
                            </span>
                        )}
                    </div>
                 </div>
            ) : project.status !== "Projeto Concluído" ? (
                <div>
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1"><CalendarClock className="h-4 w-4"/>Prazo de Entrega</Label>
                    <p className="text-base">Não definido</p>
                </div>
            ) : null}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
             {project.valor !== undefined && (
                <div>
                <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1"><DollarSign className="h-4 w-4"/>Valor do Projeto</Label>
                    <Button variant="ghost" size="icon" onClick={toggleValueVisibility} aria-label={isValueVisible ? "Ocultar valor" : "Mostrar valor"} className="h-6 w-6">
                    {isValueVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
                <p className="text-base font-semibold">
                    {isValueVisible
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.valor)
                    : "R$ ••••••"}
                </p>
                </div>
             )}
          
             {project.status !== "Projeto Concluído" && project.status !== "Aguardando Início" && completionPercentage !== null && project.checklist && project.checklist.length > 0 && (
                <div>
                    <Label className="text-sm font-medium text-muted-foreground">Progresso do Checklist</Label>
                    <Badge
                        variant={completionBadgeStyle.variant}
                        className={`text-base px-3 py-1 ${completionBadgeStyle.className}`}
                    >
                    <span role="img" aria-label="target" className="mr-1">🎯</span> {completionPercentage}%
                    </Badge>
                </div>
             )}
             {project.status === "Aguardando Início" && (
                <div>
                    <Label className="text-sm font-medium text-muted-foreground">Progresso do Checklist</Label>
                    <Badge variant="secondary" className="text-base px-3 py-1">
                        <span role="img" aria-label="target" className="mr-1">🎯</span> 0%
                    </Badge>
                </div>
             )}
          </div>

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
