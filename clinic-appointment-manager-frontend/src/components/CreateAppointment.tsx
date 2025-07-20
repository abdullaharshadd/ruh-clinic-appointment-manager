import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { 
  CalendarDaysIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import apiService from '../services/api.ts';
import LoadingSpinner from './LoadingSpinner.tsx';
import {ErrorMessage} from './ErrorMessage.tsx';
import { CreateAppointmentRequest, APPOINTMENT_TYPES } from '../types/index.tsx';

interface FormData extends CreateAppointmentRequest {}

const CreateAppointment: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const preselectedClientId = searchParams.get('clientId');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    register, 
    handleSubmit, 
    watch,
    formState: { errors },
    setValue
  } = useForm<FormData>({
    defaultValues: {
      clientId: preselectedClientId || '',
      appointmentDate: format(new Date(), 'yyyy-MM-dd'),
      appointmentTime: '09:00',
      duration: 60,
      type: 'Consultation',
      notes: ''
    }
  });

  const selectedClientId = watch('clientId');

  // Fetch clients for dropdown
  const { 
    data: clients, 
    isLoading: clientsLoading, 
    error: clientsError 
  } = useQuery('clients', () => apiService.getClients());

  // Create appointment mutation
  const createMutation = useMutation(
    (appointmentData: CreateAppointmentRequest) => apiService.createAppointment(appointmentData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('appointments');
        queryClient.invalidateQueries('upcomingAppointments');
        navigate('/appointments');
      },
      onError: (error: any) => {
        console.error('Failed to create appointment:', error);
        setIsSubmitting(false);
      }
    }
  );

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync(data);
    } catch (error) {
      // Error handled in mutation
    }
  };

  if (clientsLoading) {
    return <LoadingSpinner />;
  }

  if (clientsError) {
    return <ErrorMessage message="Failed to load clients" />;
  }

  const selectedClient = clients?.find(client => client.id === selectedClientId);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Schedule New Appointment</h1>
        <p className="text-gray-600">Create a new appointment for a client</p>
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
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {selectedClient.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-900">
                    {selectedClient.name}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-blue-700">
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
                      const selectedDate = new Date(value);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return selectedDate >= today || 'Cannot schedule appointments in the past';
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

          {/* Error Message */}
          {createMutation.error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">
                Failed to create appointment. Please try again.
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
              {isSubmitting ? 'Creating...' : 'Create Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAppointment;