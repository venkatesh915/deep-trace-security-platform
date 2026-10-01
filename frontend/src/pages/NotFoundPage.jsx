import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
      <ShieldAlert size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>404 - Page Not Found</h2>
      <p style={{ color: '#64748b', margin: '0.75rem 0 2rem' }}>
        The requested resource or security endpoint does not exist.
      </p>
      <Link to="/dashboard" className="btn-primary" style={{ display: 'inline-flex' }}>
        <ArrowLeft size={16} />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};
