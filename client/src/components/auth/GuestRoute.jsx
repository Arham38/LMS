import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../ui/Spinner';

export const GuestRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    // Check if redirect location was preserved
    const redirectUrl = location.state?.from?.pathname;
    if (redirectUrl) {
      return <Navigate to={redirectUrl} replace />;
    }

    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/student/dashboard" replace />;
  }

  return children;
};

export default GuestRoute;
