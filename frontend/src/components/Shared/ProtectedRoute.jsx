import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, token }) {
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}