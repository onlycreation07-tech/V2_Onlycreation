# V2 OnlyCreation production readiness review

Reviewed 10 October 2026. Repository: onlycreation07-tech/V2_Onlycreation.
Original revision: bdc8a43e9cb6e50b28ff1a15fb70fed592f89ce6.

## Verdict

The original application is a prototype, not a production financial or autonomous-agent system. Its build passes, but critical security boundaries and output authenticity fail. This branch supplies a hardened AI-generation foundation and deployment packaging. It is **not certification that every existing workflow is production-ready**. Real provider, Firebase rules, cloud storage, browser and hosting checks still require the owner's environment.

## Why image and video results do not match expectations

| Original code | Actual behavior | Consequence |
| --- | --- | --- |
| server.ts, image-generate catch, original lines 753–773 | Returns a Pollinations image URL with success=true and a Gemini model name. | A Google failure looks like a successful Nano Banana generation. |
| server.ts, image-edit, original lines 797–881 | Starts with Lite irrespective of UI selection; fallback generates a fresh image from text without the source image. | Product, face and composition consistency disappear. |
| server.ts, video-generate, original lines 903–948 | Uses Veo Lite despite a Fast label; retries another model; invents a simulated operation on failure. | Model quality and cost differ from what the UI promises. |
| server.ts, video-status, original lines 957–983 | Treats simulated jobs and polling failures as ready. | Errors become fake completion. |
| server.ts, video-stream, original lines 989–1052 | Returns oceans.mp4 whenever actual video retrieval fails. | The downloaded file is stock footage unrelated to the prompt. |
| VeoVideoStudio.tsx and backgroundTaskService.ts | Two independent pollers; one never stops retrying; both mishandle failure. | Endless spinners, duplicate downloads and false completion. |
| ImageStudio.tsx / VeoVideoStudio.tsx | Declares every uploaded image PNG, including JPEG; fabricates 4K/60fps progress statements. | Invalid provider inputs and misleading quality claims. |

The current Google documentation lists Nano Banana 2.1, Lite, and Veo 3.1 Quality/Fast/Lite. The names alone are not proof of an error. The account's paid API access, exact API model, input references, prompt and settings determine actual results. A Google consumer subscription is not evidence that this server's API project has billing/model access. No provider request was made during this review because no real server API credential was provided.

Sources: https://ai.google.dev/gemini-api/docs/image-generation ; https://ai.google.dev/gemini-api/docs/generate-content/image-generation ; https://ai.google.dev/gemini-api/docs/veo?hl=en .

## Other launch blockers found

| Priority | File / flow | Finding | Status in this branch |
| --- | --- | --- | --- |
| Critical | server/middleware/auth.ts | Base64-decodes JWT claims without verifying signatures; email containing "admin" grants admin access. Optional auth ignores expiry. | Replaced with Admin SDK signature/issuer/audience/expiry/revocation verification and a trusted role store. No magic test tokens. |
| Critical | firestore.rules, admins | Any user may create their own admin document if bootstrap_lock is absent. | All browser admin writes denied. Audit existing admin documents before rollout; the patch cannot undo historical escalation. |
| Critical | server.ts, payments/verify and wallet/verify-deposit | A UID/order/positive amount can be sufficient for "paid"; an order HMAC is treated as proof of actual payment. | All payment and wallet routes return 503 outside development. Payment logic still requires a rebuild. |
| Critical | server.ts, wallet/payout | Invents an IMPS reference and marks paid without calling a payout provider. | Disabled outside development; never enable this flow for real funds. |
| High | server.ts, client Firebase SDK | Server writes use the unauthenticated browser SDK; rules may deny them. | New AI jobs/quotas/assets use Admin SDK. Legacy business writes remain unfinished and their APIs are blocked. |
| High | paymentController, bookingController, projectController, briefController | Wallets, idempotency, booking locks, project phases and briefs are process-local maps. | These business APIs are blocked outside development. Six original tests prove only local behavior. |
| High | firestore.rules | Broad cross-user project/brand/creative access; monetary writes and bootstrap escalation. | Ownership checks added; monetary browser writes disabled; organizations/activity/partner data restricted. Rules must be tested in Firebase Emulator and deployed to the named database. |
| High | server.ts + services | Unauthenticated paid calls and caller-controlled UID quota keys. | API requests require Firebase ID tokens; legacy UID is overwritten; shared Firestore daily/minute count quotas added. |
| High | vite.config.ts | Defines the Gemini secret for the frontend build. | Removed. A sentinel secret build check finds no injected secret. Actual past exposure cannot be established from this source alone. |
| High | agentController.ts / agentService.ts | Fabricated campaigns, search grounding, virality/ROAS/reach and successful fallback responses. | Main agent generation fallbacks removed on both server and client. Team-board demonstration data remains explicitly labeled. |
| High | live-voice WebSocket | No authentication, quota, origin or session-duration boundary. | WebSocket handshakes fail closed until authenticated live sessions are built. |
| Medium | agentController.ts | Artificial 4.5-second timeout races valid campaign generation without cancelling it. | Removed; provider HTTP timeout used. |
| Medium | src/lib/firebase.ts | Optional undefined profile fields can make Firestore signup synchronization fail. | Client Firestore ignores undefined optional values. Actual signup needs browser verification. |
| Medium | UI / storage | Standalone media not persisted or shown in library; global browser task/chat history crosses accounts. | Media assets persisted privately; recent jobs shown in asset library; job/history storage scoped to the signed-in UID. |
| Medium | App.tsx | All workspaces loaded in the initial bundle. | Heavy screens lazy-loaded. |
| Medium | deployment | No reproducible container, reverse proxy, CI or dependency gate. | Docker, Compose, Nginx, Firebase indexes/rules configuration and CI added. |

## What the generation foundation now does

- Uses the selected image model for generation and editing; preserves all five UI aspect ratios and size selection.
- Validates prompt length, image MIME/base64/file signature and a 10 MB image limit.
- Surfaces billing/access/quota/no-output/provider failures without substituting a model or stock asset.
- Lets the user choose Veo Quality, Fast or Lite; explicitly requests one 8-second clip and the chosen resolution.
- Deduplicates video submission by verified user and request key, and stores the provider operation in Firestore behind an opaque job ID.
- Tracks failed/processing/saving/completed states; uses a transactional download lease to avoid duplicate archival by separate pollers.
- Downloads actual provider video with the SDK and archives it in the private bucket before reporting complete.
- Serves owner-authorized, expiring asset links with byte-range playback; browser clients cannot list the bucket or read other users' jobs.
- Recovers the latest 30 video jobs after login, and lists the latest 30 completed assets through the library.

## Remaining work before a public launch

1. Verify Firebase Auth providers/domain, account creation, reset/delete, genuine tokens, trusted admin provisioning and existing admin history. Deploy and emulator-test the rules, indexes and private bucket policy; audit bucket IAM for public access.
2. Run paid provider smoke tests: generate/edit PNG and JPEG with both image selections and supported aspect ratios; test all Veo selections, actual 1080p output, safety filtering, no-billing, quota and downloads. Compare output with the same model/prompt/reference/settings in AI Studio. Run browser tests for errors, refresh recovery and cross-account isolation.
3. Replace polling-driven archival with a durable worker/queue, retry policy and reconciliation. Google operations can outlive HTTP requests. If submission succeeds but persisting the operation fails, or a request times out after provider acceptance, the job needs reconciliation; do not blindly regenerate. Current jobs time out after 30 minutes, and a refresh can miss an asset if more than 30 newer jobs exist.
4. Validate every text/music/transcription provider contract and output schema; handle streamed audio formats correctly, persist audio, and test realistic input sizes. Music and transcription remain unverified live integrations.
5. Rebuild team execution, approvals, publishing, scheduled agents, organization membership and content-calendar persistence. Current team boards and executive metrics are planning demonstrations; agent chat is a real Google call, not an executing autonomous organization.
6. Migrate payments, wallet ledger, booking locks and project phase operations to database transactions. Bind payment amounts/currency/customer to stored orders, verify paid provider records and signed webhooks, deduplicate settlement permanently, reconcile refunds and payouts. Use integer paise and conserved double-entry postings. Keep these routes unavailable until this work passes concurrent/restart/tamper tests.
7. Add monitoring, provider/cost correlation, backups/restore drills, retention and user deletion for assets, CSP/CORS review, per-organization access tests, worker load tests and rollback rehearsal. Count caps are not INR spending caps; also configure provider budget monitoring.

## Validation boundaries

The original checkout passed TypeScript, six local tests and Vite build. New automated tests exercise forged/missing/revoked token paths (with a mocked Firebase verifier), trusted roles, media input validation, provider error contracts, model/settings preservation, durable job submission, duplicate keys, cross-user access and failed/no-output handling. They do not replace real cloud, browser, Firebase Emulator or payment testing. See PRODUCTION.md for deployment and acceptance instructions.


## Checks completed for this branch

- TypeScript check and Vite production build passed; 30 tests passed across five test files.
- npm audit reported zero vulnerabilities after compatible dependency updates and pinned transitive fixes. This is a point-in-time registry scan, not a security certification.
- A production-server smoke test confirms health 200, unauthorized image/video 401, payment/payout 503 (including differently cased payment paths), invalid asset-link 401, readiness 503 with missing credentials, magic-token 401, and continued process health after the readiness failure.
- A sentinel GEMINI_API_KEY did not appear in the compiled frontend. Initial main JavaScript dropped from approximately 1.51 MB to 0.76 MB after lazy loading; the remaining bundle-size warning still needs attention.
- Docker execution, real provider calls, browser acceptance, Firebase Emulator/rule deployment, and VPS/domain/TLS deployment were not run.
