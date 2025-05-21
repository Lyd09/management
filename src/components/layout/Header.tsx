
"use client";

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, History } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CHANGELOG_DATA, type ChangelogEntryItem } from "@/lib/constants";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function Header() {
  const { isLoggedIn, logout, loadingAuth } = useAuth();

  if (loadingAuth || !isLoggedIn) {
    return null;
  }

  return (
    <header className="py-4 px-6 border-b border-border sticky top-0 bg-background z-10">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
          Projetex
        </Link>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Ver histórico de modificações">
                <History className="h-5 w-5 text-primary hover:text-primary/80" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 sm:w-[450px] max-h-[70vh] p-0" side="bottom" align="end">
              <Card className="border-none shadow-none">
                <CardHeader className="p-4 sticky top-0 bg-popover z-10">
                  <CardTitle className="flex items-center text-lg">
                    <History className="mr-2 h-5 w-5 text-primary"/>Atualizações Recentes do Projetex
                  </CardTitle>
                  <CardDescription>Acompanhe as principais atualizações do Projetex.</CardDescription>
                </CardHeader>
                <ScrollArea className="h-[calc(70vh-100px)]"> {/* Adjust height based on header */}
                  <CardContent className="p-4 pt-0">
                    {CHANGELOG_DATA.map((entry, index) => (
                      <div key={index} className="mb-4 pb-4 border-b border-border last:border-b-0 last:mb-0 last:pb-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h4 className="font-semibold text-base text-foreground">{entry.description}</h4>
                          {entry.version && (
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
                              v{entry.version}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{entry.date}</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {entry.details.map((detail, detailIndex) => (
                            <li key={detailIndex}>{detail}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </CardContent>
                </ScrollArea>
              </Card>
            </PopoverContent>
          </Popover>

          {isLoggedIn && (
            <Button variant="outline" onClick={logout} size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
