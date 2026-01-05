const API_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  constructor() {
    this.userId = localStorage.getItem('nestfinder_user_id');
    this.userToken = localStorage.getItem('nestfinder_user_token');
    this.adminToken = localStorage.getItem('nestfinder_admin_token');
  }

  setUserId(id) {
    this.userId = id;
    localStorage.setItem('nestfinder_user_id', id);
  }

  setUserToken(token) {
    this.userToken = token;
    localStorage.setItem('nestfinder_user_token', token);
  }

  setAdminToken(token) {
    this.adminToken = token;
    localStorage.setItem('nestfinder_admin_token', token);
  }

  logout() {
    this.userId = null;
    this.userToken = null;
    this.adminToken = null;
    localStorage.removeItem('nestfinder_user_id');
    localStorage.removeItem('nestfinder_user_token');
    localStorage.removeItem('nestfinder_admin_token');
  }

  async fetch(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Use user token for authentication (preferred)
    if (this.userToken) {
      headers['Authorization'] = `Bearer ${this.userToken}`;
    }

    // Always include user ID if available (some endpoints require it explicitly)
    if (this.userId) {
      headers['x-user-id'] = this.userId;
    }

    // Admin token overrides for admin endpoints
    if (this.adminToken && (endpoint.includes('/admin') || endpoint.includes('/push/admin'))) {
      headers['Authorization'] = `Bearer ${this.adminToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    let data;
    try {
      if (isJson) {
        data = await response.json();
      } else {
        // Non-JSON response (likely HTML error page or plain text)
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        throw new Error(`Server error: Expected JSON but received ${contentType || 'unknown content type'}`);
      }
    } catch (parseError) {
      if (parseError.message.includes('Server error')) {
        throw parseError;
      }
      // JSON parse failed
      const text = await response.text();
      console.error('JSON parse error. Response text:', text.substring(0, 500));
      throw new Error('Invalid response from server. Please try again or contact support.');
    }

    if (!response.ok) {
      throw new Error(data.error || `Server error: ${response.status} ${response.statusText}`);
    }

    return data;
  }

  // Auth
  async register(deviceId, nickname) {
    const data = await this.fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ deviceId, nickname }),
    });

    // Store the token if returned
    if (data.token) {
      this.setUserToken(data.token);
    }

    return data;
  }

  updateNickname(nickname) {
    return this.fetch('/auth/nickname', {
      method: 'PUT',
      body: JSON.stringify({ nickname }),
    });
  }

  adminLogin(username, password) {
    return this.fetch('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  // Recovery Key
  generateRecoveryKey() {
    return this.fetch('/auth/recovery-key', {
      method: 'POST',
    });
  }

  async recoverIdentity(recoveryKey, deviceId) {
    const data = await this.fetch('/auth/recover', {
      method: 'POST',
      body: JSON.stringify({ recoveryKey, deviceId }),
    });

    // Store the new token and user ID
    if (data.token) {
      this.setUserToken(data.token);
    }
    if (data.user) {
      this.setUserId(data.user.id);
    }

    return data;
  }

  // Feedback
  getFeedback() {
    return this.fetch('/points/feedback');
  }

  pruneFeedback(cutoffDate) {
    return this.fetch('/points/feedback/prune', {
      method: 'DELETE',
      body: JSON.stringify({ cutoff: cutoffDate }),
    });
  }

  pruneNotifications(cutoffDate) {
    return this.fetch('/push/notifications/prune', {
      method: 'DELETE',
      body: JSON.stringify({ cutoff: cutoffDate }),
    });
  }

  submitFeedback(type, message, rating) {
    return this.fetch('/points/feedback', {
      method: 'POST',
      body: JSON.stringify({ type, message, rating }),
    });
  }

  // Points
  getPoints(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.fetch(`/points?${params}`);
  }

  submitPoint(data) {
    return this.fetch('/points', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  confirmPoint(id) {
    return this.fetch(`/points/${id}/confirm`, {
      method: 'POST',
    });
  }

  deactivatePoint(id) {
    return this.fetch(`/points/${id}/deactivate`, {
      method: 'POST',
    });
  }

  reactivatePoint(id) {
    return this.fetch(`/points/${id}/reactivate`, {
      method: 'POST',
    });
  }

  getRoute(points) {
    // In a real app, this would call a routing API directly or via proxy
    // For MVP, we'll calculate simple Euclidean distance or use OSRM via frontend if needed
    // This method might be used if we move routing logic to backend
    return this.fetch('/points/route', {
      method: 'POST',
      body: JSON.stringify({ points }),
    });
  }

  async downloadPoints(format = 'json', status) {
    let url = `${API_URL}/points/export?format=${format}`;
    if (status) url += `&status=${status}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      // Generate timestamp: DDMMYYYY-HHMMss
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      const timestamp = `${dd}${mm}${yyyy}-${hh}${min}${ss}`;

      const extMap = { csv: 'csv', json: 'json', gpx: 'gpx', kml: 'kml' };
      link.download = `nestfinder-nests-${timestamp}.${extMap[format] || 'json'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  // Settings
  getSettings() {
    return this.fetch('/settings');
  }

  // Public app config (testing banner settings)
  getAppConfig() {
    return this.fetch('/settings/app-config');
  }

  updateSettings(settings) {
    return this.fetch('/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  }

  // Admin
  getStats() {
    return this.fetch('/admin/stats');
  }

  getLogs(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.fetch(`/admin/logs?${params}`);
  }
}

export const api = new ApiClient();
