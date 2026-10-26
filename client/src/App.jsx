import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { ToastProvider } from './components/ui';
import { AuthProvider } from './context/AuthContext';

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
