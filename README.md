> **Local Codex handoff:** Start with [LOCAL_SETUP.md](LOCAL_SETUP.md). It contains the self-contained install, database setup, and run commands for this export.

# Dr. Alkan Aesthetic — clinic workspace

A mobile-first React + TypeScript application built on the Sites Vinext/Vite starter. It includes an owner-private clinic workspace and scoped, expiring patient intake links. Cloudflare D1 stores records, snapshots and review history; private R2 stores uploaded clinical images.

## Working features

- Overview, searchable patient records, appointments, consent library, photographs, and clinic settings.
- Ten interface languages: English, Turkish, Arabic (RTL), Russian, German, French, Spanish, Italian, Brazilian Portuguese, and Simplified Chinese.
- Five-stage intake with the sixteen screening topics from the supplied Turkish form, conditional details, server-saved drafts, independent permissions, representative fields, drawn/typed review signatures, and a discussion request path.
- Immutable patient consent snapshots with SHA-256 digests, separately retained clinician review records, an exact-version check on countersigning, printable documents, and patient record JSON exports.
- Planned treatments kept separate from performed procedures, with area/product/quantity/lot information.
- Private image uploads with permission attestation, image signature/size validation, before/after labels, angle matching, and comparison.
- Follow-up scheduling, rescheduling, cancellation, and time-zone-aware calendar exports with a 24-hour calendar alarm. Reminder intentions are stored; external message delivery is explicitly unconnected.
- Fictional sample patients are initialized once per owner. Live deployment data is separate from the local test workspace.

## Run and verify

Use the Sites skill helpers for installation, preview and builds. Existing commands:

```
node node_modules/typescript/bin/tsc --noEmit
node scripts/test-clinic.mjs
node /root/.codex/plugins/cache/openai-curated-remote/sites/1.1.2/scripts/build-site.mjs
```

The integration runner compiles the real route handlers into ignored `outputs/clinic-tests` and supplies a SQLite-backed D1 shim and an in-memory R2 interface. It exercises ownership isolation, persistence, partial drafts, input validation, exact-version review, immutable/repeat submission behavior, private files, link revocation, discussion requests, cancellation and calendar time zones. The generated test files and fixtures are never packaged.

The tracked Drizzle schema and migration define the hosted tables. Do not edit applied migrations. Generate an additional migration for subsequent schema changes, then apply it to local preview using the documented Sites D1 workflow. Sites applies hosted migrations during publication.

## Access and privacy boundaries

Production staff API requests require the platform-provided authenticated user ID. Data is scoped to that ID. The development-only local-preview identity is compiled out in production. New Sites remain owner-private; patient links also remain behind that hosting access boundary until an explicitly authorized access change. Intake tokens are random, stored as hashes, scoped to one visit, expiring after seven days, and revocable. A new link supersedes an earlier unfinished link.

A patient intake route contains no staff navigation. This release does not claim clinic-wide staff roles, hardware kiosk lock-down, a qualified electronic signature, or a medical/legal compliance certification.

## Before live patient operation

The UI and printable records deliberately label clinical text as a review copy. The source is a Botox form; the filler copy and lifting-consultation text are drafts. Supply and approve the clinic's procedure-specific information, risk disclosures, privacy notice, translation versions, retention rules, and signature process before using live consent. Define the precise lifting procedure before enabling its treatment consent. Authoritative signed snapshots retain their original locale and wording.

Email, SMS and WhatsApp are not connected. No message is represented as sent. A delivery integration must process persisted reminder records with appropriate consent, credentials, cancellation/reschedule checks and retry/deduplication before automatic messages are enabled. Calendar export works independently. Secrets must stay out of source and be configured through Sites runtime variables.

The original blank Turkish PDF is available in `public/reference/botox-consent.pdf`. It contains no filled patient data. The private hosting boundary applies to the entire review app.

## Standalone Cloudflare hosting

See [DEPLOYMENT.md](DEPLOYMENT.md) for the separate production build, Cloudflare Access staff sign-in, private D1/R2 provisioning, and Git deployment settings. Local data and the original client audio are excluded from Git.
