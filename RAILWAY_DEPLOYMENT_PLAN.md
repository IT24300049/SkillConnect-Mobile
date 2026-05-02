# Railway Deployment Plan - SkillConnect Backend

This guide outlines the steps to deploy your Node.js backend to Railway.app and connect it to your React Native app.

## 1. Prepare for Deployment

### Project Structure Note
Since your backend is in a subfolder (`mobile-backend`), Railway needs to know that this is the root of the application.

### Required Files
- **Procfile** (Optional but recommended): Create a file named `Procfile` in the `mobile-backend` folder with the following content:
  ```
  web: node server.js
  ```
- **.gitignore**: Ensure `node_modules` and `.env` are ignored (they already should be).

## 2. Railway.app Setup

1.  **Create Account**: Sign up at [Railway.app](https://railway.app/).
2.  **New Project**: Click "New Project" -> "Deploy from GitHub repo".
3.  **Root Directory**: In the Railway project settings for your repo, look for **"Root Directory"** and set it to `/mobile-backend`. This tells Railway to ignore the frontend files and only build the backend.
4.  **Environment Variables**: Navigate to the "Variables" tab in Railway and add the following keys from your `.env` file:
    - `MONGODB_URI`: (Your MongoDB Atlas URL)
    - `JWT_SECRET`: (Your secret key)
    - `PORT`: 5001 (or Railway will provide one automatically)
    - `NODE_ENV`: production

## 3. Handling CORS

In your `mobile-backend/server.js`, ensure CORS is configured to allow requests from your production frontend (though for React Native, it's less strict, but good for testing).

## 4. Connecting the Mobile App

Once deployed, Railway will provide you with a public URL (e.g., `https://skillconnect-production.up.railway.app`).

1.  **Update Config**: Open `src/config/apiConfig.js`.
2.  **Change Base URL**:
    ```javascript
    // Change this from local IP to Railway URL
    export const API_BASE_URL = "https://skillconnect-production.up.railway.app/api/v1";
    ```

## 5. Deployment Checklist

- [ ] Check `mobile-backend/package.json` has `"start": "node server.js"`.
- [ ] Ensure `MONGODB_URI` in Railway points to a cloud database (Atlas), not a local one.
- [ ] Set `Root Directory` to `/mobile-backend` in Railway settings.
- [ ] Verify that the `PORT` is not hardcoded to `5001` in `server.js` but uses `process.env.PORT`.

### Let's verify your `server.js` Port configuration:
I will check if your server uses `process.env.PORT` correctly.
