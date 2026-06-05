"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { findOverlaps } from "@/lib/availability/overlap";
import type { AvailabilityRule } from "@/app/dashboard/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_OPTIONS = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Lunes" },
  { value: "2", label: "Martes" },
  { value: "3", label: "Miércoles" },
  { value: "4", label: "Jueves" },
  { value: "5", label: "Viernes" },
  { value: "6", label: "Sábado" },
];

const TYPE_OPTIONS = [
  { value: "regular", label: "Disponible" },
  { value: "break", label: "Descanso" },
  { value: "blocked", label: "Bloqueado" },
] as const;

// ─── Props ─────────────────────────────────────────────────────────────────────

interface AvailabilityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: AvailabilityRule;
  existingRules?: AvailabilityRule[];
  onSaved: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

const DAY_NAMES = [
  "Domingo", "Lunes", "Martes", "Miércoles",
  "Jueves", "Viernes", "Sábado",
];

export function AvailabilityForm({
  open,
  onOpenChange,
  rule,
  existingRules = [],
  onSaved,
}: AvailabilityFormProps) {
  const isEditing = !!rule;

  // ── Form state ─────────────────────────────────────────────────────────────
  const [type, setType] = useState<string>("regular");
  const [dayOfWeek, setDayOfWeek] = useState<string>("");
  const [specificDate, setSpecificDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("18:00");
  const [label, setLabel] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);

  // Reset form when opening or when rule changes
  useEffect(() => {
    if (open) {
      if (rule) {
        setType(rule.type);
        setDayOfWeek(rule.dayOfWeek !== null ? String(rule.dayOfWeek) : "");
        setSpecificDate(rule.specificDate ?? "");
        setStartTime(rule.startTime);
        setEndTime(rule.endTime);
        setLabel(rule.label ?? "");
      } else {
        setType("regular");
        setDayOfWeek("");
        setSpecificDate("");
        setStartTime("09:00");
        setEndTime("18:00");
        setLabel("");
      }
      setError(null);
      setOverlapWarning(null);
    }
  }, [open, rule]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (startTime >= endTime) {
      return "La hora de fin debe ser posterior a la hora de inicio";
    }
    if (!dayOfWeek && !specificDate) {
      return "Seleccioná un día de la semana o una fecha específica";
    }
    return null;
  };

  // ── Frontend overlap check ─────────────────────────────────────────────────
  const checkOverlap = (): string | null => {
    if (type !== "regular") return null;
    if (!dayOfWeek) return null;

    const ruleId = rule?.id;
    const dayNum = Number(dayOfWeek);

    const overlaps = findOverlaps(
      { id: ruleId, dayOfWeek: dayNum, specificDate: null, startTime, endTime, type: "regular" },
      existingRules,
    );

    if (overlaps.length > 0) {
      const conflict = overlaps[0];
      const dayName =
        conflict.dayOfWeek !== null ? DAY_NAMES[conflict.dayOfWeek] : "";
      return `Se superpone con ${dayName} ${conflict.startTime}-${conflict.endTime}`;
    }

    return null;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOverlapWarning(null);

    // Validate basic constraints
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    // Frontend overlap check
    const overlapError = checkOverlap();
    if (overlapError) {
      setOverlapWarning(overlapError);
      setLoading(false);
      return;
    }

    try {
      const body: Record<string, unknown> = {
        type,
        startTime,
        endTime,
        label: label.trim() || undefined,
      };

      if (dayOfWeek) {
        body.dayOfWeek = Number(dayOfWeek);
      } else if (specificDate) {
        body.specificDate = specificDate;
      }

      const url = isEditing
        ? `/api/availability/${rule!.id}`
        : "/api/availability";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Show 409 overlap errors as overlapWarning (not error box)
        if (res.status === 409) {
          setOverlapWarning(data.error ?? "Se superpone con un horario existente");
          setLoading(false);
          return;
        }
        throw new Error(
          data.error ||
            (isEditing
              ? "Error al actualizar el horario"
              : "Error al crear el horario"),
        );
      }

      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Algo salió mal",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {isEditing ? "Editar Horario" : "Nuevo Horario"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modificá los datos del horario seleccionado"
              : "Agregá un nuevo horario de atención"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Error banner */}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Overlap warning (orange — blocks submit, not a system error) */}
          {overlapWarning && (
            <div className="rounded-lg border border-amber-400/30 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-800 dark:text-amber-300">
              {overlapWarning}
            </div>
          )}

          {/* Type */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="type">Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Day of week (for weekly recurring) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="dayOfWeek">Día de la Semana</Label>
            <Select
              value={dayOfWeek}
              onValueChange={(val) => {
                setDayOfWeek(val);
                if (val) setSpecificDate("");
              }}
            >
              <SelectTrigger id="dayOfWeek">
                <SelectValue placeholder="Seleccionar día" />
              </SelectTrigger>
              <SelectContent>
                {DAY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Specific date (for exceptions) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="specificDate">
              O Fecha Específica
            </Label>
            <Input
              id="specificDate"
              type="date"
              value={specificDate}
              onChange={(e) => {
                setSpecificDate(e.target.value);
                if (e.target.value) setDayOfWeek("");
              }}
            />
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startTime">Hora de Inicio</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="endTime">Hora de Fin</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Label */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="label">
              Etiqueta <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej: Almuerzo, Capacitación..."
            />
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditing ? "Guardar Cambios" : "Agregar Horario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
