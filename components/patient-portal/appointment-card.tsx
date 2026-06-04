"use client";

import { format } from "date-fns";
import { Calendar, Clock, MessageCircle, Upload, MapPin, XCircle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/lib/types";

interface AppointmentCardProps {
  appointment: Appointment;
  variant?: "upcoming" | "history";
  onContactWhatsApp?: () => void;
  onSendPayment?: () => void;
  onCancel?: (id: string) => void;
}

const statusConfig = {
  confirmed: {
    label: "Confirmado",
    variant: "default" as const,
    className: "bg-brand-sage-light text-brand-sage-dark hover:bg-brand-sage-light",
  },
  pending: {
    label: "Pendiente de Pago",
    variant: "secondary" as const,
    className: "bg-brand-warm-amber text-brand-warm-amber-dark hover:bg-brand-warm-amber",
  },
  cancelled: {
    label: "Cancelado",
    variant: "secondary" as const,
    className: "bg-muted text-muted-foreground hover:bg-muted",
  },
  completed: {
    label: "Completado",
    variant: "secondary" as const,
    className: "bg-brand-sage-light text-brand-sage-dark hover:bg-brand-sage-light",
  },
};

export function AppointmentCard({
  appointment,
  variant = "upcoming",
  onContactWhatsApp,
  onSendPayment,
  onCancel,
}: AppointmentCardProps) {
  const status = statusConfig[appointment.status];
  const isPending = appointment.status === "pending";
  const isUpcoming = variant === "upcoming" && appointment.status !== "cancelled";
  const canCancel = isUpcoming && (appointment.status === "pending" || appointment.status === "confirmed");

  return (
    <Card className={cn(
      "border-brand-warm-border transition-all duration-200",
      appointment.status === "cancelled" && "opacity-60"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-foreground">
              {appointment.treatmentType}
            </h3>
            <p className="text-sm text-muted-foreground">
              {appointment.professionalName || 'Profesional'}
            </p>
          </div>
          <Badge className={cn("shrink-0 border-0", status.className)}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="grid gap-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-rose-light">
              <Calendar className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {format(appointment.date, "EEEE, MMMM d, yyyy")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-rose-light">
              <Clock className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {appointment.startTime} - {appointment.endTime}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-rose-light">
              <MapPin className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                SelfLove Clinic
              </p>
              <p className="text-xs text-muted-foreground">
                Calle Serrano 50, Madrid
              </p>
            </div>
          </div>
        </div>

        {appointment.notes && (
          <div className="mt-4 rounded-lg bg-secondary/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">Notas</p>
            <p className="mt-1 text-sm text-foreground">{appointment.notes}</p>
          </div>
        )}
      </CardContent>

      {isUpcoming && (
        <CardFooter className="flex flex-wrap gap-2 border-t border-brand-warm-border pt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={onContactWhatsApp}
          >
            <MessageCircle className="mr-2 size-4" />
            Contactar por WhatsApp
          </Button>
          
          {isPending && (
            <Button
              size="sm"
              className="flex-1 bg-brand-rose text-[#6B3B3B] hover:bg-brand-rose/90 sm:flex-none"
              onClick={onSendPayment}
            >
              <Upload className="mr-2 size-4" />
              Enviar Comprobante
            </Button>
          )}

          {canCancel && onCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <XCircle className="mr-2 size-4" />
                  Cancelar Turno
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar Turno</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Estás segura de que querés cancelar este turno?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Mantener Turno</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onCancel(appointment.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sí, Cancelar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
