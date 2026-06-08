"use client";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { TreatmentType } from "@/lib/db/schema";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return "";
  return `$${(cents / 100).toFixed(2)}`;
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface TreatmentCardProps {
  treatment: TreatmentType;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleActive: (id: string, newValue: boolean) => Promise<void>;
  isFirst: boolean;
  isLast: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function TreatmentCard({
  treatment,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleActive,
  isFirst,
  isLast,
}: TreatmentCardProps) {
  const priceDisplay = formatPrice(treatment.price);

  const handleToggle = async () => {
    const newValue = !treatment.isActive;
    // Optimistic: the parent manages state, we call the handler
    // Parent toggles locally, calls API, reverts on error
    try {
      await onToggleActive(treatment.id, newValue);
    } catch {
      // Error toast fired by parent
    }
  };

  return (
    <div
      className={`flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-secondary/30 ${
        !treatment.isActive ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Reorder arrows */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            title="Subir"
            aria-label="Mover hacia arriba"
          >
            <ChevronUp className="size-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            title="Bajar"
            aria-label="Mover hacia abajo"
          >
            <ChevronDown className="size-4" />
          </button>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground truncate">
              {treatment.name}
            </span>
            {!treatment.isActive && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Inactivo
              </Badge>
            )}
            {treatment.isActive && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 text-green-600 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950/20"
              >
                Activo
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 flex-wrap">
            <span>{treatment.duration} min</span>
            {priceDisplay && (
              <>
                <span className="text-muted-foreground/40">&middot;</span>
                <span className="font-medium text-foreground/70">
                  {priceDisplay}
                </span>
              </>
            )}
            {treatment.description && (
              <>
                <span className="text-muted-foreground/40">&middot;</span>
                <span className="truncate max-w-[200px] italic">
                  {treatment.description}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 ml-4">
        {/* Toggle active */}
        <Switch
          checked={treatment.isActive}
          onCheckedChange={handleToggle}
          aria-label={treatment.isActive ? "Desactivar tratamiento" : "Activar tratamiento"}
        />

        {/* Edit */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="size-8 text-muted-foreground hover:text-foreground"
          title="Editar"
          aria-label={`Editar ${treatment.name}`}
        >
          <Pencil className="size-4" />
        </Button>

        {/* Delete */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="size-8 text-muted-foreground hover:text-destructive"
          title="Eliminar"
          aria-label={`Eliminar ${treatment.name}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
