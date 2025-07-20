export interface Client {
  id: number; // Changed to number to match SERIAL backend
  externalId?: string; // External API ID
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: number; // Changed to number to match SERIAL backend
  externalId?: string; // External API ID
  clientId: number; // Changed to number to match SERIAL backend
  clientName?: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  clientId: string; // Keep as string since this comes from external API
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  type: string;
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const APPOINTMENT_TYPES = [
  'Consultation',
  'Therapy Session',
  'Follow-up',
  'Assessment',
  'Group Session',
  'Workshop',
  'Other'
] as const;

export type AppointmentType = typeof APPOINTMENT_TYPES[number];