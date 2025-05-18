
"use client";

// Este componente foi descontinuado e pode ser removido futuramente.
// A lógica de importação/exportação de JSON não é mais relevante com a persistência de dados no Firebase Firestore.

import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
// import { useAppData } from "@/hooks/useAppData"; // Não mais necessário para a lógica principal
import { useToast } from "@/hooks/use-toast";
// import type { AppData } from '@/types'; // Não mais necessário

export function JsonImportExport() {
  // const { importData, exportData } = useAppData(); // Lógica de dados agora no Firestore
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
     toast({ 
      title: "Funcionalidade Descontinuada", 
      description: "A exportação de JSON local foi descontinuada. Seus dados estão seguros no Firebase Firestore." 
    });
    // const data = exportData(); 
    // const jsonString = JSON.stringify(data, null, 2);
    // const blob = new Blob([jsonString], { type: "application/json" });
    // const url = URL.createObjectURL(blob);
    // const a = document.createElement("a");
    // a.href = url;
    // a.download = "projetex_data_snapshot.json";
    // document.body.appendChild(a);
    // a.click();
    // document.body.removeChild(a);
    // URL.revokeObjectURL(url);
    // toast({ title: "Snapshot Exportado", description: "Um snapshot dos dados locais foi exportado. Os dados principais estão agora no Firestore." });
  };

  const handleImportClick = () => {
    toast({ 
      variant: "default", 
      title: "Funcionalidade Descontinuada", 
      description: "A importação de JSON foi descontinuada. Seus dados são gerenciados online via Firebase Firestore." 
    });
    // fileInputRef.current?.click(); 
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
     toast({ 
      variant: "default", 
      title: "Funcionalidade Descontinuada", 
      description: "A importação de JSON foi descontinuada." 
    });
    // const file = event.target.files?.[0];
    // if (file) {
    //   // ... lógica de importação antiga ...
    // }
  };

  // Como o componente não será mais usado no Header, podemos retornar null ou um placeholder.
  // Para este caso, como estamos efetivamente removendo a funcionalidade do Header,
  // não há necessidade de renderizar nada aqui se o Header não o chamar mais.
  // Se este arquivo for mantido, ele pode ser um placeholder ou completamente vazio.
  // Por enquanto, vamos manter a estrutura com as funções comentadas e toasts informativos.

  return (
    <div className="flex gap-2">
      <Button onClick={handleImportClick} variant="outline" title="A importação de JSON foi descontinuada.">
        <Upload className="mr-2 h-4 w-4" /> Importar JSON (Desativado)
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled
      />
      <Button onClick={handleExport} variant="outline" title="A exportação de JSON local foi descontinuada.">
        <Download className="mr-2 h-4 w-4" /> Exportar Local (Desativado)
      </Button>
    </div>
  );
}
