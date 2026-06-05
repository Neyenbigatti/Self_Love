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

      // A day is "covered" if it already has a regular rule whose range
      // fully contains the preset range (startTime <= preset.start &&
      // endTime >= preset.end). Partial coverage or different ranges
      // still allow creating the preset rule.
      function isDayCovered(day: number) {
        return existingRules.some(
          (r) =>
            r.type === "regular" &&
            r.dayOfWeek === day &&
            r.startTime <= preset.startTime &&
            r.endTime >= preset.endTime,
        );
      }

      // Build POST requests only for days not already covered by the preset
      const requests = preset.days
        .filter((day) => !isDayCovered(day))
        .map((day) =>
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
        );

      if (requests.length === 0) {
        toast.info("Todos los días ya tienen horario configurado");
        setLoading(null);
        return;
      }

      const results = await Promise.allSettled(requests);
      const created = results.filter(
        (r) => r.status === "fulfilled" && r.value.ok,
      ).length;

      // Build skip summary
      const skippedDays = preset.days.filter((d) => isDayCovered(d));
      const skippedNames = skippedDays.map((d) => DAY_NAMES[d]);

      let message = `Creados ${created} horarios.`;
      if (skippedNames.length > 0) {
        message += ` ${skippedNames.join(", ")} ya tiene horario configurado.`;
      }

      toast.success(message);
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
