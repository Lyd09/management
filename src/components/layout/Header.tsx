
"use client";

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, History, LayoutDashboard, Menu, Home } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import React from 'react';

export function Header() {
  const { isLoggedIn, logout, loadingAuth } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  if (loadingAuth || !isLoggedIn) {
    return null;
  }

  return (
    <header className="py-4 px-6 border-b border-border sticky top-0 bg-background z-50">
      <div className="container mx-auto flex items-center gap-4">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu className="h-6 w-6 text-primary" />
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
                  <Button variant="ghost" className="w-full justify-start text-base py-3">
                    <Home className="mr-2 h-5 w-5 text-primary" />
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
              <SheetClose asChild>
                <Link href="/updates" passHref>
                  <Button variant="ghost" className="w-full justify-start text-base py-3">
                    <History className="mr-2 h-5 w-5 text-primary" />
                    Atualizações
                  </Button>
                </Link>
              </SheetClose>
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
