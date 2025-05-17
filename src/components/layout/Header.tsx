
"use client";

import Link from 'next/link';
import { JsonImportExport } from '@/components/JsonImportExport';

export function Header() {
  return (
    <header className="py-4 px-6 border-b border-border sticky top-0 bg-background z-10">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
          Projetex
        </Link>
        <JsonImportExport />
      </div>
    </header>
  );
}
