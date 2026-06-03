import { z } from 'zod';

/**
 * Schema for updating a patient's medical history.
 * All fields are optional (PATCH semantics — only provided fields are updated).
 * Each field is a JSON array of strings.
 */
export const updateMedicalHistorySchema = z.object({
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  previousTreatments: z.array(z.string()).optional(),
});

export type UpdateMedicalHistoryInput = z.infer<typeof updateMedicalHistorySchema>;
