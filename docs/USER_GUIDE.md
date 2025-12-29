# 📱 NestFinder User Guide

Welcome to **NestFinder**! This guide will help you get started with the app on your mobile device or computer.

## 🚀 Getting Started

NestFinder is a web app (PWA) that you can install directly on your phone without going to an App Store.

### Step 1: Open the App
Visit: [https://m4j4r1c4l1.github.io/nestfinder/](https://m4j4r1c4l1.github.io/nestfinder/)

<div style={{display: 'flex', gap: '10px'}}>
  <img src="images/landing_01_welcome.jpg" width="240" alt="Welcome Screen" />
  <img src="images/landing_02_home.jpg" width="240" alt="Home Screen" />
</div>

### Step 2: Install to Home Screen

#### 🍏 iOS (iPhone/iPad)
1. Tap the **Share** button (box with arrow) or **Menu** (three dots).
   <div style={{display: 'flex', gap: '10px'}}>
     <img src="images/ios_install_01_menu.jpg" width="160" alt="Menu" />
     <img src="images/ios_install_02_share.jpg" width="160" alt="Share" />
   </div>
2. Scroll down and tap **"Add to Home Screen"**.
   <br/><img src="images/ios_install_03_add.jpg" width="200" alt="Add to Home Screen" />
3. Tap **Add**.
4. Success!
   <br/><img src="images/ios_install_04_result.jpg" width="200" alt="Home Screen Icon" />

#### 🤖 Android (Chrome/Brave)
*(Screenshots shown using Brave browser)*
1. Tap the **Menu** button (three dots).
   <br/><img src="images/android_install_01_menu.jpg" width="200" alt="Android Menu" />
2. Tap **"Add to Home screen"** (or "Install app").
   <br/><img src="images/android_install_02_add_menu.jpg" width="200" alt="Add to Home Screen" />
3. Tap **Add** in the dialog.
   <div style={{display: 'flex', gap: '10px'}}>
     <img src="images/android_install_03_create_shortcut.jpg" width="200" alt="Create Shortcut" />
     <img src="images/android_install_04_allow.jpg" width="200" alt="Allow Shortcut" />
   </div>
4. Success!
   <br/><img src="images/android_install_05_result.jpg" width="200" alt="Android Home Screen" />

---

## 📍 Enable Location Services

To find resources near you and use route navigation, the app needs your location.

> [!IMPORTANT]
> **Privacy First**: We only use your location to show nearby points and calculate routes.

### iOS (iPhone)
1. Go to **Settings** → **Privacy & Security**. Select **Location Services**.
   <img src="images/ios_step1_menu.jpg" width="300" alt="iOS Privacy Menu" />

2. Make sure **Location Services** is **ON**.
   <img src="images/ios_step2_toggle.jpg" width="300" alt="iOS Location Toggle" />

3. Scroll down to **Safari Websites**.
   <img src="images/ios_step3_applist.jpg" width="300" alt="iOS App List" />

4. Select **"Ask Next Time or When I Share"** (or "While Using the App") and ensure **Precise Location** is ON.
   <img src="images/ios_step4_permissions.jpg" width="300" alt="iOS Permissions" />

### Android
1. Go to **Settings** → **Location**, ensure it's **ON**, and check your browser permissions.
   <div style={{display: 'flex', gap: '10px'}}>
     <img src="images/android_location_settings_01_main.jpg" width="200" alt="Android Location Settings" />
     <img src="images/android_location_settings_02_permissions.jpg" width="200" alt="App Permissions" />
   </div>
2. If you see the **Enable Location** screen, tap the button:
   <br/><img src="images/android_location_01_overlay.jpg" width="200" alt="Enable Location Overlay" />
3. When the browser asks, select your preference and tap **Allow**:
   <br/><img src="images/android_location_02_permission.jpg" width="200" alt="Browser Permission" />

### Troubleshooting
If you see a purple banner saying "Enable Your Location", tap the **Enable Location** button.

<img src="images/landing_03_location_prompt.jpg" width="300" alt="Enable Location Banner" />

If it still doesn't work, clear your browser cache and try again. See full [Geolocation Troubleshooting](GEOLOCATION.md).

---

## 📖 Daily Usage

### Map View
The main screen is the map.

- **My Location**: Tap the 📍 button (bottom right) to center on you.
- **Filter**: Tap the funnel icon to show only specific points (e.g., confirmed only).
  <br/><img src="images/feature_01_filter_panel.jpg" width="240" alt="Filter Panel" />

<img src="images/map_view.jpg" width="300" alt="Main Map View" />

### Adding a Point
Help others by reporting resources!
1. Tap **Report** in the bottom menu.
2. Choose a location:
   - **Current Location**: Use where you are now.
     <br/><img src="images/feature_02_report_gps.jpg" width="200" alt="Report GPS" />
   - **Select on Map**: Tap a spot on the map.
     <br/><img src="images/feature_02_report_map.jpg" width="200" alt="Report Map" />
   - **Address**: Type the address manually.
     <br/><img src="images/feature_02_report_address.jpg" width="200" alt="Report Address" />
3. Add details (tags, notes).
4. Tap **Submit**.
   
### Verifying Points
Tap any marker on the map to see details. You help the community by verifying reports!
- **Confirm Active**: Tap this if you find the nest/resource.
- **Report Inactive**: Tap this if it's gone or empty.
<br/><img src="images/point_details.jpg" width="240" alt="Point Details" />

### Planning a Route
Find the best walking path to visit multiple places.
1. Move the map to show the area you want to visit.
2. Tap **Route** 🚶.
3. Tap **Calculate Route** and follow the numbered path!
   <div style={{display: 'flex', gap: '10px'}}>
     <img src="images/feature_03_route_panel.jpg" width="200" alt="Route Panel" />
     <img src="images/feature_03_route_map.jpg" width="200" alt="Route Result" />
   </div>

### Exporting Data
You can download visible points for other uses.
1. Tap **Download** ⬇️.
2. Select **JSON** or **CSV**.
   <br/><img src="images/feature_04_download_panel.jpg" width="240" alt="Download Panel" />

### Viewing Messages
Check the **Inbox** for updates on points you've reported or subscribed to.
- **Badge**, **Inbox Panel**, and **Reminders**:
   <div style={{display: 'flex', gap: '10px'}}>
     <img src="images/feature_05_inbox_notification_badge.jpg" width="160" alt="Inbox Badge" />
     <img src="images/feature_05_inbox_panel.jpg" width="160" alt="Inbox Panel" />
     <img src="images/feature_05_inbox_popup.jpg" width="160" alt="Inbox Popup" />
   </div>

### Settings & Language
Tap **Settings** ⚙️ to:
- Change Language (EN, ES, FR, PT, etc.)
- Turn notifications on/off

- Turn notifications on/off
<br/><img src="images/settings_panel.jpg" width="240" alt="Settings Panel" />
