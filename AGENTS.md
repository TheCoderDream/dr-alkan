# Auréa local development context

Read `LOCAL_SETUP.md` and `CODEX_HANDOFF.md` before changing the project.

## Architecture

- React 19 and TypeScript, using Vinext/Vite App Router conventions.
- Cloudflare Worker server, D1 structured records, and private R2 image storage.
- Main clinic UI: `app/components/clinic-app.tsx` and `clinic-forms.tsx`.
- Patient wizard: `app/components/intake-app.tsx`.
- Server handlers: `lib/clinic/server.ts`; route adapters are under `app/api/`.
- Translations: `lib/clinic/messages.ts`; each row has exactly ten pipe-separated values in the locale order declared in `types.ts`.
- Schema: `db/schema.ts`; append migrations in `drizzle/`.

## Commands

Use pnpm 11.25.0 and Node >=22.13. Dependencies are pinned in `pnpm-lock.yaml`.

```sh
pnpm install --frozen-lockfile
pnpm setup:local
pnpm dev
pnpm check
pnpm test:clinic
pnpm build
```

`setup:local` is self-contained and selects the portable runtime. No absolute `/root/.codex/plugins/…` helper path is needed locally. The original managed-workspace shell scripts remain in the source for completeness; they are not the local setup entry point.

## Preserve important behavior

- Keep owner checks on every staff record and media operation.
- Keep intake tokens hashed, scoped, expiring, and revocable.
- Never mutate a signed patient snapshot. Retain clinician reviews separately and tie countersigning to the exact consent version.
- Keep optional photo/publication permissions independent from treatment consent.
- Do not silently substitute another language for clinical wording being signed.
- Preserve the explicit review-copy labeling until procedure-specific clinical wording and translations are actually approved.
- Do not present an unconnected reminder channel as a delivered message.
- Do not edit applied migrations; generate a new migration.
- Retain vendor licenses and the existing Site identity if continuing that Site.

## Validation

Run the type check, relevant integration checks, and production build after material changes. The 17 integration checks compile the real route handlers into ignored `outputs/clinic-tests` and run them against local test shims. Local runtime files and personal clinic records must not be committed.

For UI changes, verify phone layouts down to 320px and Arabic RTL. The prior build was also checked across all ten locales at narrow widths.
