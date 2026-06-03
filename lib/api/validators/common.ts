import { z } from 'zod';
import { NextResponse } from 'next/server';
import { badRequest } from '../errors';

// ─── Shared schemas ────────────────────────────────────────────────────────────

export const dateStringSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Formato YYYY-MM-DD',
);

export const timeStringSchema = z.string().regex(
  /^\d{2}:\d{2}$/,
  'Formato HH:mm',
);

export const uuidSchema = z.string().min(1, 'Requerido');

// ─── Validate wrapper ──────────────────────────────────────────────────────────

type ValidateError = { response: NextResponse };
type ValidateSuccess<T> = { data: T };
type ValidateResult<T> = ValidateSuccess<T> | ValidateError;

/**
 * Safely parse `data` against `schema`.
 *
 * Usage:
 *   const parsed = validate(createAppointmentSchema, body);
 *   if ('response' in parsed) return parsed.response; // 400
 *   const { data } = parsed; // typed
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): ValidateResult<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const messages = result.error.issues
      .map((issue) => issue.message)
      .join(', ');
    return { response: badRequest(messages) };
  }

  return { data: result.data };
}
