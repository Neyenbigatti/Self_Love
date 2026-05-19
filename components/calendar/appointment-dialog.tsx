'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Clock, User, FileText, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Appointment } from '@/lib/types';
import { mockPatients, treatmentTypes, timeSlots } from '@/lib/mock-data';

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  selectedDate?: Date;
  onSave: (appointment: Partial<Appointment>) => void;
  onDelete?: (id: string) => void;
}

export function AppointmentDialog({
  open,
  onOpenChange,
  appointment,
  selectedDate,
  onSave,
  onDelete,
}: AppointmentDialogProps) {
  const isEditing = !!appointment;
  const [date, setDate] = useState<Date>(appointment?.date || selectedDate || new Date());
  const [patientId, setPatientId] = useState(appointment?.patientId || '');
  const [treatmentType, setTreatmentType] = useState(appointment?.treatmentType || '');
  const [startTime, setStartTime] = useState(appointment?.startTime || '09:00');
  const [endTime, setEndTime] = useState(appointment?.endTime || '09:30');
  const [notes, setNotes] = useState(appointment?.notes || '');
  const [status, setStatus] = useState(appointment?.status || 'pending');

  const handleSave = () => {
    const patient = mockPatients.find(p => p.id === patientId);
    onSave({
      id: appointment?.id,
      patientId,
      patientName: patient?.name || '',
      patientAvatar: patient?.avatar,
      treatmentType,
      date,
      startTime,
      endTime,
      notes,
      status: status as Appointment['status'],
      professionalId: '1',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {isEditing ? 'Edit Appointment' : 'New Appointment'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* Patient Selection */}
          <div className="grid gap-2">
            <Label htmlFor="patient" className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              Patient
            </Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger id="patient">
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {mockPatients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Treatment Type */}
          <div className="grid gap-2">
            <Label htmlFor="treatment" className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              Treatment
            </Label>
            <Select value={treatmentType} onValueChange={setTreatmentType}>
              <SelectTrigger id="treatment">
                <SelectValue placeholder="Select treatment type" />
              </SelectTrigger>
              <SelectContent>
                {treatmentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="size-4 text-muted-foreground" />
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {date ? format(date, "PPP", { locale: es }) : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startTime" className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                Start Time
              </Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger id="startTime">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endTime">End Time</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger id="endTime">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status (only for editing) */}
          {isEditing && (
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes..."
            />
          </div>
        </div>

        <div className="flex justify-between">
          {isEditing && onDelete ? (
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(appointment.id);
                onOpenChange(false);
              }}
            >
              Delete
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!patientId || !treatmentType}
            >
              {isEditing ? 'Save Changes' : 'Create Appointment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
