import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Home,
  Target,
  AlertOctagon,
  Users,
  FileText,
  LogOut,
  Building2,
  Menu,
  X,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from '../components/Badge';
import './MainLayout.css';

export const MainLayout = () => {
  const { user, logout, canManageUsers, canAccessAuditLogs } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Close user dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close mobile sidebar on route transition
  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  // Compute breadcrumb / page title
  const getPageInfo = () => {
    if (location.pathname.startsWith('/campaigns/')) {
      return { section: 'Campaigns', title: 'Campaign Details', path: '/campaigns' };
    }
    if (location.pathname.includes('/campaigns')) {
      return { section: 'Operations', title: 'Campaign Management', path: '/campaigns' };
    }
    if (location.pathname.includes('/security-events')) {
      return { section: 'Threat Telemetry', title: 'Security Events & Incidents', path: '/security-events' };
    }
    if (location.pathname.includes('/users')) {
      return { section: 'Administration', title: 'User Management & Roles', path: '/users' };
    }
    if (location.pathname.includes('/audit-logs')) {
      return { section: 'Governance', title: 'Tenant Audit Trail', path: '/audit-logs' };
    }
    if (location.pathname.includes('/profile')) {
      return { section: 'Account', title: 'User Profile & Identity', path: '/profile' };
    }
    return { section: 'Overview', title: 'Security Command Center', path: '/dashboard' };
  };

  const pageInfo = getPageInfo();

  return (
    <div className={`layout-container ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      {/* Sidebar Overlay for Mobile */}
      {mobileMenuOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Collapsible Left Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand-container">
          <div
            className="sidebar-brand"
            onClick={() => navigate('/dashboard')}
            title="Deep Trace Cybernetics — Return to Home"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/dashboard')}
          >
            <div className="brand-logo">
              <Shield size={22} className="brand-icon" />
            </div>
            {!sidebarCollapsed && (
              <div className="brand-text">
                <span className="brand-title">DEEP TRACE</span>
                <span className="brand-subtitle">CYBERNETICS</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Active Tenant Box */}
        {!sidebarCollapsed ? (
          <div className="tenant-card">
            <div className="tenant-label">ACTIVE TENANT</div>
            <div className="tenant-name-row">
              <Building2 size={16} className="tenant-icon" />
              <span className="tenant-name">{user?.organizationName || 'CyberSecure India'}</span>
            </div>
            <div className="tenant-id-tag">TENANT ID: #{user?.organizationId || 1}</div>
          </div>
        ) : (
          <div className="tenant-card-mini" title={`Tenant: ${user?.organizationName} (#${user?.organizationId})`}>
            <Building2 size={18} className="tenant-icon" />
          </div>
        )}

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            onClick={handleNavClick}
            title="Home"
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
          >
            <Home size={18} />
            {!sidebarCollapsed && <span>Home</span>}
          </NavLink>

          <NavLink
            to="/campaigns"
            onClick={handleNavClick}
            title="Campaigns"
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
          >
            <Target size={18} />
            {!sidebarCollapsed && <span>Campaigns</span>}
          </NavLink>

          <NavLink
            to="/security-events"
            onClick={handleNavClick}
            title="Security Events"
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
          >
            <AlertOctagon size={18} />
            {!sidebarCollapsed && <span>Security Events</span>}
          </NavLink>

          {/* ADMIN Only */}
          {canManageUsers && (
            <NavLink
              to="/users"
              onClick={handleNavClick}
              title="Users"
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <Users size={18} />
              {!sidebarCollapsed && <span>Users</span>}
            </NavLink>
          )}

          {/* ADMIN & MANAGER Only */}
          {canAccessAuditLogs && (
            <NavLink
              to="/audit-logs"
              onClick={handleNavClick}
              title="Audit Logs"
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <FileText size={18} />
              {!sidebarCollapsed && <span>Audit Logs</span>}
            </NavLink>
          )}
        </nav>

        {/* Bottom Profile Section */}
        <div className="sidebar-footer">
          <div
            className="user-profile"
            title={`View Profile: ${user?.name} (${user?.role})`}
            onClick={() => navigate('/profile')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/profile')}
            style={{ cursor: 'pointer' }}
          >
            <div className="user-avatar">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
            {!sidebarCollapsed && (
              <div className="user-details">
                <span className="user-name">{user?.name}</span>
                <div className="user-meta">
                  <RoleBadge role={user?.role} />
                </div>
              </div>
            )}
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut size={16} />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content View */}
      <div className="main-wrapper">
        {/* Topbar Header */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Logo Home Anchor */}
            <div
              className="topbar-logo-anchor"
              onClick={() => navigate('/dashboard')}
              title="Deep Trace Security Platform — Home"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/dashboard')}
            >
              <Shield size={20} className="topbar-brand-icon" />
              <span className="topbar-brand-name">Deep Trace Cybernetics</span>
            </div>

            <div className="topbar-divider" />

            {/* Breadcrumb Navigation */}
            <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
              <Link to="/dashboard" className="crumb-link">Home</Link>
              <span className="crumb-separator">/</span>
              <span className="crumb-current">{pageInfo.title}</span>
            </nav>
          </div>

          <div className="topbar-right">
            <div className="tenant-isolation-pill" title="Tenant queries enforced at database layer">
              <CheckCircle2 size={15} className="text-success" />
              <span>Multi-Tenant Guard Active</span>
            </div>

            {/* Interactive User Menu Dropdown */}
            <div className="topbar-user-menu-container" ref={userMenuRef}>
              <button
                type="button"
                className={`topbar-user-trigger ${userMenuOpen ? 'active' : ''}`}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                title={`${user?.name} (${user?.role})`}
              >
                <div className="topbar-user-avatar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="topbar-user-info-group">
                  <span className="topbar-user-name">{user?.name}</span>
                  <RoleBadge role={user?.role} />
                </div>
                <ChevronDown size={14} className={`topbar-chevron ${userMenuOpen ? 'open' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="topbar-dropdown-menu">
                  <div className="dropdown-user-header">
                    <div className="dropdown-user-name">{user?.name}</div>
                    <div className="dropdown-user-email">{user?.email}</div>
                    <div className="dropdown-user-meta">
                      <RoleBadge role={user?.role} />
                      <span className="dropdown-org-name" title={user?.organizationName}>
                        {user?.organizationName || 'CyberSecure India'}
                      </span>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/profile');
                    }}
                  >
                    <UserIcon size={15} />
                    <span>Profile</span>
                  </button>

                  <button
                    type="button"
                    className="dropdown-item dropdown-item-danger"
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut size={15} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="content-area">
          <Outlet />
        </main>

        {/* Professional Compact Footer */}
        <footer className="app-footer">
          <div className="footer-content">
            <span className="footer-copyright">© 2026 Deep Trace Cybernetics</span>
            <span className="footer-bullet">•</span>
            <span className="footer-item">Secure Multi-Tenant Architecture</span>
            <span className="footer-bullet">•</span>
            <span className="footer-item">Role-Based Access Control</span>
            <span className="footer-bullet">•</span>
            <span className="footer-item">Active Tenant: {user?.organizationName || 'CyberSecure India'} (ID: #{user?.organizationId || 1})</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
