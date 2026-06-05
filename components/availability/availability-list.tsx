"use client";

import { CalendarPlus } from "lucide-react";
import type { AvailabilityRule } from "@/app/dashboard/types";
import { AvailabilityRuleCard } from "@/components/availability/availability-rule-card";

// ─── Props ────────────────────────────────────────────────────────────────────

interface AvailabilityListProps {
  rules: AvailabilityRule[];
  onEdit: (rule: AvailabilityRule) => void;
  onDelete: (rule: AvailabilityRule) => void;
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
        <CalendarPlus className="size-7 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground">
        Sin horarios configurados
      </h3>
      <p className="text-muted-foreground mt-1 max-w-sm">
        Agregá tus horarios de atención para que los pacientes puedan reservar
        turnos online.
      </p>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function RuleSection({
  title,
  description,
  rules,
  onEdit,
  onDelete,
}: {
  title: string;
  description: string;
  rules: AvailabilityRule[];
  onEdit: (rule: AvailabilityRule) => void;
  onDelete: (rule: AvailabilityRule) => void;
}) {
  if (rules.length === 0) return null;

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-serif font-semibold text-foreground">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-2">
        {rules.map((rule) => (
          <AvailabilityRuleCard
            key={rule.id}
            rule={rule}
            onEdit={() => onEdit(rule)}
            onDelete={() => onDelete(rule)}
          />
        ))}
      </div>
    </section>
  );
}

// ─── AvailabilityList ─────────────────────────────────────────────────────────

export function AvailabilityList({
  rules,
  onEdit,
  onDelete,
}: AvailabilityListProps) {
  if (rules.length === 0) {
    return <EmptyState />;
  }

  // Group: weekly rules (dayOfWeek-based) vs exceptions (specificDate)
  const weeklyRules = rules.filter((r) => r.dayOfWeek !== null);
  const exceptionRules = rules.filter((r) => r.specificDate !== null);

  // Sort weekly by dayOfWeek, then by startTime
  weeklyRules.sort(
    (a, b) =>
      (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0) ||
      a.startTime.localeCompare(b.startTime),
  );

  // Sort exceptions by specificDate, then by startTime
  exceptionRules.sort(
    (a, b) =>
      (a.specificDate ?? "").localeCompare(b.specificDate ?? "") ||
      a.startTime.localeCompare(b.startTime),
  );

  return (
    <div className="space-y-8">
      <RuleSection
        title="Horario Semanal"
        description="Horarios recurrentes que se repiten todas las semanas"
        rules={weeklyRules}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      <RuleSection
        title="Excepciones"
        description="Cambios puntuales para fechas específicas (feriados, días adicionales, etc.)"
        rules={exceptionRules}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}
