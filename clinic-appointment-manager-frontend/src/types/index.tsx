// Frontend types that match your backend structure

export interface Client {
  id: string; // VARCHAR(255) from backend
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string; // VARCHAR(255) from backend
  clientId: string; // VARCHAR(255) from backend
  clientName?: string; // Optional - included in some queries
  appointmentDate: string; // DATE format YYYY-MM-DD
  appointmentTime: string; // TIME format HH:MM:SS
  duration: number;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// For appointment list components that include client information
export interface AppointmentWithClient extends Appointment {
  clientName: string; // Required for this interface
}

export interface CreateAppointmentRequest {
  clientId: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM or HH:MM:SS
  duration: number;
  type: string;
  notes?: string;
}

export interface UpdateAppointmentRequest {
  clientId?: string;
  appointmentDate?: string; // YYYY-MM-DD
  appointmentTime?: string; // HH:MM or HH:MM:SS
  duration?: number;
  type?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
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

// Additional UI types
export interface LoadingState {
  clients: boolean;
  appointments: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

export interface ErrorState {
  clients: string | null;
  appointments: string | null;
  creating: string | null;
  updating: string | null;
  deleting: string | null;
}

// Search and filter types
export interface SearchFilters {
  clientSearch: string;
  appointmentStatus: 'all' | 'scheduled' | 'completed' | 'cancelled';
  appointmentType: AppointmentType | 'all';
  dateRange: {
    start?: string;
    end?: string;
  };
}

// Form data types
export interface AppointmentFormData {
  clientId: string;
  date: string;
  time: string;
  duration: number;
  type: AppointmentType;
  notes: string;
}