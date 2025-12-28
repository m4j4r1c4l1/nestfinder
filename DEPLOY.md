# 🚀 Deploying to Render

This guide explains how to deploy NestFinder to [Render.com](https://render.com) as a single "Web Service".

## Prerequisite
Ensure your code is pushed to a GitHub repository.

## 1. Create a Web Service
1.  Log in to your Render dashboard.
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository.

## 2. Configure Settings
Use the following settings for your service:

| Setting | Value |
| :--- | :--- |
| **Name** | `nestfinder` (or your choice) |
| **Region** | Closest to you |
| **Branch** | `feature/deployment-config` |
| **Root Directory** | `.` (Leave empty) |
| **Runtime** | `Node` |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |

> **Note:** The `npm run build` command defined in the root `package.json` will install dependencies and build both Client and Admin apps.

## 3. Environment Variables
Scroll down to the "Environment Variables" section and add:

| Key | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `18.17.0` (or higher) |

## 4. Deploy
Click **Create Web Service**. Render will:
1.  Clone your repo.
2.  Run `npm run build` (Installing deps & building React apps).
3.  Run `npm start` (Starting the Express server).

Your app will be live at `https://your-app-name.onrender.com`.

- **Main App:** `/`
- **Admin Dashboard:** `/admin-panel`

## 5. Add Persistent Disk (Crucial for SQLite)
*If you are on the Starter plan or higher:*
1.  Scroll down to **Disks** (Advanced).
2.  Click **Add Disk**.
3.  **Name**: `nestfinder-db`
4.  **Mount Path**: `/opt/render/project/src/server/db`
    *   *Explanation*: Render clones your repo to `/opt/render/project/src`. Our code looks for the DB in `server/db`. This mount ensures that the `server/db` folder is stored on a separate, persistent disk.
5.  **Size**: 1 GB is plenty.

> [!WARNING]
> If you do not add a persistent disk, your database will be reset every time the server restarts or deploys.

## 6. Database Note
The project uses `sql.js` which loads the DB into memory and writes it back to disk manually. While this works, for a heavier production load in the future, consider switching to `better-sqlite3` or `sqlite3` for better performance and safety. For now, the Persistent Disk solution works perfectly with the existing code.
