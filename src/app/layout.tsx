
import type { Metadata } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { AppDataProvider } from '@/contexts/AppDataContext';
import { AuthProvider } from '@/contexts/AuthContext'; // Nova importação
import { Toaster } from "@/components/ui/toaster";
import { Header } from '@/components/layout/Header';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Projetex',
  description: 'Plataforma colaborativa para gestão de clientes e projetos.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} ${robotoMono.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col`}>
        <AuthProvider> {/* Adicionado AuthProvider */}
          <AppDataProvider>
            <Header />
            <main className="flex-grow container mx-auto p-4 sm:p-6">
              {children}
            </main>
            <Toaster />
          </AppDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
