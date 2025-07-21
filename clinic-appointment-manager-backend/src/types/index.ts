export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName?: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number; // in minutes
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentWithClient extends Appointment {
  clientName: string;
}

export interface CreateAppointmentRequest {
  clientId: string;
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

export interface MockApiClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  created_at: string;
  updated_at: string;
}

export interface MockApiAppointment {
  id: string;
  client_id: string;
  appointment_date: string;
  appointment_time: string;
  duration: number;
  type: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}