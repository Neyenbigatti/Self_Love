"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface TreatmentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treatmentName: string;
  appointmentCount: number;
  onConfirm: () => Promise<void>;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function TreatmentDeleteDialog({
  open,
  onOpenChange,
  treatmentName,
  appointmentCount,
  onConfirm,
}: TreatmentDeleteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Algo salió mal";
      // Catch 409 "active appointments" errors
      if (message.includes("turnos activos") || message.includes("active appointments")) {
        setError("No se puede eliminar: tiene turnos activos");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Eliminar &ldquo;{treatmentName}&rdquo;
          </AlertDialogTitle>
          <AlertDialogDescription>
            {appointmentCount > 0 ? (
              <>
                Este tratamiento tiene <strong>{appointmentCount}</strong> turno
                {appointmentCount !== 1 ? "s" : ""} asociado
                {appointmentCount !== 1 ? "s" : ""}. Los turnos existentes no
                se modificarán, pero el tratamiento dejará de estar disponible
                para nuevas reservas.
              </>
            ) : (
              <>
                ¿Estás seguro de que querés eliminar este tratamiento? Esta
                acción no se puede deshacer.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive mx-6">
            {error}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {appointmentCount > 0
              ? "Eliminar de todas formas"
              : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
