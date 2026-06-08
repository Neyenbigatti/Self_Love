import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  role: text('role', { enum: ['patient', 'professional'] }).notNull(),
  avatar: text('avatar'),

  // Patient profile fields
  dateOfBirth: text('date_of_birth'),
  gender: text('gender'),
  address: text('address'),
  notes: text('notes'),

  // Professional-only fields
  title: text('title'),
  clinicName: text('clinic_name'),

  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ─── Appointments ─────────────────────────────────────────────────────────────

export const appointments = sqliteTable('appointments', {
  id: text('id').primaryKey(),
  patientId: text('patient_id')
    .references(() => users.id)
    .notNull(),
  professionalId: text('professional_id')
    .references(() => users.id)
    .notNull(),
  treatmentType: text('treatment_type').notNull(),
  treatmentTypeId: text('treatment_type_id'),
  date: text('date').notNull(),             // ISO 8601 date (YYYY-MM-DD)
  startTime: text('start_time').notNull(),   // HH:mm
  endTime: text('end_time').notNull(),       // HH:mm
  status: text('status', {
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
  }).notNull(),
  notes: text('notes'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;

// ─── Availability (Professional Schedule) ─────────────────────────────────────

export const availability = sqliteTable('availability', {
  id: text('id').primaryKey(),
  professionalId: text('professional_id')
    .references(() => users.id)
    .notNull(),

  // Regular weekly rule: dayOfWeek 0-6 (null if it's a specific-date exception)
  dayOfWeek: integer('day_of_week'),
  // Specific date override (e.g. holiday or extra day)
  specificDate: text('specific_date'),

  startTime: text('start_time').notNull(), // HH:mm
  endTime: text('end_time').notNull(),     // HH:mm

  isAvailable: integer('is_available', { mode: 'boolean' }).notNull(),
  type: text('type', {
    enum: ['regular', 'break', 'blocked'],
  })
    .notNull()
    .default('regular'),

  label: text('label'), // e.g. "Lunch", "Team Meeting"
});

export type Availability = typeof availability.$inferSelect;
export type NewAvailability = typeof availability.$inferInsert;

// ─── Treatment Types ──────────────────────────────────────────────────────────

export const treatmentTypes = sqliteTable('treatment_types', {
  id: text('id').primaryKey(),
  professionalId: text('professional_id')
    .references(() => users.id)
    .notNull(),
  name: text('name').notNull(),
  duration: integer('duration').notNull(), // minutes
  description: text('description'),
  price: integer('price'), // cents (optional for future use)
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  category: text('category'),
  sortOrder: integer('sort_order'),
}, (table) => ({
  uniqueNamePerProfessional: uniqueIndex('unique_prof_name').on(table.professionalId, table.name),
}));

export type TreatmentType = typeof treatmentTypes.$inferSelect;

// ─── Explorations ─────────────────────────────────────────────────────────────
// Physical exploration records for patients — lazy-created on first save.
// appointmentId is intentionally omitted per approved architecture.

export const explorations = sqliteTable('explorations', {
  id: text('id').primaryKey(),
  patientId: text('patient_id')
    .references(() => users.id)
    .notNull(),
  professionalId: text('professional_id')
    .references(() => users.id)
    .notNull(),
  skinEvaluation: text('skin_evaluation'), // JSON string
  facialAnalysis: text('facial_analysis'), // JSON string
  notes: text('notes'),
  date: text('date').notNull(), // ISO 8601 date (YYYY-MM-DD)
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Exploration = typeof explorations.$inferSelect;
export type NewExploration = typeof explorations.$inferInsert;

// ─── Exploration Photos ────────────────────────────────────────────────────────

export const explorationPhotos = sqliteTable('exploration_photos', {
  id: text('id').primaryKey(),
  explorationId: text('exploration_id')
    .references(() => explorations.id)
    .notNull(),
  url: text('url').notNull(),
  angle: text('angle', {
    enum: ['front', 'left', 'right', 'up', 'down'],
  }).notNull(),
  originalName: text('original_name'),
  mimeType: text('mime_type'),
  fileSize: integer('file_size'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type ExplorationPhoto = typeof explorationPhotos.$inferSelect;
export type NewExplorationPhoto = typeof explorationPhotos.$inferInsert;

// ─── Medical Histories ─────────────────────────────────────────────────────────
// Patient medical history stored as JSON text columns to match the UI shape.
// Follows the same pattern as explorations JSON columns.

export const medicalHistories = sqliteTable('medical_histories', {
  id: text('id').primaryKey(),
  patientId: text('patient_id')
    .references(() => users.id)
    .notNull()
    .unique(), // one medical history per patient
  allergies: text('allergies'), // JSON string[]
  medications: text('medications'), // JSON string[]
  conditions: text('conditions'), // JSON string[]
  previousTreatments: text('previous_treatments'), // JSON string[]
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type MedicalHistory = typeof medicalHistories.$inferSelect;
export type NewMedicalHistory = typeof medicalHistories.$inferInsert;
