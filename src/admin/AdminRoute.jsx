import React, { useEffect, useState, createContext, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import api from './api';

const AuthContext = createContext({ role: 'admin' });
export const useAuth = () => useContext(AuthContext);

const AdminRoute = ({ children }) => {
  const [status, setStatus] = useState('loading');
  const [role, setRole] = useState('admin');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      setStatus('denied');
      return;
    }

    api
      .get('/me')
      .then((res) => {
        setRole(res.data.role || 'admin');
        localStorage.setItem('admin_role', res.data.role || 'admin');
        setStatus('ok');
      })
      .catch(() => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_role');
        setStatus('denied');
      });
  }, []);

  if (status === 'loading') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontSize: '1rem',
          color: '#666',
        }}
      >
        Verifying access...
      </div>
    );
  }

  if (status === 'denied') {
    return <Navigate to="/admin/login" replace />;
  }

  return <AuthContext.Provider value={{ role }}>{children}</AuthContext.Provider>;
};

export default AdminRoute;
