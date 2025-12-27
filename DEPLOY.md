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
