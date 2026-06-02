import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  role: text('role', { enum: ['patient', 'professional'] }).notNull(),
  avatar: text('avatar'),

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
});

export type TreatmentType = typeof treatmentTypes.$inferSelect;
