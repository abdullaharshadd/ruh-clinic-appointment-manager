// Database entities (internal structure) - using VARCHAR(255) IDs as per your schema
export interface Client {
  id: string; // VARCHAR(255) in database
  name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string; // VARCHAR(255) in database
  client_id: string; // VARCHAR(255) in database
  appointment_date: string; // DATE in database
  appointment_time: string; // TIME in database
  duration: number;
  type: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Mock API response structures (external API)
export interface MockApiClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MockApiAppointment {
  id: string;
  client_id: string;
  time: string; // ISO datetime string from API (e.g., "2025-07-10T10:00:00Z")
  duration?: number;
  type?: string;
  status?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Request/Response types for API operations
export interface CreateAppointmentRequest {
  clientId: string;
  appointmentDate: string;
  appointmentTime: string;
  duration?: number;
  type?: string;
  notes?: string;
}

export interface UpdateAppointmentRequest {
  clientId?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  duration?: number;
  type?: string;
  notes?: string;
  status?: string;
}

// Frontend types with client name joined
export interface AppointmentWithClient extends Appointment {
  client_name: string; // From LEFT JOIN
}

// API Response wrapper types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Status types
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
export type AppointmentType = 'consultation' | 'follow_up' | 'therapy' | 'assessment';