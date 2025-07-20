import axios, { AxiosResponse } from 'axios';
import { Client, Appointment, CreateAppointmentRequest, ApiResponse } from './../types/index';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// API functions
export const apiService = {
  // Health check
  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    const response: AxiosResponse<{ status: string; timestamp: string }> = 
      await api.get('/health');
    return response.data;
  },

  // Clients
  getClients: async (search?: string): Promise<Client[]> => {
    const params = search ? { search } : {};
    const response: AxiosResponse<ApiResponse<Client[]>> = 
      await api.get('/clients', { params });
    return response.data.data;
  },

  getClient: async (id: string): Promise<Client> => {
    const response: AxiosResponse<ApiResponse<Client>> = 
      await api.get(`/clients/${id}`);
    return response.data.data;
  },

  // Appointments
  getAppointments: async (): Promise<Appointment[]> => {
    const response: AxiosResponse<ApiResponse<Appointment[]>> = 
      await api.get('/appointments');
    return response.data.data;
  },

  getUpcomingAppointments: async (): Promise<Appointment[]> => {
    const response: AxiosResponse<ApiResponse<Appointment[]>> = 
      await api.get('/appointments/upcoming');
    return response.data.data;
  },

  getAppointment: async (id: string): Promise<Appointment> => {
    const response: AxiosResponse<ApiResponse<Appointment>> = 
      await api.get(`/appointments/${id}`);
    return response.data.data;
  },

  createAppointment: async (appointmentData: CreateAppointmentRequest): Promise<Appointment> => {
    const response: AxiosResponse<ApiResponse<Appointment>> = 
      await api.post('/appointments', appointmentData);
    return response.data.data;
  },

  updateAppointment: async (id: string, updates: Partial<CreateAppointmentRequest>): Promise<Appointment> => {
    const response: AxiosResponse<ApiResponse<Appointment>> = 
      await api.put(`/appointments/${id}`, updates);
    return response.data.data;
  },

  cancelAppointment: async (id: string): Promise<void> => {
    await api.delete(`/appointments/${id}`);
  },

  // Manual sync
  syncData: async (): Promise<string> => {
    const response: AxiosResponse<ApiResponse<string>> = 
      await api.post('/sync');
    return response.data.message || 'Sync completed';
  },
};

export default apiService;