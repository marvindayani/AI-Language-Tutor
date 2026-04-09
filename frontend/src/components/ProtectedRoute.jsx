import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-indigo-600 font-medium">Loading...</div>;

  return user ? children : <Navigate to="/auth" />;
};

export default ProtectedRoute;
