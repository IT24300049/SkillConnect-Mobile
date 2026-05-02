# SkillConnect React Native Client

This folder contains a true React Native app (Expo) to satisfy the assignment requirement.

## Backend
Configured in `src/config/apiConfig.js`:
- `https://skill-connect-mobile-backup-api.onrender.com/api/v1`

## Run
1. `npm install`
2. `npm run android` (with emulator/device)
3. `npm run web` (optional browser test)

## Implemented modules
- Authentication: register/login with JWT session
- Jobs: protected list
- Profile: fetch current user
- Bookings: list, create, status actions, delete
- Equipment: list, supplier create flow
- Complaints: list and submit complaint
- Reviews: list and submit review

## Notes
- This app uses React Native components and React Navigation (not Capacitor WebView).
- Some backend endpoints have inconsistent field naming; client sends compatibility payloads where needed.
