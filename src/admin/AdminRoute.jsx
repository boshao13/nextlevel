import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from './api';

const AdminRoute = ({ children }) => {
  const [status, setStatus] = useState('loading'); // loading | ok | denied

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      setStatus('denied');
      return;
    }

    api
      .get('/me')
      .then(() => setStatus('ok'))
      .catch(() => {
        localStorage.removeItem('admin_token');
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

  return children;
};

export default AdminRoute;
