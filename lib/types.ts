export type AppointmentStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatar?: string;
  treatmentType: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  professionalId: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  lastVisit?: Date;
  totalVisits: number;
  medicalHistory?: MedicalHistory;
  treatments?: TreatmentRecord[];
  notes?: string;
  createdAt?: Date;
}

export interface MedicalHistory {
  allergies: string[];
  medications: string[];
  conditions: string[];
  previousTreatments: string[];
}

export interface TreatmentRecord {
  id: string;
  date: Date;
  treatment: string;
  notes: string;
  professional: string;
  photos?: { before?: string; after?: string };
}

export interface PhysicalExploration {
  id: string;
  patientId: string;
  date: Date;
  skinType: string;
  skinCondition: string;
  facialAnalysis: FacialAnalysis;
  bodyAnalysis?: BodyAnalysis;
  notes: string;
  photos: ExplorationPhoto[];
}

export interface FacialAnalysis {
  forehead: AreaAnalysis;
  glabella: AreaAnalysis;
  periorbital: AreaAnalysis;
  cheeks: AreaAnalysis;
  nasolabialFolds: AreaAnalysis;
  lips: AreaAnalysis;
  chin: AreaAnalysis;
  jawline: AreaAnalysis;
  neck: AreaAnalysis;
}

export interface BodyAnalysis {
  area: string;
  concerns: string[];
  measurements?: Record<string, number>;
}

export interface AreaAnalysis {
  condition: 'normal' | 'mild' | 'moderate' | 'severe';
  notes: string;
  recommendedTreatments: string[];
}

export interface ExplorationPhoto {
  id: string;
  url: string;
  angle: 'front' | 'left' | 'right' | 'up' | 'down';
  date: Date;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface DaySchedule {
  date: Date;
  slots: TimeSlot[];
  appointments: Appointment[];
}
