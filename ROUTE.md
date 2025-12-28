# 🚶 Route Planner Feature

## Overview

The Route Planner calculates the optimal walking path to visit selected points on the map. It uses a **viewport-based filtering** approach to keep routes manageable and relevant.

---

## How It Works

### 1. Viewport-Based Filtering
Routes are calculated **only for points visible on screen**:
- Pan/zoom the map to your target area
- Only points in the current view are included
- This keeps routes focused and efficient

### 2. Status Filtering
Additionally filter by point status:
- ✅ **Confirmed** — Verified locations
- ⏳ **Pending** — Awaiting verification
- ❌ **Deactivated** — No longer active

### 3. Nearest Neighbor Algorithm
The route is optimized using nearest-neighbor ordering:
1. Start from your location (if available) or the first point
2. Visit the closest unvisited point next
3. Repeat until all points are connected

---

## Using the Route Planner

1. **Navigate** to your target area on the map
2. Tap **Route** 🚶 in the bottom navigation
3. **Toggle** status filters as needed
4. See **"X points selected"** (only visible points count)
5. Tap **"Calculate Route"**
6. View the route on the map with numbered waypoints

---

## Technical Details

### API Provider
Routes are calculated using [OSRM](https://router.project-osrm.org/) (Open Source Routing Machine):
- Walking mode directions
- Real street paths (not straight lines)
- Free, no API key required

### Map Bounds Tracking
```javascript
// Map.jsx - BoundsTracker component
map.on('moveend', updateBounds);
map.on('zoomend', updateBounds);
// Reports: { north, south, east, west }
```

### Point Filtering
```javascript
// RoutePanel.jsx
const isPointInBounds = (point) => {
    return (
        point.latitude >= mapBounds.south &&
        point.latitude <= mapBounds.north &&
        point.longitude >= mapBounds.west &&
        point.longitude <= mapBounds.east
    );
};

// Combined filter: status + viewport
points.filter(p => statusFilter[p.status] && isPointInBounds(p));
```

---

## Tips

| Tip | Description |
|-----|-------------|
| **Zoom in** | Fewer points = faster calculation |
| **Use filters** | Hide irrelevant statuses to simplify |
| **Re-center** | Tap 📍 to return to your location |
| **Clear route** | Tap "Clear Route" to start fresh |

---

## Limitations

- Maximum ~25 points recommended for optimal performance
- Requires internet connection for OSRM API
- Walking routes only (no driving/cycling)
