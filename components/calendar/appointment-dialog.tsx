'use client';

import { useState, useEffect } from 'react';
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

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  selectedDate?: Date;
  onSave: (appointment: Partial<Appointment>) => void;
  onDelete?: (id: string) => void;
}

interface TreatmentTypeOption {
  name: string;
  duration: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
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

  // ── Fetched data ──────────────────────────────────────────────────────────
  const [patients, setPatients] = useState<{ id: string; name: string; avatar?: string }[]>([]);
  const [treatmentTypes, setTreatmentTypes] = useState<TreatmentTypeOption[]>([]);

  // ── Form state ────────────────────────────────────────────────────────────
  const [date, setDate] = useState<Date>(new Date());
  const [patientId, setPatientId] = useState('');
  const [treatmentType, setTreatmentType] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Appointment['status']>('pending');

  // ── Sync form state when dialog opens with a different appointment ─────────
  useEffect(() => {
    setDate(appointment?.date || selectedDate || new Date());
    setPatientId(appointment?.patientId || '');
    setTreatmentType(appointment?.treatmentType || '');
    setStartTime(appointment?.startTime || '09:00');
    setEndTime(appointment?.endTime || '09:30');
    setNotes(appointment?.notes || '');
    setStatus(appointment?.status || 'pending');
  }, [appointment, selectedDate]);

  // ── Auto-calculate endTime when treatment or startTime changes ────────────
  useEffect(() => {
    const treatment = treatmentTypes.find((t) => t.name === treatmentType);
    if (treatment && startTime) {
      setEndTime(addMinutes(startTime, treatment.duration));
    }
  }, [treatmentType, startTime, treatmentTypes]);

  // ── Fetch patients and treatment types when dialog opens ──────────────────
  useEffect(() => {
    if (open) {
      fetch('/api/patients?search=a')
        .then((r) => r.json())
        .then((data) => setPatients(data.patients ?? []))
        .catch(() => setPatients([]));
      fetch('/api/treatment-types')
        .then((r) => r.json())
        .then((data) => setTreatmentTypes(data.treatmentTypes ?? []))
        .catch(() => setTreatmentTypes([]));
    }
  }, [open]);

  const handleSave = () => {
    const patient = patients.find(p => p.id === patientId);
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
      status,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {isEditing ? 'Editar Turno' : 'Nuevo Turno'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* Patient Selection */}
          <div className="grid gap-2">
            <Label htmlFor="patient" className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              Paciente
            </Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger id="patient">
                <SelectValue placeholder="Seleccionar paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
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
              Tratamiento
            </Label>
            <Select value={treatmentType} onValueChange={setTreatmentType}>
              <SelectTrigger id="treatment">
                <SelectValue placeholder="Seleccionar tratamiento" />
              </SelectTrigger>
              <SelectContent>
                {treatmentTypes.map((type) => (
                  <SelectItem key={type.name} value={type.name}>
                    {type.name} ({type.duration}min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="size-4 text-muted-foreground" />
              Fecha
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
                  {date ? format(date, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startTime" className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                Hora de Inicio
              </Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger id="startTime">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) =>
                    `${String(i).padStart(2, '0')}:00`
                  ).concat(
                    Array.from({ length: 24 }, (_, i) =>
                      `${String(i).padStart(2, '0')}:30`
                    )
                  ).sort().map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endTime">Hora de Fin</Label>
              <Input
                id="endTime"
                value={endTime}
                readOnly
                className="bg-muted/50 text-muted-foreground cursor-default"
              />
            </div>
          </div>

          {/* Status (only for editing) */}
          {isEditing && (
            <div className="grid gap-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Appointment['status'])}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agregar notas..."
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
              Eliminar
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!patientId || !treatmentType}
            >
              {isEditing ? 'Guardar Cambios' : 'Crear Turno'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
