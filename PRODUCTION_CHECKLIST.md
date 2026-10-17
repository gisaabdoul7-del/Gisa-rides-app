# Gisa Rides pre-launch checklist

## Accounts and secrets
- [ ] Supabase project created; correct URL and publishable key configured locally.
- [ ] No service-role/secret key in Flutter, Git, APK, or IPA.
- [ ] Restricted Android Maps SDK key configured with package name and signing fingerprints.
- [ ] Restricted iOS Maps SDK key configured with bundle identifier.
- [ ] Google Cloud billing alerts and daily quotas configured.

## Backend and privacy
- [ ] Apply SQL migration to staging first; review RLS and RPC functions.
- [ ] Test passenger, pending driver, approved driver, and unauthorized-account permissions.
- [ ] Add automated database tests for allowed and denied select/insert/update/delete actions.
- [ ] Decide privacy policy, data retention, deletion, support contact, and incident response.
- [ ] Define driver identity, permit, vehicle and insurance verification procedures.

## Product and operations
- [ ] Confirm moto/car fares, minimum fare, road-distance method, cancellation and waiting fees.
- [ ] Add address search, route distance, ETA, trip cancellation and push notifications.
- [ ] Add a secure admin/operations dashboard and driver document review.
- [ ] Decide payment methods and reconcile cash/online-payment trips.
- [ ] Test poor network, GPS denied, app backgrounded, duplicate requests and driver race conditions.
- [ ] Test real devices in Kigali and obtain informed pilot-user feedback.

## Release
- [ ] Publish Terms of Service and Privacy Policy.
- [ ] Configure app identifiers, icons, signing certificates and store metadata.
- [ ] Run `flutter analyze` and `flutter test`; fix all findings.
- [ ] Build signed release and complete Android/iOS store review.
