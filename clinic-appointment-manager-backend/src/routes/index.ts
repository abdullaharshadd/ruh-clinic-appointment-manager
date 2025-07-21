import express, { Request, Response } from 'express';
import dataService from '../services/dataService';
import apiWrapper from '../services/apiWrapper';
import { CreateAppointmentRequest } from '../types';

const router = express.Router();

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Client routes
router.get('/clients', async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    
    let clients;
    if (search && typeof search === 'string') {
      clients = await dataService.searchClients(search);
    } else {
      clients = await dataService.getAllClients();
    }
    
    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clients'
    });
  }
});

router.get('/clients/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const client = await dataService.getClientById(id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client'
    });
  }
});

// Appointment routes
router.get('/appointments', async (req: Request, res: Response) => {
  try {
    const appointments = await dataService.getAllAppointments();
    
    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments'
    });
  }
});

router.get('/appointments/upcoming', async (req: Request, res: Response) => {
  try {
    const appointments = await dataService.getUpcomingAppointments();
    
    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming appointments'
    });
  }
});

router.get('/appointments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const appointment = await dataService.getAppointmentById(id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment'
    });
  }
});

router.post('/appointments', async (req: Request, res: Response) => {
  try {
    const appointmentData: CreateAppointmentRequest = req.body;
    
    // Validate required fields
    if (!appointmentData.clientId || !appointmentData.appointmentDate || 
        !appointmentData.appointmentTime || !appointmentData.duration || 
        !appointmentData.type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: clientId, appointmentDate, appointmentTime, duration, type'
      });
    }
    
    // Verify client exists
    const client = await dataService.getClientById(appointmentData.clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    // Create appointment via external API
    const createdAppointment = await apiWrapper.createAppointment(appointmentData);
    
    // Store in local database
    await dataService.createAppointment(createdAppointment);
    
    res.status(201).json({
      success: true,
      data: createdAppointment,
      message: 'Appointment created successfully'
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment'
    });
  }
});


/**
 * Update appointment
 * PUT /api/appointments/:id
 */
router.put('/appointments/:id', async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const updates: UpdateAppointmentRequest = req.body;
    
    console.log(`📝 Updating appointment ${appointmentId}:`, JSON.stringify(updates, null, 2));
    
    // Validate appointment exists
    const existingAppointment = await dataService.getAppointmentById(appointmentId);
    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }
    
    // Call mock API (for demonstration)
    try {
      await apiWrapper.updateAppointment(appointmentId, updates);
      console.log('✅ Mock API update call completed');
    } catch (mockError: any) {
      console.warn('⚠️ Mock API update failed, continuing with database update:', mockError.message);
    }
    
    // Update in database
    await dataService.updateAppointment(appointmentId, updates);
    
    // Get updated appointment with client name
    const updatedAppointment = await dataService.getAppointmentById(appointmentId);
    
    res.json({
      success: true,
      data: updatedAppointment,
      message: 'Appointment updated successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Error updating appointment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update appointment'
    });
  }
});

/**
 * Delete appointment  
 * DELETE /api/appointments/:id
 */
router.delete('/appointments/:id', async (req, res) => {
  try {
    const appointmentId = req.params.id;
    
    console.log(`🗑️ Deleting appointment ${appointmentId}`);
    
    // Validate appointment exists
    const existingAppointment = await dataService.getAppointmentById(appointmentId);
    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }
    
    // Call mock API (for demonstration)
    try {
      await apiWrapper.cancelAppointment(appointmentId);
      console.log('✅ Mock API cancel call completed');
    } catch (mockError) {
      console.warn('⚠️ Mock API cancel failed, continuing with database deletion:', mockError.message);
    }
    
    // Delete from database
    await dataService.deleteAppointment(appointmentId);
    
    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Error deleting appointment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete appointment'
    });
  }
});

// Sync route (manual trigger)
router.post('/sync', async (req: Request, res: Response) => {
  try {
    // Fetch data from external API
    const [clients, appointments] = await Promise.all([
      apiWrapper.fetchClients(),
      apiWrapper.fetchAppointments()
    ]);
    
    // Sync to database
    await Promise.all([
      dataService.upsertClients(clients),
      dataService.upsertAppointments(appointments)
    ]);
    
    res.json({
      success: true,
      message: `Sync completed: ${clients.length} clients, ${appointments.length} appointments`
    });
  } catch (error) {
    console.error('Error during sync:', error);
    res.status(500).json({
      success: false,
      message: 'Sync failed'
    });
  }
});

export default router;