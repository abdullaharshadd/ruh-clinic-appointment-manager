import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  MagnifyingGlassIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import apiService from '../services/api.ts';
import LoadingSpinner from './LoadingSpinner.tsx';
import { ErrorMessage } from './ErrorMessage.tsx';

const ClientList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { 
    data: clients, 
    isLoading, 
    error,
    refetch 
  } = useQuery(
    ['clients', debouncedSearchTerm], 
    () => apiService.getClients(debouncedSearchTerm || undefined),
    {
      enabled: true,
    }
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load clients" onRetry={() => refetch()} />;
  }

  return (
    <div>
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600">Manage your client database</p>
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

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search clients by name, email, or phone..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Clients List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {!clients || clients.length === 0 ? (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm ? 'No clients found' : 'No clients yet'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Clients will appear here once they\'re synced from the external system'
              }
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button
                  onClick={() => refetch()}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Refresh Data
                </button>
              </div>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {clients.map((client) => (
              <li key={client.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {client.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 ml-4">
                        <div className="flex items-center space-x-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {client.name}
                            </p>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center text-sm text-gray-500">
                                <EnvelopeIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                                <span className="truncate">{client.email}</span>
                              </div>
                              {client.phone && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <PhoneIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                                  <span>{client.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          Joined {format(new Date(client.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <Link
                        to={`/appointments/new?clientId=${client.id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium"
                      >
                        Book Appointment
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {clients && clients.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          Showing {clients.length} client{clients.length !== 1 ? 's' : ''}
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      )}
    </div>
  );
};

export default ClientList;