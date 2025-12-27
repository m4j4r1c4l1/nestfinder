# Mobile Deployment Guide

NestFinder is a **Progressive Web App (PWA)**, which means it can be installed on mobile devices directly from the browser, or wrapped into a native app for App Stores.

## Option 1: PWA (Recommended & Simplest)

Your app is already configured as a PWA. This is the fastest way to distribute it.

**How it works:**
1.  **Deploy** your `client` and `server` to a hosting provider (like Railway, Vercel+Render, etc.).
2.  **Users visit the URL** on their mobile browser (Chrome/Safari).
3.  **Install Prompt:**
    *   **Android**: Chrome will automatically prompt "Add to Home Screen".
    *   **iOS**: User taps "Share" button → "Add to Home Screen".
4.  **Result**: The app appears on their home screen with the Bird icon, launches in full screen (no address bar), and works offline.

**Why this is best for now:**
*   No Apple Developer Account ($99/year) needed.
*   No Google Play Console account ($25 one-time) needed.
*   Updates are instant (users just refresh).
*   Your `vite.config.js` is already set up to cache maps and assets for offline use.

---

## Option 2: Native App Store (App Store & Google Play)

If you specifically want your app listed in the stores, you need to wrap your existing web code using **Capacitor**.

### Steps to Convert to Native App:

**1. Initialize Capacitor**
Run these commands in your `client` folder:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init NestFinder com.nestfinder.app
```

**2. Build your React implementation**
```bash
npm run build
```

**3. Add Platforms**
```bash
npx cap add android
npx cap add ios   # Requires macOS with Xcode
```

**4. Sync & Open**
```bash
npx cap sync
npx cap open android  # Opens Android Studio
npx cap open ios      # Opens Xcode
```

**5. Build & Submit**
*   **Android**: In Android Studio, Build → Generate Signed Bundle/APK → Upload to Google Play Console.
*   **iOS**: In Xcode, Product → Archive → Upload to App Store Connect.

**Prerequisites:**
*   **Android**: Android Studio installed.
*   **iOS**: A Mac with Xcode installed.

### Recommendation
Start with **Option 1 (PWA)**. It provides 95% of the "App" experience immediately with zero friction. You can switch to Option 2 later if you need improved native features (push notifications, background geofencing) or store discoverability.
