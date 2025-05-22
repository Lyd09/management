
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CHANGELOG_DATA, type ChangelogEntryItem } from "@/lib/constants";
import { History } from "lucide-react";
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function UpdatesPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>
      
      <h1 className="text-3xl font-bold text-primary mb-6 flex items-center">
        <History className="mr-3 h-8 w-8"/>
        Atualizações do Projetex
      </h1>
      <CardDescription className="mb-6">
        Acompanhe as principais atualizações e novas funcionalidades implementadas no Projetex.
      </CardDescription>

      <ScrollArea className="h-[calc(100vh-280px)] pr-4"> {/* Adjust height as needed */}
        <div className="space-y-6">
          {CHANGELOG_DATA.map((entry: ChangelogEntryItem, index: number) => (
            <Card key={index} className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex justify-between items-baseline mb-1">
                  <CardTitle className="text-xl text-primary">{entry.description}</CardTitle>
                  {entry.version && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                      v{entry.version}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{new Date(entry.date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-base text-card-foreground/90">
                  {entry.details.map((detail: string, detailIndex: number) => (
                    <li key={detailIndex}>{detail}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
          {CHANGELOG_DATA.length === 0 && (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">Nenhuma atualização registrada ainda.</p>
                </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
