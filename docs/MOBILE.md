# 📱 Mobile Guide

This guide covers how to access NestFinder on mobile devices for testing and how to distribute it as an app.

## 1. Local Network Access (Testing)

You can access the running app from your phone if it's on the same Wi-Fi network.

### How to Start
Start the servers as usual:
```bash
# Terminal 1: Client
cd client && npm run dev

# Terminal 2: Admin
cd admin && npm run dev

# Terminal 3: Server (Required for API)
cd server && npm start
```

### How to Connect
Look at the terminal output for the `client` or `admin`. You will see:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.5:5173/  <-- USE THIS URL
```
Type the **Network URL** into your phone's browser.

> [!TIP]
> **Site can't be reached?** Check your computer's Firewall. Ensure ports `5173` (Client), `5174` (Admin), and `3001` (Server) are allowed.

---

## 2. Mobile Deployment (PWA)

NestFinder is a **Progressive Web App (PWA)**. This is the recommended way to distribute it.

### How it works
1.  **Deploy** the app (e.g., to Render).
2.  **Visit the URL** on a mobile phone.
3.  **Install**:
    *   **Android**: Tap "Add to Home Screen" (often prompted automatically).
    *   **iOS**: Tap the "Share" button then "Add to Home Screen".

The app will install like a native app, appear on the home screen, and launch without the browser bar.

---

## 3. Native App Store (Optional)

If you need to publish to the Apple App Store or Google Play Store, you can wrap the code using **Capacitor**.

### Setup
Run in `client/`:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init NestFinder com.nestfinder.app
npm run build
```

### Build for Platforms
```bash
npx cap add android
npx cap add ios
npx cap sync
```

### Open & Deploy
*   **Android**: `npx cap open android` (Opens Android Studio)
*   **iOS**: `npx cap open ios` (Opens Xcode)
