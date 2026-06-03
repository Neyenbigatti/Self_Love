'use client';

import { useState, useEffect } from 'react';
import { addWeeks, subWeeks, parseISO, format } from 'date-fns';
import { toast } from 'sonner';
import { WeekView } from '@/components/calendar/week-view';
import { MiniCalendar } from '@/components/calendar/mini-calendar';
import { AppointmentDialog } from '@/components/calendar/appointment-dialog';
import { Appointment } from '@/lib/types';

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // ── Fetch appointments from API on mount ──────────────────────────────────
  useEffect(() => {
    fetch('/api/appointments')
      .then((r) => r.json())
      .then((data) => {
        const transformed = (data.appointments ?? []).map(
          (apt: Record<string, unknown>) => ({
            ...apt,
            date: parseISO(apt.date as string),
          }),
        ) as Appointment[];
        setAppointments(transformed);
      })
      .catch((err) => {
        console.error('Failed to fetch appointments:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleWeekChange = (direction: 'prev' | 'next') => {
    setSelectedDate((prev) =>
      direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1)
    );
  };

  const handleNewAppointment = () => {
    setSelectedAppointment(null);
    setDialogOpen(true);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDialogOpen(true);
  };

  const handleSaveAppointment = async (data: Partial<Appointment>) => {
    try {
      const body: Record<string, unknown> = {
        ...data,
        date: data.date ? format(data.date, 'yyyy-MM-dd') : undefined,
      };
      delete body.id;

      if (data.id) {
        const res = await fetch(`/api/appointments/${data.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json();
          console.error('Failed to update appointment:', err);
          toast.error(err?.error || 'Failed to update appointment');
          return;
        }
      } else {
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json();
          console.error('Failed to create appointment:', err);
          toast.error(err?.error || 'Failed to create appointment');
          return;
        }
      }

      // Re-fetch appointments after save
      const res = await fetch('/api/appointments');
      const json = await res.json();
      const transformed = (json.appointments ?? []).map(
        (apt: Record<string, unknown>) => ({
          ...apt,
          date: parseISO(apt.date as string),
        }),
      ) as Appointment[];
      setAppointments(transformed);
      toast.success(data.id ? 'Appointment updated' : 'Appointment created');
    } catch (err) {
      console.error('Failed to save appointment:', err);
      toast.error('Failed to save appointment');
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        console.error('Failed to delete appointment:', err);
        toast.error(err?.error || 'Failed to delete appointment');
        return;
      }
      setAppointments((prev) => prev.filter((apt) => apt.id !== id));
      toast.success('Appointment deleted');
    } catch (err) {
      console.error('Failed to delete appointment:', err);
      toast.error('Failed to delete appointment');
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Main Calendar */}
      <div className="flex-1 bg-card rounded-xl border border-border p-4 overflow-hidden">
        <WeekView
          appointments={appointments}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onWeekChange={handleWeekChange}
          onNewAppointment={handleNewAppointment}
          onAppointmentClick={handleAppointmentClick}
        />
      </div>

      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 hidden lg:block">
        <MiniCalendar
          selectedDate={selectedDate}
          onDateSelect={(date) => date && setSelectedDate(date)}
          appointments={appointments}
        />
      </div>

      {/* Appointment Dialog */}
      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointment={selectedAppointment}
        selectedDate={selectedDate}
        onSave={handleSaveAppointment}
        onDelete={handleDeleteAppointment}
      />
    </div>
  );
}
