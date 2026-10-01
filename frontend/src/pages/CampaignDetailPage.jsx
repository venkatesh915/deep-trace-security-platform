import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Target,
  Users,
  UserPlus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Shield,
  Layers,
  Building2,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, RoleBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { formatDateTime, formatDate } from '../utils/formatters';
import './CampaignDetailPage.css';

export const CampaignDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, canManageCampaigns, isAdmin } = useAuth();

  const [campaign, setCampaign] = useState(null);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [tenantUsers, setTenantUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState('');

  // Status transition state
  const [newStatus, setNewStatus] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchCampaignData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [campRes, usersRes] = await Promise.all([
        api.get(`/campaigns/${id}`),
        api.get(`/campaigns/${id}/users`),
      ]);

      if (campRes.data.success) {
        setCampaign(campRes.data.data);
        setNewStatus(campRes.data.data.status);
      }
      if (usersRes.data.success) {
        setAssignedUsers(usersRes.data.data);
      }
    } catch (err) {
      setError(
        err.response?.status === 404
          ? `Campaign #${id} was not found in your organization (${user?.organizationName}). Cross-tenant access is strictly blocked.`
          : err.friendlyMessage || 'Failed to fetch campaign details.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch tenant users for assignment modal
  const fetchTenantUsers = async () => {
    try {
      if (isAdmin) {
        const res = await api.get('/users?limit=100');
        if (res.data.success) {
          setTenantUsers(res.data.data);
        }
      }
    } catch (err) {
      console.warn('Could not fetch tenant users:', err);
    }
  };

  useEffect(() => {
    fetchCampaignData();
  }, [id]);

  useEffect(() => {
    if (isAssignModalOpen && isAdmin) {
      fetchTenantUsers();
    }
  }, [isAssignModalOpen]);

  // Handle status update
  const handleStatusChange = async (e) => {
    const updatedStatus = e.target.value;
    if (updatedStatus === campaign?.status) return;

    setStatusUpdating(true);
    setError(null);
    try {
      const res = await api.patch(`/campaigns/${id}`, { status: updatedStatus });
      if (res.data.success) {
        setCampaign(res.data.data);
        setNewStatus(res.data.data.status);
        setSuccessMessage(`Campaign status updated to ${updatedStatus}`);
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setError(err.friendlyMessage || 'Invalid status transition.');
      setNewStatus(campaign?.status); // revert select
    } finally {
      setStatusUpdating(false);
    }
  };

  // Assign user submit
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      setAssignError('Please select a user to assign.');
      return;
    }

    setAssignSubmitting(true);
    setAssignError('');
    try {
      const res = await api.post(`/campaigns/${id}/users/${selectedUserId}`);
      if (res.data.success) {
        setIsAssignModalOpen(false);
        setSelectedUserId('');
        setSuccessMessage('User successfully assigned to campaign!');
        setTimeout(() => setSuccessMessage(''), 4000);
        // Refresh users
        const usersRes = await api.get(`/campaigns/${id}/users`);
        if (usersRes.data.success) {
          setAssignedUsers(usersRes.data.data);
        }
      }
    } catch (err) {
      setAssignError(err.friendlyMessage || 'Failed to assign user.');
    } finally {
      setAssignSubmitting(false);
    }
  };

  // Remove user
  const handleRemoveUser = async (targetUserId) => {
    if (!window.confirm('Remove this user from the campaign?')) return;
    try {
      const res = await api.delete(`/campaigns/${id}/users/${targetUserId}`);
      if (res.data.success) {
        setSuccessMessage('User removed from campaign.');
        setTimeout(() => setSuccessMessage(''), 4000);
        setAssignedUsers(assignedUsers.filter((u) => u.id !== targetUserId));
      }
    } catch (err) {
      alert(err.friendlyMessage || 'Failed to remove user.');
    }
  };

  if (loading) {
    return <div className="detail-loading">Loading campaign information...</div>;
  }

  if (error) {
    return (
      <div className="detail-error-card card">
        <AlertCircle size={32} className="text-warning" />
        <h3>Access Blocked or Resource Missing</h3>
        <p>{error}</p>
        <div className="error-actions">
          <Link to="/campaigns" className="btn-primary">
            <ArrowLeft size={16} />
            <span>Return to Campaigns</span>
          </Link>
          <button
            className="btn-secondary"
            onClick={() => navigate(user?.organizationId === 1 ? '/campaigns/101' : '/campaigns/201')}
          >
            Load Permitted Campaign
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="campaign-detail-page">
      {/* Top back breadcrumb */}
      <div className="detail-header-nav">
        <Link to="/campaigns" className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Campaigns</span>
        </Link>
        <span className="tenant-crumb">
          <Building2 size={14} />
          {user?.organizationName} (Tenant #{user?.organizationId})
        </span>
      </div>

      {successMessage && (
        <div className="alert-banner alert-success">
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Campaign Overview Card */}
      <div className="card campaign-overview-card">
        <div className="overview-header">
          <div>
            <div className="campaign-id-badge">CAMPAIGN INITIATIVE #{campaign.id}</div>
            <h2 className="campaign-detail-title">{campaign.name}</h2>
          </div>

          <div className="status-control-box">
            <span className="status-label">Current State:</span>
            <StatusBadge status={campaign.status} />

            {canManageCampaigns && (
              <select
                className="status-select"
                value={newStatus}
                onChange={handleStatusChange}
                disabled={statusUpdating || campaign.status === 'COMPLETED' || campaign.status === 'CANCELLED'}
              >
                <option value="DRAFT">DRAFT</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            )}
          </div>
        </div>

        <div className="campaign-description-box">
          <h4>Description &amp; Objective</h4>
          <p>{campaign.description || 'No detailed description provided for this campaign.'}</p>
        </div>

        <div className="campaign-meta-grid">
          <div className="meta-item">
            <span className="meta-label">Created By</span>
            <span className="meta-value">{campaign.creator?.name || 'System Admin'}</span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Created On</span>
            <span className="meta-value">{formatDate(campaign.createdAt)}</span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Last Modified</span>
            <span className="meta-value">{formatDateTime(campaign.updatedAt)}</span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Organization Scope</span>
            <span className="meta-value">{user?.organizationName}</span>
          </div>
        </div>
      </div>

      {/* Campaign User Assignments Card */}
      <div className="card assignments-card">
        <div className="card-header-row">
          <div>
            <h3 className="section-title">Assigned Security Personnel ({assignedUsers.length})</h3>
            <p className="section-subtitle">
              Personnel enrolled in this initiative. Must strictly belong to {user?.organizationName}.
            </p>
          </div>

          {canManageCampaigns && (
            <button className="btn-primary" onClick={() => setIsAssignModalOpen(true)}>
              <UserPlus size={16} />
              <span>Assign Member</span>
            </button>
          )}
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Assigned Date</th>
                {canManageCampaigns && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {assignedUsers.length > 0 ? (
                assignedUsers.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <strong>{member.name}</strong>
                    </td>
                    <td>{member.email}</td>
                    <td>
                      <RoleBadge role={member.role} />
                    </td>
                    <td>{formatDateTime(member.assignedAt)}</td>
                    {canManageCampaigns && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="action-btn delete"
                          title="Remove from campaign"
                          onClick={() => handleRemoveUser(member.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canManageCampaigns ? 5 : 4} className="table-empty">
                    No users currently assigned to this campaign.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ASSIGN USER MODAL */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Organization Member to Campaign"
      >
        <form onSubmit={handleAssignSubmit} className="modal-form">
          {assignError && (
            <div className="alert-banner alert-danger">
              <AlertCircle size={16} />
              <span>{assignError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Select Tenant Member *</label>
            {isAdmin && tenantUsers.length > 0 ? (
              <select
                required
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">-- Choose User from {user?.organizationName} --</option>
                {tenantUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email}) — [{u.role}]
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                required
                placeholder="Enter User ID within your organization (e.g. 3)"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              />
            )}
            <span className="form-hint">
              Security Guarantee: Attempting to assign a User ID from another tenant will be rejected by backend isolation logic.
            </span>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsAssignModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={assignSubmitting}>
              {assignSubmitting ? 'Enrolling...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
