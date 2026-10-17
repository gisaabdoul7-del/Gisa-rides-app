# Gisa Rides — Flutter MVP for Kigali, Rwanda

A Flutter starter app for Android and iOS with:

- Email/password sign-up and sign-in through Supabase Auth
- Passenger and driver account flows (new driver accounts are pending approval)
- Google Maps view centered on Kigali, map-tap pickup/destination selection, and GPS pickup
- Ride request creation stored in Supabase
- A driver queue with atomic ride acceptance and trip-stage updates
- Passenger ride status/history stream
- SQL functions and Row Level Security (RLS) policies

**This is an MVP source project, not yet a production-reviewed or store-published ride-hailing service.** It needs your real project credentials, native platform configuration, testing on physical Android/iOS devices, driver verification operations, customer-support processes, and final fare/business decisions. It currently estimates distance as straight-line GPS distance. It does not yet provide Google Routes road-distance fares, address autocomplete, in-app payments, push notifications, background driver tracking, or an admin dashboard.

## 1. What you need

Install the current stable Flutter SDK and Android Studio (Android SDK/emulator). To build the iOS app, you also need a Mac with Xcode. An iOS build cannot be produced locally on Windows alone.

Create these accounts/projects:

1. **Supabase** — create a project at <https://supabase.com/>. Find the Project URL and publishable key in the project's Connect/API settings. The publishable key (or legacy `anon` key) is intended for client use when RLS is configured. Never put a `service_role` or secret key into Flutter, source control, screenshots, or an APK/IPA.
2. **Google Maps Platform** — create a Google Cloud project at <https://console.cloud.google.com/>, attach billing, enable **Maps SDK for Android** and **Maps SDK for iOS**, and create separate restricted API keys for Android and iOS. Restrict each key to the appropriate app identifier and Maps SDK. A Routes API key should be server-side if road-route calculations are later added.
3. **Publishing accounts, when ready** — Google Play Console for Android release; Apple Developer Program/Xcode signing for App Store distribution. These are separate from the source-code setup.

Do not send private keys or passwords in chat. Enter your credentials locally in your development environment.

## 2. Generate Android/iOS native scaffolding

Open a terminal in this `gisa_rides_source` directory. If the `android/` and `ios/` folders are not present (they are intentionally not included in this source bundle), generate them:

```bash
flutter create --platforms=android,ios .
flutter pub get
```

If Flutter asks whether to overwrite the existing Dart source, keep the files in `lib/` and `test/` from this project.

## 3. Set up Supabase database

In Supabase Dashboard → SQL Editor, run the full file:

`supabase/migrations/202610090001_gisa_rides.sql`

Then check Database → Tables for `profiles` and `rides`. In Database → Publications/Realtime, ensure `public.rides` is included in `supabase_realtime`. The SQL attempts to add it if the publication exists.

### Approve a driver

Driver sign-ups are deliberately assigned `driver_pending`. Verify the driver's identity, driving permit, vehicle/insurance documents as applicable, and business requirements before approval. Then, from the Supabase SQL Editor, update the specific profile by the driver's authenticated user UUID:

```sql
update public.profiles
set role = 'driver'
where id = 'REPLACE-WITH-VERIFIED-AUTH-USER-UUID'
  and role = 'driver_pending';
```

Do not promote drivers based solely on a submitted name. Keep the UUID and verification records in your private admin workflow.

## 4. Configure Google Maps on Android

In `android/app/src/main/AndroidManifest.xml`, add this permission within the root `<manifest>` element if not already present:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

Inside the `<application>` element, before the activity declarations, add:

```xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_RESTRICTED_ANDROID_MAPS_API_KEY" />
```

Replace the placeholder locally. Use the final Android application ID/package name and SHA certificate fingerprint when restricting the Android key in Google Cloud. Ensure the API key is not accidentally checked into a public repository; still restrict it even if it has to be embedded in the mobile package.

## 5. Configure Google Maps on iOS

Open `ios/Runner/AppDelegate.swift`. Add `import GoogleMaps` if missing, and call `GMSServices.provideAPIKey("YOUR_RESTRICTED_IOS_MAPS_API_KEY")` early in `application(_:didFinishLaunchingWithOptions:)` before `GeneratedPluginRegistrant.register(with: self)`. Follow the current `google_maps_flutter` iOS setup guide if your generated AppDelegate has a different template.

In `ios/Runner/Info.plist`, add a user-facing description within the main dict:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Gisa Rides uses your location to set your pickup point.</string>
```

Restrict the iOS key to your bundle identifier in Google Cloud. Do not commit the live key to a public repository.

## 6. Run the app

Use the Supabase **Project URL** and **publishable key**. In a terminal, run (replace the values locally):

```bash
flutter run \
  --dart-define=SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co \
  --dart-define=SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

The Maps key is configured in the native Android/iOS files as described above. If the Supabase values are absent, the app intentionally shows a setup screen. Use a real device or emulator with Google Maps services and internet access.

## 7. Try the MVP

1. Create a passenger account with an email and password. If email confirmation is enabled, confirm the email before sign-in.
2. Create a separate driver account. It will stay on the pending-approval screen until approved in SQL.
3. In the passenger app, use **my location** for pickup or tap the map to set pickup; tap a second point for destination.
4. Choose Moto or Car, review the estimated fare, and request a ride.
5. Sign in as an approved driver on a second device/account, accept a ride, then mark arrived, start trip, and complete trip.
6. Confirm the passenger's ride status updates.

## 8. Initial fares — owner confirmation required

The project uses the values previously discussed:

- Moto: **500 FRW per estimated kilometre** (5 km ≈ 2,500 FRW)
- Car: **2,500 FRW per estimated kilometre** (10 km ≈ 25,000 FRW)

These are application defaults, not a validated Kigali market tariff. Distance is straight-line, so it will usually differ from road distance. Before launch, decide whether car pricing really is 2,500 FRW/km, set minimum fares and cancellation/no-show rules, and replace straight-line estimation with road distance from Google Routes or another routing service. Change both `lib/fare.dart` and the SQL `request_ride` function together.

## 9. Commands to test and build

```bash
flutter analyze
flutter test
flutter run
flutter build apk --release
flutter build appbundle --release
flutter build ipa --release  # run on macOS with valid signing configuration
```

Before production: test Supabase RLS policies with allow/deny cases, add secure driver identity review, privacy policy/terms, crash reporting, backups, operational monitoring, support and emergency procedures, fair cancellation rules, and a proper route/fare calculation. Perform a security review of all RPC functions before real riders use this service.

## Project structure

```text
lib/main.dart                 App, auth, passenger and driver views
lib/fare.dart                 Fare rates and straight-line distance helper
supabase/migrations/*.sql     Tables, RLS, ride-request/driver RPC functions
 test/fare_test.dart          Fare helper tests
```

## Current MVP limitations

- No Supabase project or Maps API credentials are included.
- No backend has been provisioned or verified from this source archive.
- No real road-routing / ETA / place search yet; pickup and destination are map taps.
- No payments, SMS OTP, push notifications, trip cancellation, driver live-location sharing, or admin dashboard yet.
- No APK, IPA, Play Store listing, or App Store release has been signed/published by this bundle.
