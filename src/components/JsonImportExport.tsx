
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

  const handleExport = () => {
    const data = exportData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "projetex_data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Sucesso", description: "Dados exportados com sucesso." });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result;
          if (typeof text === 'string') {
            const jsonData = JSON.parse(text) as AppData;
            if (importData(jsonData)) {
              toast({ title: "Sucesso", description: "Dados importados com sucesso." });
            } else {
              toast({ variant: "destructive", title: "Erro", description: "Formato de arquivo inválido." });
            }
          }
        } catch (error) {
          toast({ variant: "destructive", title: "Erro", description: "Falha ao importar o arquivo JSON." });
          console.error("Import error:", error);
        }
      };
      reader.readAsText(file);
      // Reset file input to allow importing the same file again
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleImportClick} variant="outline">
        <Upload className="mr-2 h-4 w-4" /> Importar JSON
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Button onClick={handleExport} variant="outline">
        <Download className="mr-2 h-4 w-4" /> Exportar JSON
      </Button>
    </div>
  );
}
