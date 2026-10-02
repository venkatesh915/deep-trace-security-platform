import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Lock,
  Clock,
  Shield,
  CheckCircle2,
  AlertCircle,
  Eye,
  Building2,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { formatDateTime } from '../utils/formatters';
import './AuditLogsPage.css';

export const AuditLogsPage = () => {
  const { user, canAccessAuditLogs } = useAuth();

  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Details modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // Frontend RBAC Protection (backed up by backend 403 API response)
  if (!canAccessAuditLogs) {
    return (
      <div className="card rbac-blocked-card">
        <Lock size={32} className="text-warning" />
        <h3>Access Restricted (403 Forbidden)</h3>
        <p>
          Audit logs contain sensitive forensic and administrative telemetry and are restricted to{' '}
          <strong>ADMIN</strong> and <strong>MANAGER</strong> roles.
          Your current active role is <strong>{user?.role}</strong>.
        </p>
      </div>
    );
  }

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10,
        action: actionFilter,
        search,
      };

      const res = await api.get('/audit-logs', { params });
      if (res.data.success) {
        setLogs(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to retrieve audit trail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, actionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAuditLogs();
  };

  const handleOpenDetails = (log) => {
    setSelectedLog(log);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="audit-logs-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Audit Logs</h2>
          <p className="page-desc">
            Review important actions performed within your organization.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-danger">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Card */}
      <div className="card filter-card">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search audit trail by description, action, or entity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary">
            Search
          </button>
        </form>

        <div className="filter-group">
          <div className="filter-item">
            <label>Action Type:</label>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Actions</option>
              <option value="LOGIN">LOGIN</option>
              <option value="FAILED_LOGIN">FAILED_LOGIN</option>
              <option value="CREATE_CAMPAIGN">CREATE_CAMPAIGN</option>
              <option value="UPDATE_CAMPAIGN">UPDATE_CAMPAIGN</option>
              <option value="DELETE_CAMPAIGN">DELETE_CAMPAIGN</option>
              <option value="ASSIGN_USER">ASSIGN_USER</option>
              <option value="REMOVE_USER">REMOVE_USER</option>
              <option value="CREATE_USER">CREATE_USER</option>
              <option value="UPDATE_USER">UPDATE_USER</option>
              <option value="DELETE_USER">DELETE_USER</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Action</th>
              <th>Actor / User</th>
              <th>Entity</th>
              <th>Entity ID</th>
              <th>Description</th>
              <th>Timestamp</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="table-empty">
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <span className="code-id">#{log.id}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="entity-link-btn"
                      onClick={() => handleOpenDetails(log)}
                      title={`View audit details #${log.id}`}
                    >
                      <span
                        className={`audit-action-pill ${
                          log.action.includes('FAILED') || log.action.includes('DELETE')
                            ? 'action-danger'
                            : log.action.includes('CREATE')
                            ? 'action-success'
                            : 'action-info'
                        }`}
                      >
                        {log.action}
                      </span>
                    </button>
                  </td>
                  <td>
                    {log.user ? (
                      <div className="actor-cell">
                        <span className="actor-name">{log.user.name}</span>
                        <span className="actor-email">{log.user.email}</span>
                      </div>
                    ) : (
                      <span className="system-actor">System / External</span>
                    )}
                  </td>
                  <td>
                    <span className="entity-tag">{log.entity}</span>
                  </td>
                  <td>
                    <span className="entity-id-tag">{log.entityId || '—'}</span>
                  </td>
                  <td>
                    <div className="audit-desc-cell">{log.description}</div>
                  </td>
                  <td className="audit-time-cell">{formatDateTime(log.createdAt)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="actions-cell">
                      <button
                        type="button"
                        className="btn-action btn-action-view"
                        onClick={() => handleOpenDetails(log)}
                        title="View Full Audit Telemetry"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="table-empty">
                  No audit log records found matching your query.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Server-side Pagination */}
        <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
      </div>

      {/* AUDIT LOG DETAILS MODAL */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Audit Trail Record #${selectedLog?.id}`}
        maxWidth="560px"
      >
        {selectedLog && (
          <div className="modal-form">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Action Type</label>
                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{selectedLog.action}</div>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Target Entity</label>
                <div><span className="entity-tag">{selectedLog.entity}</span> (ID: {selectedLog.entityId || 'N/A'})</div>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Actor Identity</label>
                <div style={{ fontSize: '0.85rem' }}>
                  {selectedLog.user ? `${selectedLog.user.name} (${selectedLog.user.email})` : 'System Automated / Anonymous'}
                </div>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Recorded Timestamp</label>
                <div style={{ fontSize: '0.85rem' }}>{formatDateTime(selectedLog.createdAt)}</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Audit Event Description</label>
              <div style={{
                padding: '0.85rem',
                backgroundColor: '#f8fafc',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: 'var(--text-main)',
                lineHeight: 1.6,
              }}>
                {selectedLog.description}
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
