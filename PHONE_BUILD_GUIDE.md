# Build Gisa Rides APK using only your Android phone

This source is for the Gisa Rides MVP (Flutter + Supabase + Google Maps). You do not need to install a code editor on your phone if you use GitHub's cloud build. You do need to finish the account setup below. This guide cannot create a live APK until those private settings are entered and the cloud build succeeds.

## Before you start

- Your Supabase project already has `profiles`, `rides`, and the functions `request_ride`, `accept_ride`, and `update_driver_ride_status`.
- Use the Supabase **Project URL** and **publishable key** (or legacy `anon` key). Never use a `service_role` / secret key in the app.
- In Google Cloud Console, enable **Maps SDK for Android**, set up billing, and create an Android-restricted API key. Restrict it to the app ID `rw.gisarides.gisa_rides` after the first generated build, and follow Google Cloud's current signing-key guidance. A missing Maps key may let the app build but the map will not load.

## A. Put the source on GitHub from your phone

1. Sign in to GitHub in your phone browser and create a **private** repository named `gisa-rides-app`.
2. Open the repository's **Add file** / upload files option. GitHub's browser upload does not reliably accept a ZIP as a repository, so extract `gisa_rides_flutter_source.zip` with your phone's file manager first, then upload the files and folders inside `gisa_rides_source` (including the hidden `.github` folder). If the browser hides dot-folders or makes folder upload difficult, use GitHub's web editor to add `.github/workflows/build-android.yml` from this package after uploading the remaining source.
3. Confirm that `lib/main.dart`, `pubspec.yaml`, `supabase/migrations/202610090001_gisa_rides.sql`, and `.github/workflows/build-android.yml` appear in the repository.

## B. Add private build settings

In the GitHub repository, open **Settings → Secrets and variables → Actions → New repository secret**. Add these exact names one by one:

- `SUPABASE_URL` — your Supabase Project URL, usually `https://YOUR_PROJECT_REF.supabase.co`.
- `SUPABASE_PUBLISHABLE_KEY` — your Supabase publishable key (or legacy `anon` key). Do not add the service-role/secret key.
- `ANDROID_MAPS_API_KEY` — your restricted Google Maps Android key.

Do not put any of these values into a public issue, screenshot, or chat message. Keep the repository private while you set it up.

## C. Start the cloud build

1. Open the repository's **Actions** tab.
2. Select **Build Gisa Rides Android APK**.
3. Tap **Run workflow** and confirm.
4. Wait for the workflow to finish. If it fails, open the failed step and read the error. The common causes are a missing secret, an incorrect Supabase URL/key, Maps setup, or a test/build error.
5. When successful, open the completed run and download the artifact named `gisa-rides-android-apk`. Extract the downloaded artifact ZIP; it contains `app-release.apk`.
6. Download `app-release.apk` to your phone and install it. Android may ask you to allow installation from that browser/file manager. Only install APKs you built from your own trusted private repository.

## D. Test before real customers use it

1. Create a passenger account and sign in.
2. Create a separate driver account. It must remain pending until you verify the driver and approve their profile in Supabase.
3. To approve a verified driver, find that driver's UUID in **Authentication → Users**, then run this in SQL Editor, replacing the placeholder with the exact UUID:

```sql
update public.profiles
set role = 'driver'
where id = 'REPLACE-WITH-VERIFIED-AUTH-USER-UUID'
  and role = 'driver_pending';
```

4. Use two accounts/devices to test requesting, accepting, arriving, starting, and completing a ride.
5. Confirm ride updates appear and test that a passenger cannot accept rides and a pending driver cannot accept rides.

## Important limits — not yet a public production service

This is a connected MVP source and a cloud-build workflow, not a guarantee that the app has passed device testing or store review. Current distance/fare estimates use straight-line GPS distance, not road distance/ETA. No in-app payments, push notifications, background live driver tracking, address autocomplete, cancellation flow, or secure admin dashboard are included. Before taking real customer rides, finish these features as required, review security and privacy, test the actual APK in Kigali, and validate the fares. Current defaults are moto 500 FRW/km and car 2,500 FRW/km; confirm the car rate because it differs from the general 500 FRW/km rate mentioned earlier.

An iOS build still requires Apple signing and App Store setup; this workflow only builds Android APK.
