"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TreatmentGroup } from "@/app/dashboard/treatments/components/treatment-group";
import { TreatmentForm } from "@/app/dashboard/treatments/components/treatment-form";
import { TreatmentDeleteDialog } from "@/app/dashboard/treatments/components/treatment-delete-dialog";
import type { TreatmentType } from "@/lib/db/schema";

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<TreatmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Form dialog state ──────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<
    TreatmentType | undefined
  >(undefined);

  // ── Delete dialog state ────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<{
    treatment: TreatmentType;
    appointmentCount: number;
  } | null>(null);

  // ── Fetch treatments from API ──────────────────────────────────────────────
  const fetchTreatments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/treatment-types");
      if (!res.ok) throw new Error("Error al cargar los tratamientos");

      const data = await res.json();
      setTreatments(data.treatmentTypes ?? []);
    } catch (err) {
      console.error("[treatments] Failed to fetch:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error al cargar los tratamientos",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTreatments();
  }, [fetchTreatments]);

  // ── Group treatments by category ───────────────────────────────────────────
  const grouped = useCallback(() => {
    const groups = new Map<string | null, TreatmentType[]>();

    // Sort all by sortOrder first
    const sorted = [...treatments].sort((a, b) => {
      if (a.sortOrder === null && b.sortOrder === null) return 0;
      if (a.sortOrder === null) return 1;
      if (b.sortOrder === null) return -1;
      return a.sortOrder - b.sortOrder;
    });

    for (const t of sorted) {
      const key = t.category ?? "__uncategorized__";
      const existing = groups.get(key) ?? [];
      existing.push(t);
      groups.set(key, existing);
    }

    return groups;
  }, [treatments]);

  // ── Global sort for move boundaries ─────────────────────────────────────────
  // isFirst/isLast must be global (not per-category) because sortOrder applies
  // across all categories — categories are visual grouping only.
  const globallySorted = useMemo(
    () =>
      [...treatments].sort((a, b) => {
        if (a.sortOrder === null && b.sortOrder === null) return 0;
        if (a.sortOrder === null) return 1;
        if (b.sortOrder === null) return -1;
        return a.sortOrder - b.sortOrder;
      }),
    [treatments],
  );
  const globalFirstId = globallySorted[0]?.id;
  const globalLastId = globallySorted[globallySorted.length - 1]?.id;

  // ── CRUD Handlers ──────────────────────────────────────────────────────────

  const handleCreate = () => {
    setEditingTreatment(undefined);
    setFormOpen(true);
  };

  const handleEdit = (treatment: TreatmentType) => {
    setEditingTreatment(treatment);
    setFormOpen(true);
  };

  const handleSaved = useCallback(() => {
    fetchTreatments();
  }, [fetchTreatments]);

  // ── Toggle active (optimistic) ─────────────────────────────────────────────
  const handleToggleActive = useCallback(
    async (id: string, newValue: boolean) => {
      // Optimistic update
      setTreatments((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isActive: newValue } : t)),
      );

      try {
        const res = await fetch(`/api/treatment-types/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: newValue }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Error al actualizar");
        }
      } catch (err) {
        // Revert on error
        setTreatments((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, isActive: !newValue } : t,
          ),
        );
        toast.error(
          err instanceof Error
            ? err.message
            : "Error al cambiar el estado del tratamiento",
        );
        throw err; // Re-throw so card knows it failed
      }
    },
    [],
  );

  // ── Renumber all non-null sortOrders to sequential unique values ──────────
  // Used when duplicate sortOrders make a swap a no-op.
  async function renumberSortOrders(all: TreatmentType[]) {
    const sorted = [...all]
      .filter((t) => t.sortOrder !== null)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    await Promise.all(
      sorted.map((t, i) =>
        fetch(`/api/treatment-types/${t.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: i }),
        }),
      ),
    );
  }

  // ── Reorder (swap sortOrder with adjacent) ─────────────────────────────────
  const handleMoveUp = useCallback(
    async (treatment: TreatmentType) => {
      if (treatment.sortOrder === null) {
        // Assign initial sortOrder if null
        await fetch(`/api/treatment-types/${treatment.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: 0 }),
        });
        await fetchTreatments();
        return;
      }

      // Find adjacent treatment with next lower sortOrder
      const sorted = [...treatments]
        .filter((t) => t.sortOrder !== null)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

      const currentIndex = sorted.findIndex(
        (t) => t.id === treatment.id,
      );
      if (currentIndex <= 0) return;

      const above = sorted[currentIndex - 1];
      if (!above || above.sortOrder === null) return;

      // Swap sortOrder values
      const tempOrder = above.sortOrder;

      // ── Duplicate sortOrder guard ──────────────────────────────────────────
      // If both values are equal, the swap is a no-op. Renumber all to unique
      // sequential values first, then refetch. The user clicks again to move.
      if (tempOrder === treatment.sortOrder) {
        await renumberSortOrders(treatments);
        await fetchTreatments();
        return;
      }

      try {
        await Promise.all([
          fetch(`/api/treatment-types/${treatment.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sortOrder: tempOrder }),
          }),
          fetch(`/api/treatment-types/${above.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sortOrder: treatment.sortOrder }),
          }),
        ]);

        await fetchTreatments();
      } catch {
        toast.error("Error al reordenar los tratamientos");
        await fetchTreatments(); // refetch to reset
      }
    },
    [treatments, fetchTreatments],
  );

  const handleMoveDown = useCallback(
    async (treatment: TreatmentType) => {
      if (treatment.sortOrder === null) {
        await fetch(`/api/treatment-types/${treatment.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: 0 }),
        });
        await fetchTreatments();
        return;
      }

      const sorted = [...treatments]
        .filter((t) => t.sortOrder !== null)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

      const currentIndex = sorted.findIndex(
        (t) => t.id === treatment.id,
      );
      if (currentIndex < 0 || currentIndex >= sorted.length - 1) return;

      const below = sorted[currentIndex + 1];
      if (!below || below.sortOrder === null) return;

      const tempOrder = below.sortOrder;

      // ── Duplicate sortOrder guard ──────────────────────────────────────────
      if (tempOrder === treatment.sortOrder) {
        await renumberSortOrders(treatments);
        await fetchTreatments();
        return;
      }

      try {
        await Promise.all([
          fetch(`/api/treatment-types/${treatment.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sortOrder: tempOrder }),
          }),
          fetch(`/api/treatment-types/${below.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sortOrder: treatment.sortOrder }),
          }),
        ]);

        await fetchTreatments();
      } catch {
        toast.error("Error al reordenar los tratamientos");
        await fetchTreatments();
      }
    },
    [treatments, fetchTreatments],
  );

  // ── Delete handler ─────────────────────────────────────────────────────────
  const handleDeleteRequest = useCallback(
    async (treatment: TreatmentType) => {
      // Check for active appointments first
      try {
        const res = await fetch("/api/appointments");
        if (!res.ok) throw new Error();
        const data = await res.json();
        const appointments: { treatmentTypeId: string }[] =
          data.appointments ?? [];
        const count = appointments.filter(
          (a) => a.treatmentTypeId === treatment.id,
        ).length;

        setDeleteTarget({ treatment, appointmentCount: count });
      } catch {
        // If we can't check, allow delete anyway but show confirm
        setDeleteTarget({ treatment, appointmentCount: 0 });
      }
    },
    [],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;

    const res = await fetch(
      `/api/treatment-types/${deleteTarget.treatment.id}`,
      { method: "DELETE" },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        throw new Error(
          data.error ?? "No se puede eliminar: tiene turnos activos",
        );
      }
      throw new Error(data.error ?? "Error al eliminar");
    }

    await fetchTreatments();
    setDeleteTarget(null);
  }, [deleteTarget, fetchTreatments]);

  // ── Loading state ──────────────────────────────────────────────────────────
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

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-foreground">
            Tratamientos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestioná tu catálogo de tratamientos
          </p>
        </div>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center max-w-md mx-auto">
          <Loader2 className="mx-auto size-8 text-destructive mb-3" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            No se pudieron cargar los tratamientos
          </h2>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => fetchTreatments()}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            <Loader2 className="size-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const groups = grouped();
  const categories = Array.from(groups.keys()).sort((a, b) => {
    // "Sin categoría" always last
    if (a === "__uncategorized__") return 1;
    if (b === "__uncategorized__") return -1;
    return (a ?? "").localeCompare(b ?? "");
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-foreground">
            Tratamientos
          </h1>
          <p className="text-muted-foreground mt-1">
            Configurá los tratamientos que ofrecés
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" />
          Nuevo Tratamiento
        </Button>
      </div>

      {/* Empty state */}
      {treatments.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
            <Plus className="size-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">
            Sin tratamientos configurados
          </h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            Agregá tus tratamientos para que los pacientes puedan reservar
            turnos online.
          </p>
          <Button onClick={handleCreate} className="mt-4">
            <Plus className="mr-2 size-4" />
            Crear Tratamiento
          </Button>
        </div>
      )}

      {/* Groups */}
      {treatments.length > 0 && (
        <div className="space-y-8">
          {categories.map((key) => {
            const categoryKey =
              key === "__uncategorized__" ? null : key;
            const items = groups.get(key) ?? [];
            return (
              <TreatmentGroup
                key={key}
                category={categoryKey}
                treatments={items}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onToggleActive={handleToggleActive}
                globalFirstId={globalFirstId}
                globalLastId={globalLastId}
              />
            );
          })}
        </div>
      )}

      {/* Create/Edit form dialog */}
      <TreatmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        treatment={editingTreatment}
        onSaved={handleSaved}
      />

      {/* Delete confirmation dialog */}
      <TreatmentDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        treatmentName={deleteTarget?.treatment.name ?? ""}
        appointmentCount={deleteTarget?.appointmentCount ?? 0}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
