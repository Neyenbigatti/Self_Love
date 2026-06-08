"use client";

import type { TreatmentType } from "@/lib/db/schema";
import { TreatmentCard } from "@/app/dashboard/treatments/components/treatment-card";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface TreatmentGroupProps {
  category: string | null;
  treatments: TreatmentType[];
  onEdit: (treatment: TreatmentType) => void;
  onDelete: (treatment: TreatmentType) => void;
  onMoveUp: (treatment: TreatmentType) => void;
  onMoveDown: (treatment: TreatmentType) => void;
  onToggleActive: (id: string, newValue: boolean) => Promise<void>;
  /** ID of the first treatment in globally-sorted order. If this treatment's
   *  ID matches, its move-up button is disabled (nothing above it globally). */
  globalFirstId?: string;
  /** ID of the last treatment in globally-sorted order. If this treatment's
   *  ID matches, its move-down button is disabled (nothing below it globally). */
  globalLastId?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function TreatmentGroup({
  category,
  treatments,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleActive,
  globalFirstId,
  globalLastId,
}: TreatmentGroupProps) {
  if (treatments.length === 0) return null;

  // Sort by sortOrder ascending (nulls go last)
  const sorted = [...treatments].sort((a, b) => {
    if (a.sortOrder === null && b.sortOrder === null) return 0;
    if (a.sortOrder === null) return 1;
    if (b.sortOrder === null) return -1;
    return a.sortOrder - b.sortOrder;
  });

  const categoryLabel = category ?? "Sin categoría";

  return (
    <section>
      <h3 className="text-lg font-serif font-semibold text-foreground mb-3">
        {categoryLabel}
      </h3>
      <div className="space-y-2">
        {sorted.map((treatment) => (
          <TreatmentCard
            key={treatment.id}
            treatment={treatment}
            onEdit={() => onEdit(treatment)}
            onDelete={() => onDelete(treatment)}
            onMoveUp={() => onMoveUp(treatment)}
            onMoveDown={() => onMoveDown(treatment)}
            onToggleActive={onToggleActive}
            isFirst={treatment.id === globalFirstId}
            isLast={treatment.id === globalLastId}
          />
        ))}
      </div>
    </section>
  );
}
