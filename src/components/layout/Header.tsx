
"use client";

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, History, LayoutDashboard, Menu } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { CHANGELOG_DATA } from "@/lib/constants";
import React from 'react';

export function Header() {
  const { isLoggedIn, logout, loadingAuth } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  if (loadingAuth || !isLoggedIn) {
    return null;
  }

  const changelogPopoverContent = (
    <PopoverContent className="w-96 sm:w-[450px] max-h-[70vh] p-0" side="bottom" align="end">
      <Card className="border-none shadow-none">
        <CardHeader className="p-4 sticky top-0 bg-popover z-10">
          <CardTitle className="flex items-center text-lg">
            <History className="mr-2 h-5 w-5 text-primary"/>Atualizações Recentes do Projetex
          </CardTitle>
          <CardDescription>Acompanhe as principais atualizações do Projetex.</CardDescription>
        </CardHeader>
        <ScrollArea className="h-[calc(70vh-120px)]"> {/* Ajuste de altura */}
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
  );

  return (
    <header className="py-4 px-6 border-b border-border sticky top-0 bg-background z-50">
      <div className="container mx-auto flex items-center gap-4"> {/* Alterado de justify-between para gap-4 */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu className="h-6 w-6 text-primary" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-4 flex flex-col">
            <div className="mb-6">
              <Link href="/" passHref>
                 <span className="text-2xl font-bold text-primary" onClick={() => setIsSheetOpen(false)}>
                    Projetex
                 </span>
              </Link>
            </div>
            <nav className="flex flex-col gap-3 flex-grow">
              <SheetClose asChild>
                <Link href="/" passHref>
                  <Button variant="ghost" className="w-full justify-start text-base py-3">
                    <LayoutDashboard className="mr-2 h-5 w-5 text-primary" />
                    Início
                  </Button>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link href="/dashboard" passHref>
                  <Button variant="ghost" className="w-full justify-start text-base py-3">
                    <LayoutDashboard className="mr-2 h-5 w-5 text-primary" />
                    Métricas
                  </Button>
                </Link>
              </SheetClose>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start text-base py-3">
                    <History className="mr-2 h-5 w-5 text-primary" />
                    Atualizações
                  </Button>
                </PopoverTrigger>
                {changelogPopoverContent}
              </Popover>

            </nav>
            <div className="mt-auto">
                <SheetClose asChild>
                    <Button variant="outline" onClick={() => { logout(); setIsSheetOpen(false); }} className="w-full text-base py-3">
                        <LogOut className="mr-2 h-5 w-5" />
                        Sair
                    </Button>
                </SheetClose>
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/" className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity" onClick={() => setIsSheetOpen(false)}>
          Projetex
        </Link>
      </div>
    </header>
  );
}
