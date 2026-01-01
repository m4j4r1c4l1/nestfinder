# 📱 NestFinder User Guide

Welcome to **NestFinder**! This guide will help you get started with the app on your mobile device or computer.

---

**Contents**
- [🚀 Getting Started](#-getting-started)
- [📍 Enable Location Services](#-enable-location-services)
- [📖 Daily Usage](#-daily-usage)
  - [Map View](#map-view)
  - [Adding a Point](#adding-a-point)
  - [Verifying Points](#verifying-points)
  - [Planning a Route](#planning-a-route)
  - [Exporting Data](#exporting-data)
  - [Viewing Messages](#viewing-messages)
  - [Settings & Language](#settings--language)

---

## 🚀 Getting Started

NestFinder is a web app (PWA) that you can use directly on your phone without going to an App Store nor installing anything.

### Step 1: Open the App
Visit: [https://m4j4r1c4l1.github.io/nestfinder/](https://m4j4r1c4l1.github.io/nestfinder/)

<p align="center"><img src="images/landing_02_home.jpg" width="240" alt="Home Screen" /></p>

### Step 2: Install to Home Screen (Optional)

> [!TIP]
> Installing to your home screen is **optional**. The app works perfectly in any browser! Installing just makes it easier to access and gives a more app-like experience.

#### 🍏 iOS (iPhone/iPad)
1. Tap the **Share** button (box with arrow) or **Menu** (three dots).
<p align="center">
  <img src="images/ios_install_01_menu.jpg" width="160" alt="Menu" />
  <img src="images/ios_install_02_share.jpg" width="160" alt="Share" />
</p>

2. Scroll down and tap **"Add to Home Screen"**.
<p align="center"><img src="images/ios_install_03_add.jpg" width="200" alt="Add to Home Screen" /></p>

3. Tap **Add**.
<p align="center"><img src="images/add_to_home_screen.jpg" width="200" alt="Tap Add Button" /></p>

4. Success!
<p align="center"><img src="images/ios_install_04_result.jpg" width="200" alt="Home Screen Icon" /></p>

#### 🤖 Android (Chrome/Brave)
*(Screenshots shown using Brave browser)*

1. Tap the **Menu** button (three dots).
<p align="center"><img src="images/android_install_01_menu.jpg" width="200" alt="Android Menu" /></p>

2. Tap **"Add to Home screen"** (or "Install app").
<p align="center"><img src="images/android_install_02_add_menu.jpg" width="200" alt="Add to Home Screen" /></p>

3. Tap **Add** in the dialog.
<p align="center">
  <img src="images/android_install_03_create_shortcut.jpg" width="180" alt="Create Shortcut" />
  <img src="images/android_install_04_allow.jpg" width="180" alt="Allow Shortcut" />
</p>

4. Success!
<p align="center"><img src="images/android_install_05_result.jpg" width="200" alt="Android Home Screen" /></p>

---

## 📍 Enable Location Services

To find resources near you and use route navigation, the app needs your location.

> [!IMPORTANT]
> **Privacy First**: We only use your location to show nearby points and calculate routes, but we do NOT save or share any information regarding your location in any way.

### iOS (iPhone)

1. Go to **Settings** → **Privacy & Security**. Select **Location Services**.
<p align="center"><img src="images/ios_step1_menu.jpg" width="250" alt="iOS Privacy Menu" /></p>

2. Make sure **Location Services** is **ON**.
<p align="center"><img src="images/ios_step2_toggle.jpg" width="250" alt="iOS Location Toggle" /></p>

3. Scroll down to **Safari Websites**.
<p align="center"><img src="images/ios_step3_applist.jpg" width="250" alt="iOS App List" /></p>

4. Select **"Ask Next Time or When I Share"** (or "While Using the App") and ensure **Precise Location** is ON.
<p align="center"><img src="images/ios_step4_permissions.jpg" width="250" alt="iOS Permissions" /></p>

### Android

1. Go to **Settings** → **Location**, ensure it's **ON**, and check your browser permissions.
<p align="center">
  <img src="images/android_location_settings_01_main.jpg" width="180" alt="Android Location Settings" />
  <img src="images/android_location_settings_02_permissions.jpg" width="180" alt="App Permissions" />
</p>

2. If you see the **Enable Location** screen, tap the button:
<p align="center"><img src="images/android_location_01_overlay.jpg" width="200" alt="Enable Location Overlay" /></p>

3. When the browser asks, select your preference and tap **Allow**:
<p align="center"><img src="images/android_location_02_permission.jpg" width="200" alt="Browser Permission" /></p>

### Troubleshooting
If you see a purple banner saying "Enable Your Location", tap the **Enable Location** button.

<p align="center"><img src="images/landing_03_location_prompt.jpg" width="250" alt="Enable Location Banner" /></p>

If you see this iOS system prompt, tap "**Allow While Using App**":

<p align="center"><img src="images/ios_system_permission_prompt.jpg" width="250" alt="iOS System Permission Prompt" /></p>

If it still doesn't work, clear your browser cache and try again. See full [Geolocation Troubleshooting](GEOLOCATION.md).

---

## 📖 Daily Usage

### Map View
The main screen is the map.

- **My Location**: Tap the 📍 button (bottom right) to center on you.
- **Filter**: Tap the magnifying glass icon 🔍 to show only specific points (e.g., confirmed only).

<p align="center">
  <img src="images/feature_01_filter_panel.jpg" width="200" alt="Filter Panel" />
  <img src="images/map_view.jpg" width="200" alt="Main Map View" />
</p>

### Adding a Point
Help others by reporting resources!

#### Point Status Flow
Points move through different states based on community actions:

<p align="center"><img src="images/point_status_flow.png" width="400" alt="Point Status Flow Diagram" /></p>

1. Tap **Report** in the bottom menu.
2. Choose a location:
   - **Current Location**: Use where you are now.
   - **Select on Map**: Tap a spot on the map.
   - **Address**: Type the address manually.
<p align="center">
  <img src="images/feature_02_report_gps.jpg" width="160" alt="Report GPS" />
  <img src="images/feature_02_report_map.jpg" width="160" alt="Report Map" />
  <img src="images/feature_02_report_address.jpg" width="160" alt="Report Address" />
</p>

3. Add details (tags, notes).
4. Tap **Submit**.
   
### Verifying Points
Tap any marker on the map to see details. You help the community by verifying reports!
- **Confirm Active**: Tap this if you find the nest/resource.
- **Report Inactive**: Tap this if it's gone or empty.

<p align="center"><img src="images/point_details.jpg" width="240" alt="Point Details" /></p>



### Planning a Route
Find the best walking path to visit multiple places.
1. Move the map to show the area you want to visit.
2. Tap **Route** 🚶.
3. Tap **Calculate Route** and follow the numbered path!

<p align="center">
  <img src="images/feature_03_route_panel.jpg" width="180" alt="Route Panel" />
  <img src="images/feature_03_route_map.jpg" width="180" alt="Route Result" />
</p>

### Exporting Data
You can download visible points for other uses.
1. Tap **Download** ⬇️.
2. Select **JSON**, **CSV**, **GPX**, or **KML**.

<p align="center"><img src="images/feature_04_download_panel.jpg" width="240" alt="Download Panel" /></p>

### Viewing Messages
Check the **Inbox** for updates on points you've reported or subscribed to.

<p align="center">
  <img src="images/feature_05_inbox_panel.jpg" width="180" alt="Inbox Panel" />
  <img src="images/feature_05_inbox_popup.jpg" width="180" alt="Inbox Popup" />
</p>

Unread messages will be shown with a badge:
<p align="center"><img src="images/feature_05_inbox_notification_badge.jpg" width="360" alt="Inbox Badge" /></p>

### Settings & Language
Tap **Settings** ⚙️ to:
- Change Language (EN, ES, FR, PT, etc.)
- Toggle notification style (popup alerts vs. silent inbox)

<p align="center"><img src="images/settings_panel.jpg" width="240" alt="Settings Panel" /></p>
