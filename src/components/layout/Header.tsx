
"use client";

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function Header() {
  const { isLoggedIn, logout, loadingAuth } = useAuth();

  // Não renderizar o header se estiver carregando o estado de autenticação ou se não estiver logado
  if (loadingAuth || !isLoggedIn) {
    return null;
  }

  return (
    <header className="py-4 px-6 border-b border-border sticky top-0 bg-background z-10">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
          Gestão de Clientes - FastFilms
        </Link>
        {isLoggedIn && (
          <Button variant="outline" onClick={logout} size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        )}
      </div>
    </header>
  );
}
