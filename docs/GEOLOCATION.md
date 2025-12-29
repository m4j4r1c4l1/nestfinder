# 📍 Geolocation Troubleshooting

This guide is for troubleshooting specific location issues. For general setup, see the [User Guide](USER_GUIDE.md).

## Problem: "Location Access Denied"

If you see an error saying location was denied or blocked, your browser has likely saved a "No" answer from a previous visit.

### 🍏 Fix for iOS (iPhone/iPad)

**iOS Safari has two layers of permissions:**

1. **System Level**:
   - Go to **Settings** → **Privacy & Security** → **Location Services**.
   - <img src="images/ios_step1_menu.jpg" width="250" />
   - Ensure it is **ON**.
   - <img src="images/ios_step2_toggle.jpg" width="250" />
   - *If you see this system prompt, tap "Allow While Using App":*
   - <img src="images/ios_system_permission_prompt.jpg" width="250" />

2. **Browser Level (Safari)**:
   - In the same menu, scroll down to **Safari Websites**.
   - <img src="images/ios_step3_applist.jpg" width="250" />
   - Set to **"While Using the App"** (or "Ask Next Time") and check **Precise Location**.
   - <img src="images/ios_step4_permissions.jpg" width="250" />
   - *If set to "Never", Safari will auto-block all sites.*

3. **Method 2: Global Safari Settings**:
   - Go to **Settings** and find **Safari** (or search in Apps).
   - <img src="images/ios_safari_app_search.jpg" width="250" />
   - Scroll to **Settings for Websites** and tap **Location**.
   - <img src="images/ios_safari_settings_location.jpg" width="250" />
   - Ensure it is set to **"Ask"** or "Allow".
   - <img src="images/ios_safari_global_policy.jpg" width="250" />

**To clear a specific block:**
1. Go to **Settings** → **Safari** → **Advanced** → **Website Data**.
2. Search for `nestfinder` or `github`.
3. Swipe left to **Delete**.
4. Refresh the page and tap "Allow" when asked.

### 🤖 Fix for Android (Chrome)

1. Open **Chrome**.
2. Tap **Menu (⋮)** → **Settings** → **Site Settings**.
3. Tap **Location**.
4. Check if `nestfinder` is in the "Blocked" list.
5. Tap the site and select **Allow**.

**To clear cache:**
1. Tap the lock icon 🔒 in the address bar.
2. Tap **Permissions** → **Reset permissions**.

---

## Problem: "Location Unavailable" or Timeout

1. **Check GPS**: Ensure your phone's GPS/Location toggle is actually on.
2. **Go Outside**: Sometimes GPS signals are weak indoors.
3. **Refresh**: Reload the page and try again.

---

## Still Not Working?

You can still use the app!

- **Manual Mode**: When reporting a point, choose "**Select on Map**" to manually drop a pin without needing GPS.
