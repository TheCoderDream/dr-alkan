# Continue development locally

This is a complete source export of the Auréa clinic application. It runs locally without the ChatGPT Work container or its plugin helper paths. The hosted app is not modified by these steps.

## Requirements

- Node.js **22.13 or newer**. Node 24 is also supported by the included setup flow.
- **pnpm 11.25.0**, pinned in `package.json`.
- An internet connection for the first dependency installation.

No Cloudflare account, API key, or production sign-in is required for local development. D1 and R2 are emulated on your computer.

## First run

Extract the ZIP, open the `aurea-clinic` directory in local Codex, and run:

```sh
pnpm install --frozen-lockfile
pnpm setup:local
pnpm dev
```

Open **http://localhost:5173**. The app initializes fictional example patients in the local database on first load.

The setup script builds the Worker/browser assets and applies SQL migrations **locally**, using Wrangler's migration ledger. It is safe to rerun after adding new migrations; already-applied migrations are skipped. Run `pnpm db:generate` after a schema change, inspect the resulting SQL, then run `pnpm setup:local` again.

For subsequent development sessions, just run `pnpm dev`. Stop it with Ctrl+C. The local database and uploaded images remain under the ignored `.wrangler/` directory. Do not delete that directory if you want to retain local test records.

The portable development server supports a simulated ChatGPT identity at `/signin-with-chatgpt?return_to=/`; the clinic API also has a development-only local identity. These are local conveniences and are not production authentication.

## Verify

```sh
pnpm check
pnpm test:clinic
pnpm build
```

The integration suite contains 17 checks. It uses isolated SQLite and an in-memory object store; it does not modify your local clinic database or the hosted app.

## What is included

- All 134 tracked files from the published source commit, including hidden project configuration, the dependency lockfile, styles, components, server routes, and licenses.
- Database schema and SQL migrations.
- Ten-language UI copy, including Arabic RTL.
- Patient intake, signatures, clinician review, consent documents, photo storage, appointments, and exports.
- The original blank Turkish form at `public/reference/botox-consent.pdf`.
- The client voice recording and product brief under `docs/requirements/`.
- `AGENTS.md` and `CODEX_HANDOFF.md` for the next Codex session.
- A SHA-256 export manifest with source provenance.

Generated builds, dependencies, caches, Git authentication/configuration, and live database/photo contents are excluded. They are not needed to continue development. The ZIP contains no production credentials.

## Hosting and data

The `.openai/hosting.json` file retains the existing Site ID and the logical `DB`/`BUCKET` bindings for continuity. It is metadata, not a deployment credential. Local build and migration commands use local emulators and do not change hosted data.

The live patient records and uploaded photos remain on the hosted service. This export starts with a separate local database. A migration of live clinical data would be a separate export/import task.

If you later deploy outside ChatGPT Sites, replace the platform-specific staff authentication boundary and provision your own database/object storage. The application is a React app using **Vinext/Vite with Cloudflare Workers**, not a generic Express server.

## Known launch requirements

Clinical wording and medical translations are review drafts. Automatic email/SMS/WhatsApp delivery is unconnected; calendar exports already contain reminder alarms. See `CODEX_HANDOFF.md` for the full continuation notes.
