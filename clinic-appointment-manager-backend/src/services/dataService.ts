import pool from '../database/db';
import { Client, Appointment, MockApiClient, MockApiAppointment } from '../types/index';

class DataService {
  // Client operations
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

  async upsertClients(clients: MockApiClient[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const clientData of clients) {
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
        
        await client.query(query, [
          clientData.id,
          clientData.name,
          clientData.email,
          clientData.phone,
          clientData.date_of_birth || null,
          clientData.created_at,
          clientData.updated_at
        ]);
      }
      
      await client.query('COMMIT');
      console.log(`Synced ${clients.length} clients`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Appointment operations
  async getAllAppointments(): Promise<(Appointment & { clientName: string })[]> {
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

  async getUpcomingAppointments(): Promise<(Appointment & { clientName: string })[]> {
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

  async upsertAppointments(appointments: MockApiAppointment[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const appointment of appointments) {
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
        
        await client.query(query, [
          appointment.id,
          appointment.client_id,
          appointment.appointment_date,
          appointment.appointment_time,
          appointment.duration,
          appointment.type,
          appointment.status || 'scheduled',
          appointment.notes || null,
          appointment.created_at,
          appointment.updated_at
        ]);
      }
      
      await client.query('COMMIT');
      console.log(`Synced ${appointments.length} appointments`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async createAppointment(appointment: MockApiAppointment): Promise<void> {
    const query = `
      INSERT INTO appointments (id, client_id, appointment_date, appointment_time, 
                              duration, type, status, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
    
    await pool.query(query, [
      appointment.id,
      appointment.client_id,
      appointment.appointment_date,
      appointment.appointment_time,
      appointment.duration,
      appointment.type,
      appointment.status || 'scheduled',
      appointment.notes || null,
      appointment.created_at,
      appointment.updated_at
    ]);
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
}

export default new DataService();