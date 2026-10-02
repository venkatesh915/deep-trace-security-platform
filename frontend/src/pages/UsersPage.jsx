import React, { useState, useEffect } from 'react';
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Shield,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Lock,
  Building2,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from '../components/Badge';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { formatDate, formatDateTime } from '../utils/formatters';
import './UsersPage.css';

export const UsersPage = () => {
  const { user, isAdmin } = useAuth();

  const [usersList, setUsersList] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Forms state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
  });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // If not admin, RBAC blocks access
  if (!isAdmin) {
    return (
      <div className="card rbac-blocked-card">
        <Lock size={32} className="text-warning" />
        <h3>Access Restricted (403 Forbidden)</h3>
        <p>
          User management is strictly limited to users with the <strong>ADMIN</strong> role.
          Your current active role is <strong>{user?.role}</strong>.
        </p>
      </div>
    );
  }

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 10, search };
      const res = await api.get('/users', { params });
      if (res.data.success) {
        setUsersList(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to fetch users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // Open View Details
  const handleOpenView = (targetUser) => {
    setSelectedUser(targetUser);
    setIsViewModalOpen(true);
  };

  // Open Create
  const handleOpenCreate = () => {
    setFormData({ name: '', email: '', password: '', role: 'USER' });
    setFormError('');
    setIsCreateModalOpen(true);
  };

  // Submit Create
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setFormError('All fields are required.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');
    try {
      // Send only required fields without id or organizationId (server enforces tenant from JWT)
      const res = await api.post('/users', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      });
      if (res.data.success) {
        setIsCreateModalOpen(false);
        setSuccessMessage(`User ${res.data.data.email} provisioned successfully!`);
        setTimeout(() => setSuccessMessage(''), 4000);
        fetchUsers();
      }
    } catch (err) {
      setFormError(err.friendlyMessage || 'Failed to create user.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Edit
  const handleOpenEdit = (targetUser) => {
    setSelectedUser(targetUser);
    setFormData({
      name: targetUser.name,
      role: targetUser.role,
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');
    try {
      const res = await api.patch(`/users/${selectedUser.id}`, {
        name: formData.name.trim(),
        role: formData.role,
      });
      if (res.data.success) {
        setIsEditModalOpen(false);
        setSuccessMessage(`User ${selectedUser.email} updated successfully!`);
        setTimeout(() => setSuccessMessage(''), 4000);
        fetchUsers();
      }
    } catch (err) {
      setFormError(err.friendlyMessage || 'Failed to update user.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Delete
  const handleOpenDelete = (targetUser) => {
    setSelectedUser(targetUser);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    setFormSubmitting(true);
    try {
      const res = await api.delete(`/users/${selectedUser.id}`);
      if (res.data.success) {
        setIsDeleteModalOpen(false);
        setSuccessMessage(`User ${selectedUser.email} removed from organization.`);
        setTimeout(() => setSuccessMessage(''), 4000);
        fetchUsers();
      }
    } catch (err) {
      alert(err.friendlyMessage || 'Failed to delete user.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="users-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">User Management</h2>
          <p className="page-desc">
            Manage organization users and access roles.
          </p>
        </div>

        <button className="btn-primary" onClick={handleOpenCreate}>
          <UserPlus size={16} />
          <span>Provision User</span>
        </button>
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

      {/* Filter Card */}
      <div className="card filter-card">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search users by name or email address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary">
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Full Name</th>
              <th>Email Address</th>
              <th>Assigned Role</th>
              <th>Created Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="table-empty">
                  Loading users...
                </td>
              </tr>
            ) : usersList.length > 0 ? (
              usersList.map((u) => (
                <tr key={u.id}>
                  <td>
                    <span className="code-id">#{u.id}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="entity-link-btn"
                      onClick={() => handleOpenView(u)}
                      title={`View details for ${u.name}`}
                    >
                      {u.name}
                    </button>
                    {u.id === user?.id && <span className="you-pill">YOU</span>}
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <RoleBadge role={u.role} />
                  </td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="actions-cell">
                      <button
                        type="button"
                        className="btn-action btn-action-view"
                        title="View User Details"
                        onClick={() => handleOpenView(u)}
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                      <button
                        type="button"
                        className="btn-action btn-action-edit"
                        title="Edit User Role"
                        onClick={() => handleOpenEdit(u)}
                      >
                        <Edit2 size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className="btn-action btn-action-delete"
                        title="Delete User"
                        disabled={u.id === user?.id}
                        onClick={() => handleOpenDelete(u)}
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="table-empty">
                  No users found matching query.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
      </div>

      {/* CREATE USER MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Provision User"
      >
        <form onSubmit={handleCreateSubmit} className="modal-form">
          {formError && (
            <div className="alert-banner alert-danger">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Vikram Malhotra"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@tenant1.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Initial Password * (min 6 characters)</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Role Assignment *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="USER">USER (Standard Member)</option>
              <option value="MANAGER">MANAGER (Campaign &amp; Incident Manager)</option>
              <option value="ADMIN">ADMIN (Full Tenant Administrator)</option>
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
              {formSubmitting ? 'Provisioning...' : 'Provision User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit User Profile — ${selectedUser?.name}`}
      >
        <form onSubmit={handleEditSubmit} className="modal-form">
          {formError && (
            <div className="alert-banner alert-danger">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Assigned Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="USER">USER</option>
              <option value="MANAGER">MANAGER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
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
              {formSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW USER DETAILS MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="User Details & Access Scope"
        maxWidth="500px"
      >
        {selectedUser && (
          <div className="modal-form">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>User ID</label>
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>#{selectedUser.id}</div>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Role Scope</label>
                <div><RoleBadge role={selectedUser.role} /></div>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Full Name</label>
                <div style={{ fontWeight: 600 }}>{selectedUser.name}</div>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Email Address</label>
                <div style={{ fontSize: '0.875rem' }}>{selectedUser.email}</div>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Organization</label>
                <div style={{ fontSize: '0.85rem' }}>Tenant ID #{selectedUser.organizationId}</div>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Enrolled On</label>
                <div style={{ fontSize: '0.85rem' }}>{formatDate(selectedUser.createdAt)}</div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenEdit(selectedUser);
                }}
              >
                <Edit2 size={14} />
                <span>Edit User</span>
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete User?"
        maxWidth="460px"
      >
        <div className="modal-form">
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Are you sure you want to delete user <strong>"{selectedUser?.name}"</strong> ({selectedUser?.email})?
            <br /><br />
            <span style={{ color: '#b91c1c', fontWeight: 600 }}>This action cannot be undone.</span>
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
              <Trash2 size={14} />
              <span>{formSubmitting ? 'Deleting...' : 'Delete User'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
