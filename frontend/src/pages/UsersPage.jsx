import React, { useState, useEffect } from 'react';
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Shield,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from '../components/Badge';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { formatDate } from '../utils/formatters';
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
      const res = await api.post('/users', formData);
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
        name: formData.name,
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
    if (targetUser.id === user?.id) {
      alert('Action Blocked: Self-deletion is prohibited for safety.');
      return;
    }
    setSelectedUser(targetUser);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    setFormSubmitting(true);
    try {
      const res = await api.delete(`/users/${selectedUser.id}`);
      if (res.data.success) {
        setIsDeleteModalOpen(false);
        setSuccessMessage('User deleted successfully.');
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
          <h2 className="page-title">User Management &amp; Access Control</h2>
          <p className="page-desc">
            Manage organization members, roles, and administrative privileges for {user?.organizationName}.
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
              placeholder="Search by name or email..."
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
                    <strong>{u.name}</strong>
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
                        className="action-btn edit"
                        title="Edit Role / Name"
                        onClick={() => handleOpenEdit(u)}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className="action-btn delete"
                        title="Delete User"
                        disabled={u.id === user?.id}
                        onClick={() => handleOpenDelete(u)}
                      >
                        <Trash2 size={15} />
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
        title="Provision New Organization User"
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
              <option value="USER">USER (Standard User / Member)</option>
              <option value="MANAGER">MANAGER (Campaign &amp; Security Manager)</option>
              <option value="ADMIN">ADMIN (Full Organization Administrator)</option>
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
        title={`Edit User: ${selectedUser?.email}`}
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
              {formSubmitting ? 'Saving...' : 'Update Role'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm User Deletion"
        maxWidth="450px"
      >
        <div className="modal-form">
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Are you sure you want to remove user <strong>"{selectedUser?.name}"</strong> ({selectedUser?.email})?
            This will immediately invalidate any future sessions for this user.
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
              {formSubmitting ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
