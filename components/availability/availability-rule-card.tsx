"use client";

import { Clock, Pencil, Trash2 } from "lucide-react";
import type { AvailabilityRule } from "@/app/dashboard/types";
import { Button } from "@/components/ui/button";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const TYPE_LABELS: Record<AvailabilityRule["type"], string> = {
  regular: "Disponible",
  break: "Descanso",
  blocked: "Bloqueado",
};

const TYPE_STYLES: Record<
  AvailabilityRule["type"],
  { badge: string; card: string }
> = {
  regular: {
    badge: "bg-accent/10 text-accent-foreground",
    card: "border-border",
  },
  break: {
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    card: "border-amber-200 dark:border-amber-800/40",
  },
  blocked: {
    badge: "bg-destructive/10 text-destructive-foreground",
    card: "border-destructive/20",
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatTimeRange(startTime: string, endTime: string) {
  return `${startTime} – ${endTime}`;
}

function formatDisplayDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface AvailabilityRuleCardProps {
  rule: AvailabilityRule;
  onEdit: () => void;
  onDelete: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function AvailabilityRuleCard({
  rule,
  onEdit,
  onDelete,
}: AvailabilityRuleCardProps) {
  const styles = TYPE_STYLES[rule.type];

  return (
    <div
      className={`flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-secondary/30 ${styles.card}`}
    >
      <div className="flex items-center gap-4 min-w-0">
        {/* Icon */}
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <Clock className="size-4 text-muted-foreground" />
        </div>

        {/* Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground truncate">
              {rule.dayOfWeek !== null
                ? DAY_NAMES[rule.dayOfWeek]
                : rule.specificDate
                  ? formatDisplayDate(rule.specificDate)
                  : "—"}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles.badge}`}
            >
              {TYPE_LABELS[rule.type]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatTimeRange(rule.startTime, rule.endTime)}
            {rule.label && (
              <>
                {" "}
                &middot;{" "}
                <span className="italic">{rule.label}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="size-8 text-muted-foreground hover:text-foreground"
          title="Editar"
          aria-label={`Editar ${rule.dayOfWeek !== null ? DAY_NAMES[rule.dayOfWeek] : rule.specificDate ?? ""}`}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="size-8 text-muted-foreground hover:text-destructive"
          title="Eliminar"
          aria-label={`Eliminar ${rule.dayOfWeek !== null ? DAY_NAMES[rule.dayOfWeek] : rule.specificDate ?? ""}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
