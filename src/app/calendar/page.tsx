
"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppData } from '@/hooks/useAppData';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ArrowLeft, CalendarDays, ExternalLink, Info } from "lucide-react";
import type { Project } from '@/types';
import { format, parseISO, isValid, startOfDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProjectWithClientInfo extends Project {
  clientId: string;
  clientName: string;
}

export default function ProjectCalendarPage() {
  const { clients, loading } = useAppData();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState<Date>(new Date());

  const allProjectsWithClientInfo = useMemo((): ProjectWithClientInfo[] => {
    if (loading) return [];
    return clients.reduce((acc, client) => {
      const clientProjects = client.projetos.map(p => ({
        ...p,
        clientId: client.id,
        clientName: client.nome,
      }));
      return acc.concat(clientProjects);
    }, [] as ProjectWithClientInfo[]);
  }, [clients, loading]);

  const projectsWithActiveDeadlines = useMemo(() => {
    return allProjectsWithClientInfo.filter(
      (p) => p.prazo && isValid(parseISO(p.prazo)) && p.status !== "Projeto Concluído"
    );
  }, [allProjectsWithClientInfo]);

  const deadlineDays = useMemo(() => {
    return projectsWithActiveDeadlines.map(p => startOfDay(parseISO(p.prazo!)));
  }, [projectsWithActiveDeadlines]);

  const modifiers = {
    deadline: deadlineDays,
  };

  const modifiersClassNames = {
    deadline: "calendar-deadline-day",
  };

  const projectsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return projectsWithActiveDeadlines.filter(p =>
      isSameDay(startOfDay(parseISO(p.prazo!)), selectedDate)
    );
  }, [selectedDate, projectsWithActiveDeadlines]);

  const handleDayClick = (day: Date | undefined) => {
    if (day) {
      setSelectedDate(startOfDay(day));
    } else {
      setSelectedDate(undefined);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-xl">Carregando calendário...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-4 print:hidden">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <div className="flex items-center gap-3 mb-6 print:hidden">
        <CalendarDays className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary">Calendário de Projetos</h1>
      </div>
      <CardDescription className="mt-[-1.25rem] mb-6 print:hidden">
        Visualize os prazos dos projetos em andamento. Clique em um dia para ver os projetos com prazo nessa data.
      </CardDescription>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-1 sm:p-2 md:p-4 flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDayClick}
                month={currentDisplayMonth}
                onMonthChange={setCurrentDisplayMonth}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                className="rounded-md"
                locale={ptBR}
                // Example: disable past years and far future, can be adjusted
                disabled={(date) => date < startOfDay(new Date(new Date().getFullYear() -1 , 0, 1)) || date > startOfDay(new Date(new Date().getFullYear() + 2, 11, 31))}
                showOutsideDays
              />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader className="print:hidden">
              <CardTitle>
                Prazos para {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Nenhum Dia"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden print:overflow-visible">
              <ScrollArea className="h-full pr-3 print:h-auto print:overflow-visible">
                {selectedDate && projectsOnSelectedDate.length > 0 ? (
                  <ul className="space-y-3">
                    {projectsOnSelectedDate.map(project => (
                      <li key={project.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <Link href={`/clients/${project.clientId}/projects/${project.id}/view`} className="group block">
                          <h4 className="font-semibold text-primary group-hover:underline">{project.nome}</h4>
                          <p className="text-sm text-muted-foreground">Cliente: {project.clientName}</p>
                          <p className="text-sm text-muted-foreground">Tipo: {project.tipo}</p>
                          <div className="flex justify-end mt-1 print:hidden">
                             <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : selectedDate ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Info className="h-10 w-10 text-muted-foreground mb-3 print:hidden" />
                    <p className="text-muted-foreground">Nenhum prazo agendado para este dia.</p>
                  </div>
                ) : (
                   <div className="flex flex-col items-center justify-center h-full text-center">
                    <Info className="h-10 w-10 text-muted-foreground mb-3 print:hidden" />
                    <p className="text-muted-foreground">Selecione um dia no calendário para ver os prazos.</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

    