export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateString;
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const getRoleBadgeClass = (role) => {
  switch (role) {
    case 'ADMIN':
      return 'badge-admin';
    case 'MANAGER':
      return 'badge-manager';
    case 'USER':
    default:
      return 'badge-user';
  }
};

export const getSeverityBadgeClass = (severity) => {
  switch (severity) {
    case 'CRITICAL':
      return 'badge-critical';
    case 'HIGH':
      return 'badge-high';
    case 'MEDIUM':
      return 'badge-medium';
    case 'LOW':
    default:
      return 'badge-low';
  }
};

export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'ACTIVE':
    case 'RESOLVED':
      return 'badge-active';
    case 'DRAFT':
    case 'INVESTIGATING':
      return 'badge-draft';
    case 'COMPLETED':
      return 'badge-completed';
    case 'CANCELLED':
    case 'OPEN':
      return 'badge-critical';
    default:
      return 'badge-neutral';
  }
};
