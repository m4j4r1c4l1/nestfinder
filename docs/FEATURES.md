# 🛠️ NestFinder Features & Technical Documentation

This document provides a detailed technical overview of the application's features, architecture, and capabilities.

## 🏗️ Architecture Overview

NestFinder is built as a **Progressive Web App (PWA)** using a modern React stack.

- **Frontend**: React 18, Vite, Leaflet (Maps)
- **Backend API**: Node.js, Express
- **Database**: SQLite (via `sql.js` for ephemeral/portable data handling)
- **Real-time**: WebSockets for live point updates and notifications

---

## 🗺️ Core Features

### 1. Interactive Map System
The core interface is built on **Leaflet.js**, optimized for mobile performance.
- **Marker Clustering**: Automatically groups points at high zoom levels to prevent clutter.
- **Custom Icons**: SVG-based markers indicating status (Green=Confirmed, Orange=Pending, Grey=Deactivated).
- **User Tracking**: Real-time GPS location tracking with continuous updates.
- **Reverse Geocoding**: Automatically converts GPS coordinates to readable addresses (City, Street).

### 2. Status & Verification System
Points lifecycle management to ensure data accuracy:
- **Pending (⏳)**: Newly submitted points.
- **Confirmed (✅)**: Verified by other users.
- **Deactivated (❌)**: Flagged as no longer valid.
- **Logic**: Users can "Confirm" or "Report Inactive" on any point. The system tracks confirmation counts.

### 3. Smart Route Planner
Optimized walking paths using **OSRM (Open Source Routing Machine)**.
- **Viewport Filtering**: Only calculates routes for points currently visible on the screen.
- **Nearest Neighbor Algorithm**: Sorts points to create an efficient path starting from the user's location.
- **Status Filtering**: Option to include/exclude pending or deactivated points in the route.
- **Visual Feedback**: Dashed lines for walking paths and numbered waypoints for order.

### 4. Internationalization (i18n)
Full support for **11 Languages** using a flexible translation system.
- **Languages**: English, Spanish, French, Portuguese, Valencian, Italian, German, Dutch, Russian, Arabic, Chinese.
- **Context-Aware**: Auto-detects browser language on first load.
- **Dynamic Switching**: Instant language toggle without page reload.

### 5. Reporting Interface
A versatile submission system supporting three modes:
- **GPS Mode**: Uses device geolocation.
- **Map Mode**: Tap-to-select specific coordinates.
- **Address Mode**: Manual address entry with geocoding.
- **Quick Tags**: Fast categorization (One Person, Multiple, Children, Animals).

### 6. Notification System
Real-time user engagement features.
- **Push Notifications**: VAPID-protected web push notifications.
- **In-App Toast**: Non-intrusive popup messages for immediate feedback.
- **Inbox**: Persistent message storage for updates (e.g., "Your point was confirmed").
- **Admin Broadcasts**: Support for system-wide announcements.

### 7. Offline PWA Capabilities
Designed for low-connectivity environments.
- **Service Worker**: Caches app assets for offline load.
- **Installable**: Meets criteria for "Add to Home Screen" on iOS and Android.
- **Responsive**: Mobile-first design that adapts to all screen sizes.

---

## 🔒 Security & Privacy

- **Anonymous Auth**: UUID-based authentication requires no account creation or personal data.
- **Input Sanitization**: Protection against XSS and SQL injection.
- **Rate Limiting**: API protection against spam/abuse.
- **CORS Configured**: Strict origin policies for API access.

---

## 📥 Data Export

- **JSON**: Full hierarchical data export.
- **CSV**: Spreadsheet-compatible export for analysis.
- **GPX/KML**: GIS-compatible formats for use with other mapping tools.
- **Pretty Printing**: Formatted JSON for human readability.
