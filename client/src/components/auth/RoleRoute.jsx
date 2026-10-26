import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../ui/Spinner';

export const RoleRoute = ({ allowedRoles = [], children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect students attempting to access admin back to student dashboard
    if (user.role === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    }
    // Redirect admins attempting to access student portal to admin dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default RoleRoute;
