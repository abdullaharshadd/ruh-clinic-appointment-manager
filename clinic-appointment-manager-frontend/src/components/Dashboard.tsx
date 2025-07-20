import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  UserGroupIcon, 
  CalendarDaysIcon, 
  ClockIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import apiService from '../services/api.ts';
import LoadingSpinner from './LoadingSpinner.tsx';
import { ErrorMessage } from './ErrorMessage.tsx';

const Dashboard: React.FC = () => {
  const { 
    data: clients, 
    isLoading: clientsLoading, 
    error: clientsError 
  } = useQuery('clients', () => apiService.getClients());

  const { 
    data: upcomingAppointments, 
    isLoading: appointmentsLoading, 
    error: appointmentsError 
  } = useQuery('upcomingAppointments', () => apiService.getUpcomingAppointments());

  if (clientsLoading || appointmentsLoading) {
    return <LoadingSpinner />;
  }

  if (clientsError || appointmentsError) {
    return <ErrorMessage message="Failed to load dashboard data" />;
  }

  const stats = [
    {
      name: 'Total Clients',
      value: clients?.length || 0,
      icon: UserGroupIcon,
      href: '/clients',
    },
    {
      name: 'Upcoming Appointments',
      value: upcomingAppointments?.length || 0,
      icon: CalendarDaysIcon,
      href: '/appointments',
    },
    {
      name: 'Today\'s Appointments',
      value: upcomingAppointments?.filter(apt => 
        format(new Date(apt.appointmentDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
      ).length || 0,
      icon: ClockIcon,
      href: '/appointments',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to the wellness platform admin panel</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              to={stat.href}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Upcoming Appointments
            </h3>
            <Link
              to="/appointments/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium inline-flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Schedule New
            </Link>
          </div>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          {!upcomingAppointments || upcomingAppointments.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No upcoming appointments
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Schedule a new appointment to get started
              </p>
              <div className="mt-6">
                <Link
                  to="/appointments/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  New Appointment
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.slice(0, 5).map((appointment) => (
                <div 
                  key={appointment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {appointment.clientName?.charAt(0) || '?'}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {appointment.clientName || 'Unknown Client'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {appointment.type} • {appointment.duration} minutes
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(appointment.appointmentDate), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {appointment.appointmentTime}
                    </p>
                  </div>
                </div>
              ))}
              
              {upcomingAppointments.length > 5 && (
                <div className="text-center pt-4">
                  <Link
                    to="/appointments"
                    className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                  >
                    View all appointments →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;