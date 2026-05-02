# Setup Instructions for New Members

Follow these steps to get the project running on your local machine.

## 1. Backend Setup
1. Navigate to the backend folder: `cd mobile-backend`
2. Install dependencies: `npm install`
3. Create a `.env` file: `cp .env.example .env` (or manually copy and rename).
4. Update the `.env` file with your own:
   - `MONGODB_URI`: Your MongoDB connection string.
   - `JWT_SECRET`: A random string for security.

## 2. Frontend Setup
1. Navigate to the root folder: `cd ..`
2. Install dependencies: `npm install`
3. **CRITICAL STEP**: Update the API IP address:
   - Open `src/config/apiConfig.js`
   - Change the IP address (e.g., `192.168.x.x`) to your computer's actual local IP address.
   - *On Windows, run `ipconfig` in CMD to find your "IPv4 Address".*

## 3. Running the App
1. **Start the Backend**:
   - In the `mobile-backend` folder: `npm run dev` (or `node server.js`)
2. **Start the Mobile App**:
   - In the root folder: `npx expo start`
3. **Open the App**:
   - Use the **Expo Go** app on your physical device and scan the QR code.
   - Ensure your phone and computer are on the **same Wi-Fi network**.
