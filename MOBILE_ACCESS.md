# Accessing NestFinder on Local Network (Mobile Testing)

You can access both the Client and Admin dashboard from other devices (like your phone) on the same Wi-Fi network.

## Prerequisites
1.  Your computer and mobile device must be on the **same Wi-Fi network**.
2.  Windows Firewall (or other firewalls) must allow Node.js to accept incoming connections.

## How to Start
Start the development servers as usual:

```powershell
# In one terminal (Client)
cd client
npm run dev

# In another terminal (Admin)
cd admin
npm run dev

# In a third terminal (Server) (Required for data/API)
cd server
npm start
```

## How to Access
When you run `npm run dev` for the client or admin, you will now see something like this in the terminal:

```
  VITE v5.0.10  ready in 250 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.5:5173/  <-- THIS IS THE URL YOU NEED
```

1.  **Find the Network URL**: Look for the `Network:` line in your terminal output.
2.  **Open on Phone**: Type that exact URL (e.g., `http://192.168.1.5:5173`) into your phone's web browser.

## Troubleshooting
*   **Site can't be reached?**
    *   Check if your computer's Firewall is blocking port `5173` (Client), `5174` (Admin), or `3001` (Server).
    *   Try temporarily disabling the firewall to test.
    *   Ensure both devices are on the same Wi-Fi (e.g., one isn't on 5G/LTE).
*   **API Errors?**
    *   Ensure the **Server** is running (`cd server && npm start`).
    *   If the frontend loads but data doesn't, ensure port `3001` is also allowed through the firewall.
