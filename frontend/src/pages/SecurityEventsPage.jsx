import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SeverityBadge, StatusBadge } from '../components/Badge';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { formatDateTime } from '../utils/formatters';
import './SecurityEventsPage.css';

export const SecurityEventsPage = () => {
  const { user, canManageCampaigns } = useAuth();

  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Filters state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    eventType: 'SUSPICIOUS_ACTIVITY',
    severity: 'HIGH',
    status: 'OPEN',
    description: '',
  });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 8,
        search,
        severity: severityFilter,
        status: statusFilter,
        eventType: eventTypeFilter,
      };

      const res = await api.get('/security-events', { params });
      if (res.data.success) {
        setEvents(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load security events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, severityFilter, statusFilter, eventTypeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  // Create Event Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      setFormError('Description is required.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');
    try {
      const res = await api.post('/security-events', formData);
      if (res.data.success) {
        setIsCreateModalOpen(false);
        setFormData({
          eventType: 'SUSPICIOUS_ACTIVITY',
          severity: 'HIGH',
          status: 'OPEN',
          description: '',
        });
        setSuccessMessage('Security event reported and audit logged!');
        setTimeout(() => setSuccessMessage(''), 4000);
        fetchEvents();
      }
    } catch (err) {
      setFormError(err.friendlyMessage || 'Failed to record event.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Update Modal
  const handleOpenUpdate = (event) => {
    setSelectedEvent(event);
    setFormData({
      status: event.status,
      severity: event.severity,
      description: event.description,
    });
    setFormError('');
    setIsUpdateModalOpen(true);
  };

  // Update Event Submit
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');
    try {
      const res = await api.patch(`/security-events/${selectedEvent.id}`, {
        status: formData.status,
        severity: formData.severity,
      });
      if (res.data.success) {
        setIsUpdateModalOpen(false);
        setSuccessMessage(`Event #${selectedEvent.id} updated successfully!`);
        setTimeout(() => setSuccessMessage(''), 4000);
        fetchEvents();
      }
    } catch (err) {
      setFormError(err.friendlyMessage || 'Failed to update event.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="security-events-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Security Events &amp; Incidents</h2>
          <p className="page-desc">
            Continuous threat telemetry and security incidents recorded for {user?.organizationName}.
          </p>
        </div>

        {canManageCampaigns && (
          <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} />
            <span>Report Event</span>
          </button>
        )}
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="alert-banner alert-success">
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="alert-banner alert-danger">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card filter-card">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search event descriptions or telemetry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary">
            Filter
          </button>
        </form>

        <div className="filter-group">
          <div className="filter-item">
            <label>Severity:</label>
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Type:</label>
            <select
              value={eventTypeFilter}
              onChange={(e) => {
                setEventTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Types</option>
              <option value="MALWARE">MALWARE</option>
              <option value="SUSPICIOUS_ACTIVITY">SUSPICIOUS_ACTIVITY</option>
              <option value="UNAUTHORIZED_ACCESS">UNAUTHORIZED_ACCESS</option>
              <option value="DATA_ACCESS">DATA_ACCESS</option>
              <option value="FAILED_LOGIN">FAILED_LOGIN</option>
              <option value="LOGIN">LOGIN</option>
              <option value="SYSTEM_ALERT">SYSTEM_ALERT</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Event Type</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Description</th>
              <th>Timestamp</th>
              {canManageCampaigns && <th style={{ textAlign: 'right' }}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="table-empty">
                  Loading security events...
                </td>
              </tr>
            ) : events.length > 0 ? (
              events.map((ev) => (
                <tr key={ev.id}>
                  <td>
                    <span className="code-id">#{ev.id}</span>
                  </td>
                  <td>
                    <span className="event-type-badge">{ev.eventType}</span>
                  </td>
                  <td>
                    <SeverityBadge severity={ev.severity} />
                  </td>
                  <td>
                    <StatusBadge status={ev.status} />
                  </td>
                  <td>
                    <div className="event-desc-cell">{ev.description}</div>
                  </td>
                  <td className="event-time-cell">{formatDateTime(ev.createdAt)}</td>
                  {canManageCampaigns && (
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-secondary update-event-btn"
                        onClick={() => handleOpenUpdate(ev)}
                      >
                        Update
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="table-empty">
                  No security events recorded matching your query.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Server-side Pagination */}
        <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
      </div>

      {/* CREATE EVENT MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Report New Security Event"
      >
        <form onSubmit={handleCreateSubmit} className="modal-form">
          {formError && (
            <div className="alert-banner alert-danger">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Event Type *</label>
            <select
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
            >
              <option value="SUSPICIOUS_ACTIVITY">SUSPICIOUS_ACTIVITY</option>
              <option value="MALWARE">MALWARE</option>
              <option value="UNAUTHORIZED_ACCESS">UNAUTHORIZED_ACCESS</option>
              <option value="DATA_ACCESS">DATA_ACCESS</option>
              <option value="FAILED_LOGIN">FAILED_LOGIN</option>
              <option value="SYSTEM_ALERT">SYSTEM_ALERT</option>
              <option value="LOGIN">LOGIN</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Severity Level *</label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description &amp; Incident Telemetry *</label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide IP, affected asset, detection signature, or forensic notes..."
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={formSubmitting}>
              {formSubmitting ? 'Submitting...' : 'Log Security Incident'}
            </button>
          </div>
        </form>
      </Modal>

      {/* UPDATE EVENT MODAL */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title={`Update Incident Status #${selectedEvent?.id}`}
      >
        <form onSubmit={handleUpdateSubmit} className="modal-form">
          {formError && (
            <div className="alert-banner alert-danger">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Incident Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="OPEN">OPEN</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Severity</label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsUpdateModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={formSubmitting}>
              {formSubmitting ? 'Saving...' : 'Update Event'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
