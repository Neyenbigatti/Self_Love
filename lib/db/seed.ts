/**
 * Seed script — populates the database with initial data for development.
 *
 * Usage:
 *   npx tsx lib/db/seed.ts
 *
 * Creates:
 *   - 1 professional (Dra. Lucía Belén Uncal)
 *   - 5 patients (matching existing mock-data.ts)
 *   - Treatment types (aesthetic procedures)
 *   - Weekly availability schedule
 *   - Sample appointments for the current week
 */

import { randomUUID } from 'node:crypto';
import { hashSync } from 'bcryptjs';
import { db } from './client';
import { users, appointments, availability, treatmentTypes } from './schema';
import {
  addDays,
  startOfWeek,
  setHours,
  setMinutes,
} from 'date-fns';

const PROFESSIONAL_ID = 'prof-1';
const PASSWORD = 'password123';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today() {
  return new Date();
}

function weekStart() {
  return startOfWeek(today(), { weekStartsOn: 1 });
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding database…');

  const passwordHash = hashSync(PASSWORD, 10);

  // ── Professional ────────────────────────────────────────────────────────
  await db.insert(users).values({
    id: PROFESSIONAL_ID,
    email: 'dra.uncal@selflove.com',
    passwordHash,
    name: 'Dra. Lucía Belén Uncal',
    phone: '+34 612 000 000',
    role: 'professional',
    title: 'Técnica Cosmetóloga',
    clinicName: 'SelfLove Clinic',
  });
  console.log('  ✅ Professional created');

  // ── Patients ────────────────────────────────────────────────────────────
  const patientData = [
    {
      name: 'María García López',
      email: 'maria.garcia@email.com',
      phone: '+34 612 345 678',
      dateOfBirth: '1992-04-15',
      gender: 'female',
      address: 'Calle Mayor 123, 28013 Madrid',
      notes: 'Alérgica a la penicilina. Prefiere citas por la mañana.',
    },
    {
      name: 'Carlos Rodríguez Fernández',
      email: 'carlos.rodriguez@email.com',
      phone: '+34 623 456 789',
      dateOfBirth: '1985-09-22',
      gender: 'male',
      address: 'Av. Diagonal 456, 08006 Barcelona',
      notes: 'Paciente recurrente. Tratamientos cada 3 meses.',
    },
    {
      name: 'Ana Martínez Sánchez',
      email: 'ana.martinez@email.com',
      phone: '+34 634 567 890',
      dateOfBirth: '1998-12-03',
      gender: 'female',
      address: 'Gran Vía 78, 2ºB, 48001 Bilbao',
      notes: 'Primeriza en tratamientos estéticos. Piel sensible.',
    },
    {
      name: 'Pedro Gómez Ruiz',
      email: 'pedro.gomez@email.com',
      phone: '+34 645 678 901',
      dateOfBirth: '1979-07-18',
      gender: 'male',
      address: 'Plaza del Ayuntamiento 5, 46002 Valencia',
      notes: 'Prefiere comunicación por WhatsApp. Disponible solo fines de semana.',
    },
    {
      name: 'Laura Hernández Díaz',
      email: 'laura.hernandez@email.com',
      phone: '+34 656 789 012',
      dateOfBirth: '2001-03-30',
      gender: 'female',
      address: 'Calle San Fernando 34, 41004 Sevilla',
      notes: 'Estudiante universitaria. Presupuesto ajustado.',
    },
  ];

  const patientIds: string[] = [];
  for (const p of patientData) {
    const id = randomUUID();
    patientIds.push(id);
    await db.insert(users).values({
      id,
      email: p.email,
      passwordHash,
      name: p.name,
      phone: p.phone,
      role: 'patient',
      dateOfBirth: p.dateOfBirth,
      gender: p.gender,
      address: p.address,
      notes: p.notes,
    });
  }
  console.log(`  ✅ ${patientData.length} patients created`);

  // ── Treatment Types ─────────────────────────────────────────────────────
  const treatments = [
    { name: 'Botox', duration: 30, description: 'Aplicación de toxina botulínica', price: 25000 },
    { name: 'Dermal Fillers', duration: 60, description: 'Rellenos dérmicos con ácido hialurónico', price: 35000 },
    { name: 'Chemical Peel', duration: 45, description: 'Peeling químico facial', price: 12000 },
    { name: 'Microneedling', duration: 60, description: 'Microagujas con principios activos', price: 15000 },
    { name: 'Laser Treatment', duration: 45, description: 'Tratamiento láser facial', price: 20000 },
    { name: 'PRP Therapy', duration: 60, description: 'Plasma rico en plaquetas', price: 30000 },
    { name: 'Consultation', duration: 30, description: 'Consulta inicial o valoración', price: 0 },
    { name: 'Follow-up', duration: 20, description: 'Revisión post-tratamiento', price: 0 },
  ];

  for (const t of treatments) {
    await db.insert(treatmentTypes).values({
      id: randomUUID(),
      professionalId: PROFESSIONAL_ID,
      ...t,
    });
  }
  console.log(`  ✅ ${treatments.length} treatment types created`);

  // ── Availability (Weekly Schedule) ──────────────────────────────────────
  // Monday to Friday: 08:00–19:00, break 12:00–13:00
  // Saturday: 09:00–13:00
  // Sunday: closed

  const weekSchedule: { day: number; start: string; end: string; type: 'regular' | 'break' }[] = [
    { day: 1, start: '08:00', end: '12:00', type: 'regular' },  // Mon AM
    { day: 1, start: '12:00', end: '13:00', type: 'break' },    // Mon lunch
    { day: 1, start: '13:00', end: '19:00', type: 'regular' },  // Mon PM
    { day: 2, start: '08:00', end: '12:00', type: 'regular' },  // Tue AM
    { day: 2, start: '12:00', end: '13:00', type: 'break' },    // Tue lunch
    { day: 2, start: '13:00', end: '19:00', type: 'regular' },  // Tue PM
    { day: 3, start: '08:00', end: '12:00', type: 'regular' },  // Wed AM
    { day: 3, start: '12:00', end: '13:00', type: 'break' },    // Wed lunch
    { day: 3, start: '13:00', end: '19:00', type: 'regular' },  // Wed PM
    { day: 4, start: '08:00', end: '12:00', type: 'regular' },  // Thu AM
    { day: 4, start: '12:00', end: '13:00', type: 'break' },    // Thu lunch
    { day: 4, start: '13:00', end: '19:00', type: 'regular' },  // Thu PM
    { day: 5, start: '08:00', end: '12:00', type: 'regular' },  // Fri AM
    { day: 5, start: '12:00', end: '13:00', type: 'break' },    // Fri lunch
    { day: 5, start: '13:00', end: '19:00', type: 'regular' },  // Fri PM
    { day: 6, start: '09:00', end: '14:00', type: 'regular' },  // Sat
  ];

  for (const s of weekSchedule) {
    await db.insert(availability).values({
      id: randomUUID(),
      professionalId: PROFESSIONAL_ID,
      dayOfWeek: s.day,
      startTime: s.start,
      endTime: s.end,
      isAvailable: s.type === 'regular',
      type: s.type,
      label: s.type === 'break' ? 'Almuerzo' : null,
    });
  }
  console.log('  ✅ Availability schedule created');

  // ── Sample Appointments ────────────────────────────────────────────────
  const ws = weekStart();

  const sampleAppointments = [
    {
      patientIdx: 0,
      dayOffset: 0,
      start: '09:00',
      end: '09:30',
      treatment: 'Botox',
      status: 'confirmed' as const,
    },
    {
      patientIdx: 1,
      dayOffset: 0,
      start: '10:30',
      end: '11:30',
      treatment: 'Dermal Fillers',
      status: 'confirmed' as const,
    },
    {
      patientIdx: 2,
      dayOffset: 1, // Tuesday
      start: '11:00',
      end: '12:00',
      treatment: 'Chemical Peel',
      status: 'pending' as const,
    },
    {
      patientIdx: 3,
      dayOffset: 1,
      start: '15:00',
      end: '15:30',
      treatment: 'Consultation',
      status: 'confirmed' as const,
    },
    {
      patientIdx: 4,
      dayOffset: 2, // Wednesday
      start: '09:30',
      end: '10:30',
      treatment: 'Microneedling',
      status: 'confirmed' as const,
    },
    {
      patientIdx: 0,
      dayOffset: 3, // Thursday
      start: '14:00',
      end: '14:30',
      treatment: 'Follow-up',
      status: 'pending' as const,
    },
    {
      patientIdx: 1,
      dayOffset: 4, // Friday
      start: '10:00',
      end: '11:00',
      treatment: 'Laser Treatment',
      status: 'confirmed' as const,
    },
    {
      patientIdx: 2,
      dayOffset: 4,
      start: '16:00',
      end: '17:00',
      treatment: 'PRP Therapy',
      status: 'cancelled' as const,
    },
  ];

  for (const apt of sampleAppointments) {
    const appointmentDate = addDays(ws, apt.dayOffset);

    await db.insert(appointments).values({
      id: randomUUID(),
      patientId: patientIds[apt.patientIdx],
      professionalId: PROFESSIONAL_ID,
      treatmentType: apt.treatment,
      date: formatDate(appointmentDate),
      startTime: apt.start,
      endTime: apt.end,
      status: apt.status,
    });
  }
  console.log(`  ✅ ${sampleAppointments.length} sample appointments created`);
  console.log('🌱 Seed complete!');
  console.log(`\n📧 Login credentials:`);
  console.log(`   Professional: dra.uncal@selflove.com / ${PASSWORD}`);
  console.log(`   Patient:      maria.garcia@email.com / ${PASSWORD}`);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
