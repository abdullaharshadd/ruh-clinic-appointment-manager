import axios, { AxiosInstance } from 'axios';
import { MockApiClient, MockApiAppointment, CreateAppointmentRequest } from '../types';

class ApiWrapper {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.MOCK_API_URL || 'https://your-mock-server-url.com';
    
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging and data extraction
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        
        // Log the raw response for debugging
        console.log('Raw API Response:', JSON.stringify(response.data, null, 2));
        
        return response;
      },
      (error) => {
        console.error('API Response Error:', error.response?.status, error.message);
        if (error.response?.data) {
          console.error('Error Response Data:', error.response.data);
        }
        return Promise.reject(error);
      }
    );
  }

  async fetchClients(): Promise<MockApiClient[]> {
    try {
      const response = await this.client.get('/clients');
      
      // Handle different possible response formats
      let clientsData = response.data;
      
      // Log the raw response for debugging
      console.log('Raw API Response for clients:', JSON.stringify(clientsData, null, 2));
      
      // If response is an array with one element that has a 'body' field (Postman mock format)
      if (Array.isArray(clientsData) && clientsData.length > 0 && clientsData[0].body) {
        try {
          clientsData = JSON.parse(clientsData[0].body);
          console.log('Parsed clients from body field');
        } catch (parseError) {
          console.warn('Failed to parse response body from array, returning empty array:', parseError);
          return []; // Return empty array instead of throwing
        }
      }
      // If response is a single object with a 'body' field
      else if (typeof clientsData === 'object' && !Array.isArray(clientsData) && clientsData.body) {
        try {
          clientsData = JSON.parse(clientsData.body);
          console.log('Parsed clients from single object body field');
        } catch (parseError) {
          console.warn('Failed to parse response body from object, returning empty array:', parseError);
          return []; // Return empty array instead of throwing
        }
      }
      // If it's already an array of clients (direct format)
      else if (Array.isArray(clientsData)) {
        // Check if it's already the right format
        if (clientsData.length > 0 && clientsData[0].id && clientsData[0].name) {
          console.log('Clients already in correct array format');
        } else {
          console.warn('Array does not contain valid client objects, returning empty array');
          return []; // Return empty array instead of throwing
        }
      }
      
      // Ensure we have an array
      if (!Array.isArray(clientsData)) {
        console.warn('Expected array of clients, got:', typeof clientsData, 'returning empty array');
        return []; // Return empty array instead of throwing
      }
      
      // Validate each client object and filter out invalid ones
      const validatedClients = clientsData.filter((client: any) => {
        if (!client || typeof client !== 'object') {
          console.warn('Skipping invalid client object (not an object):', client);
          return false;
        }
        
        if (!client.id || !client.name || !client.email) {
          console.warn('Skipping client missing required fields (id, name, email):', client);
          return false;
        }
        
        // Add default values for optional fields
        if (!client.phone) {
          client.phone = '';
        }
        if (!client.created_at) {
          client.created_at = new Date().toISOString();
        }
        if (!client.updated_at) {
          client.updated_at = new Date().toISOString();
        }
        
        return true;
      });
      
      console.log(`Successfully parsed ${validatedClients.length} valid clients out of ${clientsData.length} total`);
      return validatedClients;
      
    } catch (error) {
      console.error('Error fetching clients, returning empty array:', error);
      return []; // Return empty array instead of throwing
    }
  }

  async fetchAppointments(): Promise<MockApiAppointment[]> {
    try {
      const response = await this.client.get('/appointments');
      
      // Handle different possible response formats
      let appointmentsData = response.data;
      
      // Log the raw response for debugging
      console.log('Raw API Response for appointments:', JSON.stringify(appointmentsData, null, 2));
      
      // If response is an array with one element that has a 'body' field (Postman mock format)
      if (Array.isArray(appointmentsData) && appointmentsData.length > 0 && appointmentsData[0].body) {
        try {
          appointmentsData = JSON.parse(appointmentsData[0].body);
          console.log('Parsed appointments from body field');
        } catch (parseError) {
          console.warn('Failed to parse response body from array, returning empty array:', parseError);
          return []; // Return empty array instead of throwing
        }
      }
      // If response is a single object with a 'body' field
      else if (typeof appointmentsData === 'object' && !Array.isArray(appointmentsData) && appointmentsData.body) {
        try {
          appointmentsData = JSON.parse(appointmentsData.body);
          console.log('Parsed appointments from single object body field');
        } catch (parseError) {
          console.warn('Failed to parse response body from object, returning empty array:', parseError);
          return []; // Return empty array instead of throwing
        }
      }
      // If it's already an array of appointments (direct format)
      else if (Array.isArray(appointmentsData)) {
        // Check if it's already the right format
        if (appointmentsData.length > 0 && appointmentsData[0].id && appointmentsData[0].client_id) {
          console.log('Appointments already in correct array format');
        } else {
          console.warn('Array does not contain valid appointment objects, returning empty array');
          return []; // Return empty array instead of throwing
        }
      }
      
      // Ensure we have an array
      if (!Array.isArray(appointmentsData)) {
        console.warn('Expected array of appointments, got:', typeof appointmentsData, 'returning empty array');
        return []; // Return empty array instead of throwing
      }
      
      // Validate each appointment object and filter out invalid ones
      const validatedAppointments = appointmentsData.filter((appointment: any) => {
        if (!appointment || typeof appointment !== 'object') {
          console.warn('Skipping invalid appointment object (not an object):', appointment);
          return false;
        }
        
        if (!appointment.id || !appointment.client_id) {
          console.warn('Skipping appointment missing required fields (id, client_id):', appointment);
          return false;
        }
        
        // Add default values for missing fields and handle different time formats
        try {
          if (!appointment.appointment_date && appointment.time) {
            // Extract date from time field if needed
            appointment.appointment_date = appointment.time.split('T')[0];
          }
          if (!appointment.appointment_time && appointment.time) {
            // Extract time from time field if needed
            const timeObj = new Date(appointment.time);
            appointment.appointment_time = timeObj.toTimeString().slice(0, 5);
          }
          if (!appointment.duration) {
            appointment.duration = 60; // Default 60 minutes
          }
          if (!appointment.type) {
            appointment.type = 'Consultation'; // Default type
          }
          if (!appointment.status) {
            appointment.status = 'scheduled'; // Default status
          }
          if (!appointment.created_at) {
            appointment.created_at = new Date().toISOString();
          }
          if (!appointment.updated_at) {
            appointment.updated_at = new Date().toISOString();
          }
          
          return true;
        } catch (timeParsingError) {
          console.warn('Skipping appointment due to time parsing error:', appointment, timeParsingError);
          return false;
        }
      });
      
      console.log(`Successfully parsed ${validatedAppointments.length} valid appointments out of ${appointmentsData.length} total`);
      return validatedAppointments;
      
    } catch (error) {
      console.error('Error fetching appointments, returning empty array:', error);
      return []; // Return empty array instead of throwing
    }
  }

  async createAppointment(appointmentData: CreateAppointmentRequest): Promise<MockApiAppointment> {
    try {
      const response = await this.client.post('/appointments', {
        client_id: appointmentData.clientId,
        appointment_date: appointmentData.appointmentDate,
        appointment_time: appointmentData.appointmentTime,
        duration: appointmentData.duration,
        type: appointmentData.type,
        notes: appointmentData.notes,
      });
      
      let createdAppointment = response.data;
      
      // Handle Postman mock server response format
      if (createdAppointment.length > 0 && createdAppointment[0].body) {
        try {
          createdAppointment = JSON.parse(createdAppointment[0].body);
        } catch (parseError) {
          console.error('Failed to parse create response body:', parseError);
          throw new Error('Invalid JSON in create response body');
        }
      }
            
      // Validate the created appointment
      if (!createdAppointment || !createdAppointment.id) {
        throw new Error('Invalid appointment creation response');
      }
      
      return createdAppointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw new Error('Failed to create appointment via external API');
    }
  }

  async updateAppointment(appointmentId: string, updates: Partial<CreateAppointmentRequest>): Promise<MockApiAppointment> {
    try {
      const response = await this.client.put(`/appointments/${appointmentId}`, {
        client_id: updates.clientId,
        appointment_date: updates.appointmentDate,
        appointment_time: updates.appointmentTime,
        duration: updates.duration,
        type: updates.type,
        notes: updates.notes,
      });
      
      let updatedAppointment = response.data;
      
      // Handle Postman mock server response format
      if (typeof updatedAppointment === 'object' && updatedAppointment.body) {
        try {
          updatedAppointment = JSON.parse(updatedAppointment.body);
        } catch (parseError) {
          console.error('Failed to parse update response body:', parseError);
          throw new Error('Invalid JSON in update response body');
        }
      }
      
      return updatedAppointment;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw new Error('Failed to update appointment via external API');
    }
  }

  async cancelAppointment(appointmentId: string): Promise<void> {
    try {
      await this.client.delete(`/appointments/${appointmentId}`);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw new Error('Failed to cancel appointment via external API');
    }
  }
}

export default new ApiWrapper();