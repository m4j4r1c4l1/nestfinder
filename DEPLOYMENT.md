# Deployment Guide for NestFinder

This guide outlines the best way to deploy the NestFinder application using **Render.com**. We recommend a **Unified Deployment** strategy, where the Node.js server serves both the API and the React frontend. This is the simplest and most robust approach for this application.

## Prerequisites

1.  A [GitHub](https://github.com/) account with this repository pushed to it.
2.  A [Render](https://render.com/) account.
3.  **Important**: Because this application uses a local SQLite database (`nestfinder.db`), you **MUST** use a deployment service that supports persistent storage (Disks/Volumes) to prevent data loss on restarts. Render's "Starter" plan ($7/month) supports Disks.
    *   *If you use a free tier (Ephemeral), all user data will be wiped every time the server restarts or deploys.*

---

## Step-by-Step Guide (Unified Deployment)

### 1. Push Code to GitHub
Ensure your latest code is pushed to your GitHub repository.
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Create a Web Service on Render
1.  Log in to your Render Dashboard.
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub repository (`nestfinder` or whatever you named it).

### 3. Configure the Service
Fill in the details as follows:

*   **Name**: `nestfinder` (or your choice)
*   **Region**: Choose the one closest to you (e.g., Oregon, Frankfurt).
*   **Branch**: `main`
*   **Root Directory**: (Leave blank)
*   **Runtime**: `Node`
*   **Build Command**:
    ```bash
    cd client && npm install && npm run build && cd ../server && npm install
    ```
    *(This builds the React app first, then installs server dependencies)*
*   **Start Command**:
    ```bash
    cd server && npm start
    ```
*   **Instance Type**: Select **Starter** ($7/mo) if you want to save data. You can select **Free** for testing, but data will be lost on restart.

### 4. Add Persistent Disk (Crucial for SQLite)
*If you are on the Starter plan or higher:*
1.  Scroll down to **Disks** (Advanced).
2.  Click **Add Disk**.
3.  **Name**: `nestfinder-db`
4.  **Mount Path**: `/opt/render/project/src/server/db`
    *   *Explanation*: Render clones your repo to `/opt/render/project/src`. Our code looks for the DB in `server/db`. This mount ensures that the `server/db` folder is stored on a separate, persistent disk.
5.  **Size**: 1 GB is plenty.

### 5. Environment Variables
Scroll to the **Environment Variables** section and add:

*   `NODE_VERSION`: `20` (Recommended)
*   `PORT`: `10000` (Render sets this automatically, but good to know)

### 6. Deploy
Click **Create Web Service**.
Render will start building your app. It might take a few minutes.
Watch the logs. You should see:
1.  Frontend build completing.
2.  Server starting.
3.  `Database initialized successfully`.

### 7. Access Your App
Once deployed, Render will verify the service is live.
Click the URL provided (e.g., `https://nestfinder.onrender.com`).
You should see the NestFinder app load!

---

## Technical Details (What we changed)

To make this deployment possible, we made two small changes to your code:

1.  **Server (`server/index.js`)**: Configured to serve the built React files from `client/dist`. This allows the API server to also host the website.
2.  **Client (`client/src/utils/api.js`)**: Updated to automatically detect the API URL, so it works both on localhost and in production.

## Database Note regarding `sql.js` vs `sqlite3`
We noticed the project uses `sql.js` which loads the DB into memory and writes it back to disk manually. While this works, for a heavier production load in the future, consider switching to `better-sqlite3` or `sqlite3` for better performance and safety, or use a hosted database like Turso or Supabase. For now, the Persistent Disk solution works perfectly with the existing code.
