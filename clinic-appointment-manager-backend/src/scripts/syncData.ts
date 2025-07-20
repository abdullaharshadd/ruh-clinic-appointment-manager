import cron from 'node-cron';
import apiWrapper from '../services/apiWrapper';
import dataService from '../services/dataService';

export const syncData = async (): Promise<void> => {
  try {
    console.log('Starting data synchronization...');
    const startTime = Date.now();
    
    // Fetch data from external API
    const [clients, appointments] = await Promise.all([
      apiWrapper.fetchClients(),
      apiWrapper.fetchAppointments()
    ]);
    
    console.log(`Fetched ${clients.length} clients and ${appointments.length} appointments from API`);
    
    // Sync to database
    await Promise.all([
      dataService.upsertClients(clients),
      dataService.upsertAppointments(appointments)
    ]);
    
    const duration = Date.now() - startTime;
    console.log(`Data synchronization completed in ${duration}ms`);
  } catch (error) {
    console.error('Error during data synchronization:', error);
    // In production, you might want to send alerts or notifications here
  }
};

// Schedule automatic sync every 15 minutes
export const startPeriodicSync = () => {
  console.log('Starting periodic data synchronization...');
  
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('Running scheduled sync...');
    await syncData();
  });
  
  // Run initial sync on startup
  setTimeout(async () => {
    console.log('Running initial sync...');
    await syncData();
  }, 5000); // Wait 5 seconds after server start
};

// If this script is run directly
if (require.main === module) {
  syncData()
    .then(() => {
      console.log('Manual sync completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Manual sync failed:', error);
      process.exit(1);
    });
}