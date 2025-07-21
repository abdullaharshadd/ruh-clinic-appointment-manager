import pool from '../database/db';
import { Client, Appointment, MockApiClient, MockApiAppointment, AppointmentWithClient } from '../types/index';
import ApiWrapper from './apiWrapper';

class DataService {
  // =====================
  // CLIENT OPERATIONS
  // =====================
  
  async getAllClients(): Promise<Client[]> {
    const query = `
      SELECT id, name, email, phone, date_of_birth as "dateOfBirth", 
             created_at as "createdAt", updated_at as "updatedAt"
      FROM clients 
      ORDER BY name ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async getClientById(id: string): Promise<Client | null> {
    const query = `
      SELECT id, name, email, phone, date_of_birth as "dateOfBirth", 
             created_at as "createdAt", updated_at as "updatedAt"
      FROM clients 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Sync clients from Mock API to local database with enhanced validation
   */
  async upsertClients(clients: MockApiClient[]): Promise<void> {
    console.log('🔍 DEBUG: Raw clients data from API:', JSON.stringify(clients, null, 2));
    
    // Filter out invalid clients
    const validClients = clients.filter((client, index) => {
      const isValid = client && 
                     typeof client.id === 'string' && 
                     client.id.trim() !== '' &&
                     typeof client.name === 'string' &&
                     client.name.trim() !== '' &&
                     typeof client.email === 'string' &&
                     client.email.trim() !== '';
      
      if (!isValid) {
        console.warn(`⚠️  Skipping invalid client at index ${index}:`, client);
      }
      
      return isValid;
    });

    console.log(`✅ Filtered ${validClients.length} valid clients out of ${clients.length} total`);

    if (validClients.length === 0) {
      console.log('❌ No valid clients to sync');
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const clientData of validClients) {
        console.log(`📝 Processing client: ${clientData.id} - ${clientData.name}`);
        
        const query = `
          INSERT INTO clients (id, name, email, phone, date_of_birth, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            date_of_birth = EXCLUDED.date_of_birth,
            updated_at = EXCLUDED.updated_at
        `;
        
        const now = new Date().toISOString();
        
        await client.query(query, [
          clientData.id.trim(),
          clientData.name.trim(),
          clientData.email.trim(),
          clientData.phone?.trim() || null,
          clientData.date_of_birth || null,
          clientData.created_at || now,
          clientData.updated_at || now
        ]);
      }
      
      await client.query('COMMIT');
      console.log(`✅ Successfully synced ${validClients.length} clients to database`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error syncing clients:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async searchClients(searchTerm: string): Promise<Client[]> {
    const query = `
      SELECT id, name, email, phone, date_of_birth as "dateOfBirth", 
             created_at as "createdAt", updated_at as "updatedAt"
      FROM clients 
      WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1
      ORDER BY name ASC
    `;
    const result = await pool.query(query, [`%${searchTerm}%`]);
    return result.rows;
  }

  // =====================
  // APPOINTMENT OPERATIONS
  // =====================

  async getAllAppointments(): Promise<AppointmentWithClient[]> {
    const query = `
      SELECT a.id, a.client_id as "clientId", a.appointment_date as "appointmentDate",
             a.appointment_time as "appointmentTime", a.duration, a.type, a.status, a.notes,
             a.created_at as "createdAt", a.updated_at as "updatedAt",
             c.name as "clientName"
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      ORDER BY a.appointment_date DESC, a.appointment_time ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async getUpcomingAppointments(): Promise<AppointmentWithClient[]> {
    const query = `
      SELECT a.id, a.client_id as "clientId", a.appointment_date as "appointmentDate",
             a.appointment_time as "appointmentTime", a.duration, a.type, a.status, a.notes,
             a.created_at as "createdAt", a.updated_at as "updatedAt",
             c.name as "clientName"
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      WHERE a.appointment_date >= CURRENT_DATE AND a.status = 'scheduled'
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
      LIMIT 20
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async getAppointmentById(id: string): Promise<Appointment | null> {
    const query = `
      SELECT id, client_id as "clientId", appointment_date as "appointmentDate",
             appointment_time as "appointmentTime", duration, type, status, notes,
             created_at as "createdAt", updated_at as "updatedAt"
      FROM appointments 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Sync appointments from Mock API to local database with enhanced validation
   */
  async upsertAppointments(appointments: MockApiAppointment[]): Promise<void> {
    console.log('🔍 DEBUG: Raw appointments data from API:', JSON.stringify(appointments, null, 2));
    
    // Filter out invalid appointments
    const validAppointments = appointments.filter((appointment, index) => {
      const hasId = appointment && typeof appointment.id === 'string' && appointment.id.trim() !== '';
      const hasClientId = appointment && typeof appointment.client_id === 'string' && appointment.client_id.trim() !== '';
      const hasTime = appointment && typeof appointment.time === 'string' && appointment.time.trim() !== '';
      
      const isValid = hasId && hasClientId && hasTime;
      
      if (!isValid) {
        console.warn(`⚠️  Skipping invalid appointment at index ${index}:`, {
          id: appointment?.id,
          client_id: appointment?.client_id,
          time: appointment?.time,
          hasId,
          hasClientId,
          hasTime
        });
      }
      
      return isValid;
    });

    console.log(`✅ Filtered ${validAppointments.length} valid appointments out of ${appointments.length} total`);

    if (validAppointments.length === 0) {
      console.log('❌ No valid appointments to sync');
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const appointment of validAppointments) {
        console.log(`📝 Processing appointment: ${appointment.id} for client ${appointment.client_id}`);
        
        // Convert API 'time' field to separate date and time for database
        const { date, time } = this.parseApiDateTime(appointment.time);
        
        console.log(`🕒 Converted time "${appointment.time}" to date: ${date}, time: ${time}`);
        
        const query = `
          INSERT INTO appointments (id, client_id, appointment_date, appointment_time, 
                                  duration, type, status, notes, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO UPDATE SET
            client_id = EXCLUDED.client_id,
            appointment_date = EXCLUDED.appointment_date,
            appointment_time = EXCLUDED.appointment_time,
            duration = EXCLUDED.duration,
            type = EXCLUDED.type,
            status = EXCLUDED.status,
            notes = EXCLUDED.notes,
            updated_at = EXCLUDED.updated_at
        `;
        
        const now = new Date().toISOString();
        
        await client.query(query, [
          appointment.id.trim(),
          appointment.client_id.trim(),
          date,
          time,
          appointment.duration || 60, // Default 60 minutes
          appointment.type || 'consultation',
          appointment.status || 'scheduled',
          appointment.notes || null,
          appointment.created_at || now,
          appointment.updated_at || now
        ]);
      }
      
      await client.query('COMMIT');
      console.log(`✅ Successfully synced ${validAppointments.length} appointments to database`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error syncing appointments:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create appointment locally (typically after creating via API)
   */
  async createAppointment(appointment: MockApiAppointment): Promise<void> {
    if (!appointment.id || !appointment.client_id || !appointment.time) {
      throw new Error('Invalid appointment data: missing required fields');
    }

    // Convert API 'time' field to separate date and time for database
    const { date, time } = this.parseApiDateTime(appointment.time);
    
    const query = `
      INSERT INTO appointments (id, client_id, appointment_date, appointment_time, 
                              duration, type, status, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
    
    const now = new Date().toISOString();
    
    await pool.query(query, [
      appointment.id,
      appointment.client_id,
      date,
      time,
      appointment.duration || 60,
      appointment.type || 'consultation',
      appointment.status || 'scheduled',
      appointment.notes || null,
      appointment.created_at || now,
      appointment.updated_at || now
    ]);
    
    console.log(`✅ Created appointment ${appointment.id} in database`);
  }

  // =====================
  // SYNC OPERATIONS
  // =====================

  /**
   * Sync both clients and appointments from Mock API
   */
  async syncDataFromApi(): Promise<{ clientsCount: number; appointmentsCount: number }> {
    try {
      console.log('🔄 Starting data sync from Mock API...');
      
      // Fetch data from Mock API
      const [clients, appointments] = await Promise.all([
        ApiWrapper.fetchClients(),
        ApiWrapper.fetchAppointments()
      ]);

      console.log(`📊 API Response Summary:`);
      console.log(`   - Clients: ${clients?.length || 0}`);
      console.log(`   - Appointments: ${appointments?.length || 0}`);

      // Validate we got expected data structure
      if (!Array.isArray(clients)) {
        console.error('❌ Clients response is not an array:', clients);
        throw new Error('Invalid clients response format');
      }

      if (!Array.isArray(appointments)) {
        console.error('❌ Appointments response is not an array:', appointments);
        throw new Error('Invalid appointments response format');
      }

      // Sync to database
      await Promise.all([
        this.upsertClients(clients),
        this.upsertAppointments(appointments)
      ]);

      console.log('✅ Data sync completed successfully');
      return {
        clientsCount: clients.length,
        appointmentsCount: appointments.length
      };
    } catch (error) {
      console.error('❌ Data sync failed:', error);
      throw new Error('Failed to sync data from Mock API');
    }
  }

  // =====================
  // HELPER METHODS
  // =====================

  /**
   * Parse datetime string from API to separate date and time
   * Enhanced with better error handling and logging
   */
  private parseApiDateTime(dateTimeString: string): { date: string; time: string } {
    console.log('🔍 Parsing datetime:', dateTimeString);
    
    if (!dateTimeString || typeof dateTimeString !== 'string') {
      console.error('❌ Invalid datetime input:', dateTimeString);
      const now = new Date();
      return {
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0]
      };
    }

    try {
      const dateTime = new Date(dateTimeString);
      
      // Ensure the date is valid
      if (isNaN(dateTime.getTime())) {
        throw new Error('Invalid date string');
      }
      
      const date = dateTime.toISOString().split('T')[0]; // YYYY-MM-DD
      const time = dateTime.toTimeString().split(' ')[0]; // HH:MM:SS
      
      console.log(`✅ Parsed "${dateTimeString}" to date: ${date}, time: ${time}`);
      return { date, time };
    } catch (error: any) {
      console.error('❌ Error parsing datetime:', dateTimeString, error.message);
      
      // Fallback to current date/time
      const now = new Date();
      const fallbackDate = now.toISOString().split('T')[0];
      const fallbackTime = now.toTimeString().split(' ')[0];
      
      console.warn(`⚠️  Using fallback datetime: ${fallbackDate} ${fallbackTime}`);
      return {
        date: fallbackDate,
        time: fallbackTime
      };
    }
  }

  /**
   * Format database date and time back to API format
   */
  private formatToApiDateTime(date: string, time: string): string {
    try {
      const dateTime = new Date(`${date}T${time}`);
      return dateTime.toISOString();
    } catch (error) {
      console.error('❌ Error formatting datetime:', { date, time }, error);
      return new Date().toISOString();
    }
  }
}

export default new DataService();