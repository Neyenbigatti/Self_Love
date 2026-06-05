"use client";

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

// ─── Props ──────────────────────────────────────────────────────────────────────

interface AppointmentConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentCount: number;
  onConfirm: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────────

export function AppointmentConflictDialog({
  open,
  onOpenChange,
  appointmentCount,
  onConfirm,
}: AppointmentConflictDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Horario</AlertDialogTitle>
          <AlertDialogDescription>
            Esta regla afecta a {appointmentCount} turno
            {appointmentCount !== 1 ? "s" : ""}. Los turnos existentes no se
            modificarán, pero no se generarán nuevos turnos en estas fechas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Eliminar de todas formas
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
