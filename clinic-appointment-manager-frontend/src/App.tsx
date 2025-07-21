import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard.tsx';
import ClientList from './components/ClientList.tsx';
import AppointmentList from './components/AppointmentList.tsx';
import CreateAppointment from './components/CreateAppointment.tsx';
import EditAppointmentPage from './components/EditAppointmentPage.tsx';
import Layout from './components/Layout.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clients" element={<ClientList />} />
              <Route path="/appointments" element={<AppointmentList />} />
              <Route path="/appointments/new" element={<CreateAppointment />} />
              <Route path="/appointments/:id/edit" element={<EditAppointmentPage />} />
            </Routes>
          </Layout>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;