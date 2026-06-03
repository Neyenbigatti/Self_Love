import { z } from 'zod';
import { dateStringSchema, timeStringSchema } from './common';

export const createAvailabilitySchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    specificDate: dateStringSchema.optional(),
    startTime: timeStringSchema,
    endTime: timeStringSchema,
    type: z.enum(['regular', 'break', 'blocked']),
    label: z.string().optional(),
    isAvailable: z.boolean().optional(),
  })
  .refine(
    (data) => data.dayOfWeek !== undefined || data.specificDate !== undefined,
    {
      message: 'Either dayOfWeek or specificDate is required',
      path: ['dayOfWeek'],
    },
  );

export const updateAvailabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  specificDate: dateStringSchema.optional(),
  startTime: timeStringSchema.optional(),
  endTime: timeStringSchema.optional(),
  type: z.enum(['regular', 'break', 'blocked']).optional(),
  label: z.string().optional(),
  isAvailable: z.boolean().optional(),
});
