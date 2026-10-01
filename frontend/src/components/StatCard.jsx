import React from 'react';
import './StatCard.css';

export const StatCard = ({ title, value, icon: Icon, color = 'blue', description }) => {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        <div className={`stat-card-icon-wrapper icon-${color}`}>
          {Icon && <Icon size={20} />}
        </div>
      </div>
      <div className="stat-card-value">{value}</div>
      {description && <div className="stat-card-desc">{description}</div>}
    </div>
  );
};
