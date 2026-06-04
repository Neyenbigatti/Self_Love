import { z } from 'zod';
import { dateStringSchema, timeStringSchema, uuidSchema } from './common';
import { addDays, isBefore, isAfter, startOfDay } from 'date-fns';
import { BOOKING_WINDOW_DAYS } from '@/lib/constants';

export const createAppointmentSchema = z
  .object({
    patientId: uuidSchema,
    treatmentType: z.string().min(1, 'Treatment type is required'),
    date: dateStringSchema,
    startTime: timeStringSchema,
    endTime: timeStringSchema,
    notes: z.string().optional(),
  })
  .refine(
    (data) => data.endTime > data.startTime,
    { message: 'endTime must be after startTime', path: ['endTime'] },
  )
  .refine(
    (data) => {
      const date = new Date(data.date + 'T12:00:00');
      const today = startOfDay(new Date());
      return !isBefore(date, today);
    },
    { message: 'La fecha debe ser hoy o posterior', path: ['date'] },
  )
  .refine(
    (data) => {
      const date = new Date(data.date + 'T12:00:00');
      const maxDate = addDays(startOfDay(new Date()), BOOKING_WINDOW_DAYS);
      return !isAfter(date, maxDate);
    },
    { message: `Solo se puede reservar hasta ${BOOKING_WINDOW_DAYS} días antes`, path: ['date'] },
  );

export const updateAppointmentSchema = z
  .object({
    status: z
      .enum(['pending', 'confirmed', 'cancelled', 'completed'])
      .optional(),
    treatmentType: z.string().min(1).optional(),
    date: dateStringSchema.optional(),
    startTime: timeStringSchema.optional(),
    endTime: timeStringSchema.optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.date) return true;
      const date = new Date(data.date + 'T12:00:00');
      const today = startOfDay(new Date());
      return !isBefore(date, today);
    },
    { message: 'La fecha debe ser hoy o posterior', path: ['date'] },
  )
  .refine(
    (data) => {
      if (!data.date) return true;
      const date = new Date(data.date + 'T12:00:00');
      const maxDate = addDays(startOfDay(new Date()), BOOKING_WINDOW_DAYS);
      return !isAfter(date, maxDate);
    },
    { message: `Solo se puede reservar hasta ${BOOKING_WINDOW_DAYS} días antes`, path: ['date'] },
  );

export const queryAppointmentsSchema = z.object({
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
  professionalId: z.string().optional(),
  status: z.string().optional(),
});
