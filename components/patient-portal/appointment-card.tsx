"use client";

import { format } from "date-fns";
import { Calendar, Clock, MessageCircle, Upload, MapPin } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/lib/types";

interface AppointmentCardProps {
  appointment: Appointment;
  variant?: "upcoming" | "history";
  onContactWhatsApp?: () => void;
  onSendPayment?: () => void;
}

const statusConfig = {
  confirmed: {
    label: "Confirmed",
    variant: "default" as const,
    className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  },
  pending: {
    label: "Pending Payment",
    variant: "secondary" as const,
    className: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  },
  cancelled: {
    label: "Cancelled",
    variant: "secondary" as const,
    className: "bg-muted text-muted-foreground hover:bg-muted",
  },
  completed: {
    label: "Completed",
    variant: "secondary" as const,
    className: "bg-secondary text-secondary-foreground hover:bg-secondary",
  },
};

export function AppointmentCard({
  appointment,
  variant = "upcoming",
  onContactWhatsApp,
  onSendPayment,
}: AppointmentCardProps) {
  const status = statusConfig[appointment.status];
  const isPending = appointment.status === "pending";
  const isUpcoming = variant === "upcoming" && appointment.status !== "cancelled";

  return (
    <Card className={cn(
      "transition-all duration-200",
      appointment.status === "cancelled" && "opacity-60"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-foreground">
              {appointment.treatmentType}
            </h3>
            <p className="text-sm text-muted-foreground">
              Dr. Elena Vázquez
            </p>
          </div>
          <Badge className={cn("shrink-0", status.className)}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="grid gap-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex size-8 items-center justify-center rounded-lg bg-secondary">
              <Calendar className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {format(appointment.date, "EEEE, MMMM d, yyyy")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="flex size-8 items-center justify-center rounded-lg bg-secondary">
              <Clock className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {appointment.startTime} - {appointment.endTime}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="flex size-8 items-center justify-center rounded-lg bg-secondary">
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
            <p className="text-xs font-medium text-muted-foreground">Notes</p>
            <p className="mt-1 text-sm text-foreground">{appointment.notes}</p>
          </div>
        )}
      </CardContent>

      {isUpcoming && (
        <CardFooter className="flex flex-wrap gap-2 border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={onContactWhatsApp}
          >
            <MessageCircle className="mr-2 size-4" />
            Contact via WhatsApp
          </Button>
          
          {isPending && (
            <Button
              size="sm"
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 sm:flex-none"
              onClick={onSendPayment}
            >
              <Upload className="mr-2 size-4" />
              Send Payment Proof
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
