
"use client";

import React, { useState, useEffect } from 'react';
import type { ChecklistItem } from "@/types";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface ChecklistItemInputProps {
  item: ChecklistItem;
  onChange: (updatedItem: ChecklistItem) => void;
  onRemove: () => void;
}

export function ChecklistItemInput({ item, onChange, onRemove }: ChecklistItemInputProps) {
  const [localItemText, setLocalItemText] = useState(item.item);

  // Sync local state if the item prop changes from outside
  useEffect(() => {
    if (item.item !== localItemText) {
      setLocalItemText(item.item);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.item]); // Only re-run if item.item itself changes, not the whole item object initially.

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalItemText(e.target.value);
  };

  const handleBlur = () => {
    // Update parent form state only if text has actually changed
    if (localItemText !== item.item) {
      onChange({ ...item, item: localItemText });
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    // When checkbox changes, ensure the current text (even if not blurred yet) is part of the update
    onChange({ ...item, item: localItemText, feito: checked });
  };

  // Use item.id (which should be unique like a UUID) for DOM element IDs
  const uniqueCheckboxId = `checklist-item-checkbox-${item.id}`;
  const uniqueInputId = `checklist-item-text-${item.id}`;

  return (
    <div className="flex items-center gap-2 mb-2 p-2 border rounded-md bg-card-foreground/5 hover:bg-card-foreground/10 transition-colors">
      <Checkbox
        id={uniqueCheckboxId}
        checked={item.feito}
        onCheckedChange={(checked) => handleCheckboxChange(!!checked)}
        aria-label={item.feito ? `Marcar tarefa "${localItemText}" como não feita` : `Marcar tarefa "${localItemText}" como feita`}
      />
      <Input
        id={uniqueInputId}
        type="text"
        value={localItemText} // Controlled by local state
        onChange={handleTextChange} // Updates local state
        onBlur={handleBlur} // Updates form state on blur
        placeholder="Descrição da tarefa"
        className="flex-grow"
        aria-label="Descrição da tarefa do checklist"
      />
      <Button variant="ghost" size="icon" onClick={onRemove} aria-label={`Remover tarefa "${localItemText}" do checklist`}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}
