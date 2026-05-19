import { Appointment, Patient, TreatmentRecord, MedicalHistory } from './types';
import { addDays, setHours, setMinutes, startOfWeek, subMonths } from 'date-fns';

const today = new Date();
const weekStart = startOfWeek(today, { weekStartsOn: 1 });

// Sample medical histories
const medicalHistory1: MedicalHistory = {
  allergies: ['Penicillin', 'Latex'],
  medications: ['Vitamin D', 'Birth Control'],
  conditions: ['Rosacea'],
  previousTreatments: ['Botox (2020)', 'Chemical Peel (2021)'],
};

const medicalHistory2: MedicalHistory = {
  allergies: [],
  medications: ['Aspirin', 'Metformin'],
  conditions: ['Diabetes Type 2', 'Hypertension'],
  previousTreatments: [],
};

const medicalHistory3: MedicalHistory = {
  allergies: ['Lidocaine'],
  medications: [],
  conditions: [],
  previousTreatments: ['Microneedling (2022)', 'Dermal Fillers (2023)'],
};

// Sample treatment records
const treatments1: TreatmentRecord[] = [
  {
    id: 't1',
    date: subMonths(today, 2),
    treatment: 'Botox - Forehead & Crow\'s Feet',
    notes: 'Patient tolerated procedure well. 20 units forehead, 12 units per side crow\'s feet. Follow-up in 2 weeks.',
    professional: 'Dr. Elena Vázquez',
    photos: { before: '/photos/before1.jpg', after: '/photos/after1.jpg' },
  },
  {
    id: 't2',
    date: subMonths(today, 4),
    treatment: 'Chemical Peel - Light',
    notes: 'Glycolic acid 30% peel. Slight erythema post-procedure, expected resolution in 24-48 hours.',
    professional: 'Dr. Elena Vázquez',
  },
  {
    id: 't3',
    date: subMonths(today, 6),
    treatment: 'Initial Consultation',
    notes: 'Patient seeking facial rejuvenation. Discussed options including botox, fillers, and skin resurfacing. Created treatment plan.',
    professional: 'Dr. Elena Vázquez',
  },
];

const treatments2: TreatmentRecord[] = [
  {
    id: 't4',
    date: subMonths(today, 1),
    treatment: 'Dermal Fillers - Nasolabial Folds',
    notes: '1ml Juvederm per side. Good results, patient satisfied. Schedule follow-up in 2 weeks.',
    professional: 'Dr. Elena Vázquez',
    photos: { before: '/photos/before2.jpg', after: '/photos/after2.jpg' },
  },
];

const treatments3: TreatmentRecord[] = [
  {
    id: 't5',
    date: subMonths(today, 1),
    treatment: 'Microneedling Session 1',
    notes: 'First session of 3. Used 1.5mm depth. Applied hyaluronic acid serum post-treatment.',
    professional: 'Dr. Elena Vázquez',
  },
  {
    id: 't6',
    date: addDays(today, -3),
    treatment: 'Microneedling Session 2',
    notes: 'Second session completed. Patient reports improved skin texture. One more session scheduled.',
    professional: 'Dr. Elena Vázquez',
  },
];

export const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'María García López',
    email: 'maria.garcia@email.com',
    phone: '+34 612 345 678',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    dateOfBirth: new Date(1985, 3, 15),
    gender: 'female',
    address: 'Calle Mayor 45, 28013 Madrid',
    lastVisit: addDays(today, -7),
    totalVisits: 12,
    medicalHistory: medicalHistory1,
    treatments: treatments1,
    notes: 'VIP patient. Prefers morning appointments. Sensitive to cold.',
    createdAt: new Date(2022, 5, 10),
  },
  {
    id: '2',
    name: 'Carlos Rodríguez Fernández',
    email: 'carlos.rodriguez@email.com',
    phone: '+34 623 456 789',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    dateOfBirth: new Date(1978, 7, 22),
    gender: 'male',
    address: 'Avenida de la Constitución 12, 28014 Madrid',
    lastVisit: addDays(today, -14),
    totalVisits: 8,
    medicalHistory: medicalHistory2,
    treatments: treatments2,
    notes: 'Requires blood pressure monitoring before procedures due to hypertension.',
    createdAt: new Date(2023, 1, 15),
  },
  {
    id: '3',
    name: 'Ana Martínez Sánchez',
    email: 'ana.martinez@email.com',
    phone: '+34 634 567 890',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    dateOfBirth: new Date(1990, 11, 3),
    gender: 'female',
    address: 'Plaza de España 8, 28008 Madrid',
    lastVisit: addDays(today, -3),
    totalVisits: 5,
    medicalHistory: medicalHistory3,
    treatments: treatments3,
    createdAt: new Date(2023, 8, 20),
  },
  {
    id: '4',
    name: 'Pedro Gómez Ruiz',
    email: 'pedro.gomez@email.com',
    phone: '+34 645 678 901',
    dateOfBirth: new Date(1982, 5, 18),
    gender: 'male',
    lastVisit: addDays(today, -21),
    totalVisits: 3,
    createdAt: new Date(2024, 0, 5),
  },
  {
    id: '5',
    name: 'Laura Hernández Díaz',
    email: 'laura.hernandez@email.com',
    phone: '+34 656 789 012',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    dateOfBirth: new Date(1995, 1, 28),
    gender: 'female',
    address: 'Calle Serrano 100, 28006 Madrid',
    lastVisit: today,
    totalVisits: 2,
    createdAt: new Date(2024, 2, 1),
  },
];

export const treatmentTypes = [
  'Botox',
  'Dermal Fillers',
  'Chemical Peel',
  'Microneedling',
  'Laser Treatment',
  'PRP Therapy',
  'Consultation',
  'Follow-up',
];

export const mockAppointments: Appointment[] = [
  {
    id: '1',
    patientId: '1',
    patientName: 'María García López',
    patientAvatar: mockPatients[0].avatar,
    treatmentType: 'Botox',
    date: setMinutes(setHours(addDays(weekStart, 0), 9), 0),
    startTime: '09:00',
    endTime: '09:30',
    status: 'confirmed',
    professionalId: '1',
    notes: 'First botox session - forehead and crow\'s feet',
  },
  {
    id: '2',
    patientId: '2',
    patientName: 'Carlos Rodríguez Fernández',
    patientAvatar: mockPatients[1].avatar,
    treatmentType: 'Dermal Fillers',
    date: setMinutes(setHours(addDays(weekStart, 0), 10), 30),
    startTime: '10:30',
    endTime: '11:30',
    status: 'confirmed',
    professionalId: '1',
  },
  {
    id: '3',
    patientId: '3',
    patientName: 'Ana Martínez Sánchez',
    patientAvatar: mockPatients[2].avatar,
    treatmentType: 'Chemical Peel',
    date: setMinutes(setHours(addDays(weekStart, 1), 11), 0),
    startTime: '11:00',
    endTime: '12:00',
    status: 'pending',
    professionalId: '1',
  },
  {
    id: '4',
    patientId: '4',
    patientName: 'Pedro Gómez Ruiz',
    treatmentType: 'Consultation',
    date: setMinutes(setHours(addDays(weekStart, 1), 15), 0),
    startTime: '15:00',
    endTime: '15:30',
    status: 'confirmed',
    professionalId: '1',
    notes: 'Initial consultation for facial rejuvenation',
  },
  {
    id: '5',
    patientId: '5',
    patientName: 'Laura Hernández Díaz',
    patientAvatar: mockPatients[4].avatar,
    treatmentType: 'Microneedling',
    date: setMinutes(setHours(addDays(weekStart, 2), 9), 30),
    startTime: '09:30',
    endTime: '10:30',
    status: 'confirmed',
    professionalId: '1',
  },
  {
    id: '6',
    patientId: '1',
    patientName: 'María García López',
    patientAvatar: mockPatients[0].avatar,
    treatmentType: 'Follow-up',
    date: setMinutes(setHours(addDays(weekStart, 3), 14), 0),
    startTime: '14:00',
    endTime: '14:30',
    status: 'pending',
    professionalId: '1',
  },
  {
    id: '7',
    patientId: '2',
    patientName: 'Carlos Rodríguez Fernández',
    patientAvatar: mockPatients[1].avatar,
    treatmentType: 'Laser Treatment',
    date: setMinutes(setHours(addDays(weekStart, 4), 10), 0),
    startTime: '10:00',
    endTime: '11:00',
    status: 'confirmed',
    professionalId: '1',
  },
  {
    id: '8',
    patientId: '3',
    patientName: 'Ana Martínez Sánchez',
    patientAvatar: mockPatients[2].avatar,
    treatmentType: 'PRP Therapy',
    date: setMinutes(setHours(addDays(weekStart, 4), 16), 0),
    startTime: '16:00',
    endTime: '17:00',
    status: 'cancelled',
    professionalId: '1',
  },
];

export const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00',
];
