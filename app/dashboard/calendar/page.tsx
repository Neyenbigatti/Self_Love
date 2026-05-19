'use client';

import { useState } from 'react';
import { addWeeks, subWeeks } from 'date-fns';
import { WeekView } from '@/components/calendar/week-view';
import { MiniCalendar } from '@/components/calendar/mini-calendar';
import { AppointmentDialog } from '@/components/calendar/appointment-dialog';
import { Appointment } from '@/lib/types';
import { mockAppointments } from '@/lib/mock-data';

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

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

  const handleSaveAppointment = (data: Partial<Appointment>) => {
    if (data.id) {
      // Update existing
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === data.id ? { ...apt, ...data } as Appointment : apt))
      );
    } else {
      // Create new
      const newAppointment: Appointment = {
        ...data,
        id: String(Date.now()),
      } as Appointment;
      setAppointments((prev) => [...prev, newAppointment]);
    }
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((apt) => apt.id !== id));
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
