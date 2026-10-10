# Deploy the AI-generation foundation

This is a staging deployment runbook for the hardened AI generation flow. Payments/wallets, marketplace booking APIs, legacy project/brief APIs, team messaging/notification APIs and live voice are blocked outside development. Team execution boards remain labeled planning demonstrations. See PRODUCTION_READINESS_REPORT.md for the remaining launch work. Do not describe this deployment as a fully production-ready financial/agent platform.

## Prerequisites

- A VPS with Docker Compose and Nginx, or another container host with equivalent secret mounts and HTTPS. No server/hosting connection was available during this task.
- A domain pointed at that VPS and added to Firebase Authentication's authorized domains. Enable the Auth providers actually used by the app.
- A paid Gemini API project/key with access to the exact image and Veo models you plan to offer. Put GEMINI_API_KEY only in server secrets.
- Firebase project gen-lang-client-0304979454, the named Firestore database ai-studio-remixonlycreatio-df40d4e4-af6e-4162-91b6-f536149ec519, and the configured storage bucket. If replacing the Firebase project, update firebase-applet-config.json and firebase.json together before building.
- A server service account for that project with Firebase Auth token/account read access, Firestore transaction read/write access and private bucket object create/read access plus bucket metadata access for readiness. Prefer workload identity on managed Google hosting; on a VPS mount a service-account JSON outside source control. Never upload this JSON to GitHub.

## Configure Firebase first

From a trusted machine with Firebase CLI installed and authenticated as the project owner:

```bash
firebase deploy --project gen-lang-client-0304979454 --only firestore,storage
```

firebase.json selects the named database, not the default database. Wait for composite indexes to finish building. Test the rules in Firebase Emulator before applying them to an existing live customer database; stricter rules deliberately disable insecure legacy writes.

Inspect admins documents for previously self-granted access. Remove unauthorized roles using a trusted owner session. Provision only intended administrators through Firebase Console or Admin SDK; the browser cannot create admins. Also verify bucket IAM denies public access: Firebase Storage rules alone do not override public GCS IAM.

## Hostinger / VPS deployment

Use a reviewed branch/commit from the pull request, or merge it after review and deploy main. Pin the deployment revision rather than pulling an unreviewed branch blindly.

```bash
cd /var/www
git clone https://github.com/onlycreation07-tech/V2_Onlycreation.git onlycreation-v2
cd /var/www/onlycreation-v2
git checkout fix/production-generation-foundation
cp .env.example .env
openssl rand -hex 32
```

Set GEMINI_API_KEY, MEDIA_SIGNING_SECRET to the generated value, APP_URL to the HTTPS origin and the quota values in .env. Set NODE_ENV=production. Payment variables are unused by the blocked production flows. The frontend's Firebase configuration contains the normal public Firebase identifier, not the server Gemini secret.

Store the service-account file at /etc/onlycreation/firebase-service-account.json. Restrict it to the UID used by the non-root container (1000) and owner read only; verify it is readable inside the container. Ensure .env is also restricted. The Compose file mounts credentials read only and exposes the app only on localhost.

```bash
docker compose -f deployment/compose.yaml up -d --build
docker compose -f deployment/compose.yaml logs --tail=100 app
curl --fail http://127.0.0.1:3000/api/health
curl --fail http://127.0.0.1:3000/api/ready
```

Health is process liveness. Readiness verifies Firestore and bucket access; it does not prove model access or Google billing. A 503 readiness response means credentials/database/storage need fixing before routing traffic. The server also refuses startup without the Gemini key and a sufficiently long media-signing secret.

Copy deployment/nginx.conf to the VPS Nginx site configuration, replace app.example.com with the real domain, enable it, run nginx -t and reload Nginx. Install/configure Certbot for that domain to obtain HTTPS, then check the generated TLS configuration and renewal. Do not expose Vite's development server as the production application. The proxy read timeout accommodates generation requests up to 120 seconds; a timed-out submission needs reconciliation, not automatic resubmission.

## Verify before admitting users

1. Confirm a real Firebase user can sign in, use chat, generate an image, edit a JPEG and download the actual result. Check both image model choices and aspect ratios.
2. Generate one real Veo clip, confirm the returned model and 8-second duration/resolution, refresh during generation, play/seek/download the saved clip and recover it from the asset library.
3. Simulate blocked/no-output/access/quota errors. Confirm no Pollinations image, stock ocean video, fake campaign or invented performance metric replaces the error.
4. Sign in as another user. Confirm they cannot access the first user's job IDs, role documents or private assets without an explicitly shared expiring asset link. Test Firestore isolation with Emulator.
5. Confirm unauthenticated generation returns 401, disabled payment/wallet flows return 503, and live voice fails closed.
6. Review provider charges and errors for these smoke tests. Run a restore/rollback rehearsal before a public beta. Count quotas are conservative and should be adjusted to the actual budget.

## Operations and known limits

Assets are private objects under generated/{uid}/{jobId}. Server-issued asset links expire after 24 hours; reopen the library or request a fresh download link to renew access. Asset links grant access to whoever possesses them during that period. Keep MEDIA_SIGNING_SECRET stable across instances; rotating it invalidates existing links.

Firestored generationQuotas use expiresAt for retention; enable Firestore TTL on that field to remove expired counters. Create a separate retention/deletion policy for jobs and bucket objects. Jobs/archive retrieval currently depend on an authenticated browser poller; a durable worker is still required for unattended completion. Daily caps reset at UTC midnight. Defaults: per user 3 video / 25 image / 100 text starts, per project 10 / 100 / 500. Failed/duplicate submissions conservatively consume count allowance. These are counts, not charge authorization or money limits.

Back up the database/configuration and archive service logs with access restrictions. Record the deployed commit before changing it. Roll back to a prior reviewed hardened image; never roll back to the original insecure payment/authentication implementation. Docker image building and real VPS/TLS deployment were not executed in the agent environment because Docker and hosting access were unavailable.
