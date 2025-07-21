import axios, { AxiosInstance } from 'axios';
import { MockApiClient, MockApiAppointment, CreateAppointmentRequest } from '../types/index';

class ApiWrapper {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.MOCK_API_URL || 'https://your-postman-mock-url.mock.pstmn.io';
    const apiKey = process.env.POSTMAN_API_KEY;
    
    console.log('🔧 API Configuration:');
    console.log('   - Base URL:', baseURL);
    console.log('   - API Key:', apiKey ? '***set***' : 'not set');
    
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }
    
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers,
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log('📤 API Request Details:');
        console.log(`   Method: ${config.method?.toUpperCase()}`);
        console.log(`   URL: ${config.baseURL}${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging and parsing
    this.client.interceptors.response.use(
      (response) => {
        console.log('📥 API Response Details:');
        console.log(`   Status: ${response.status} ${response.statusText}`);
        console.log(`   URL: ${response.config.url}`);
        console.log(`   Data Type:`, typeof response.data);
        
        // Handle string responses from Postman mock server
        if (typeof response.data === 'string') {
          try {
            // Try to parse as JSON first
            response.data = JSON.parse(response.data);
            console.log('✅ Successfully parsed string response as JSON');
          } catch (jsonError: any) {
            // If JSON parsing fails, try to evaluate as JavaScript
            try {
              // Convert JavaScript object notation to JSON
              const jsString = response.data
                .replace(/'/g, '"')  // Replace single quotes with double quotes
                .replace(/(\w+):/g, '"$1":')  // Add quotes around property names
                .replace(/,\s*}/g, '}')  // Remove trailing commas
                .replace(/,\s*]/g, ']');  // Remove trailing commas in arrays
              
              response.data = JSON.parse(jsString);
              console.log('✅ Successfully converted JS notation to JSON and parsed');
            } catch (jsError: any) {
              console.error('❌ Failed to parse response data:', response.data);
              console.error('JSON Error:', jsonError.message);
              console.error('JS Error:', jsError.message);
              throw new Error('Unable to parse response data');
            }
          }
        }
        
        console.log(`   Parsed Data Length:`, Array.isArray(response.data) ? response.data.length : 'N/A');
        console.log(`   Parsed Data Sample:`, JSON.stringify(response.data, null, 2));
        
        return response;
      },
      (error) => {
        console.error('❌ API Response Error:', error.response?.status, error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Fetch all clients from the mock API
   * Handles both JSON and string responses from Postman mock server
   */
  async fetchClients(): Promise<MockApiClient[]> {
    try {
      console.log('🔄 Fetching clients from mock API...');
      const response = await this.client.get('/clients');
      
      // Data should now be parsed by interceptor
      if (!Array.isArray(response.data)) {
        console.error('❌ Expected array but got:', typeof response.data, response.data);
        throw new Error(`Expected array of clients, got ${typeof response.data}`);
      }

      // Validate individual client objects
      const validClients = response.data.filter((client: any, index: number) => {
        const isValid = client && 
                       typeof client.id === 'string' && 
                       typeof client.name === 'string' &&
                       typeof client.email === 'string';
        
        if (!isValid) {
          console.warn(`⚠️  Invalid client at index ${index}:`, client);
        }
        
        return isValid;
      });

      console.log(`✅ Fetched ${validClients.length} valid clients out of ${response.data.length} total`);
      
      return validClients;
    } catch (error) {
      console.error('❌ Error fetching clients:', error);
      
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error('Clients endpoint not found. Please check your Postman mock server setup.');
      }
      
      throw new Error('Failed to fetch clients from external API');
    }
  }

  /**
   * Fetch all appointments from the mock API
   * Handles both JSON and string responses from Postman mock server
   */
  async fetchAppointments(): Promise<MockApiAppointment[]> {
    try {
      console.log('🔄 Fetching appointments from mock API...');
      const response = await this.client.get('/appointments');
      
      // Data should now be parsed by interceptor
      if (!Array.isArray(response.data)) {
        console.error('❌ Expected array but got:', typeof response.data, response.data);
        throw new Error(`Expected array of appointments, got ${typeof response.data}`);
      }

      // Validate individual appointment objects
      const validAppointments = response.data.filter((appointment: any, index: number) => {
        const isValid = appointment && 
                       typeof appointment.id === 'string' && 
                       typeof appointment.client_id === 'string' &&
                       typeof appointment.time === 'string';
        
        if (!isValid) {
          console.warn(`⚠️  Invalid appointment at index ${index}:`, appointment);
        }
        
        return isValid;
      });

      console.log(`✅ Fetched ${validAppointments.length} valid appointments out of ${response.data.length} total`);
      
      return validAppointments;
    } catch (error) {
      console.error('❌ Error fetching appointments:', error);
      
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error('Appointments endpoint not found. Please check your Postman mock server setup.');
      }
      
      throw new Error('Failed to fetch appointments from external API');
    }
  }

  /**
   * Create a new appointment via the mock API
   */
  async createAppointment(appointmentData: CreateAppointmentRequest): Promise<MockApiAppointment> {
    try {
      const time = this.formatDateTime(appointmentData.appointmentDate, appointmentData.appointmentTime);
      
      const payload = {
        client_id: appointmentData.clientId,
        time: time,
        duration: appointmentData.duration,
        type: appointmentData.type,
        notes: appointmentData.notes,
      };

      console.log('📤 Creating appointment with payload:', JSON.stringify(payload, null, 2));
      const response = await this.client.post('/appointments', payload);
      console.log('✅ Appointment created:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error creating appointment:', error);
      throw new Error('Failed to create appointment via external API');
    }
  }

  /**
   * Update an existing appointment
   */
  async updateAppointment(appointmentId: string, updates: Partial<CreateAppointmentRequest>): Promise<MockApiAppointment> {
    try {
      const payload: any = {
        client_id: updates.clientId,
      };
      
      if (updates.appointmentDate && updates.appointmentTime) {
        payload.time = this.formatDateTime(updates.appointmentDate, updates.appointmentTime);
      }
      
      if (updates.duration !== undefined) payload.duration = updates.duration;
      if (updates.type !== undefined) payload.type = updates.type;
      if (updates.notes !== undefined) payload.notes = updates.notes;

      console.log('📤 Updating appointment:', appointmentId, JSON.stringify(payload, null, 2));
      const response = await this.client.put(`/appointments/${appointmentId}`, payload);
      console.log('✅ Appointment updated:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error updating appointment:', error);
      throw new Error('Failed to update appointment via external API');
    }
  }

  /**
   * Cancel/delete an appointment
   */
  async cancelAppointment(appointmentId: string): Promise<void> {
    try {
      console.log('🗑️ Cancelling appointment:', appointmentId);
      await this.client.delete(`/appointments/${appointmentId}`);
      console.log('✅ Appointment cancelled successfully');
    } catch (error) {
      console.error('❌ Error cancelling appointment:', error);
      throw new Error('Failed to cancel appointment via external API');
    }
  }

  /**
   * Test connectivity to the mock API
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing API connection...');
      const response = await this.client.get('/clients');
      console.log(`✅ Connection successful! Status: ${response.status}`);
      return true;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }

  /**
   * Helper method to format date and time into ISO string
   */
  private formatDateTime(date: string, time: string): string {
    try {
      let formattedTime = time;
      if (time.split(':').length === 2) {
        formattedTime = `${time}:00`;
      }
      
      const dateTime = new Date(`${date}T${formattedTime}`);
      const isoString = dateTime.toISOString();
      console.log(`🕒 Formatted "${date} ${time}" to "${isoString}"`);
      return isoString;
    } catch (error) {
      console.error('❌ Error formatting datetime:', error);
      return new Date().toISOString();
    }
  }

  /**
   * Helper method to parse ISO datetime back to separate date and time
   */
  static parseDateTime(isoString: string): { date: string; time: string } {
    try {
      const dateTime = new Date(isoString);
      const date = dateTime.toISOString().split('T')[0];
      const time = dateTime.toTimeString().split(' ')[0];
      return { date, time };
    } catch (error) {
      console.error('❌ Error parsing datetime:', error);
      const now = new Date();
      return {
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0]
      };
    }
  }
}

export default new ApiWrapper();