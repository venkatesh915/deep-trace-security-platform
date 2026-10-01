import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle, Send, Lock } from 'lucide-react';
import { Modal } from './Modal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './CrossTenantLabModal.css';

export const CrossTenantLabModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [targetCampaignId, setTargetCampaignId] = useState(user?.organizationId === 1 ? '201' : '101');
  const [testAction, setTestAction] = useState('GET');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleRunTest = async () => {
    setLoading(true);
    setResult(null);

    const startTime = performance.now();
    try {
      let response;
      if (testAction === 'GET') {
        response = await api.get(`/campaigns/${targetCampaignId}`);
      } else if (testAction === 'PATCH') {
        response = await api.patch(`/campaigns/${targetCampaignId}`, {
          name: 'Unauthorized Cross-Tenant Attempt',
        });
      } else if (testAction === 'ASSIGN') {
        // Attempt assigning user from other tenant (e.g., user 6 or user 1)
        const crossUserId = user?.organizationId === 1 ? '6' : '1';
        response = await api.post(`/campaigns/${targetCampaignId}/users/${crossUserId}`);
      }

      const elapsed = Math.round(performance.now() - startTime);
      setResult({
        status: response.status,
        statusText: response.statusText,
        isSuccess: true, // In this security context, getting 200 on another tenant's resource would be a failure!
        data: response.data,
        elapsed,
        explanation: 'CRITICAL SECURITY ALERT: Resource was returned! Multi-tenancy isolation failed.',
      });
    } catch (err) {
      const elapsed = Math.round(performance.now() - startTime);
      const status = err.response?.status || 500;
      const data = err.response?.data || { message: err.message };

      setResult({
        status,
        statusText: status === 404 ? 'Not Found' : status === 403 ? 'Forbidden' : 'Error',
        isSuccess: false,
        data,
        elapsed,
        explanation:
          status === 404
            ? `SUCCESS: Tenant Isolation verified! The API responded with 404 Not Found. Even though Campaign ID ${targetCampaignId} exists under another organization, the database query enforced 'where: { id: ${targetCampaignId}, organizationId: ${user?.organizationId} }'. The existence of the resource is completely hidden from the caller, preventing IDOR (Insecure Direct Object Reference).`
            : `API responded with HTTP ${status}: ${data.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🛡️ Interactive Multi-Tenant Security Verification Lab"
      maxWidth="700px"
    >
      <div className="security-lab-container">
        <div className="security-lab-info-banner">
          <div className="security-lab-info-icon">
            <Lock size={20} />
          </div>
          <div>
            <strong>Demonstrating Strict Tenant Isolation (Section 35 &amp; 49)</strong>
            <p>
              Verify that an authenticated user belonging to <strong>{user?.organizationName} (Tenant ID: {user?.organizationId})</strong>{' '}
              cannot read, modify, or assign resources belonging to another tenant — even with knowledge of the exact database ID.
            </p>
          </div>
        </div>

        <div className="security-lab-form">
          <div className="form-group">
            <label className="form-label">Active Session Identity:</label>
            <div className="session-pill">
              <span>{user?.name} ({user?.email})</span>
              <span className="badge badge-role-admin">{user?.role}</span>
              <span className="tenant-tag">🏢 Org ID: {user?.organizationId}</span>
            </div>
          </div>

          <div className="security-lab-row">
            <div className="form-group flex-1">
              <label className="form-label">Target Campaign ID (Foreign Tenant):</label>
              <input
                type="number"
                value={targetCampaignId}
                onChange={(e) => setTargetCampaignId(e.target.value)}
                placeholder="e.g. 201"
              />
              <span className="form-hint">
                {user?.organizationId === 1
                  ? 'Campaign ID 201 belongs to Tenant 2 (DeepShield Labs).'
                  : 'Campaign ID 101 belongs to Tenant 1 (CyberSecure India).'}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Action Vector:</label>
              <select value={testAction} onChange={(e) => setTestAction(e.target.value)}>
                <option value="GET">GET /api/campaigns/:id</option>
                <option value="PATCH">PATCH /api/campaigns/:id</option>
                <option value="ASSIGN">POST /api/campaigns/:id/users/:crossUser</option>
              </select>
            </div>
          </div>

          <button
            className="btn-primary run-test-btn"
            onClick={handleRunTest}
            disabled={loading || !targetCampaignId}
          >
            <Send size={16} />
            {loading ? 'Dispatching Probed Request...' : 'Execute Cross-Tenant Request'}
          </button>
        </div>

        {result && (
          <div className={`security-lab-result-box ${result.status === 404 ? 'result-passed' : 'result-alert'}`}>
            <div className="result-header">
              <div className="result-status-tag">
                {result.status === 404 ? (
                  <CheckCircle size={18} className="text-success" />
                ) : (
                  <AlertTriangle size={18} className="text-warning" />
                )}
                <span>HTTP {result.status} {result.statusText}</span>
              </div>
              <span className="result-latency">{result.elapsed}ms latency</span>
            </div>

            <p className="result-explanation">{result.explanation}</p>

            <div className="result-json-view">
              <div className="result-json-title">Raw API JSON Payload:</div>
              <pre>{JSON.stringify(result.data, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
