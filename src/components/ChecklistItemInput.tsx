
"use client";

import React, { useState, useEffect } from 'react';
import type { ChecklistItem } from "@/types";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2 } from "lucide-react"; // Adicionado GripVertical
import { cn } from "@/lib/utils";

interface ChecklistItemInputProps {
  item: ChecklistItem;
  index: number; // Adicionado index
  onChange: (updatedItem: ChecklistItem) => void;
  onRemove: () => void;
  // Props para drag and drop
  onItemDragStart: (index: number) => void;
  onItemDragOver: (event: React.DragEvent<HTMLDivElement>, index: number) => void;
  onItemDrop: (index: number) => void;
  onItemDragEnd: () => void;
  onItemDragLeave: () => void;
  isDraggingThisItem: boolean;
  isDropTarget: boolean;
}

export function ChecklistItemInput({
  item,
  index,
  onChange,
  onRemove,
  onItemDragStart,
  onItemDragOver,
  onItemDrop,
  onItemDragEnd,
  onItemDragLeave,
  isDraggingThisItem,
  isDropTarget,
}: ChecklistItemInputProps) {
  const [localItemText, setLocalItemText] = useState(item.item);

  useEffect(() => {
    if (item.item !== localItemText) {
      setLocalItemText(item.item);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.item]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalItemText(e.target.value);
  };

  const handleBlur = () => {
    if (localItemText !== item.item) {
      onChange({ ...item, item: localItemText });
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    onChange({ ...item, item: localItemText, feito: checked });
  };

  const uniqueCheckboxId = `checklist-item-checkbox-${item.id}`;
  const uniqueInputId = `checklist-item-text-${item.id}`;

  return (
    <div
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(index)); // Definir dados para o drag
        e.dataTransfer.effectAllowed = "move";
        onItemDragStart(index);
      }}
      onDragOver={(e) => onItemDragOver(e, index)}
      onDrop={(e) => {
        e.preventDefault(); // Prevenir comportamento padrão para permitir drop
        onItemDrop(index);
      }}
      onDragEnd={onItemDragEnd}
      onDragLeave={onItemDragLeave}
      className={cn(
        "flex items-center gap-2 mb-2 p-2 border rounded-md bg-card-foreground/5 hover:bg-card-foreground/10 transition-all duration-150 ease-in-out",
        isDraggingThisItem ? "opacity-50 cursor-grabbing shadow-lg" : "cursor-grab",
        isDropTarget ? "ring-2 ring-primary ring-offset-1 bg-primary/10" : ""
      )}
    >
      <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
      <Checkbox
        id={uniqueCheckboxId}
        checked={item.feito}
        onCheckedChange={(checked) => handleCheckboxChange(!!checked)}
        aria-label={item.feito ? `Marcar tarefa "${localItemText}" como não feita` : `Marcar tarefa "${localItemText}" como feita`}
        className="flex-shrink-0"
      />
      <Input
        id={uniqueInputId}
        type="text"
        value={localItemText}
        onChange={handleTextChange}
        onBlur={handleBlur}
        placeholder="Descrição da tarefa"
        className="flex-grow"
        aria-label="Descrição da tarefa do checklist"
      />
      <Button variant="ghost" size="icon" onClick={onRemove} aria-label={`Remover tarefa "${localItemText}" do checklist`} className="flex-shrink-0">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}
