
"use client";

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, Menu, Home, CalendarDays, Users as UsersIcon, Briefcase } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import React from 'react';

export function Header() {
  const { isLoggedIn, logout, loadingAuth, currentUser } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  if (loadingAuth || !isLoggedIn) {
    return null; // Se estiver carregando ou não logado, não renderiza o header
  }

  return (
    <header className="py-4 px-6 border-b border-border sticky top-0 bg-background z-50 print:hidden">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu" className="group">
                <Menu className="h-6 w-6 text-primary group-hover:text-accent-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-4 flex flex-col">
              <SheetHeader className="mb-6 text-left">
                  <SheetTitle>
                      <Link href="/" passHref>
                         <span className="text-2xl font-bold text-primary" onClick={() => setIsSheetOpen(false)}>
                            Projetex
                         </span>
                      </Link>
                  </SheetTitle>
              </SheetHeader>
              
              <nav className="flex flex-col gap-3 flex-grow">
                <SheetClose asChild>
                  <Link href="/" passHref>
                    <Button variant="ghost" className="group w-full justify-start text-base py-3">
                      <Home className="mr-2 h-5 w-5 text-primary group-hover:text-accent-foreground" />
                      Início
                    </Button>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/dashboard" passHref>
                    <Button variant="ghost" className="group w-full justify-start text-base py-3">
                      <LayoutDashboard className="mr-2 h-5 w-5 text-primary group-hover:text-accent-foreground" />
                      Métricas
                    </Button>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/calendar" passHref>
                    <Button variant="ghost" className="group w-full justify-start text-base py-3">
                      <CalendarDays className="mr-2 h-5 w-5 text-primary group-hover:text-accent-foreground" />
                      Calendário
                    </Button>
                  </Link>
                </SheetClose>
                
                {currentUser && currentUser.role === 'admin' && (
                  <>
                    <SheetClose asChild>
                      <Link href="/admin/users" passHref>
                        <Button variant="ghost" className="group w-full justify-start text-base py-3">
                          <UsersIcon className="mr-2 h-5 w-5 text-primary group-hover:text-accent-foreground" />
                          Usuários
                        </Button>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                       <a href="https://orcafast-io.netlify.app/" target="_blank" rel="noopener noreferrer" className="w-full">
                        <Button variant="ghost" className="group w-full justify-start text-base py-3">
                          <Briefcase className="mr-2 h-5 w-5 text-primary group-hover:text-accent-foreground" />
                          Orçamentos/Contratos
                        </Button>
                      </a>
                    </SheetClose>
                  </>
                )}

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

        {currentUser && currentUser.username && (
          <div className="text-sm text-muted-foreground">
            Bem vindo(a), <span className="font-semibold text-foreground">{currentUser.username}</span>!
          </div>
        )}
      </div>
    </header>
  );
}
