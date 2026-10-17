# Gisa Rides — MVP starter

Real Android + iPhone ride-hailing foundation for Kigali, Rwanda.

## Included
- Passenger mobile app (Expo/React Native)
- Live device location permission and map
- Tap-to-select destination
- Moto/car ride selection
- Real HTTP ride-request API
- Socket.IO real-time ride updates
- Demo Captain auto-assignment
- Ride status updates and driver location support

## Run the backend
```bash
cd server
npm install
npm run dev
```

## Run the mobile app
```bash
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:4000 npx expo start
```

For a physical phone, use your computer's LAN IP, not `localhost`.

## Google Maps
Put your Android Google Maps API key in `mobile/app.json` at `android.config.googleMaps.apiKey`. Restrict the key to the Android package `rw.gisarides.app` and the Maps SDK for Android.

On iPhone, `react-native-maps` can use the native Apple Maps provider by default. A Google Maps iOS setup can be added later if desired.

## Next production steps
1. Firebase phone authentication
2. PostgreSQL + PostGIS for drivers/rides
3. Real nearest-driver matching by distance
4. Driver app with background location
5. Passenger/driver trip state machine
6. Kigali fare rules and commission configuration
7. Payment integration (cash + Rwanda-supported digital payments)
8. Admin dashboard
9. Driver document verification
10. Production monitoring, security, rate limits, backups and deployment
