# Deploy Dr. Alkan Aesthetic to Cloudflare Workers

## Current free deployment

The user declined all usage-billed subscriptions. The selected configuration uses Workers Free and D1 Free, **no R2**, and **no Cloudflare Zero Trust subscription**. Staff access uses a generated high-entropy HTTPS Basic password. The Worker secret is stored through Wrangler; it is never committed. The shared password grants one clinic workspace, not separate staff accounts. Use a private browser window and close it after use; browsers cache Basic credentials and do not provide reliable application-level logout.

Photo uploads are disabled by the absence of the BUCKET binding, enforced by the API and labeled in all ten UI locales. Local development still has R2 emulation and photo support. At free-tier limits, service can stop until limits reset; do not upgrade plans without the user's permission.

Configure this mode with:

```sh
export CLOUDFLARE_ACCOUNT_ID='YOUR_ACCOUNT_ID'
export CLINIC_D1_DATABASE_ID='YOUR_DATABASE_ID'
export CLINIC_DISABLE_PHOTOS=true
export CLINIC_AUTH_MODE=password
export STAFF_USERNAME=dralkan
export STAFF_EMAIL='YOUR_STAFF_EMAIL'
pnpm configure:cloudflare
pnpm db:migrate:cloudflare
pnpm build:cloudflare
pnpm exec wrangler deploy --config dist/server/wrangler.json
pnpm exec wrangler secret put STAFF_PASSWORD --config wrangler.production.json
```

Set a generated random password of at least 24 characters. Missing or short passwords fail closed. No password belongs in environment variables committed to source or in the generated configuration. Keep local credential files under ignored `.sites-runtime/` with owner-only permissions. Retrieve the deployment URL from Wrangler's successful deploy output.

The Access/R2 setup below is an optional alternative and was **not activated**. Cloudflare currently asks for a payment method and usage-billing consent even at its Zero Trust Free checkout.

## Hosting choice

This full-stack Vinext app uses **Cloudflare Workers**, **D1** for records, and a **private R2 bucket** for photos. Netlify is not a drop-in target: the Cloudflare Vite plugin, `cloudflare:workers` imports, D1/R2 storage, and authentication would need adapting. Uploading only the static client would omit the APIs and signing workflow. Cloudflare Workers retains the existing architecture.

## What is prepared

- Separate production build: `pnpm build:cloudflare`.
- `pnpm configure:cloudflare` generates an ignored account-specific `wrangler.production.json` and rejects missing account/storage/Access settings.
- `pnpm deploy:cloudflare` builds and deploys the Worker with the generated configuration.
- `pnpm db:migrate:cloudflare` applies migrations to the configured **remote** D1 database.
- In standalone mode the Worker removes caller-supplied ChatGPT identity headers and verifies Cloudflare Access JWT signatures, issuer, audience, expiration, and staff identity before allowing staff requests. Existing owner checks remain in place. Intake routes continue using scoped intake tokens.
- GitHub Actions runs type checks, clinic integration checks, Access security checks, and the portable build on push/PR. It does not deploy automatically.
- `.openai/hosting.json` retains the existing Site identity. Standalone configuration does not change that Site or transfer its records.

## One-time account setup

Create a Cloudflare account at https://dash.cloudflare.com/sign-up, then enable Workers and Zero Trust. R2 may require enabling billing; review Cloudflare's current pricing before activation. A paid custom domain is not required for an initial workers.dev deployment.

Use Node >=22.13 and pnpm 11.25.0, then:

```sh
pnpm install --frozen-lockfile
pnpm exec wrangler login
pnpm exec wrangler d1 create dr-alkan
pnpm exec wrangler r2 bucket create dr-alkan-private
```

Copy your Cloudflare account ID and the newly created D1 database ID. Keep the R2 bucket private: do not enable an r2.dev public URL or a public bucket domain.

## Staff sign-in with Cloudflare Access

In Zero Trust, create a self-hosted Access application for the hostname that will serve this Worker (initially `dr-alkan.YOUR-SUBDOMAIN.workers.dev`). Add an **Allow** policy restricted to the doctor's specific email address and any explicitly authorized staff. Email one-time PIN is sufficient for an initial setup; do not allow all emails or Everyone.

Protect the hostname, including `/` and `/api/clinic/*`. Patients need access without staff sign-in, so create more-specific **Bypass** applications for `/intake/*`, `/api/intake/*`, `/assets/*`, `/reference/*`, and `/favicon.svg`. The Worker still validates intake tokens for patient APIs. Test a patient link in a signed-out browser to confirm the Access rules let the patient UI and its assets load.

Record the team issuer URL (`https://YOUR-TEAM.cloudflareaccess.com`, no trailing slash) and the staff application's **Application Audience (AUD) Tag**. Set these non-secret deployment values in your shell:

```sh
export CLOUDFLARE_ACCOUNT_ID='YOUR_ACCOUNT_ID'
export CLINIC_D1_DATABASE_ID='YOUR_DATABASE_ID'
export CLINIC_R2_BUCKET='dr-alkan-private'
export ACCESS_TEAM_DOMAIN='https://YOUR-TEAM.cloudflareaccess.com'
export ACCESS_AUD='YOUR_STAFF_APP_AUDIENCE'
pnpm configure:cloudflare
```

The configuration is excluded from Git. No API token belongs in this file. A missing or invalid Access JWT fails closed on staff routes, including direct workers.dev requests.

## Validate and deploy

```sh
pnpm check
pnpm test:clinic
pnpm test:access
pnpm db:migrate:cloudflare
pnpm deploy:cloudflare
```

After deployment verify:

- Signed-out access to the staff app triggers Access sign-in; only approved staff can enter.
- A different staff identity has its own owner-scoped records. Shared clinic/team membership is not implemented.
- A patient link works signed out through the full form, signature, and document flow.
- Private photos are inaccessible without authorized staff access.
- Clinical consent wording/translations remain explicitly review copies until approved. Reminder delivery remains unconnected.

New hosting starts with a separate database and fictional samples. Local `.wrangler` data and the current hosted app's patient records/photos are not deployed or migrated by these commands.

## Deploy on future pushes

After the first successful deployment, connect `TheCoderDream/dr-alkan` in **Workers & Pages → dr-alkan → Settings → Builds**. The Worker name is `dr-alkan` and the branch is `main`.

Set the five configuration variables above in the build environment. Use:

- Build command: `pnpm configure:cloudflare && pnpm check && pnpm test:clinic && pnpm test:access && pnpm build:cloudflare`
- Deploy command: `pnpm exec wrangler d1 migrations apply DB --remote --config wrangler.production.json && pnpm exec wrangler deploy --config dist/server/wrangler.json`

Migration and deployment credentials are supplied by Cloudflare's build integration. Review future migrations before merging; do not edit applied migrations. No deployment workflow runs from GitHub until you explicitly connect the Worker.

## References

- https://github.com/cloudflare/vinext#deployment
- https://developers.cloudflare.com/workers/ci-cd/builds/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
- https://docs.netlify.com/build/data-and-storage/netlify-database/
