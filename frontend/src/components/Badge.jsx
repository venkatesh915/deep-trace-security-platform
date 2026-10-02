import React from 'react';
import './Badge.css';

export const RoleBadge = ({ role }) => {
  let badgeClass = 'badge-role-user';
  if (role === 'ADMIN') badgeClass = 'badge-role-admin';
  if (role === 'MANAGER') badgeClass = 'badge-role-manager';

  return <span className={`badge ${badgeClass}`}>{role || 'USER'}</span>;
};

export const SeverityBadge = ({ severity }) => {
  let badgeClass = 'badge-sev-low';
  if (severity === 'CRITICAL') badgeClass = 'badge-sev-critical';
  if (severity === 'HIGH') badgeClass = 'badge-sev-high';
  if (severity === 'MEDIUM') badgeClass = 'badge-sev-medium';

  return (
    <span className={`badge ${badgeClass}`}>
      <span className="badge-dot">●</span>
      <span>{severity}</span>
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  let badgeClass = 'badge-status-neutral';
  if (status === 'ACTIVE' || status === 'RESOLVED') badgeClass = 'badge-status-success';
  if (status === 'DRAFT' || status === 'INVESTIGATING') badgeClass = 'badge-status-warning';
  if (status === 'COMPLETED') badgeClass = 'badge-status-info';
  if (status === 'CANCELLED' || status === 'OPEN') badgeClass = 'badge-status-danger';

  return (
    <span className={`badge ${badgeClass}`}>
      <span className="badge-dot">●</span>
      <span>{status}</span>
    </span>
  );
};
