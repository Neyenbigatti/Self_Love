import { z } from 'zod';

export const createTreatmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  duration: z.number().int().positive('Duration must be positive'),
  description: z.string().optional(),
  price: z.number().int().nonnegative().optional(),
});

export const updateTreatmentSchema = z.object({
  name: z.string().min(1).optional(),
  duration: z.number().int().positive().optional(),
  description: z.string().optional(),
  price: z.number().int().nonnegative().optional(),
});
