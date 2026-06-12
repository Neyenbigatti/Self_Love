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
  professionalName?: string;
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

// ─── Skin Evaluation ──────────────────────────────────────────────────────────
// Shared between API, DB (JSON column), and the SkinEvaluationForm component.

export interface SkinEvaluationData {
  skinType: string;
  skinCondition: string;
  concerns: string[];
  elasticity: 'excellent' | 'good' | 'fair' | 'poor';
  hydrationLevel: number;
  oilLevel: number;
  sensitivityLevel: 'none' | 'mild' | 'moderate' | 'severe';
  notes: string;
}

export interface PhysicalExploration {
  id: string;
  patientId: string;
  professionalId: string;
  date: Date;
  skinEvaluation?: SkinEvaluationData;
  facialAnalysis?: FacialAnalysis;
  notes?: string;
  photos: ExplorationPhoto[];
  createdAt: Date;
  updatedAt: Date;
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
  explorationId?: string;
  url: string;
  angle: 'front' | 'left' | 'right' | 'up' | 'down';
  originalName?: string;
  mimeType?: string;
  fileSize?: number;
  date: Date;
}

/**
 * Response shape from GET /api/patients/[id]/clinical-history
 */
export interface ClinicalHistoryResponse {
  patient: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    totalVisits: number;
    lastVisit: string | null;
  };
  medicalHistory: MedicalHistory | null;
  completedAppointments: Array<{
    id: string;
    treatmentType: string;
    date: string;
    startTime: string;
    endTime: string;
    notes: string | null;
    professionalName: string;
  }>;
  explorations: Array<{
    id: string;
    date: string;
    skinEvaluation: unknown;
    facialAnalysis: unknown;
    responses: unknown;
    notes: string | null;
    templateId: string | null;
    templateConfig: unknown;
    photos: ExplorationPhoto[];
  }>;
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

// ─── Exploration Templates ──────────────────────────────────────────────────────

export interface TemplateField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'boolean' | 'number' | 'date' | 'select' | 'multiselect';
  options?: string[];
  required?: boolean;
  sortOrder: number;
  isActive?: boolean;
  system?: boolean;
}

export interface ExplorationSection {
  id: string;
  title: string;
  fields: TemplateField[];
}

export interface WidgetsConfig {
  facialDiagram?: boolean;
  photoCapture?: boolean;
}

export interface TemplateConfig {
  sections: ExplorationSection[];
  widgets?: WidgetsConfig;
}

export interface ExplorationResponseV2 {
  templateId: string | null;
  responses: Record<string, any> | null;
  facialAnalysis: Partial<FacialAnalysis> | null;
  photos: ExplorationPhoto[];
  notes: string | null;
}
