import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { 
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import apiService from '../services/api.ts';
import LoadingSpinner from './LoadingSpinner.tsx';
import { ErrorMessage } from './ErrorMessage.tsx';
import { UpdateAppointmentRequest, AppointmentWithClient, APPOINTMENT_TYPES } from '../types/index.tsx';

interface FormData extends UpdateAppointmentRequest {}

interface EditAppointmentProps {
  appointment: AppointmentWithClient;
}

const EditAppointment: React.FC<EditAppointmentProps> = ({ appointment }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug: Log the received appointment prop
  console.log('🔍 EditAppointment received appointment prop:', appointment);

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const { 
    register, 
    handleSubmit, 
    watch,
    formState: { errors },
    setValue
  } = useForm<FormData>({
    defaultValues: {
      clientId: appointment?.clientId || '',
      appointmentDate: appointment?.appointmentDate || '',
      appointmentTime: appointment?.appointmentTime?.substring(0, 5) || '', // Remove seconds
      duration: appointment?.duration || 60,
      type: appointment?.type || 'Consultation',
      notes: appointment?.notes || ''
    }
  });

  const selectedClientId = watch('clientId');

  // Fetch clients for dropdown
  const { 
    data: clients, 
    isLoading: clientsLoading, 
    error: clientsError 
  } = useQuery('clients', () => apiService.getClients());

  // Update appointment mutation
  const updateMutation = useMutation(
    (appointmentData: UpdateAppointmentRequest) => {
      console.log('📤 Sending update request:', appointmentData);
      return apiService.updateAppointment(appointment?.id || '', appointmentData);
    },
    {
      onSuccess: (data) => {
        console.log('✅ Appointment updated successfully:', data);
        queryClient.invalidateQueries('appointments');
        queryClient.invalidateQueries('upcomingAppointments');
        queryClient.invalidateQueries(['appointment', appointment?.id]);
        navigate('/appointments');
      },
      onError: (error: any) => {
        console.error('❌ Failed to update appointment:', error);
        setIsSubmitting(false);
      }
    }
  );

  // NOW WE CAN DO EARLY RETURNS AFTER ALL HOOKS ARE CALLED

  // Early return if appointment is not provided
  if (!appointment) {
    console.error('❌ EditAppointment: appointment prop is undefined');
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Error</h2>
          <p className="mt-2 text-gray-600">
            Appointment data is not available.
          </p>
          <button
            onClick={() => navigate('/appointments')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  // Validate required appointment fields
  if (!appointment.id || !appointment.clientId) {
    console.error('❌ EditAppointment: appointment missing required fields:', {
      id: appointment.id,
      clientId: appointment.clientId,
      fullAppointment: appointment
    });
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Invalid Appointment</h2>
          <p className="mt-2 text-gray-600">
            This appointment is missing required information.
          </p>
          <div className="mt-4 p-4 bg-red-50 rounded-lg text-left">
            <pre className="text-sm text-red-800">
              Missing fields:
              - ID: {appointment.id || 'MISSING'}
              - Client ID: {appointment.clientId || 'MISSING'}
            </pre>
          </div>
          <button
            onClick={() => navigate('/appointments')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  if (clientsLoading) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <LoadingSpinner />
        <p className="text-center mt-4 text-gray-600">Loading clients...</p>
      </div>
    );
  }

  if (clientsError) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <ErrorMessage message="Failed to load clients" />
        <button
          onClick={() => navigate('/appointments')}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium block mx-auto"
        >
          Back to Appointments
        </button>
      </div>
    );
  }

  // Form submission handler
  const onSubmit = async (data: FormData) => {
    console.log('📝 Form submitted with data:', data);
    setIsSubmitting(true);
    try {
      await updateMutation.mutateAsync(data);
    } catch (error) {
      console.error('❌ Submit error:', error);
    }
  };

  // Debug form values
  console.log('🔍 Form default values:', {
    clientId: appointment.clientId,
    appointmentDate: appointment.appointmentDate,
    appointmentTime: appointment.appointmentTime,
    duration: appointment.duration,
    type: appointment.type,
    notes: appointment.notes
  });

  const selectedClient = clients?.find(client => client.id === selectedClientId);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <PencilSquareIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Appointment</h1>
            <p className="text-gray-600">Modify appointment details</p>
          </div>
        </div>
        
        {/* Current Appointment Info */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-gray-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {appointment.clientName?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Current: {appointment.clientName || 'Unknown Client'}
                </p>
                <p className="text-sm text-gray-500">
                  {appointment.appointmentDate && format(new Date(appointment.appointmentDate), 'MMM d, yyyy')} at{' '}
                  {appointment.appointmentTime?.substring(0, 5)} • {appointment.duration} min • {appointment.type}
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              ID: #{appointment.id}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          {/* Client Selection */}
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
              Client *
            </label>
            <select
              id="clientId"
              {...register('clientId', { required: 'Please select a client' })}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">Select a client...</option>
              {clients?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.email})
                </option>
              ))}
            </select>
            {errors.clientId && (
              <p className="mt-2 text-sm text-red-600">{errors.clientId.message}</p>
            )}
          </div>

          {/* Selected Client Info */}
          {selectedClient && (
            <div className={`${selectedClient.id === appointment.clientId ? 'bg-blue-50' : 'bg-yellow-50'} rounded-lg p-4`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`h-10 w-10 ${selectedClient.id === appointment.clientId ? 'bg-blue-500' : 'bg-yellow-500'} rounded-full flex items-center justify-center`}>
                    <span className="text-sm font-medium text-white">
                      {selectedClient.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${selectedClient.id === appointment.clientId ? 'text-blue-900' : 'text-yellow-900'}`}>
                    {selectedClient.name}
                    {selectedClient.id !== appointment.clientId && (
                      <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                        CHANGED
                      </span>
                    )}
                  </p>
                  <div className={`flex items-center space-x-4 text-sm ${selectedClient.id === appointment.clientId ? 'text-blue-700' : 'text-yellow-700'}`}>
                    <span>{selectedClient.email}</span>
                    {selectedClient.phone && <span>{selectedClient.phone}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700">
                Date *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="appointmentDate"
                  {...register('appointmentDate', { 
                    required: 'Date is required',
                    validate: (value) => {
                      if (!value) return 'Date is required';
                      
                      const selectedDate = new Date(value);
                      const today = new Date();
                      const originalDate = new Date(appointment.appointmentDate);
                      today.setHours(0, 0, 0, 0);
                      
                      // Allow original date even if it's in the past
                      if (value === appointment.appointmentDate) {
                        return true;
                      }
                      
                      return selectedDate >= today || 'Cannot reschedule to a past date';
                    }
                  })}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {errors.appointmentDate && (
                <p className="mt-2 text-sm text-red-600">{errors.appointmentDate.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="appointmentTime" className="block text-sm font-medium text-gray-700">
                Time *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="time"
                  id="appointmentTime"
                  {...register('appointmentTime', { required: 'Time is required' })}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {errors.appointmentTime && (
                <p className="mt-2 text-sm text-red-600">{errors.appointmentTime.message}</p>
              )}
            </div>
          </div>

          {/* Duration and Type */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                Duration (minutes) *
              </label>
              <select
                id="duration"
                {...register('duration', { 
                  required: 'Duration is required',
                  valueAsNumber: true
                })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
              {errors.duration && (
                <p className="mt-2 text-sm text-red-600">{errors.duration.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Appointment Type *
              </label>
              <select
                id="type"
                {...register('type', { required: 'Appointment type is required' })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                {APPOINTMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-2 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              {...register('notes')}
              placeholder="Add any additional notes about this appointment..."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Changes Summary */}
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <PencilSquareIcon className="h-5 w-5 text-amber-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">
                  Review Your Changes
                </h3>
                <p className="mt-1 text-sm text-amber-700">
                  Please review all changes before updating the appointment. The client may need to be notified of any schedule changes.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {updateMutation.error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">
                Failed to update appointment. Please try again.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/appointments')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAppointment;