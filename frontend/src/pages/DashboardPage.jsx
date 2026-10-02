import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Target,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Plus,
  ArrowRight,
  Clock,
  Building2,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { formatDateTime } from '../utils/formatters';
import './DashboardPage.css';

export const DashboardPage = () => {
  const { user, canManageCampaigns } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard');
      if (res.data.success) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="dashboard-page">
      {/* Welcome Banner */}
      <div className="dashboard-banner">
        <div className="banner-left">
          <div className="banner-badge">
            <Building2 size={15} />
            <span>ORGANIZATION TENANT CONTEXT</span>
          </div>
          <h2 className="banner-title">
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {user?.name?.split(' ')[0] || user?.name}
          </h2>
          <p className="banner-subtitle">
            Here's what's happening across <strong>{user?.organizationName}</strong> (Tenant ID #{user?.organizationId}).
            All displayed metrics, campaigns, and security events are strictly isolated to your organization.
          </p>
        </div>

        <div className="banner-actions">
          <button className="btn-secondary refresh-btn" onClick={fetchMetrics} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh Telemetry</span>
          </button>
          {canManageCampaigns && (
            <button className="btn-primary" onClick={() => navigate('/campaigns')}>
              <Plus size={16} />
              <span>Launch Campaign</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-danger">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Top 4 Metrics Cards */}
      <div className="metrics-grid">
        <StatCard
          title="Total Users"
          value={loading ? '...' : metrics?.users ?? 0}
          icon={Users}
          color="blue"
          description="Enrolled organization members"
        />

        <StatCard
          title="Active Campaigns"
          value={loading ? '...' : metrics?.campaigns ?? 0}
          icon={Target}
          color="purple"
          description={user?.role === 'USER' ? 'Assigned to your profile' : 'Total tenant initiatives'}
        />

        <StatCard
          title="Open Security Events"
          value={loading ? '...' : metrics?.openEvents ?? 0}
          icon={AlertTriangle}
          color="amber"
          description="Requiring investigation or resolution"
        />

        <StatCard
          title="Critical Incidents"
          value={loading ? '...' : metrics?.criticalEvents ?? 0}
          icon={Flame}
          color="red"
          description="Immediate containment priorities"
        />
      </div>

      {/* Main Grid: Recent Activity & Tenant Isolation Notice */}
      <div className="dashboard-content-grid">
        {/* Recent Activity Card */}
        <div className="card recent-activity-card">
          <div className="card-header-row">
            <div>
              <h3 className="section-title">Recent Tenant Activity &amp; Audit Trail</h3>
              <p className="section-subtitle">Real-time log of security events and administrative actions</p>
            </div>
            {user?.role !== 'USER' && (
              <button
                className="view-all-link"
                onClick={() => navigate('/audit-logs')}
              >
                <span>View Full Audit Log</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>

          <div className="activity-list">
            {loading ? (
              <div className="empty-state">Loading recent telemetry...</div>
            ) : metrics?.recentActivity?.length > 0 ? (
              metrics.recentActivity.map((item) => (
                <div key={item.id} className="activity-item">
                  <div className="activity-icon-bullet">
                    <Clock size={14} />
                  </div>
                  <div className="activity-info">
                    <div className="activity-desc">{item.description}</div>
                    <div className="activity-meta">
                      <span className="activity-action-tag">{item.action}</span>
                      {item.user && <span className="activity-user">{item.user.name} ({item.user.role})</span>}
                      <span className="activity-time">{formatDateTime(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No recent activity logged for this organization yet.</div>
            )}
          </div>
        </div>

        {/* Multi-Tenant Security Verification Card */}
        <div className="card security-posture-card">
          <div className="card-header-row">
            <h3 className="section-title">Zero-Trust Isolation Architecture</h3>
            <ShieldCheck size={20} className="text-success" />
          </div>

          <div className="posture-items">
            <div className="posture-item">
              <strong>Tenant Scoped Queries</strong>
              <p>Every SQL query automatically injects <code>organizationId = req.user.organizationId</code>.</p>
            </div>

            <div className="posture-item">
              <strong>IDOR Defense</strong>
              <p>Resources belonging to other tenants return <code>404 Not Found</code> without exposing resource existence.</p>
            </div>

            <div className="posture-item">
              <strong>Role Enforced API Gates</strong>
              <p>Backend middleware strictly enforces <code>ADMIN</code>, <code>MANAGER</code>, and <code>USER</code> boundaries.</p>
            </div>

            <div className="posture-item">
              <strong>State Machine Guards</strong>
              <p>Campaign status changes follow deterministic transition rules (e.g., terminal completed state).</p>
            </div>
          </div>

          <div className="security-quote">
            "Security by Design: Multi-tenancy is enforced deep in the database layer, never trusting the client."
          </div>
        </div>
      </div>
    </div>
  );
};
