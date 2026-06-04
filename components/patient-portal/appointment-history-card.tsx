"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, Scissors } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/lib/types";

interface AppointmentHistoryCardProps {
  appointment: Appointment;
}

const statusStyles: Record<string, { label: string; className: string }> = {
  completed: {
    label: "Completado",
    className: "bg-brand-sage-light text-brand-sage-dark",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-brand-rose-light text-brand-rose-dark",
  },
  pending: {
    label: "Pendiente",
    className: "bg-brand-warm-amber text-brand-warm-amber-dark",
  },
  confirmed: {
    label: "Confirmado",
    className: "bg-brand-sage-light text-brand-sage-dark",
  },
};

export function AppointmentHistoryCard({
  appointment,
}: AppointmentHistoryCardProps) {
  const status = statusStyles[appointment.status] ?? statusStyles.completed;
  const isCancelled = appointment.status === "cancelled";

  return (
    <Card
      className={cn(
        "border-brand-warm-border transition-all duration-200",
        isCancelled && "opacity-70",
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: info */}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Scissors className="size-4 shrink-0 text-brand-rose-dark" />
              <h3 className="truncate text-sm font-semibold text-foreground">
                {appointment.treatmentType}
              </h3>
            </div>

            <p className="text-xs text-muted-foreground">
              {appointment.professionalName || "Profesional"}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5 shrink-0" />
                {format(appointment.date, "EEEE, d MMMM yyyy", { locale: es })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5 shrink-0" />
                {appointment.startTime} - {appointment.endTime}
              </span>
            </div>
          </div>

          {/* Right: status badge */}
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
              status.className,
            )}
          >
            {status.label}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
