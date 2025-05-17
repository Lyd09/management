
"use client";

import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { useToast } from "@/hooks/use-toast";
import type { AppData } from '@/types';

export function JsonImportExport() {
  const { importData, exportData } = useAppData();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // With data now in Firestore, these functions are less relevant for direct data management.
  // They could be re-purposed for backup/restore from Firestore, but that's more complex.
  // For now, they will log warnings and operate on the current local state if needed.

  const handleExport = () => {
    const data = exportData(); // This will now likely return the current client-side state
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "projetex_data_snapshot.json"; // Renamed to reflect it's a snapshot
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Snapshot Exportado", description: "Um snapshot dos dados locais foi exportado. Os dados principais estão agora no Firestore." });
  };

  const handleImportClick = () => {
    toast({ variant: "default", title: "Funcionalidade Alterada", description: "A importação de JSON foi descontinuada. Os dados são gerenciados online via Firestore." });
    // fileInputRef.current?.click(); // Optionally disable or change behavior
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    toast({ variant: "default", title: "Funcionalidade Alterada", description: "A importação de JSON foi descontinuada. Os dados são gerenciados online via Firestore." });
    // const file = event.target.files?.[0];
    // if (file) {
    //   const reader = new FileReader();
    //   reader.onload = (e) => {
    //     try {
    //       const text = e.target?.result;
    //       if (typeof text === 'string') {
    //         const jsonData = JSON.parse(text) as AppData;
    //         if (importData(jsonData)) { // importData now has different behavior
    //           toast({ title: "Aviso", description: "Tentativa de importação registrada. Verifique o console." });
    //         } else {
    //           toast({ variant: "destructive", title: "Erro", description: "Falha na importação (funcionalidade descontinuada)." });
    //         }
    //       }
    //     } catch (error) {
    //       toast({ variant: "destructive", title: "Erro", description: "Falha ao processar o arquivo JSON." });
    //       console.error("Import error:", error);
    //     }
    //   };
    //   reader.readAsText(file);
    //   if(fileInputRef.current) {
    //     fileInputRef.current.value = "";
    //   }
    // }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleImportClick} variant="outline" title="A importação de JSON foi descontinuada com a migração para o Firestore.">
        <Upload className="mr-2 h-4 w-4" /> Importar JSON (Descontinuado)
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled // Disable file input as functionality is deprecated
      />
      <Button onClick={handleExport} variant="outline" title="Exporta um snapshot dos dados carregados localmente. Os dados principais estão no Firestore.">
        <Download className="mr-2 h-4 w-4" /> Exportar Snapshot
      </Button>
    </div>
  );
}
