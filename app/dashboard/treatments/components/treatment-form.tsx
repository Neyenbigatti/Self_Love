"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import type { TreatmentType } from "@/lib/db/schema";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface TreatmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treatment?: TreatmentType;
  onSaved: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function TreatmentForm({
  open,
  onOpenChange,
  treatment,
  onSaved,
}: TreatmentFormProps) {
  const isEditing = !!treatment;

  // ── Form state ─────────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when opening
  useEffect(() => {
    if (open) {
      if (treatment) {
        setName(treatment.name);
        setDuration(String(treatment.duration));
        setDescription(treatment.description ?? "");
        setPrice(treatment.price !== null ? String(treatment.price) : "");
        setCategory(treatment.category ?? "");
      } else {
        setName("");
        setDuration("30");
        setDescription("");
        setPrice("");
        setCategory("");
      }
      setError(null);
    }
  }, [open, treatment]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!name.trim()) return "El nombre es obligatorio";
    if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) {
      return "La duración debe ser un número positivo";
    }
    return null;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        duration: Number(duration),
        description: description.trim() || undefined,
        price: price ? Number(price) : undefined,
        category: category.trim() || undefined,
      };

      const url = isEditing
        ? `/api/treatment-types/${treatment!.id}`
        : "/api/treatment-types";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        if (res.status === 409) {
          // Check if it's a rename conflict or duplicate name
          if (isEditing && data.error?.includes("rename")) {
            setError(
              "No se puede renombrar: el tratamiento tiene turnos activos",
            );
          } else {
            setError("Ya existe un tratamiento con este nombre");
          }
          setLoading(false);
          return;
        }

        throw new Error(
          data.error ||
            (isEditing
              ? "Error al actualizar el tratamiento"
              : "Error al crear el tratamiento"),
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
            {isEditing ? "Editar Tratamiento" : "Nuevo Tratamiento"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modificá los datos del tratamiento"
              : "Agregá un nuevo tratamiento a tu catálogo"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Error banner */}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Consulta inicial"
              required
            />
          </div>

          {/* Duration */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="duration">
              Duración (minutos) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="duration"
              type="number"
              min={5}
              step={5}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="30"
              required
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">
              Descripción{" "}
              <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción del tratamiento"
              rows={2}
            />
          </div>

          {/* Price */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="price">
              Precio (en centavos){" "}
              <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="price"
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ej: 5000 → $50.00"
            />
            {price && !isNaN(Number(price)) && Number(price) > 0 && (
              <p className="text-xs text-muted-foreground">
                Mostrará: ${(Number(price) / 100).toFixed(2)}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="category">
              Categoría{" "}
              <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ej: Estética, Salud, Consultas..."
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
              {isEditing ? "Guardar Cambios" : "Crear Tratamiento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
