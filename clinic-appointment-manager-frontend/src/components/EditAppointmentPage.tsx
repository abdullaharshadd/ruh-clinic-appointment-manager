import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import EditAppointment from './EditAppointment.tsx';
import LoadingSpinner from './LoadingSpinner.tsx';
import { ErrorMessage } from './ErrorMessage.tsx';
import apiService from '../services/api.ts';

const EditAppointmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Debug logging
  console.log('🔍 EditAppointmentPage - Appointment ID from params:', id);

  const { 
    data: appointment, 
    isLoading, 
    error,
    refetch 
  } = useQuery(
    ['appointment', id],
    async () => {
      if (!id) {
        throw new Error('No appointment ID provided');
      }
      
      console.log('📥 Fetching appointment with ID:', id);
      const result = await apiService.getAppointment(id);
      console.log('📥 Appointment data received:', result);
      return result;
    },
    { 
      enabled: !!id,
      retry: 3,
      onError: (error) => {
        console.error('❌ Error loading appointment:', error);
      }
    }
  );

  // Handle loading state
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading appointment...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <ErrorMessage 
          message={`Failed to load appointment${id ? ` (ID: ${id})` : ''}`}
          onRetry={() => refetch()}
        />
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/appointments')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  // Handle missing appointment
  if (!appointment) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Appointment Not Found</h2>
          <p className="mt-2 text-gray-600">
            The appointment you're looking for doesn't exist or may have been deleted.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/appointments')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Back to Appointments
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Debug: Log the appointment data before passing to EditAppointment
  console.log('📋 Passing appointment to EditAppointment:', {
    id: appointment.id,
    clientId: appointment.clientId,
    clientName: appointment.clientName,
    appointmentDate: appointment.appointmentDate,
    appointmentTime: appointment.appointmentTime,
    fullData: appointment
  });

  // Validate required fields before passing to EditAppointment
  if (!appointment.id || !appointment.clientId) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Invalid Appointment Data</h2>
          <p className="mt-2 text-gray-600">
            This appointment is missing required information.
          </p>
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <pre className="text-sm text-red-800">
              {JSON.stringify(appointment, null, 2)}
            </pre>
          </div>
          <div className="mt-6">
            <button
              onClick={() => navigate('/appointments')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Back to Appointments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <EditAppointment appointment={appointment} />;
};

export default EditAppointmentPage;