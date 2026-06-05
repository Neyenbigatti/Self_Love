"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvailabilityList } from "@/components/availability/availability-list";
import { AvailabilityForm } from "@/components/availability/availability-form";
import { ConfigureHours } from "@/components/availability/availability-configure-hours";
import { AppointmentConflictDialog } from "@/components/availability/appointment-conflict-dialog";
import type { AvailabilityRule } from "@/app/dashboard/types";

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AvailabilityPage() {
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Form dialog state ────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AvailabilityRule | undefined>(
    undefined,
  );

  // ── Delete conflict dialog state ─────────────────────────────────────────
  const [deleteState, setDeleteState] = useState<{
    rule: AvailabilityRule;
    appointmentCount: number;
  } | null>(null);

  // ── Fetch availability rules from API ─────────────────────────────────────
  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/availability");
      if (!res.ok) throw new Error("Error al cargar los horarios");

      const data = await res.json();
      setRules(data.availability ?? []);
    } catch (err) {
      console.error("[availability] Failed to fetch:", err);
      setError(
        err instanceof Error ? err.message : "Error al cargar los horarios",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // ── CRUD Handlers ─────────────────────────────────────────────────────────

  const handleCreate = () => {
    setEditingRule(undefined);
    setFormOpen(true);
  };

  const handleEdit = (rule: AvailabilityRule) => {
    setEditingRule(rule);
    setFormOpen(true);
  };

  // ── Count appointments affected by this rule ────────────────────────────
  const countAffectedAppointments = useCallback(
    async (rule: AvailabilityRule): Promise<number> => {
      try {
        const res = await fetch("/api/appointments");
        if (!res.ok) return 0;
        const data = await res.json();
        const appointments: { date: string }[] = data.appointments ?? [];

        return appointments.filter((a) => {
          if (rule.dayOfWeek !== null) {
            const [y, m, d] = a.date.split("-").map(Number);
            const date = new Date(y, m - 1, d);
            return date.getDay() === rule.dayOfWeek;
          }
          if (rule.specificDate) {
            return a.date === rule.specificDate;
          }
          return false;
        }).length;
      } catch {
        return 0;
      }
    },
    [],
  );

  // ── Perform the actual DELETE fetch ──────────────────────────────────────
  const performDelete = useCallback(
    async (rule: AvailabilityRule) => {
      try {
        const res = await fetch(`/api/availability/${rule.id}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("Error al eliminar el horario");

        await fetchRules();
      } catch (err) {
        console.error("[availability] Failed to delete:", err);
        alert(
          err instanceof Error
            ? err.message
            : "Error al eliminar el horario",
        );
      }
    },
    [fetchRules],
  );

  // ── Delete handler: check appointments, show dialog or confirm ──────────
  const handleDelete = useCallback(
    async (rule: AvailabilityRule) => {
      const count = await countAffectedAppointments(rule);

      if (count > 0) {
        setDeleteState({ rule, appointmentCount: count });
      } else {
        const label =
          rule.dayOfWeek !== null
            ? DAY_NAMES[rule.dayOfWeek]
            : rule.specificDate ?? "";
        if (!confirm(`¿Eliminar este horario de ${label}?`)) return;
        await performDelete(rule);
      }
    },
    [countAffectedAppointments, performDelete],
  );

  const handleSaved = useCallback(() => {
    fetchRules();
  }, [fetchRules]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-56 bg-muted rounded" />
          <div className="h-4 w-72 bg-muted rounded" />
          <div className="h-48 bg-muted rounded-lg" />
          <div className="h-48 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-foreground">
            Disponibilidad
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestioná tus horarios de atención
          </p>
        </div>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center max-w-md mx-auto">
          <Loader2 className="mx-auto size-8 text-destructive mb-3" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            No se pudieron cargar los horarios
          </h2>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => fetchRules()}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            <Loader2 className="size-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-foreground">
            Disponibilidad
          </h1>
          <p className="text-muted-foreground mt-1">
            Configurá tus horarios de atención semanales y excepciones
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" />
          Agregar Horario
        </Button>
      </div>

      {/* Quick-set preset buttons */}
      <ConfigureHours onConfigured={fetchRules} />

      {/* Rule list */}
      <AvailabilityList
        rules={rules}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Create/Edit form dialog */}
      <AvailabilityForm
        open={formOpen}
        onOpenChange={setFormOpen}
        rule={editingRule}
        existingRules={rules}
        onSaved={handleSaved}
      />

      {/* Appointment conflict dialog on delete */}
      <AppointmentConflictDialog
        open={deleteState !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteState(null);
        }}
        appointmentCount={deleteState?.appointmentCount ?? 0}
        onConfirm={async () => {
          if (deleteState) {
            await performDelete(deleteState.rule);
            setDeleteState(null);
          }
        }}
      />
    </div>
  );
}

// ─── Day names (shared with delete confirm) ──────────────────────────────────

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
