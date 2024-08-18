import { Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Component } from 'react';
export default function PrivateRoute({ element, ...rest }) {
  const { currentUser } = useAuth();

  return currentUser ? children : <Navigate to="/" />;
}
