'use client';

import { useState } from 'react';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Appointment } from '@/lib/types';

interface WeekViewProps {
  appointments: Appointment[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onWeekChange: (direction: 'prev' | 'next') => void;
  onNewAppointment: () => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

export function WeekView({
  appointments,
  selectedDate,
  onDateSelect,
  onWeekChange,
  onNewAppointment,
  onAppointmentClick,
}: WeekViewProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter((apt) => isSameDay(apt.date, date));
  };

  const getAppointmentPosition = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startHour = 8;
    const hourHeight = 60;
    return ((hours - startHour) * hourHeight) + (minutes / 60 * hourHeight);
  };

  const getAppointmentHeight = (startTime: string, endTime: string) => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const duration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
    return (duration / 60) * 60;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-accent/15 border-accent text-accent';
      case 'pending':
        return 'bg-amber-50 border-amber-400 text-amber-700';
      case 'cancelled':
        return 'bg-red-50 border-red-300 text-red-600 line-through opacity-60';
      case 'completed':
        return 'bg-muted border-muted-foreground/30 text-muted-foreground';
      default:
        return 'bg-secondary border-border';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onWeekChange('prev')}
            className="size-9"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onWeekChange('next')}
            className="size-9"
          >
            <ChevronRight />
          </Button>
          <h2 className="text-lg font-semibold text-foreground">
            {format(weekStart, "MMMM yyyy", { locale: es })}
          </h2>
        </div>
        <Button onClick={onNewAppointment} className="gap-2">
          <Plus data-icon="inline-start" />
          New Appointment
        </Button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-8 border-b border-border">
        <div className="w-16" />
        {weekDays.map((day) => (
          <button
            key={day.toISOString()}
            onClick={() => onDateSelect(day)}
            className={cn(
              "py-3 text-center transition-colors hover:bg-muted/50",
              isSameDay(day, selectedDate) && "bg-muted",
              isToday(day) && "font-semibold"
            )}
          >
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              {format(day, 'EEE', { locale: es })}
            </div>
            <div className={cn(
              "mt-1 text-xl",
              isToday(day) && "text-accent font-bold"
            )}>
              {format(day, 'd')}
            </div>
          </button>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-8 min-h-[720px]">
          {/* Time labels */}
          <div className="border-r border-border">
            {timeSlots.map((time) => (
              <div
                key={time}
                className="h-[60px] pr-2 text-right text-xs text-muted-foreground"
              >
                {time}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const dayAppointments = getAppointmentsForDay(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "relative border-r border-border",
                  isSameDay(day, selectedDate) && "bg-muted/30"
                )}
              >
                {/* Hour lines */}
                {timeSlots.map((time) => (
                  <div
                    key={time}
                    className="h-[60px] border-b border-border/50"
                  />
                ))}

                {/* Appointments */}
                {dayAppointments.map((apt) => {
                  const aptHeight = getAppointmentHeight(apt.startTime, apt.endTime);
                  const isShort = aptHeight < 48;

                  return (
                    <button
                      key={apt.id}
                      onClick={() => onAppointmentClick(apt)}
                      title={`${apt.patientName} — ${apt.treatmentType} (${apt.startTime})`}
                      className={cn(
                        "absolute left-1 right-1 rounded-md border-l-2 text-left text-xs overflow-hidden transition-all hover:shadow-md",
                        getStatusColor(apt.status),
                        isShort ? "px-1.5 py-0.5" : "px-2 py-1"
                      )}
                      style={{
                        top: `${getAppointmentPosition(apt.startTime)}px`,
                        height: `${Math.max(aptHeight, 24)}px`,
                        minHeight: '24px',
                      }}
                    >
                      <div className="font-medium truncate leading-tight">{apt.patientName}</div>
                      {!isShort && (
                        <div className="truncate opacity-80 leading-tight">{apt.treatmentType}</div>
                      )}
                      <div className="opacity-70 leading-tight">{apt.startTime}</div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
