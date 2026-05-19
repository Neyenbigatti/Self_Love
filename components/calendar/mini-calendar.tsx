'use client';

import { format, isSameDay, isToday, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Appointment } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date | undefined) => void;
  appointments: Appointment[];
}

export function MiniCalendar({ selectedDate, onDateSelect, appointments }: MiniCalendarProps) {
  const selectedDayAppointments = appointments.filter((apt) =>
    isSameDay(apt.date, selectedDate)
  );

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const hasAppointments = (date: Date) => {
    return appointments.some((apt) => isSameDay(apt.date, date));
  };

  return (
    <div className="flex flex-col gap-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        className="rounded-lg border border-border bg-card p-3"
        modifiers={{
          hasAppointments: (date) => hasAppointments(date),
        }}
        modifiersClassNames={{
          hasAppointments: 'font-bold text-accent',
        }}
      />

      {/* Selected day appointments */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-semibold text-foreground mb-3">
          {isToday(selectedDate)
            ? 'Today'
            : format(selectedDate, "EEEE, d MMMM", { locale: es })}
        </h3>
        
        {selectedDayAppointments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No appointments scheduled</p>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="flex flex-col gap-3">
              {selectedDayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <Avatar className="size-8">
                    <AvatarImage src={apt.patientAvatar} alt={apt.patientName} />
                    <AvatarFallback className="text-xs">
                      {apt.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{apt.patientName}</p>
                      <Badge variant={getStatusBadgeVariant(apt.status)} className="text-[10px] px-1.5">
                        {apt.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{apt.treatmentType}</p>
                    <p className="text-xs text-muted-foreground">
                      {apt.startTime} - {apt.endTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
