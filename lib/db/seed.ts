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
import { users, appointments, availability, treatmentTypes, explorations, explorationPhotos, medicalHistories } from './schema';
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

  // ── Completed Appointments (past dates for Treatment History) ────────────────
  const completedAppts = [
    { patientIdx: 0, dayOffset: -21, start: '09:00', end: '09:30', treatment: 'Botox' },
    { patientIdx: 0, dayOffset: -7, start: '10:00', end: '10:20', treatment: 'Follow-up' },
    { patientIdx: 1, dayOffset: -14, start: '10:30', end: '11:30', treatment: 'Dermal Fillers' },
    { patientIdx: 3, dayOffset: -21, start: '15:00', end: '15:30', treatment: 'Consultation' },
    { patientIdx: 4, dayOffset: -14, start: '09:30', end: '10:30', treatment: 'Microneedling' },
    { patientIdx: 4, dayOffset: -7, start: '14:00', end: '14:20', treatment: 'Follow-up' },
  ];

  for (const apt of completedAppts) {
    const appointmentDate = addDays(ws, apt.dayOffset);
    await db.insert(appointments).values({
      id: randomUUID(),
      patientId: patientIds[apt.patientIdx],
      professionalId: PROFESSIONAL_ID,
      treatmentType: apt.treatment,
      date: formatDate(appointmentDate),
      startTime: apt.start,
      endTime: apt.end,
      status: 'completed',
    });
  }
  console.log(`  ✅ ${completedAppts.length} completed appointments created`);

  // ── Medical Histories ────────────────────────────────────────────────────────
  const medicalSeedData = [
    {
      patientIdx: 0, // María García
      allergies: ['Penicilina', 'Polen'],
      medications: ['Vitamina D 1000 UI/día', 'Anticonceptivos orales'],
      conditions: ['Rinitis alérgica estacional', 'Hipotiroidismo subclínico'],
      previousTreatments: ['Ácido hialurónico - labios (2024)', 'Botox frontal (2025)'],
    },
    {
      patientIdx: 1, // Laura Hernández
      allergies: ['Látex', 'Ibuprofeno'],
      medications: [],
      conditions: ['Acné quístico recurrente'],
      previousTreatments: ['Peeling químico (2024)', 'Láser CO2 fraccionado (2025)'],
    },
    {
      patientIdx: 2, // Carmen Rodríguez
      allergies: [],
      medications: ['Losartán 50 mg/día', 'Metformina 850 mg/día'],
      conditions: ['Hipertensión arterial', 'Diabetes tipo 2'],
      previousTreatments: ['Botox frontal y patas de gallo (2025)'],
    },
    {
      patientIdx: 3, // Carlos Ruiz
      allergies: ['Sulfamidas'],
      medications: ['Omeprazol 20 mg/día'],
      conditions: ['Reflujo gastroesofágico'],
      previousTreatments: [],
    },
    {
      patientIdx: 4, // Ana Martínez
      allergies: [],
      medications: [],
      conditions: ['Fototipo cutáneo II - sensibilidad solar alta'],
      previousTreatments: ['Limpieza facial profunda (2025)'],
    },
  ];

  for (const m of medicalSeedData) {
    await db.insert(medicalHistories).values({
      id: randomUUID(),
      patientId: patientIds[m.patientIdx],
      allergies: JSON.stringify(m.allergies),
      medications: JSON.stringify(m.medications),
      conditions: JSON.stringify(m.conditions),
      previousTreatments: JSON.stringify(m.previousTreatments),
    });
  }
  console.log(`  ✅ ${medicalSeedData.length} medical histories created`);

  // ── Sample Explorations ──────────────────────────────────────────────────
  const explorationSeedData = [
    {
      patientIdx: 0, // María García López (34yo, combination, pigmentation)
      date: '2026-05-28',
      skinEvaluation: {
        skinType: 'III',
        skinCondition: 'Combination',
        concerns: ['pigmentation', 'dullness', 'dark-circles'],
        elasticity: 'good',
        hydrationLevel: 45,
        oilLevel: 55,
        sensitivityLevel: 'mild',
        notes: 'Paciente presenta hiperpigmentación en zona malar bilateral. Dullness generalizada. Se recomienda peeling químico suave y protector solar.',
      },
      facialAnalysis: {
        forehead: { condition: 'normal', notes: 'Sin particularidades', recommendedTreatments: [] },
        glabella: { condition: 'mild', notes: 'Líneas de expresión verticales leves', recommendedTreatments: ['Botox'] },
        periorbital: { condition: 'mild', notes: 'Patas de gallo incipientes', recommendedTreatments: ['Botox'] },
        cheeks: { condition: 'normal', notes: 'Hiperpigmentación leve con melasma', recommendedTreatments: ['Chemical Peel'] },
        nasolabialFolds: { condition: 'mild', notes: 'Surco nasogeniano leve', recommendedTreatments: ['Dermal Fillers'] },
        lips: { condition: 'normal', notes: 'Volumen y forma adecuados', recommendedTreatments: [] },
        chin: { condition: 'normal', notes: 'Sin alteraciones', recommendedTreatments: [] },
        jawline: { condition: 'normal', notes: 'Definición adecuada', recommendedTreatments: [] },
        neck: { condition: 'normal', notes: 'Sin particularidades', recommendedTreatments: [] },
      },
      notes: 'Paciente solicita tratamiento para mejorar luminosidad. Próximo paso: peeling químico + rutina de cuidado en casa con vitamina C.',
      photos: [
        { angle: 'front', originalName: 'maria_front.jpg', mimeType: 'image/jpeg', fileSize: 245760 },
        { angle: 'left', originalName: 'maria_left.jpg', mimeType: 'image/jpeg', fileSize: 212992 },
        { angle: 'right', originalName: 'maria_right.jpg', mimeType: 'image/jpeg', fileSize: 221184 },
      ],
    },
    {
      patientIdx: 1, // Carlos Rodríguez Fernández (41yo, oily, acne scarring)
      date: '2026-05-25',
      skinEvaluation: {
        skinType: 'IV',
        skinCondition: 'Oily',
        concerns: ['acne', 'scarring', 'pores', 'texture'],
        elasticity: 'fair',
        hydrationLevel: 35,
        oilLevel: 80,
        sensitivityLevel: 'none',
        notes: 'Piel grasa con poros dilatados en zona T. Cicatrices de acné en mejillas. Responde bien a tratamientos con ácido salicílico.',
      },
      facialAnalysis: {
        forehead: { condition: 'mild', notes: 'Poros dilatados, comedones cerrados', recommendedTreatments: ['Chemical Peel'] },
        glabella: { condition: 'normal', notes: 'Sin particularidades', recommendedTreatments: [] },
        periorbital: { condition: 'normal', notes: 'Sin alteraciones significativas', recommendedTreatments: [] },
        cheeks: { condition: 'moderate', notes: 'Cicatrices atróficas de acné. Poros dilatados. Textura irregular.', recommendedTreatments: ['Microneedling', 'Chemical Peel'] },
        nasolabialFolds: { condition: 'mild', notes: 'Pliegues nasogenianos leves', recommendedTreatments: [] },
        lips: { condition: 'normal', notes: 'Labios finos pero proporcionales al rostro', recommendedTreatments: ['Dermal Fillers'] },
        chin: { condition: 'moderate', notes: 'Acné activo ocasional, cicatrices residuales', recommendedTreatments: ['Chemical Peel'] },
        jawline: { condition: 'normal', notes: 'Definición adecuada', recommendedTreatments: [] },
        neck: { condition: 'normal', notes: 'Sin alteraciones', recommendedTreatments: [] },
      },
      notes: 'Paciente recurrente. Completando ciclo de 3 sesiones de microneedling. Buena evolución en textura general. Pendiente valorar necesidad de tercera sesión.',
      photos: [
        { angle: 'front', originalName: 'carlos_front.jpg', mimeType: 'image/jpeg', fileSize: 258048 },
        { angle: 'left', originalName: 'carlos_left.jpg', mimeType: 'image/jpeg', fileSize: 229376 },
        { angle: 'right', originalName: 'carlos_right.jpg', mimeType: 'image/jpeg', fileSize: 233472 },
        { angle: 'up', originalName: 'carlos_up.jpg', mimeType: 'image/jpeg', fileSize: 204800 },
        { angle: 'down', originalName: 'carlos_down.jpg', mimeType: 'image/jpeg', fileSize: 217088 },
      ],
    },
    {
      patientIdx: 2, // Ana Martínez Sánchez (28yo, sensitive, rosacea tendency)
      date: '2026-05-26',
      skinEvaluation: {
        skinType: 'II',
        skinCondition: 'Sensitive',
        concerns: ['redness', 'dehydration', 'sagging'],
        elasticity: 'fair',
        hydrationLevel: 30,
        oilLevel: 25,
        sensitivityLevel: 'severe',
        notes: 'Piel sensible con tendencia a rosácea. Barrera cutánea comprometida. Precaución máxima con principios activos agresivos. Suspender cualquier producto con alcohol o fragancia.',
      },
      facialAnalysis: {
        forehead: { condition: 'mild', notes: 'Leve descamación superficial', recommendedTreatments: [] },
        glabella: { condition: 'normal', notes: 'Sin particularidades', recommendedTreatments: [] },
        periorbital: { condition: 'mild', notes: 'Ojeras y ligera bolsa palpebral', recommendedTreatments: [] },
        cheeks: { condition: 'mild', notes: 'Eritema difuso con telangiectasias leves', recommendedTreatments: ['Laser Treatment'] },
        nasolabialFolds: { condition: 'normal', notes: 'Sin alteraciones', recommendedTreatments: [] },
        lips: { condition: 'normal', notes: 'Labios hidratados, sin queilitis', recommendedTreatments: [] },
        chin: { condition: 'normal', notes: 'Sin alteraciones', recommendedTreatments: [] },
        jawline: { condition: 'normal', notes: 'Sin particularidades', recommendedTreatments: [] },
        neck: { condition: 'normal', notes: 'Sin alteraciones', recommendedTreatments: [] },
      },
      notes: 'Primera consulta. Se recomienda tratamiento suave de hidratación profunda con ácido hialurónico y protector solar mineral SPF50+. Evitar ácidos, retinoides y exfoliantes por ahora.',
      photos: [
        { angle: 'front', originalName: 'ana_front.jpg', mimeType: 'image/jpeg', fileSize: 237568 },
        { angle: 'left', originalName: 'ana_left.jpg', mimeType: 'image/jpeg', fileSize: 204800 },
        { angle: 'right', originalName: 'ana_right.jpg', mimeType: 'image/jpeg', fileSize: 212992 },
      ],
    },
    {
      patientIdx: 3, // Pedro Gómez Ruiz (47yo, male, anti-aging)
      date: '2026-05-24',
      skinEvaluation: {
        skinType: 'III',
        skinCondition: 'Normal',
        concerns: ['wrinkles', 'volume-loss', 'sagging'],
        elasticity: 'poor',
        hydrationLevel: 40,
        oilLevel: 40,
        sensitivityLevel: 'none',
        notes: 'Piel normo-grasa con signos de envejecimiento cutáneo. Flacidez facial incipiente. Volumen disminuido en tercio medio facial.',
      },
      facialAnalysis: {
        forehead: { condition: 'moderate', notes: 'Arrugas frontales profundas', recommendedTreatments: ['Botox'] },
        glabella: { condition: 'moderate', notes: 'Surco glabelar pronunciado (líneas del entrecejo)', recommendedTreatments: ['Botox', 'Dermal Fillers'] },
        periorbital: { condition: 'moderate', notes: 'Patas de gallo marcadas. Bolsas palpebrales inferiores.', recommendedTreatments: ['Botox'] },
        cheeks: { condition: 'moderate', notes: 'Pérdida de volumen malar. Flacidez.', recommendedTreatments: ['Dermal Fillers', 'Radiofrequency'] },
        nasolabialFolds: { condition: 'moderate', notes: 'Surco nasogeniano marcado bilateral', recommendedTreatments: ['Dermal Fillers'] },
        lips: { condition: 'mild', notes: 'Labios finos con pérdida de volumen', recommendedTreatments: ['Dermal Fillers'] },
        chin: { condition: 'mild', notes: 'Flacidez Mentoniana incipiente', recommendedTreatments: ['Radiofrequency'] },
        jawline: { condition: 'moderate', notes: 'Pérdida de definición mandibular', recommendedTreatments: ['Radiofrequency', 'Thread Lift'] },
        neck: { condition: 'mild', notes: 'Flacidez cervical leve, bandas platismales incipientes', recommendedTreatments: ['Radiofrequency'] },
      },
      notes: 'Paciente interesado en rejuvenecimiento facial no quirúrgico. Se propone plan combinado: toxina botulínica + rellenos + radiofrecuencia. Presupuesto presentado.',
      photos: [
        { angle: 'front', originalName: 'pedro_front.jpg', mimeType: 'image/jpeg', fileSize: 266240 },
        { angle: 'left', originalName: 'pedro_left.jpg', mimeType: 'image/jpeg', fileSize: 241664 },
        { angle: 'right', originalName: 'pedro_right.jpg', mimeType: 'image/jpeg', fileSize: 245760 },
        { angle: 'up', originalName: 'pedro_up.jpg', mimeType: 'image/jpeg', fileSize: 221184 },
        { angle: 'down', originalName: 'pedro_down.jpg', mimeType: 'image/jpeg', fileSize: 225280 },
      ],
    },
  ];

  let photoCount = 0;
  for (const exp of explorationSeedData) {
    const explorationId = randomUUID();
    await db.insert(explorations).values({
      id: explorationId,
      patientId: patientIds[exp.patientIdx],
      professionalId: PROFESSIONAL_ID,
      skinEvaluation: JSON.stringify(exp.skinEvaluation),
      facialAnalysis: JSON.stringify(exp.facialAnalysis),
      notes: exp.notes,
      date: exp.date,
    });

    if (exp.photos.length > 0) {
      await db.insert(explorationPhotos).values(
        exp.photos.map((photo) => ({
          id: randomUUID(),
          explorationId,
          url: `/placeholder/explorations/${photo.originalName}`,
          angle: photo.angle as 'front' | 'left' | 'right' | 'up' | 'down',
          originalName: photo.originalName ?? null,
          mimeType: photo.mimeType ?? null,
          fileSize: photo.fileSize ?? null,
        })),
      );
      photoCount += exp.photos.length;
    }
  }
  console.log(`  ✅ ${explorationSeedData.length} sample explorations created`);
  console.log(`  ✅ ${photoCount} exploration photos created`);

  console.log('🌱 Seed complete!');
  console.log(`\n📧 Login credentials:`);
  console.log(`   Professional: dra.uncal@selflove.com / ${PASSWORD}`);
  console.log(`   Patient:      maria.garcia@email.com / ${PASSWORD}`);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
