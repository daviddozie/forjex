# Forjex Cloud

Next.js dashboard and template scaffolding API for the Forjex CLI.

## Development

Install the root CLI dependencies with `npm install`, and web dependencies with `pnpm install` from this directory. Copy `.env.example` to `.env` and configure Neon PostgreSQL and your GitHub OAuth app. Set the OAuth callback to `${NEXT_PUBLIC_APP_URL}/api/auth/github/callback`. Run `pnpm db:migrate` for the existing schema, then `pnpm dev`.

Sign in with GitHub OAuth or connect a personal access token through the credentials dialog. Connect Vercel separately. Server `GITHUB_TOKEN` and `VERCEL_TOKEN` values never substitute for a visitor's credentials.

Without credentials, the forge wizard provides a demo preview. Demo previews do not create repositories, deployments, or cloud records. Without a configured database, real GitHub operations can still run, but cloud persistence is unavailable and is reported as such.

Development writes generated files to `.next-dev`; production builds and `next start` use `.next`. This allows a production build to run while the dev server remains open. If a dev server was running before this configuration changed, restart it once and reload your browser to discard previously cached chunks.

## Connecting an existing repository

Choose **Connect Existing Repo** in the forge wizard and enter an HTTPS GitHub repository URL. The signed-in account needs write access, and the repository must have an initial commit. Choose the matching stack to configure any missing CI or Vercel files.

Connecting preserves existing application files, README, workflows, repository visibility, and Vercel configuration. It adds only missing `.github/workflows/ci.yml` and `vercel.json` files selected in the wizard. Generated workflows target the actual default branch. Changes use one commit and never force-push over concurrent work. Existing configuration is reported as preserved. Reconnecting updates the existing account-scoped dashboard record when available.

For new repositories, the **Generate README.md** checkbox controls whether README.md is included in the final scaffold.

## CLI authentication

Set `FORJEX_CLOUD_URL` to the dashboard's origin and run `forjex login`. Remote origins must use HTTPS; localhost permits HTTP. The CLI opens a browser with a random session secret in the URL fragment and polls with that secret in a request header. No provider tokens travel through callback URLs.

Production requires a migrated database and a stable `FORJEX_SESSION_SECRET` (or `GITHUB_CLIENT_SECRET` fallback) shared by every server instance. Authorizations are encrypted with AES-256-GCM in the existing `credentials` table, expire after three minutes, and are atomically consumed once. Development without a database uses a bounded process-local session store. No schema migration is needed beyond the existing migration.

Local CLI tokens are saved to `~/.forjex/config.json` with owner-only file permissions. `forjex login --token <token>` validates the GitHub token; cloud sync also accepts legacy CLI config tokens.

## Deployment reporting

Creating/linking a Vercel project does not confirm deployment success. The API checks that the Vercel project links to the expected GitHub repository, then reads the latest production deployment. For a newly linked web project with no deployment yet, the forge API requests an initial production deployment from the committed GitHub source. The dashboard refresh action repeats this check. A live URL appears only for a provider-confirmed `READY` deployment. Building, queued, failed, canceled, pending setup, and unknown states remain explicit. Provider errors never produce a guessed deployment domain.

## Validation

From the repository root, run `npm test`, `npx tsc --noEmit`, `npm run build:cli`, and `npm run build:web`. Web type checking can also run from this directory with `npx tsc --noEmit --incremental false`. Tests use isolated credentials and mocked provider responses; they never contact live providers or your configured database. Production builds fetch the existing Google Fonts dependency and therefore need network access.
