<p align="center">
  <h1 align="center">🪹 NestFinder</h1>
  <p align="center">
    <strong>A Progressive Web App for mapping and tracking resources for homeless assistance</strong>
    <br />
    <a href="docs/USER_GUIDE.md"><strong>📱 User Guide</strong></a> ·
    <a href="docs/FEATURES.md"><strong>🛠️ Technical Features</strong></a> ·
    <a href="docs/DEPLOY.md"><strong>🚀 Deployment</strong></a>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Translations-11_Languages-FF5722?style=flat-square" alt="Translations">
  <img src="https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=flat-square&logo=pwa" alt="PWA">
</p>

---

## 📖 Introduction

**NestFinder** is a community-driven tool designed to help locate and verify resources for those in need. Built as a fast, offline-capable Progressive Web App (PWA), it works seamlessly on mobile devices and desktops.

![Screenshot: Main Map View](client/public/screenshots/map_view_placeholder.png)

## ✨ Key Features

- **🗺️ Interactive Map** — View resources with status markers (Verified/Pending).
- **📍 Easy Reporting** — Submit locations via GPS, Map Tap, or Address.
- **🚶 Smart Routing** — Calculate optimal walking paths to visible points.
- **🌍 11 Languages** — Native support for EN, ES, FR, PT, IT, DE, NL, RU, AR, ZH, VAL.
- **🔔 Real-time Alerts** — Push notifications for updates and verifications.
- **📱 Installable App** — Add to home screen on iOS/Android (no store needed).

👉 **[See Detailed Features List](docs/FEATURES.md)**

---

## 🚀 Quick Start

### For Users
No installation required! Just visit the web app.
1. Open the [Web App](https://m4j4r1c4l1.github.io/nestfinder/).
2. Enable Location when prompted.
3. Start exploring!

👉 **[Read the Full User Guide](docs/USER_GUIDE.md)**

### For Developers (Installation)

1. **Clone the repo**
   ```bash
   git clone https://github.com/m4j4r1c4l1/nestfinder.git
   ```

2. **Install dependencies**
   ```bash
   cd nestfinder
   cd server && npm install
   cd ../client && npm install
   cd ../admin && npm install
   ```

3. **Run locally**
   ```bash
   # Terminal 1: API Server
   cd server && npm run dev
   
   # Terminal 2: Client App
   cd client && npm run dev
   ```

---

## 🏗️ Project Structure

```
nestfinder/
├── client/          # PWA Frontend (React + Vite + Leaflet)
├── server/          # REST API + WebSocket (Express + SQLite)
├── admin/           # Admin Dashboard (React + Vite)
└── docs/            # Documentation
    ├── USER_GUIDE.md    # 📱 End-user instructions
    ├── FEATURES.md      # 🛠️ Technical deep-dive
    ├── DEPLOY.md        # 🚀 Render deployment guide
    └── GEOLOCATION.md   # 📍 Troubleshooting
```

---

## 📄 License

MIT © 2025 NestFinder
<p align="center">Made with ❤️ to help those in need</p>
