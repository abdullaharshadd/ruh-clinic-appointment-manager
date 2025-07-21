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
            const parsedData = JSON.parse(response.data);
            response.data = parsedData;
            console.log('✅ Successfully parsed string response as JSON');
          } catch (jsonError) {
            // If JSON parsing fails, try to evaluate as JavaScript
            try {
              // Convert JavaScript object notation to JSON
              const jsString = response.data
                .replace(/'/g, '"')  // Replace single quotes with double quotes
                .replace(/(\w+):/g, '"$1":')  // Add quotes around property names
                .replace(/,\s*}/g, '}')  // Remove trailing commas
                .replace(/,\s*]/g, ']');  // Remove trailing commas in arrays
              
              const parsedData = JSON.parse(jsString);
              response.data = parsedData;
              console.log('✅ Successfully converted JS notation to JSON and parsed');
            } catch (jsError) {
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
      throw new Error('Failed to fetch clients from external API');
    }
  }

  /**
   * Fetch all appointments from the mock API
   * FIXED: Preserve the 'time' field properly
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

      console.log('🔍 DEBUG: Raw appointments after parsing:', JSON.stringify(response.data, null, 2));

      // Validate individual appointment objects - FIXED validation
      const validAppointments = response.data.filter((appointment: any, index: number) => {
        const hasId = appointment && typeof appointment.id === 'string' && appointment.id.trim() !== '';
        const hasClientId = appointment && typeof appointment.client_id === 'string' && appointment.client_id.trim() !== '';
        const hasTime = appointment && typeof appointment.time === 'string' && appointment.time.trim() !== '';
        
        const isValid = hasId && hasClientId && hasTime;
        
        if (!isValid) {
          console.warn(`⚠️  Invalid appointment at index ${index}:`, {
            appointment,
            hasId,
            hasClientId,
            hasTime,
            timeValue: appointment?.time,
            timeType: typeof appointment?.time
          });
        }
        
        return isValid;
      });

      console.log(`✅ Fetched ${validAppointments.length} valid appointments out of ${response.data.length} total`);
      
      return validAppointments;
    } catch (error) {
      console.error('❌ Error fetching appointments:', error);
      throw new Error('Failed to fetch appointments from external API');
    }
  }

  /**
   * Create a new appointment via the mock API
   * FIXED: Generate unique ID and preserve client_id
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
      
      // Still call the mock API for demonstration purposes
      let mockResponse;
      try {
        const response = await this.client.post('/appointments', payload);
        mockResponse = response.data;
        console.log('✅ Mock API responded:', mockResponse);
      } catch (mockError) {
        console.warn('⚠️ Mock API call failed, continuing with local creation:', mockError.message);
      }

      // Generate unique appointment ID
      const uniqueId = this.generateUniqueId();
      
      // Create the appointment object with our generated ID and correct client_id
      const createdAppointment: MockApiAppointment = {
        id: uniqueId, // Use our generated unique ID
        client_id: appointmentData.clientId, // Use the client_id from request body
        time: time,
        duration: appointmentData.duration,
        type: appointmentData.type,
        notes: appointmentData.notes,
        status: 'scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('✅ Appointment created with unique ID:', createdAppointment);
      
      return createdAppointment;
      
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
      const payload: any = {};
      
      // Build payload with only provided fields
      if (updates.clientId) payload.client_id = updates.clientId;
      
      if (updates.appointmentDate && updates.appointmentTime) {
        payload.time = this.formatDateTime(updates.appointmentDate, updates.appointmentTime);
      }
      
      if (updates.duration !== undefined) payload.duration = updates.duration;
      if (updates.type !== undefined) payload.type = updates.type;
      if (updates.notes !== undefined) payload.notes = updates.notes;

      console.log('📤 Updating appointment:', appointmentId, JSON.stringify(payload, null, 2));
      
      // Still call the mock API for demonstration purposes
      let mockResponse;
      try {
        const response = await this.client.put(`/appointments/${appointmentId}`, payload);
        mockResponse = response.data;
        console.log('✅ Mock API responded for update:', mockResponse);
      } catch (mockError) {
        console.warn('⚠️ Mock API update call failed, continuing with local update:', mockError.message);
      }

      // Create the updated appointment object
      const updatedAppointment: MockApiAppointment = {
        id: appointmentId,
        client_id: updates.clientId || payload.client_id,
        time: payload.time || (updates.appointmentDate && updates.appointmentTime ? 
              this.formatDateTime(updates.appointmentDate, updates.appointmentTime) : ''),
        duration: updates.duration,
        type: updates.type,
        notes: updates.notes,
        status: 'scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Remove undefined fields
      Object.keys(updatedAppointment).forEach(key => {
        if (updatedAppointment[key as keyof MockApiAppointment] === undefined) {
          delete updatedAppointment[key as keyof MockApiAppointment];
        }
      });

      console.log('✅ Appointment updated:', updatedAppointment);
      
      return updatedAppointment;
      
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
      
      // Still call the mock API for demonstration purposes
      try {
        await this.client.delete(`/appointments/${appointmentId}`);
        console.log('✅ Mock API responded for cancellation');
      } catch (mockError: any) {
        console.warn('⚠️ Mock API cancel call failed, continuing with local deletion:', mockError.message);
      }

      console.log('✅ Appointment cancellation processed');
      
    } catch (error) {
      console.error('❌ Error cancelling appointment:', error);
      throw new Error('Failed to cancel appointment via external API');
    }
  }

  /**
   * Generate a unique ID for appointments
   */
  private generateUniqueId(): string {
    // Generate a unique ID using timestamp + random string
    const timestamp = Date.now().toString(36); // Base36 timestamp
    const randomPart = Math.random().toString(36).substring(2, 8); // Random 6-char string
    return `appt_${timestamp}_${randomPart}`;
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