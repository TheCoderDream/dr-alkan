# Auréa continuation handoff

## Goal and existing app

The user is Emre Baskan. The client is an aesthetic clinic with international patients. The requested core is online informed-consent capture, identification of planned procedures, before/after photographs, a separate performed-treatment record, contact information, follow-up appointments, and reminders. The user requested a beautiful, very user-friendly, mobile-first React application with ten languages.

Current brand: **Dr. Alkan Aesthetic**, for **Dr. Alkan Veysi Alkan**, based on the supplied @dralkanaesthetic profile. The compact wordmark is Dr. Alkan / AESTHETIC. Legacy default settings resolve to the current brand; custom settings and signed snapshots are preserved. The design uses warm ivory, deep plum, restrained terracotta/sage accents, serif display headings, and readable form controls.

Existing private Site:

- Project ID: `appgprj_6ade6aa854e0819187edb22b655e16e4`
- URL: https://aurea-clinic-emre.mellow-boar-8504.chatgpt.site
- Published source commit: `e3b79102b25c5dad4af0af539bc86578417b4464`
- Published version at export: 1

The local export adds development scripts and handoff documents. These additions do not change the live deployment. See `EXPORT_MANIFEST.json` for exact copied, changed, and added files.

## Implemented

- Overview dashboard with real record counts, dates, pending reviews, and activity.
- Searchable patient records, editing, visit histories, JSON export.
- Appointment creation, rescheduling, cancellation, follow-up scheduling.
- A five-stage patient wizard: About you, Health history, Treatment information, Permissions, Review/sign.
- The sixteen screening topics from the supplied Turkish source form, grouped four per health subpage, with conditional required details.
- Server-saved partial drafts and resume behavior; language changes preserve answers.
- Separate clinical, education/publication, marketing-photo and sharing choices; communication channel choices; representative fields for minors.
- Drawn or typed review signatures and a separate discussion-request path.
- Immutable patient snapshots and content digests. Clinician review records are retained separately and tied to the exact signed version; stale review submissions are rejected.
- Printable consent documents with browser print/save-to-PDF.
- Private image upload with type/size checks and staff permission attestation; before/after stage, visit and angle association; matched image comparison.
- Calendar exports with correct clinic-zone conversion and a 24-hour alarm when enabled. Reminder intentions are persisted, but messages are not sent.
- English, Turkish, Arabic, Russian, German, French, Spanish, Italian, Brazilian Portuguese, Simplified Chinese.

## Data and access

The deployed Site uses platform-provided ChatGPT identity headers. Records are scoped to the authenticated user's stable Site ID. New Sites are private; the current patient links remain behind that hosting access boundary. Intake tokens grant only the scoped patient form/document path, not staff records.

Local preview uses emulated D1/R2 and development-only identity. It is independent from the live database. The archive intentionally excludes production records, photos, authentication tokens, local emulator state, and installed dependencies.

## Content limitations and remaining work

1. Obtain clinic-approved procedure-specific information, risks, alternatives, aftercare, privacy notice, retention rules and signatory process. The uploaded source is a **Botox** form, not a full filler/lifting template library.
2. Arrange competent medical/legal and language review for all active clinical translations. Current documents explicitly say **review copy**.
3. Define the exact lifting procedure. Surgery, threads and device-based procedures need different consent; the current item is a lifting consultation.
4. Connect a real message-delivery provider and a scheduled dispatcher before enabling automatic email/SMS/WhatsApp reminders. Implement provider credentials, permitted-channel checks, delivery receipts, retries/deduplication and cancellation/reschedule handling. Current UI honestly says delivery is unconnected.
5. Add clinic team membership/roles if multiple staff need one shared clinic. This version scopes one workspace per authenticated owner and does not claim full staff-role management.
6. A patient route has no staff navigation, but hardware/shared-tablet kiosk lock-down is not implemented.
7. Typed/drawn review signatures are not claimed to be qualified electronic signatures or a compliance certification.

## Validation recorded

The published app passed TypeScript checks, a production build, 17 integration checks, and browser tests including the full sample intake/clinician-review journey. Interface messages and layouts were checked in all ten locales, including Arabic and narrow 320px views. Integration tests cover isolation, initialization, partial draft saving, required answers, independent optional permissions, repeat submission, snapshot retention, exact-version countersigning, media access, calendar times/alarms, cancellation, discussion requests and revoked tokens.

## Suggested next local Codex instruction

“Read AGENTS.md, LOCAL_SETUP.md, CODEX_HANDOFF.md and the requirements folder. Set up and run the existing app locally, run its checks, and continue from this implementation. Preserve the current design and data boundaries.”

## Standalone deployment preparation

The project is being pushed to TheCoderDream/dr-alkan. See DEPLOYMENT.md. Standalone builds opt into Cloudflare Access JWT verification at the Worker boundary and strip untrusted identity headers; Site-hosted behavior remains unchanged. Account setup and real deployment remain pending. Use pnpm test:access with the existing clinic checks.
