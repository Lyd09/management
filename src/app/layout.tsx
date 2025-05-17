
import type { Metadata } from 'next';
import { Geist_Sans as GeistSans, Geist_Mono as GeistMono } from 'next/font/google';
import './globals.css';
import { AppDataProvider } from '@/contexts/AppDataContext';
import { Toaster } from "@/components/ui/toaster";
import { Header } from '@/components/layout/Header';

const geistSans = GeistSans({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = GeistMono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Projetex - Gestão de Clientes e Projetos',
  description: 'Plataforma colaborativa para gestão de clientes e projetos.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col`}>
        <AppDataProvider>
          <Header />
          <main className="flex-grow container mx-auto p-4 sm:p-6">
            {children}
          </main>
          <Toaster />
        </AppDataProvider>
      </body>
    </html>
  );
}
