import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Target,
  AlertOctagon,
  Users,
  FileText,
  LogOut,
  Building2,
  Menu,
  X,
  FlaskConical,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from '../components/Badge';
import { CrossTenantLabModal } from '../components/CrossTenantLabModal';
import './MainLayout.css';

export const MainLayout = () => {
  const { user, logout, canManageUsers, canAccessAuditLogs } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSecurityLabOpen, setIsSecurityLabOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close mobile sidebar on route transition
  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="layout-container">
      {/* Sidebar Overlay for Mobile */}
      {mobileMenuOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Left Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">
            <Shield size={24} className="brand-icon" />
          </div>
          <div className="brand-text">
            <span className="brand-title">DEEP TRACE</span>
            <span className="brand-subtitle">CYBERNETICS</span>
          </div>
        </div>

        {/* Active Tenant Box */}
        <div className="tenant-card">
          <div className="tenant-label">ACTIVE TENANT</div>
          <div className="tenant-name-row">
            <Building2 size={16} className="tenant-icon" />
            <span className="tenant-name">{user?.organizationName || 'CyberSecure India'}</span>
          </div>
          <div className="tenant-id-tag">TENANT ID: #{user?.organizationId || 1}</div>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            onClick={handleNavClick}
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/campaigns"
            onClick={handleNavClick}
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
          >
            <Target size={18} />
            <span>Campaigns</span>
          </NavLink>

          <NavLink
            to="/security-events"
            onClick={handleNavClick}
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
          >
            <AlertOctagon size={18} />
            <span>Security Events</span>
          </NavLink>

          {/* ADMIN Only */}
          {canManageUsers && (
            <NavLink
              to="/users"
              onClick={handleNavClick}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <Users size={18} />
              <span>Users</span>
            </NavLink>
          )}

          {/* ADMIN & MANAGER Only */}
          {canAccessAuditLogs && (
            <NavLink
              to="/audit-logs"
              onClick={handleNavClick}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <FileText size={18} />
              <span>Audit Logs</span>
            </NavLink>
          )}

          {/* Security Verification Lab */}
          <button
            type="button"
            className="nav-item nav-item-lab"
            onClick={() => {
              setIsSecurityLabOpen(true);
              setMobileMenuOpen(false);
            }}
          >
            <FlaskConical size={18} />
            <span>Cross-Tenant Lab</span>
            <span className="lab-badge">TEST</span>
          </button>
        </nav>

        {/* Bottom Profile Section */}
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <div className="user-meta">
                <RoleBadge role={user?.role} />
              </div>
            </div>
          </div>

          <button className="logout-button" onClick={handleLogout} title="Sign Out">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content View */}
      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="topbar-title-section">
              <h1 className="page-heading">
                {location.pathname.startsWith('/campaigns/')
                  ? 'Campaign Details'
                  : location.pathname.includes('/campaigns')
                  ? 'Campaign Management'
                  : location.pathname.includes('/security-events')
                  ? 'Security Events & Incidents'
                  : location.pathname.includes('/users')
                  ? 'User Management & Roles'
                  : location.pathname.includes('/audit-logs')
                  ? 'Tenant Audit Trail'
                  : 'Security Command Center'}
              </h1>
            </div>
          </div>

          <div className="topbar-right">
            <div className="tenant-isolation-pill">
              <CheckCircle2 size={15} className="text-success" />
              <span>Multi-Tenant Guard Active</span>
            </div>

            <button
              className="btn-secondary security-test-trigger-btn"
              onClick={() => setIsSecurityLabOpen(true)}
            >
              <FlaskConical size={16} />
              <span>Verify Cross-Tenant Isolation</span>
            </button>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>

      {/* Interactive Cross-Tenant Verification Modal */}
      <CrossTenantLabModal
        isOpen={isSecurityLabOpen}
        onClose={() => setIsSecurityLabOpen(false)}
      />
    </div>
  );
};
