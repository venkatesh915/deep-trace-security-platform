import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  Building2,
  Shield,
  Calendar,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { RoleBadge } from '../components/Badge';
import { formatDate, formatDateTime } from '../utils/formatters';
import './ProfilePage.css';

export const ProfilePage = () => {
  const { user: contextUser } = useAuth();
  const [profileData, setProfileData] = useState(contextUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchLatestProfile = async () => {
      try {
        setLoading(true);
        // Securely retrieve the authenticated user's own profile derived from JWT req.user
        const res = await api.get('/auth/me');
        if (isMounted && res.data?.success && res.data?.data) {
          setProfileData(res.data.data);
        }
      } catch (err) {
        // Fallback gracefully to contextUser if network glitch
        console.warn('Could not refresh profile from server, using local session state:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLatestProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayUser = profileData || contextUser;

  const initials = displayUser?.name
    ? displayUser.name
        .split(' ')
        .map((part) => part.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="profile-page-container">
      {/* Page Header */}
      <div className="profile-page-header">
        <div>
          <h1 className="profile-page-title">User Profile</h1>
          <p className="profile-page-subtitle">
            Authenticated identity, access privileges, and multi-tenant security context.
          </p>
        </div>
        <div className="profile-status-pill">
          <CheckCircle2 size={16} className="text-success" />
          <span>Active Session</span>
        </div>
      </div>

      <div className="profile-layout-grid">
        {/* Left Column: Avatar & Role Summary Card */}
        <div className="profile-card profile-identity-card">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-circle">
              <span className="profile-avatar-initials">{initials}</span>
            </div>
            <div className="profile-avatar-badge" title="Tenant Session Guarded">
              <Shield size={14} />
            </div>
          </div>

          <h2 className="profile-name">{displayUser?.name || 'Security Operator'}</h2>
          <p className="profile-email-sub">{displayUser?.email}</p>

          <div className="profile-role-badge-row">
            <RoleBadge role={displayUser?.role} />
          </div>

          <div className="profile-tenant-box">
            <div className="profile-tenant-label">ASSIGNED TENANT</div>
            <div className="profile-tenant-name-row">
              <Building2 size={16} className="text-primary" />
              <span className="profile-tenant-val">
                {displayUser?.organizationName || 'CyberSecure India'}
              </span>
            </div>
            <div className="profile-tenant-id">
              TENANT ID: #{displayUser?.organizationId || 1}
            </div>
          </div>

          <div className="profile-session-guard">
            <Lock size={14} className="text-muted" />
            <span>Cryptographically sealed JWT identity</span>
          </div>
        </div>

        {/* Right Column: Detailed Account Details & Security Telemetry */}
        <div className="profile-details-column">
          <div className="profile-card profile-details-card">
            <h3 className="profile-section-heading">Account Information</h3>
            <p className="profile-section-desc">
              Non-sensitive attributes registered under your tenant account.
            </p>

            <div className="profile-info-grid">
              {/* Full Name */}
              <div className="profile-field-group">
                <span className="profile-field-label">
                  <UserIcon size={14} />
                  <span>Full Name</span>
                </span>
                <span className="profile-field-value">{displayUser?.name || '—'}</span>
              </div>

              {/* Email Address */}
              <div className="profile-field-group">
                <span className="profile-field-label">
                  <Mail size={14} />
                  <span>Email Address</span>
                </span>
                <span className="profile-field-value">{displayUser?.email || '—'}</span>
              </div>

              {/* Role */}
              <div className="profile-field-group">
                <span className="profile-field-label">
                  <Shield size={14} />
                  <span>Role &amp; Privilege Level</span>
                </span>
                <div className="profile-field-value-role">
                  <RoleBadge role={displayUser?.role} />
                  <span className="role-subtext">
                    {displayUser?.role === 'ADMIN'
                      ? 'Full Tenant Administrator & User Manager'
                      : displayUser?.role === 'MANAGER'
                      ? 'Campaign & Telemetry Operations Manager'
                      : 'Assigned Operator / Restricted Telemetry Viewer'}
                  </span>
                </div>
              </div>

              {/* Organization / Tenant */}
              <div className="profile-field-group">
                <span className="profile-field-label">
                  <Building2 size={14} />
                  <span>Organization / Tenant</span>
                </span>
                <span className="profile-field-value">
                  {displayUser?.organizationName || 'CyberSecure India'} (ID #{displayUser?.organizationId || 1})
                </span>
              </div>

              {/* Account Status */}
              <div className="profile-field-group">
                <span className="profile-field-label">
                  <Sparkles size={14} />
                  <span>Account Status</span>
                </span>
                <span className="profile-status-tag">
                  <span className="status-dot"></span>
                  Active &amp; Authorized
                </span>
              </div>

              {/* Member Since */}
              <div className="profile-field-group">
                <span className="profile-field-label">
                  <Calendar size={14} />
                  <span>Member Since</span>
                </span>
                <span className="profile-field-value">
                  {displayUser?.createdAt ? formatDate(displayUser.createdAt) : 'System Initialized'}
                </span>
              </div>
            </div>
          </div>

          {/* Tenant Security Notice */}
          <div className="profile-card profile-security-assurance-card">
            <div className="security-assurance-header">
              <Shield size={18} className="text-primary" />
              <h4>Zero-Trust Identity Enforcement</h4>
            </div>
            <p className="security-assurance-text">
              Deep Trace Cybernetics strictly isolates all operational data by authenticated tenant.
              Profile attributes and authorization scopes are derived directly from the signed backend JWT.
              Client-side parameters or headers cannot override your tenant ID or role.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
