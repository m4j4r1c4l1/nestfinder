const API_URL = import.meta.env.DEV ? '/api' : '/api';

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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
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

  downloadPoints(format = 'json', status) {
    let url = `${API_URL}/points/export?format=${format}`;
    if (status) url += `&status=${status}`;
    window.location.href = url;
  }

  // Settings
  getSettings() {
    return this.fetch('/settings');
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
