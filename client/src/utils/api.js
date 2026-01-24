const API_URL = import.meta.env.VITE_API_URL || '/api';
import { logger } from './logger';


class ApiClient {
  constructor() {
    this.userId = localStorage.getItem('nestfinder_user_id');
    this.userToken = localStorage.getItem('nestfinder_user_token');
    this.adminToken = localStorage.getItem('nestfinder_admin_token');

    if (this.userId) {
      logger.setUserId(this.userId);
      // Defer init slightly to avoid blocking constructor or allow method availability
      setTimeout(() => logger.init(this), 0);
    }
  }

  setUserId(id) {
    this.userId = id;
    localStorage.setItem('nestfinder_user_id', id);
    logger.setUserId(id);
    logger.init(this); // Check if debug is enabled for this user
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

  getHumanReadableName(method, endpoint) {
    const path = endpoint.split('?')[0]; // Ignore query params

    // Mappings
    if (path === '/points/broadcast/active') return 'Active broadcasts';
    if (path === '/points' && method === 'GET') return 'Points';
    if (path === '/points' && method === 'POST') return 'Point submission';
    if (path === '/auth/generate-key') return 'recovery key';
    if (path === '/auth/register') return 'Register/Refresh Identity';
    if (path === '/auth/recover') return 'Recover Identity';
    if (path === '/settings') return 'User settings';
    if (path === '/settings/app-config') return 'App config';
    if (path === '/points/feedback' && method === 'GET') return 'Update Sent messages';
    if (path === '/points/feedback' && method === 'POST') return 'Submitting message';
    if (path.includes('/confirm')) return 'Confirm point';
    if (path.includes('/deactivate')) return 'Deactivate point';
    if (path.includes('/reactivate')) return 'Reactivate point';
    if (path.includes('/push/notifications')) return method === 'DELETE' ? 'Delete notification' : 'Update Notification status';

    return null; // Unknown
  }

  getAreaFromEndpoint(endpoint) {
    if (endpoint.startsWith('/auth')) return 'Authentication';
    if (endpoint.startsWith('/admin')) return 'Admin';
    if (endpoint.startsWith('/debug')) return 'Debug';
    if (endpoint.startsWith('/settings')) return 'Settings';
    if (endpoint.startsWith('/push')) return 'Notifications';
    if (endpoint.startsWith('/points')) return 'Points';
    return 'App';
  }

  async fetch(endpoint, options = {}, isRetry = false) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Use user token for authentication (preferred)
    if (this.userToken) {
      headers['Authorization'] = `Bearer ${this.userToken}`;
    }

    // Admin token overrides for admin endpoints
    if (this.adminToken && (endpoint.includes('/admin') || endpoint.includes('/push/admin'))) {
      headers['Authorization'] = `Bearer ${this.adminToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Logging Logic
    const humanName = this.getHumanReadableName(options.method || 'GET', endpoint);
    const area = this.getAreaFromEndpoint(endpoint);

    // Default: Human readable summary
    if (humanName) {
      if (humanName === 'Points') {
        logger.default(['API', area], 'Request: Update actual points');
      } else if (humanName === 'Active broadcasts') {
        logger.default(['API', area], 'Request: Update active broadcasts');
      } else {
        logger.default(['API', area], `Request: ${humanName}`);
      }
    } else {
      logger.aggressive(['API', area], `Request: ${options.method || 'GET'} ${endpoint.split('?')[0]}`);
    }

    // Aggressive: Technical Request Line
    logger.aggressive(['API', area], `Request: ${options.method || 'GET'} ${endpoint}`);

    // Paranoic: Full Request Options (Headers, Body)
    if (options.body) {
      logger.paranoic('API', 'Request Body', JSON.parse(options.body));
    }

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    let data;
    try {
      // ... existing error handling ...
      if (response.status === 502 || response.status === 503 || response.status === 504) {
        window.dispatchEvent(new CustomEvent('server:unavailable', { detail: { status: response.status } }));
        throw new Error('Server is updating. Please wait...');
      }

      if (isJson) {
        data = await response.json();
      } else {
        // ... existing text handling ...
        const text = await response.text();
        if (text.includes('<title>502') || text.includes('<title>503') || text.includes('<title>504')) {
          window.dispatchEvent(new CustomEvent('server:unavailable', { detail: { status: response.status } }));
          throw new Error('Server is updating. Please wait...');
        }
        console.error('Non-JSON response:', text.substring(0, 500));
        throw new Error('Server Error: The server returned an invalid response format.');
      }
    } catch (parseError) {
      // ... existing error catch ...
      if (parseError.message.includes('Server is updating') || parseError.message.includes('Server Error') || parseError.message.includes('The server returned')) {
        logger.error('API', `Request to ${endpoint} failed: ${parseError.message}`);
        throw parseError;
      }
      const text = await response.text();
      const errMessage = `JSON parse error for ${endpoint}. Preview: ${text.substring(0, 100)}`;
      console.error(errMessage);
      logger.error('API', errMessage);
      throw new Error('Invalid response from server. Please try again or contact support.');
    }

    // ... existing 401 handling ...
    // Handle 401: Attempt token refresh if not already retrying
    if (response.status === 401 && !isRetry) {
      // ... existing retry logic ...
      const deviceId = localStorage.getItem('nestfinder_device_id');
      if (deviceId) {
        logger.warn(['Auth', 'Session'], 'Access token expired, attempting silent refresh');
        try {
          // ...
          const refreshResponse = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId }),
          });
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            if (refreshData.token) {
              this.setUserToken(refreshData.token);
              if (refreshData.user) this.setUserId(refreshData.user.id);
              return this.fetch(endpoint, options, true);
            }
          }
        } catch (e) { console.error(e); }
      }
      throw new Error(data.error || 'Session expired. Please login again.');
    }

    if (response.ok) {
      if (humanName) {
        let suffix = '';
        let count = null;

        if (Array.isArray(data)) {
          count = data.length;
        } else if (data) {
          if (typeof data.count === 'number') count = data.count;
          else if (Array.isArray(data.feedback)) count = data.feedback.length;
          else if (Array.isArray(data.broadcasts)) count = data.broadcasts.length;
        }

        if (count !== null) suffix = ` (${count})`;

        if (humanName === 'Update Notification status' || humanName === 'Update notification status') {
          logger.default(['API', area], `Response: Notification status successfully updated.${suffix}`);
        } else if (humanName === 'Submitting message') {
          logger.default(['API', area], `Response: Submission successfully received.${suffix}`);
        } else if (humanName === 'Update Sent messages') {
          logger.default(['API', area], `Response: Sent messages successfully updated.${suffix}`);

          // Aggressive: Response Status
          logger.aggressive(['API', area], `Response: ${response.status} from ${endpoint}`);
          // Aggressive Data Block for Sent Messages
          logger.aggressive(['API', area], 'Sent Messages Data', data);
        } else if (humanName === 'Active broadcasts') {
          logger.default(['API', area], `Response: Active broadcasts successfully received${suffix}`);

          // Aggressive: Response Status
          logger.aggressive(['API', area], `Response: ${response.status} from ${endpoint}`);
          // Aggressive Data Block for Broadcasts
          logger.aggressive(['API', area], 'Broadcasts Data', data);
        } else {
          logger.default(['API', area], `Response: ${humanName} successfully received.${suffix}`);
          // Aggressive: Response Status
          logger.aggressive(['API', area], `Response: ${response.status} from ${endpoint}`);
        }
      } else {
        // Aggressive: Response Status (Fallback)
        logger.aggressive(['API', area], `Response: ${response.status} from ${endpoint}`);
      }

      // Paranoic: Full Response Data
      logger.paranoic(['API', area], 'Response Data', data);
    }


    if (!response.ok) {
      const errorMessage = data.error || `Server error: ${response.status} ${response.statusText}`;
      // Log error (excluding temporary server unavailable errors which are handled by toast)
      if (response.status !== 502 && response.status !== 503 && response.status !== 504) {
        logger.error('API', 'Error', `${endpoint} - ${errorMessage}`);
      }
      throw new Error(errorMessage);
    }

    return data;
  }



  // HTTP Helpers
  get(endpoint, options = {}) {
    return this.fetch(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body = {}, options = {}) {
    return this.fetch(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put(endpoint, body = {}, options = {}) {
    return this.fetch(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint, options = {}) {
    return this.fetch(endpoint, { ...options, method: 'DELETE' });
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
    return this.fetch('/auth/generate-key', {
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
    return this.fetch('/push/prune', {
      method: 'DELETE',
      body: JSON.stringify({ cutoff: cutoffDate }),
    });
  }

  deleteNotification(id) {
    return this.fetch(`/push/notifications/${id}`, { method: 'DELETE' });
  }

  deleteFeedback(id) {
    return this.fetch(`/points/feedback/${id}`, { method: 'DELETE' });
  }

  // ========================================
  // NOTIFICATION STATUS METHODS (Regular In-App)
  // ========================================
  markNotificationDelivered(id) {
    return this.fetch(`/push/notifications/${id}/delivered`, { method: 'POST' });
  }

  markNotificationRead(id) {
    return this.fetch(`/push/notifications/${id}/read`, { method: 'POST' });
  }

  // ========================================
  // BROADCAST STATUS METHODS
  // ========================================
  markBroadcastSent(id) {
    return this.fetch(`/push/broadcasts/${id}/sent`, { method: 'POST' });
  }

  markBroadcastDelivered(id) {
    return this.fetch(`/push/broadcasts/${id}/delivered`, { method: 'POST' });
  }

  markBroadcastRead(id) {
    return this.fetch(`/push/broadcasts/${id}/read`, { method: 'POST' });
  }

  deleteBroadcast(id) {
    return this.fetch(`/push/broadcasts/${id}`, { method: 'DELETE' });
  }

  // Legacy alias for backward compatibility - now truly deletes/dismisses
  dismissBroadcast(id) {
    return this.deleteBroadcast(id);
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
      // Log significant errors
      if (!error.message.includes('Server is updating')) {
        logger.log('API', 'Error', `Download points - ${error.message}`);
      }
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
