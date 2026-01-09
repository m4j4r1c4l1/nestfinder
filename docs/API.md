# NestFinder API Documentation

**Base URL:** `/api`  
**Authentication:**
- **Admin endpoints:** JWT Bearer token (`Authorization: Bearer <token>`)
- **User endpoints:** JWT Bearer token (`Authorization: Bearer <token>`)

> **Note:** User tokens are issued upon registration and auto-refresh when expired via Device ID.

---

## 📑 Table of Contents

| Section | Description |
|:---|:---|
| **[🔐 Authentication Routes](#-authentication-routes-api-auth)** | Login, Register, Admin Access |
| **[📍 Points Routes](#-points-routes-api-points)** | Submit, List, Confirm, Deactivate Locations |
| **[⚙️ Settings Routes](#-settings-routes-api-settings)** | App Configuration & Admin Settings |
| **[🔔 Notification Routes](#-notification-routes-api-push)** | Push Notifications & Admin Messaging |
| **[👨‍💼 Admin Routes](#-admin-routes-api-admin)** | Dashboard Stats, Logs, User Management |
| **[🪝 Webhook Routes](#-webhook-routes-api-webhook)** | GitHub Integration & Dev Metrics |
| **[🐛 Debug Routes](#-debug-routes-api-debug)** | Client Logging & Diagnostics |
| **[🏥 Health Check](#-health-check)** | Server Status Monitor |
| **[🔌 WebSocket](#-websocket)** | Real-time Updates |

---

## 🔐 Authentication Routes (`/api/auth`)

### Register/Login User
```
POST /api/auth/register
```
Creates new user or returns existing user by device ID.

**Request Body:**
```json
{
  "deviceId": "string (required)",
  "nickname": "string (optional)"
}
```

**Response:**
```json
{
  "user": { "id", "device_id", "nickname", "created_at", "last_active" },
  "isNew": boolean
}
```

---

### Update Nickname
```
PUT /api/auth/nickname
Headers: Authorization: Bearer <user_token>
```

**Request Body:**
```json
{ "nickname": "string" }
```

---

### Admin Login
```
POST /api/auth/admin/login
```
Rate limited. Default credentials: `admin / admin123`

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "JWT token",
  "admin": { "id", "username" },
  "expiresIn": "24h"
}
```

---

## 📍 Points Routes (`/api/points`)

### List Points
```
GET /api/points
```

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by `pending`, `confirmed`, `deactivated` |
| `minLat`, `maxLat` | float | Latitude bounds |
| `minLng`, `maxLng` | float | Longitude bounds |

---

### Submit Point
```
POST /api/points
Headers: Authorization: Bearer <user_token>
```

**Request Body:**
```json
{
  "latitude": number,
  "longitude": number,
  "address": "string (optional)",
  "notes": "string (optional)"
}
```

---

### Confirm Point
```
POST /api/points/:id/confirm
Headers: Authorization: Bearer <user_token>
```

---

### Deactivate Point
```
POST /api/points/:id/deactivate
Headers: Authorization: Bearer <user_token>
```

---

### Reactivate Point
```
POST /api/points/:id/reactivate
Headers: Authorization: Bearer <user_token>
```

---

### Export Points
```
GET /api/points/export
```

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `format` | string | `json`, `csv`, or `gpx` |
| `status` | string | Filter by status |

---

## ⚙️ Settings Routes (`/api/settings`)

### Get Settings (Public)
```
GET /api/settings
```

**Response:** All app settings (sensitive values masked)

---

### Get App Config (Client)
```
GET /api/settings/app-config
```

**Response:**
```json
{
  "testing_banner_enabled": boolean,
  "testing_banner_text": "string",
  "polling_interval_ms": number
}
```

---

### Update Settings (Admin)
```
PUT /api/settings
Headers: Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "settings": {
    "app_name": "string",
    "confirmations_required": number,
    "deactivations_required": number,
    ...
  }
}
```

---

## 🔔 Notification Routes (`/api/push`)

### Get User Notifications
```
GET /api/push/notifications
Headers: Authorization: Bearer <user_token>
```

---

### Mark as Read
```
POST /api/push/notifications/:id/read
```

**Request Body:**
```json
{ "userId": "string" }
```

---

### Admin - Get Templates
```
GET /api/push/admin/templates
Headers: Authorization: Bearer <token>
```

---

### Admin - Get Stats
```
GET /api/push/admin/stats
Headers: Authorization: Bearer <token>
```

---

### Admin - Send Notification
```
POST /api/push/admin/send
Headers: Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "template": "announcement|share_app|reminder|urgent (optional)",
  "title": "string",
  "body": "string",
  "image": "url (optional)",
  "target": "all|selected",
  "userIds": ["id1", "id2"] // if target=selected
}
```

---

### Admin - Get Batch Details
```
GET /api/push/admin/notifications/batch/:batchId
Headers: Authorization: Bearer <token>
```

---

### Admin - Get History
```
GET /api/push/admin/notifications/history
Headers: Authorization: Bearer <token>
```

---

### Admin - Clear All Notifications
```
DELETE /api/push/admin/notifications/clear-all
Headers: Authorization: Bearer <token>
```

---

### Admin - Cleanup History Logs
```
POST /api/push/admin/notifications/cleanup
Headers: Authorization: Bearer <token>
```

---

## 👨‍💼 Admin Routes (`/api/admin`)

> All routes require `Authorization: Bearer <token>` header

### Dashboard Stats
```
GET /api/admin/stats
```

**Response:** Comprehensive stats including:
- Point counts (total, pending, confirmed, deactivated)
- User counts (total, active in 7 days)
- Notification metrics
- System info (OS, memory, disk, uptime)
- Database size

---

### Historical Metrics (Charts)
```
GET /api/admin/metrics/history?days=7
```

**Response:**
```json
{
  "metrics": [
    {
      "date": "2025-12-31",
      "users": 100,
      "notifications": 500,
      "delivered": 450,
      "read": 300,
      "pending": 50
    }
  ]
}
```

---

### Logs with Pagination & Sorting
```
GET /api/admin/logs
```

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 50) |
| `action` | string | Filter by action type |
| `userId` | string | Filter by user |
| `startDate` | string | Start date filter |
| `endDate` | string | End date filter |
| `sortBy` | string | `created_at`, `action`, `user_nickname` |
| `sortDir` | string | `asc` or `desc` |

---

### Get Log Actions (for filters)
```
GET /api/admin/logs/actions
```

---

### Export Logs
```
GET /api/admin/logs/export?format=csv
```

---

### Users Management
```
GET /api/admin/users           # List all users
GET /api/admin/users/:id       # Get user details
DELETE /api/admin/users/:id    # Delete user
```

---

### Points Management
```
GET /api/admin/points          # List all points (admin view)
DELETE /api/admin/points/:id   # Delete point
```

---

### Notifications & Confirmations
```
GET /api/admin/notifications   # All notifications
GET /api/admin/confirmations   # All confirmations/votes
```

---

### Admin Password
```
PUT /api/admin/password
```

**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

---

### Database Backup
```
GET /api/admin/backup
```

Downloads `nestfinder_backup_<date>.db` file.

---

### Database Reset
```
POST /api/admin/reset
```

**Request Body:**
```json
{
  "confirm": "LOGS|POINTS|USERS|ALL",
  "target": "logs|points|users|all"
}
```

---

## 🪝 Webhook Routes (`/api/webhook`)

### GitHub Push Webhook
```
POST /api/webhook/github
Headers: X-Hub-Signature-256: sha256=<signature>
```
Receives push events from GitHub. Verifies HMAC-SHA256 signature.

**Request Body:** GitHub push event payload

**Response:**
```json
{
  "success": true,
  "commits_received": 3,
  "last_commit": "a1b2c3d",
  "actual_total": 150
}
```

---

### Get Dev Metrics
```
GET /api/webhook/dev-metrics
```
Returns stored development metrics.

**Response:**
```json
{
  "total_commits": 150,
  "last_commit_hash": "a1b2c3d",
  "last_commit_message": "Fix bug",
  "last_commit_author": "Developer",
  "updated_at": "ISO timestamp"
}
```

---

## 🐛 Debug Routes (`/api/debug`)

### Submit Debug Logs
```
POST /api/debug/logs
```
Receives client-side debug logs for troubleshooting.

**Request Body:**
```json
{
  "logs": ["log entry 1", "log entry 2"],
  "platform": "iOS",
  "userAgent": "Mozilla/5.0..."
}
```

---

### Download Debug Logs
```
GET /api/debug/download
```
Downloads collected debug logs as `swipe_debug_logs.txt`.

---

## 🏥 Health Check

```
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "name": "NestFinder API",
  "version": "1.0.0",
  "timestamp": "ISO timestamp"
}
```

---

## 🔌 WebSocket

**URL:** `ws://localhost:3001` (same port as HTTP)

**Events received:**
- `{ type: 'point_added', point: {...} }`
- `{ type: 'point_updated', point: {...} }`
- `{ type: 'settings_updated', settings: {...} }`
