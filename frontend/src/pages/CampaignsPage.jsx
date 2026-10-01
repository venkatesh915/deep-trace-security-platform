import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Target,
  AlertCircle,
  Users,
  CheckCircle2,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/Badge';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { formatDate } from '../utils/formatters';
import './CampaignsPage.css';

export const CampaignsPage = () => {
  const { user, canManageCampaigns } = useAuth();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Search & Filter state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'DRAFT',
  });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 8,
        search,
        status: statusFilter,
        sortBy,
        sortOrder,
      };

      const res = await api.get('/campaigns', { params });
      if (res.data.success) {
        setCampaigns(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to retrieve campaigns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [page, statusFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCampaigns();
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({ name: '', description: '', status: 'DRAFT' });
    setFormError('');
    setIsCreateModalOpen(true);
  };

  // Submit Create
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Campaign name is required.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');
    try {
      const res = await api.post('/campaigns', formData);
      if (res.data.success) {
        setIsCreateModalOpen(false);
        setSuccessMessage('Campaign created successfully!');
        setTimeout(() => setSuccessMessage(''), 4000);
        fetchCampaigns();
      }
    } catch (err) {
      setFormError(err.friendlyMessage || 'Failed to create campaign.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (campaign) => {
    setSelectedCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      status: campaign.status,
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Campaign name cannot be empty.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');
    try {
      const res = await api.patch(`/campaigns/${selectedCampaign.id}`, formData);
      if (res.data.success) {
        setIsEditModalOpen(false);
        setSuccessMessage('Campaign updated successfully!');
        setTimeout(() => setSuccessMessage(''), 4000);
        fetchCampaigns();
      }
    } catch (err) {
      setFormError(err.friendlyMessage || 'Failed to update campaign.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (campaign) => {
    setSelectedCampaign(campaign);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    setFormSubmitting(true);
    try {
      const res = await api.delete(`/campaigns/${selectedCampaign.id}`);
      if (res.data.success) {
        setIsDeleteModalOpen(false);
        setSuccessMessage('Campaign deleted successfully.');
        setTimeout(() => setSuccessMessage(''), 4000);
        fetchCampaigns();
      }
    } catch (err) {
      alert(err.friendlyMessage || 'Failed to delete campaign.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="campaigns-page">
      {/* Top action bar */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Security Campaigns</h2>
          <p className="page-desc">
            {user?.role === 'USER'
              ? 'Security awareness and compliance campaigns assigned to your profile.'
              : `Manage organization campaigns for ${user?.organizationName}.`}
          </p>
        </div>

        {canManageCampaigns && (
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>New Campaign</span>
          </button>
        )}
      </div>

      {/* Notifications */}
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

      {/* Filter and Search Bar */}
      <div className="card filter-card">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by campaign name or description..."
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
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Sort By:</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
            >
              <option value="createdAt">Created Date</option>
              <option value="name">Campaign Name</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Order:</label>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setPage(1);
              }}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Campaign Name</th>
              <th>Status</th>
              <th>Assigned Users</th>
              <th>Created By</th>
              <th>Created Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="table-empty">
                  Loading campaigns...
                </td>
              </tr>
            ) : campaigns.length > 0 ? (
              campaigns.map((camp) => (
                <tr key={camp.id}>
                  <td>
                    <span className="code-id">#{camp.id}</span>
                  </td>
                  <td>
                    <div className="campaign-name-cell">
                      <div className="campaign-name">{camp.name}</div>
                      {camp.description && (
                        <div className="campaign-desc-sub">{camp.description}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={camp.status} />
                  </td>
                  <td>
                    <div className="assignments-cell">
                      <Users size={14} />
                      <span>{camp._count?.assignments ?? 0} Assigned</span>
                    </div>
                  </td>
                  <td>
                    <span className="creator-text">
                      {camp.creator ? camp.creator.name : 'System'}
                    </span>
                  </td>
                  <td>{formatDate(camp.createdAt)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="actions-cell">
                      <button
                        className="action-btn view"
                        title="View Details & Assignments"
                        onClick={() => navigate(`/campaigns/${camp.id}`)}
                      >
                        <Eye size={15} />
                      </button>

                      {canManageCampaigns && (
                        <>
                          <button
                            className="action-btn edit"
                            title="Edit Campaign"
                            onClick={() => handleOpenEdit(camp)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="action-btn delete"
                            title="Delete Campaign"
                            onClick={() => handleOpenDelete(camp)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="table-empty">
                  No campaigns found matching your query.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Server-side Pagination */}
        <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
      </div>

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Launch New Security Campaign"
      >
        <form onSubmit={handleCreateSubmit} className="modal-form">
          {formError && (
            <div className="alert-banner alert-danger">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Campaign Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Q1 Phishing Awareness Simulation"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Explain the scope and purpose of this security initiative..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Initial Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="DRAFT">DRAFT</option>
              <option value="ACTIVE">ACTIVE</option>
            </select>
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
              {formSubmitting ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Campaign #${selectedCampaign?.id}`}
      >
        <form onSubmit={handleEditSubmit} className="modal-form">
          {formError && (
            <div className="alert-banner alert-danger">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Campaign Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status (State Machine Guard)</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="DRAFT">DRAFT</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <span className="form-hint">
              Transitions enforced: DRAFT → ACTIVE/CANCELLED, ACTIVE → COMPLETED/CANCELLED.
            </span>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={formSubmitting}>
              {formSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Campaign Deletion"
        maxWidth="450px"
      >
        <div className="modal-form">
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Are you sure you want to permanently delete campaign{' '}
            <strong>"{selectedCampaign?.name}"</strong> (ID #{selectedCampaign?.id})?
            This will also delete associated user assignments and generate an audit log.
          </p>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger"
              onClick={handleDeleteConfirm}
              disabled={formSubmitting}
            >
              {formSubmitting ? 'Deleting...' : 'Delete Campaign'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
