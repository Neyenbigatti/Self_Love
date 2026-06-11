import { z } from 'zod';

// ─── Config field types ─────────────────────────────────────────────────────────

const fieldTypeEnum = z.enum([
  'text',
  'textarea',
  'boolean',
  'number',
  'date',
  'select',
  'multiselect',
]);

// ─── TemplateConfig schema ──────────────────────────────────────────────────────

export const templateConfigFieldSchema = z.object({
  key: z.string().min(1, 'Field key is required'),
  label: z.string().min(1, 'Field label is required'),
  type: fieldTypeEnum,
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
  sortOrder: z.number().int().min(0),
});

export const templateConfigSectionSchema = z.object({
  id: z.string().min(1, 'Section id is required'),
  title: z.string().min(1, 'Section title is required'),
  fields: z.array(templateConfigFieldSchema).min(1, 'Section must have at least one field'),
});

export const templateConfigSchema = z.object({
  sections: z
    .array(templateConfigSectionSchema)
    .min(1, 'Config must have at least one section'),
  widgets: z
    .object({
      facialDiagram: z.boolean().optional(),
      photoCapture: z.boolean().optional(),
    })
    .optional(),
});

// ─── Create ─────────────────────────────────────────────────────────────────────

export const createExplorationTemplateSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase kebab-case'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  config: templateConfigSchema,
  isActive: z.boolean().optional(),
});

// ─── Update ─────────────────────────────────────────────────────────────────────
// All fields optional — PATCH/PUT semantics.
// The caller restricts slug changes for system templates at the route level.

export const updateExplorationTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  config: templateConfigSchema.optional(),
  isActive: z.boolean().optional(),
});

// ─── Types ──────────────────────────────────────────────────────────────────────

export type TemplateConfig = z.infer<typeof templateConfigSchema>;
export type TemplateConfigSection = z.infer<typeof templateConfigSectionSchema>;
export type TemplateConfigField = z.infer<typeof templateConfigFieldSchema>;
