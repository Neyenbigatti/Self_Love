"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// ─── Presets ────────────────────────────────────────────────────────────────────

const PRESETS = [
  { label: "Lun–Vie 09:00–18:00", startTime: "09:00", endTime: "18:00", days: [1, 2, 3, 4, 5] },
  { label: "Lun–Vie 08:00–17:00", startTime: "08:00", endTime: "17:00", days: [1, 2, 3, 4, 5] },
  { label: "Lun–Sab 09:00–13:00", startTime: "09:00", endTime: "13:00", days: [1, 2, 3, 4, 5, 6] },
] as const;

const DAY_NAMES = [
  "Domingo", "Lunes", "Martes", "Miércoles",
  "Jueves", "Viernes", "Sábado",
];

// ─── Props ──────────────────────────────────────────────────────────────────────

interface ConfigureHoursProps {
  onConfigured: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────────

export function ConfigureHours({ onConfigured }: ConfigureHoursProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const applyPreset = async (preset: (typeof PRESETS)[number]) => {
    setLoading(preset.label);

    try {
      // Fetch existing rules to know which days to skip
      const res = await fetch("/api/availability");
      if (!res.ok) throw new Error("Error al cargar horarios existentes");

      const data = await res.json();
      const existingRules: {
        dayOfWeek: number | null;
        type: string;
        startTime: string;
        endTime: string;
      }[] = data.availability ?? [];

      // ── Classify each day ──────────────────────────────────────────────────
      // Conservative approach: quick-set NEVER modifies existing rules.
      // - No regular rules → create the preset
      // - Has regular rule covering full preset range → skip (already done)
      // - Has regular rule but doesn't cover full range → skip (manual needed)

      const daysWithRegular = new Set(
        existingRules
          .filter((r) => r.type === "regular" && r.dayOfWeek !== null)
          .map((r) => r.dayOfWeek!),
      );

      function isFullyCovered(day: number) {
        return existingRules.some(
          (r) =>
            r.type === "regular" &&
            r.dayOfWeek === day &&
            r.startTime <= preset.startTime &&
            r.endTime >= preset.endTime,
        );
      }

      const toCreate: number[] = [];
      const alreadyConfigured: string[] = [];
      const needsManual: string[] = [];

      for (const day of preset.days) {
        if (!daysWithRegular.has(day)) {
          toCreate.push(day);
        } else if (isFullyCovered(day)) {
          alreadyConfigured.push(DAY_NAMES[day]);
        } else {
          needsManual.push(DAY_NAMES[day]);
        }
      }

      // ── Create rules for empty days ───────────────────────────────────────
      const results = await Promise.allSettled(
        toCreate.map((day) =>
          fetch("/api/availability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dayOfWeek: day,
              startTime: preset.startTime,
              endTime: preset.endTime,
              type: "regular",
            }),
          }),
        ),
      );

      const created = results.filter(
        (r) => r.status === "fulfilled" && r.value.ok,
      ).length;

      // ── Build summary message ─────────────────────────────────────────────
      const parts: string[] = [];

      if (created > 0) {
        parts.push(`Creados ${created} horarios`);
      }

      if (alreadyConfigured.length > 0) {
        parts.push(
          `${alreadyConfigured.join(", ")} ya tiene horario configurado`,
        );
      }

      if (needsManual.length > 0) {
        parts.push(
          `${needsManual.join(", ")} requiere configuración manual`,
        );
      }

      if (parts.length === 0) {
        if (toCreate.length > 0) {
          toast.error("No se pudieron crear los horarios");
        } else {
          toast.info("Todos los días ya tienen el horario completo");
        }
      } else {
        toast.success(parts.join(". "));
      }

      onConfigured();
    } catch (err) {
      console.error("[configure-hours] Error:", err);
      toast.error("Error al configurar horarios");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map((preset) => (
        <Button
          key={preset.label}
          variant="outline"
          size="sm"
          onClick={() => applyPreset(preset)}
          disabled={loading !== null}
        >
          {loading === preset.label && (
            <Loader2 className="mr-2 size-4 animate-spin" />
          )}
          {preset.label}
        </Button>
      ))}
    </div>
  );
}
