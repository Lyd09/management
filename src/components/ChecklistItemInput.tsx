
"use client";

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
  return (
    <div className="flex items-center gap-2 mb-2 p-2 border rounded-md bg-card-foreground/5 hover:bg-card-foreground/10 transition-colors">
      <Checkbox
        id={`check-${item.id}`}
        checked={item.feito}
        onCheckedChange={(checked) => onChange({ ...item, feito: !!checked })}
        aria-label={item.feito ? "Marcar como não feito" : "Marcar como feito"}
      />
      <Input
        type="text"
        value={item.item}
        onChange={(e) => onChange({ ...item, item: e.target.value })}
        placeholder="Descrição da tarefa"
        className="flex-grow"
        aria-label="Descrição da tarefa do checklist"
      />
      <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Remover item do checklist">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}
