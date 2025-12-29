# Bottom Sheet Modal - Layout Architecture

## Overview
This document explains the layout solution for the bottom sheet modal system used throughout NestFinder's panels (Route, Settings, Filter, Submit, Download, Notifications).

## Structure

### Current Architecture (2-Layer)
```
┌─────────────────────────────────────────┐
│ .bottom-sheet (RED - Modal Container)   │
│ ├── .bottom-sheet-handle (Drag bar)     │
│ └── .card (GREEN - Content Panel)       │
│     └── .card-body (CYAN - Inner)       │
└─────────────────────────────────────────┘
```

### Files
- **JSX Structure**: `client/src/pages/MapView.jsx` (lines 305-382)
- **CSS Styling**: `client/src/index.css` (lines 528-610)

## Historical Context

### Previous Architecture (3-Layer) ❌
```
.bottom-sheet (Red)
  └── .bottom-sheet-content (Blue wrapper)
      └── .card (Green)
          └── .card-body (Cyan)
```

### Why Blue Wrapper Was Removed
The `.bottom-sheet-content` wrapper was initially designed for:
- Scrollable overflow handling
- Consistent padding around content
- Separation between fixed handle and scrolling content

**However, it caused a critical issue:**
- Blue box had `flex: 1 1 auto` to fill available space
- Red box used `justify-content: center` to center children
- Result: **Blue + Handle filled entire Red box**, leaving no space for centering
- Even with `flex: 0 1 auto` + `margin: auto`, Blue remained stuck at bottom

**Solution:** Removed Blue wrapper entirely, moving its properties to Red.

## Current Solution

### Vertical Centering
```css
.bottom-sheet {
  display: flex;
  flex-direction: column;
  /* NO justify-content: center */
  overflow-y: auto;
}

.bottom-sheet > .card {
  margin: auto 0;  /* Vertical centering */
  flex: 0 1 auto;  /* Natural height */
}
```

**How it works:**
1. **Short content**: `margin: auto 0` centers the card vertically within Red
2. **Tall content**: Card grows naturally, Red scrolls with `overflow-y: auto`

### Why Not `justify-content: center`?
```
justify-content: center + overflow-y: auto = ⚠️ DANGER
```

When content overflows, `justify-content: center` can:
- Clip top content (unreachable)
- Start scroll from "center point" instead of top
- Create poor UX for tall panels

Using `margin: auto 0` instead:
- ✅ Centers short content
- ✅ Allows full top-to-bottom scrolling
- ✅ No content clipping

## CSS Properties Breakdown

### Red Box (`.bottom-sheet`)
```css
max-height: calc(100vh - 150px);  /* Fits on screen with nav */
padding: var(--space-4);          /* 16px spacing */
padding-top: 0;                   /* Allow handle to touch top */
overflow-y: auto;                 /* Scroll when tall */
display: flex;
flex-direction: column;
```

### Green Card (`.bottom-sheet > .card`)
```css
margin: auto 0;      /* Vertical centering */
flex: 0 1 auto;      /* Grow based on content, can shrink */
max-height: none;    /* No height restriction */
overflow: visible;   /* Don't clip content */
```

### Cyan Body (`.bottom-sheet > .card .card-body`)
```css
padding: var(--space-4);           /* 16px all sides */
padding-bottom: var(--space-10);   /* 40px bottom lift */
display: flex;
flex-direction: column;
justify-content: center;           /* Center inner form elements */
```

## Debugging

### Visual Debug Colors
Enabled in development via CSS comments:
- 🔴 **Red**: `.bottom-sheet` (outer container)
- 🟢 **Green**: `.card` (panel container)
- 🟦 **Cyan**: `.card-body` (inner content)

To enable:
```css
/* DEBUG: RED - Outer Sheet Container */
border: 4px solid red !important;
background: rgba(255, 0, 0, 0.15) !important;
```

### Common Issues

**Problem**: Content touching bottom of Red box
- **Cause**: Missing `margin: auto 0` on Green card
- **Fix**: Ensure `.bottom-sheet > .card` has `margin: auto 0`

**Problem**: Can't scroll to top of content
- **Cause**: Using `justify-content: center` with `overflow`
- **Fix**: Remove `justify-content`, use `margin: auto` instead

**Problem**: Content not centered when short
- **Cause**: Missing `flex: 0 1 auto` on Green card
- **Fix**: Ensure card has natural height, not `flex: 1`

## Migration Notes

If you need to add a new panel:
1. Add panel component to `MapView.jsx` inside `.bottom-sheet` div
2. Ensure component returns a `.card` element
3. No wrapper needed - card is direct child of Red box
4. Centering and scrolling work automatically

## References

- **Commit History**:
  - `2b5fee5`: Removed Blue wrapper
  - `1a1c3d3`: Fixed scrolling with safe centering
  - `c0ded91`: Initial flex attempts (superseded)

- **Related Issues**: Panel alignment, vertical centering, scroll behavior
