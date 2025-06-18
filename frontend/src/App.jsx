import React from 'react';
import {
  MantineProvider,
  Container,
} from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import UserTable from './components/UserTable';
import LoginPage from './components/LoginPage';
import CalendarView from './components/CalendarView';
const queryClient = new QueryClient();

// PrivateRoute wrapper to protect routes
function PrivateRoute({ children }) {
  const user = localStorage.getItem('user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider withGlobalStyles withNormalizeCSS>
        <Notifications position="top-right" />
        <BrowserRouter>
          <Container
            size="xl"
            fluid
            px={0}
            py={0}
            m={0}
            style={{
              marginTop: 0,
              paddingTop: 0,
              paddingBottom: 0,
            }}
          >
            <Routes key={localStorage.getItem('user') || 'guest'}>
              {/* Public route */}
              <Route
                path="/login"
                element={
                  localStorage.getItem('user') ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <LoginPage />
                  )
                }
              />

              {/* Protected route */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <UserTable />
                  </PrivateRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/login" replace />} />
              
            </Routes>
          </Container>
        </BrowserRouter>
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;
