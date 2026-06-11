import { z } from 'zod';
import { dateStringSchema } from './common';

// ─── Create ────────────────────────────────────────────────────────────────────

export const createClinicalNoteSchema = z.object({
  date: dateStringSchema,
  content: z.string().min(1, 'Content is required'),
});

// ─── Update ─────────────────────────────────────────────────────────────────────
// All fields optional — PATCH semantics.

export const updateClinicalNoteSchema = z.object({
  date: dateStringSchema.optional(),
  content: z.string().min(1, 'Content is required').optional(),
});
