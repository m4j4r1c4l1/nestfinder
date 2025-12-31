const API_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  constructor() {
    this.userId = localStorage.getItem('nestfinder_user_id');
    this.adminToken = localStorage.getItem('nestfinder_admin_token');
  }

  setUserId(id) {
    this.userId = id;
    localStorage.setItem('nestfinder_user_id', id);
  }

  setAdminToken(token) {
    this.adminToken = token;
    localStorage.setItem('nestfinder_admin_token', token);
  }

  logout() {
    this.userId = null;
    this.adminToken = null;
    localStorage.removeItem('nestfinder_user_id');
    localStorage.removeItem('nestfinder_admin_token');
  }

  async fetch(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.userId) {
      headers['x-user-id'] = this.userId;
    }

    if (this.adminToken) {
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
  register(deviceId, nickname) {
    return this.fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ deviceId, nickname }),
    });
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
