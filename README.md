<p align="center">
  <h1 align="center">🏠 NestFinder</h1>
  <p align="center">
    <strong>A Progressive Web App for mapping and tracking resources for homeless assistance</strong>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Leaflet-Maps-199900?style=flat-square&logo=leaflet" alt="Leaflet">
  <img src="https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=flat-square&logo=pwa" alt="PWA">
</p>

---

## ✨ Features

- 🗺️ **Interactive Map** — View and navigate resource locations with Leaflet maps
- 📍 **Submit Points** — Users can submit new resource locations
- 🚶 **Route Calculation** — Calculate walking routes between points
- 📱 **Progressive Web App** — Works offline, installable on mobile devices
- 🔐 **Anonymous Auth** — Privacy-first anonymous authentication
- 📊 **Admin Dashboard** — Manage data, view logs, and configure settings
- 📥 **Data Export** — Download data in various formats

---

## 🏗️ Project Structure

```
nestfinder/
├── client/          # User-facing PWA (React + Vite)
├── server/          # Backend API (Express + SQLite)
└── admin/           # Admin dashboard (React + Vite)
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/m4j4r1c4l1/nestfinder.git
cd nestfinder

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install

# Install admin dependencies
cd ../admin && npm install
```

### Running the App

**Start the API server:**
```bash
cd server
npm run dev
# Server runs on http://localhost:3000
```

**Start the client app:**
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

**Start the admin dashboard:**
```bash
cd admin
npm run dev
# Admin runs on http://localhost:5174
```

---

## 🛠️ Tech Stack

| Component | Technologies |
|-----------|-------------|
| **Client** | React 18, Vite, Leaflet, React Router, PWA |
| **Server** | Node.js, Express, SQLite (sql.js), WebSocket |
| **Admin** | React 18, Vite, Chart.js, Leaflet |

---

## 📁 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/points` | Get all resource points |
| `POST` | `/api/points` | Submit a new point |
| `GET` | `/api/points/:id` | Get point details |
| `POST` | `/api/auth/anonymous` | Anonymous authentication |
| `GET` | `/api/admin/logs` | Get system logs (admin) |
| `GET` | `/api/admin/settings` | Get app settings (admin) |

---

## 🌿 Branch Strategy

| Branch | Purpose |
|--------|---------|
| `master` | Production-ready code |
| `develop` | Active development |
| `feature/*` | New features |
| `fix/*` | Bug fixes |

---

## 📄 License

MIT © 2024 NestFinder

---

<p align="center">
  Made with ❤️ to help those in need
</p>
