import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  PlusIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import apiService from '../services/api.ts';
import LoadingSpinner from './LoadingSpinner.tsx';
import { ErrorMessage } from './ErrorMessage.tsx';
import { Appointment } from '../types';

const AppointmentList: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'today'>('all');
  const queryClient = useQueryClient();

  const { 
    data: appointments, 
    isLoading, 
    error,
    refetch 
  } = useQuery(
    'appointments', 
    () => apiService.getAppointments()
  );

  const cancelMutation = useMutation(
    (appointmentId: string) => apiService.cancelAppointment(appointmentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('appointments');
        queryClient.invalidateQueries('upcomingAppointments');
      },
      onError: (error) => {
        console.error('Failed to cancel appointment:', error);
        alert('Failed to cancel appointment. Please try again.');
      }
    }
  );

  const handleCancelAppointment = (appointmentId: string, clientName: string) => {
    if (window.confirm(`Are you sure you want to cancel the appointment for ${clientName}?`)) {
      cancelMutation.mutate(appointmentId);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load appointments" onRetry={() => refetch()} />;
  }

  // Filter appointments
  const today = format(new Date(), 'yyyy-MM-dd');
  const filteredAppointments = appointments?.filter(appointment => {
    if (filter === 'today') {
      return format(new Date(appointment.appointmentDate), 'yyyy-MM-dd') === today;
    }
    if (filter === 'upcoming') {
      return new Date(appointment.appointmentDate) >= new Date() && appointment.status === 'scheduled';
    }
    return true; // 'all'
  }) || [];

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'scheduled':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">Manage client appointments and schedules</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/appointments/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium inline-flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Appointment
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'all', label: 'All Appointments' },
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'today', label: 'Today' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`${
                  filter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.label}
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {appointments?.filter(apt => {
                    if (tab.key === 'today') {
                      return format(new Date(apt.appointmentDate), 'yyyy-MM-dd') === today;
                    }
                    if (tab.key === 'upcoming') {
                      return new Date(apt.appointmentDate) >= new Date() && apt.status === 'scheduled';
                    }
                    return true;
                  }).length || 0}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No appointments found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'today' 
                ? 'No appointments scheduled for today'
                : filter === 'upcoming'
                ? 'No upcoming appointments'
                : 'No appointments in the system yet'
              }
            </p>
            <div className="mt-6">
              <Link
                to="/appointments/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Schedule First Appointment
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredAppointments.map((appointment) => (
              <li key={appointment.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {appointment.clientName?.charAt(0) || '?'}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 ml-4">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {appointment.clientName || 'Unknown Client'}
                            </p>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center text-sm text-gray-500">
                                <CalendarDaysIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                                <span>
                                  {format(new Date(appointment.appointmentDate), 'MMM dd, yyyy')}
                                </span>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                                <span>{appointment.appointmentTime}</span>
                              </div>
                              <div className="text-sm text-gray-500">
                                {appointment.duration} minutes
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-sm text-gray-600">
                                {appointment.type}
                              </span>
                              <span className={getStatusBadge(appointment.status)}>
                                {appointment.status}
                              </span>
                            </div>
                            {appointment.notes && (
                              <p className="text-sm text-gray-500 mt-1">
                                Notes: {appointment.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      {appointment.status === 'scheduled' && (
                        <>
                          <button
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-xs font-medium inline-flex items-center"
                            onClick={() => {
                              // This would open an edit modal in a real app
                              alert('Edit functionality would be implemented here');
                            }}
                          >
                            <PencilIcon className="h-3 w-3 mr-1" />
                            Edit
                          </button>
                          <button
                            className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-md text-xs font-medium inline-flex items-center"
                            onClick={() => handleCancelAppointment(appointment.id.toString(), appointment.clientName || 'Unknown')}
                            disabled={cancelMutation.isLoading}
                          >
                            <XMarkIcon className="h-3 w-3 mr-1" />
                            {cancelMutation.isLoading ? 'Cancelling...' : 'Cancel'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Results count */}
      {filteredAppointments.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          Showing {filteredAppointments.length} appointment{filteredAppointments.length === 1 ? '' : 's'}
        </div>
      )}
    </div>
  );
};

export default AppointmentList;