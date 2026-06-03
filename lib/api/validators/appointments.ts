import { z } from 'zod';
import { dateStringSchema, timeStringSchema, uuidSchema } from './common';

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
  );

export const updateAppointmentSchema = z.object({
  status: z
    .enum(['pending', 'confirmed', 'cancelled', 'completed'])
    .optional(),
  treatmentType: z.string().min(1).optional(),
  date: dateStringSchema.optional(),
  startTime: timeStringSchema.optional(),
  endTime: timeStringSchema.optional(),
  notes: z.string().optional(),
});

export const queryAppointmentsSchema = z.object({
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
  professionalId: z.string().optional(),
  status: z.string().optional(),
});
