import { z } from 'zod';
import { dateStringSchema } from './common';

// ─── Photo sub-schema ──────────────────────────────────────────────────────────
// Photos can be included in create/update payloads (no real upload yet).

export const photoSchema = z.object({
  angle: z.enum(['front', 'left', 'right', 'up', 'down']),
  url: z.string().min(1, 'Photo URL is required'),
  originalName: z.string().optional(),
  mimeType: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
});

// ─── Create ────────────────────────────────────────────────────────────────────
// Supports both legacy (skinEvaluation/facialAnalysis) and v2 (templateId/responses) paths.
// If templateId is provided, store in responses and null out legacy columns.

export const createExplorationSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  date: dateStringSchema,
  skinEvaluation: z.record(z.unknown()).optional(),
  facialAnalysis: z.record(z.unknown()).optional(),
  templateId: z.string().optional(),
  responses: z.record(z.unknown()).optional(),
  notes: z.string().optional(),
  photos: z.array(photoSchema).optional(),
});

// ─── Update ────────────────────────────────────────────────────────────────────
// All fields optional — PATCH semantics.

export const updateExplorationSchema = z.object({
  date: dateStringSchema.optional(),
  skinEvaluation: z.record(z.unknown()).optional(),
  facialAnalysis: z.record(z.unknown()).optional(),
  templateId: z.string().optional(),
  responses: z.record(z.unknown()).optional(),
  notes: z.string().optional(),
  photos: z.array(photoSchema).optional(),
});
