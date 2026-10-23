# Forjex

[![npm version](https://img.shields.io/npm/v/forjex?style=flat&color=8000ff)](https://www.npmjs.com/package/forjex)
[![npm downloads](https://img.shields.io/npm/dm/forjex?style=flat&color=8000ff)](https://www.npmjs.com/package/forjex)
[![License](https://img.shields.io/github/license/daviddozie/forjex?style=flat&color=8000ff)](LICENSE)

Create a project from a starter template, then connect GitHub, add CI, and deploy when you're ready.

Forjex provides starters for Next.js, React, Vue, Python, Go, and Rust. You can create and run a project locally without a GitHub or Vercel account, or use the guided setup to take a new or existing project through repository creation and deployment.

[Website](https://forjex-forge.vercel.app) · [Documentation](https://forjex-forge.vercel.app/docs) · [npm](https://www.npmjs.com/package/forjex) · [Report an issue](https://github.com/daviddozie/forjex/issues)

## Quick start

Install the CLI:

```bash
npm install -g forjex
```

Create a Next.js project:

```bash
forjex create my-app --template nextjs
cd my-app
npm run dev
```

Choose **Yes** when prompted to install dependencies. If you skip that step, run `npm install` before starting the development server.

You can also run Forjex without a global installation:

```bash
npx forjex@latest create my-app --template react
```

For an interactive choice of project name and template, run `forjex create`.

## Requirements

- **Node.js and npm** to run the CLI. Frontend starters declare support for Node.js `^20.19.0 || ^22.13.0 || >=24`; use a version in those ranges for frontend projects.
- **Python**, **Go**, or **Rust with Cargo** to run the corresponding backend starter. The Go starter declares Go 1.22.
- **Git and a GitHub account** when connecting a repository.
- **A Vercel account** when deploying to Vercel. The CLI checks for the Vercel CLI and installs it if needed.

Forjex's built-in dependency installation uses npm. Existing Node.js projects are checked for npm, pnpm, Yarn, or Bun lockfiles when generating CI commands.

## Starter templates

| Template | Stack                                     | Start locally               |
| -------- | ----------------------------------------- | --------------------------- |
| `nextjs` | Next.js App Router, React, TypeScript     | `npm run dev`               |
| `react`  | React, Vite, TypeScript                   | `npm run dev`               |
| `vue`    | Vue, Vite, TypeScript                     | `npm run dev`               |
| `python` | FastAPI with an example endpoint and test | `uvicorn main:app --reload` |
| `go`     | HTTP API with a health endpoint and test  | `go run .`                  |
| `rust`   | Cargo application with a unit test        | `cargo run`                 |

For example:

```bash
forjex create my-site --template vue
forjex create my-api --template python
forjex create my-service --template go
forjex create my-tool --template rust
```

Forjex prints the setup commands for each language. For Python, these include creating a virtual environment and installing `requirements.txt`. Follow the generated project's README for its setup instructions.

Project names must use 1–64 lowercase letters, numbers, or hyphens and start with a letter. Forjex creates a new folder and refuses to overwrite an existing folder.

### What's included in frontend starters

The Next.js, React, and Vue starters include:

- TypeScript and `@/` imports for shared modules.
- A home feature with example components, data, and types.
- Shared layout and UI components, plus a reusable hook or Vue composable.
- Application configuration, route constants, styles, and design tokens.
- A typed JSON API client with error and cancellation handling.
- ESLint, Prettier, Vitest, and example tests.
- Environment examples, a `.gitignore`, a README, and Forjex favicon assets.

The Next.js starter also includes loading, error, not-found, and health-route examples.

The generated structure follows this pattern, with framework-specific entry points:

```text
src/
  app/           # Next.js routes; Vite starters use App.tsx or App.vue
  components/    # Shared layout and UI
  features/      # Feature components, data, and types
  hooks/         # React hooks; Vue uses composables/
  config/        # Application and public environment settings
  constants/     # Route constants
  services/      # API client
  lib/           # Shared errors
  utils/         # Utility functions
  types/         # Shared types
  styles/        # Global styles and design tokens
tests/           # Utility and API-client tests
```

Run these commands from a generated frontend project:

```bash
npm run check       # Type checking, linting, and unit tests
npm run build       # Production build
npm run test:watch  # Watch tests during development
npm run format     # Format files
```

API-client tests use mocked requests. Configure the optional API origin in your environment file when connecting your own backend. Keep server secrets out of `NEXT_PUBLIC_` and `VITE_` variables.

### Create files without installing dependencies

```bash
forjex create my-app --template react --no-install
cd my-app
npm install
npm run dev
```

The `create` command generates local project files. It does not initialize Git, create a GitHub repository, add CI, or deploy your application.

## Connect GitHub and deploy

### Start a new project with guided setup

```bash
forjex forge my-app --template nextjs
```

Forjex creates the starter and asks whether you want to set up GitHub now. You can stop there and continue later. Install frontend dependencies before continuing to GitHub setup; the CLI runs a local build check before pushing.

To select CI and Vercel deployment when continuing through the guided setup:

```bash
forjex forge my-app --template react --ci --vercel
```

These flags select the corresponding setup steps; the command still asks for project and repository details. Vercel setup is offered for frontend starters. Python, Go, and Rust starters can be created and connected to GitHub without Vercel.

### Use an existing project

Run Forjex inside the project you want to connect:

```bash
cd my-existing-project
forjex forge
```

Choose **Use the existing project in this directory**, then choose whether to create a new GitHub repository or push to an existing one. Forjex can use a detected remote or ask for a GitHub repository URL.

The guided flow can:

1. Authenticate with GitHub.
2. Create or connect a repository.
3. Generate a GitHub Actions workflow if selected.
4. Create Vercel configuration if selected.
5. Run the detected local build check, then stage, commit, and push project changes.
6. Deploy through the Vercel CLI if selected.
7. Attempt to save the project to your configured Forjex Cloud dashboard.

Review your working tree and `.gitignore` before running the repository flow: it stages project changes for the commit. To set up GitHub and CI without deployment, answer **No** to the Vercel prompt.

### CI and deployment behavior

Forjex detects Node.js projects from `package.json`, Python projects from `requirements.txt`, `pyproject.toml`, or `setup.py`, Go projects from `go.mod`, and Rust projects from `Cargo.toml`. If the project type is unknown, CI generation is skipped.

Generated CI is written to `.github/workflows/ci.yml` and targets pushes and pull requests to `main`. It includes language-specific dependency installation, linting, testing, and build steps where configured. Some lint and formatting steps allow failures. Review the generated workflow for your runtime versions, package manager, default branch, and desired checks; selecting CI can replace an existing `ci.yml`.

Vercel setup writes `vercel.json`, runs a production deployment, and attempts to connect the GitHub repository for future deployments. If that connection fails, connect the repository in **Vercel → Project Settings → Git**. Future deployment behavior depends on that connection and the Vercel project settings. GitHub Actions and Vercel run independently; the generated workflow does not make deployment wait for CI to pass.

## Command reference

| Command                        | Purpose                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------- |
| `forjex create [name]`         | Create a local starter; prompts for missing details                             |
| `forjex forge [name]`          | Guide a new or existing project through GitHub and optional CI/deployment setup |
| `forjex login`                 | Connect the CLI to Forjex Cloud through the browser                             |
| `forjex login --token <token>` | Validate and save a GitHub personal access token                                |
| `forjex whoami`                | Show saved identity, credential availability, and Cloud connection status       |
| `forjex sync`                  | Fetch and list projects saved in Forjex Cloud                                   |
| `forjex logout`                | Confirm and clear saved CLI credentials                                         |

Both `create` and `forge` accept `--template <template>` and `--no-install`. The `forge` command also accepts `--ci` and `--vercel`.

Use `forjex --help`, `forjex create --help`, or `forjex forge --help` for available options.

## Authentication and Forjex Cloud

### GitHub access

When the repository setup needs GitHub credentials and none are saved, Forjex opens GitHub's device authorization page and displays a code. Complete the authorization in your browser to continue.

Saved credentials are stored in `~/.forjex/config.json` with owner-only file permissions. Treat this file as sensitive. Use `forjex logout` to clear the saved CLI credentials.

Vercel authentication is handled separately through the Vercel CLI or a connected Vercel token.

### Connect the Cloud dashboard

Set the dashboard origin before signing in:

```bash
export FORJEX_CLOUD_URL=https://forjex-forge.vercel.app
forjex login
forjex whoami
forjex sync
```

`forjex login` opens the Forjex Cloud authorization page. Complete its sign-in and authorization flow to connect the CLI.

The Cloud URL resolves from `FORJEX_CLOUD_URL`, then saved CLI configuration, then `http://localhost:3000`. Remote URLs must use HTTPS; HTTP is permitted for localhost. For local dashboard development, use `http://localhost:3000` as the origin.

Cloud persistence requires a configured dashboard database. Repository setup can finish even if Cloud sync is unavailable; the CLI reports when the project was not saved. The `sync` command lists Cloud project records rather than synchronizing local source files.

## Troubleshooting

### `forjex: command not found`

Check the installation or run the CLI through npx:

```bash
npm list -g forjex
npx forjex@latest --help
```

To update a global installation:

```bash
npm install -g forjex@latest
forjex --version
```

### Dependencies were not installed

Run `npm install` inside the generated frontend project, then `npm run dev`. You can also run `forjex forge` from that directory after installation to continue repository setup.

### Authentication failed or timed out

Complete the browser authorization and check your connection. For Cloud login, verify `FORJEX_CLOUD_URL` points to the intended dashboard and retry `forjex login`. To replace saved credentials, run `forjex logout`, then authenticate again.

### The build failed before pushing

Forjex stops the push when the local build check fails. Run the build command shown in the error output, fix the failure, then retry `forjex forge` from your project directory.

### Vercel deployment failed

Check `vercel --version` and `vercel whoami`. Run `vercel login` if needed, then inspect the project's build logs and Git connection in the Vercel dashboard. Reconnect an invalid saved Vercel token through Forjex Cloud if you use one.

### Cloud projects are unavailable

Check the configured Cloud URL and run `forjex whoami`. The dashboard must be reachable and have a configured database to persist and list projects. See the [Cloud setup guide](https://github.com/daviddozie/forjex/blob/main/apps/web/README.md) for local setup.

## Development and contributions

The repository contains the CLI in `src/`, CLI tests in `tests/`, and the Cloud web app in `apps/web/`.

To work on the CLI:

```bash
git clone https://github.com/daviddozie/forjex.git
cd forjex
npm install
npm run dev -- --help
npm run test:cli
npm run build:cli
```

Pull requests and pushes to `main` run GitHub Actions checks on Node.js 22 and 24: formatting, linting, TypeScript, CLI/web tests, production builds, and package contents. Run `npm run lint`, `npm run format:check`, and `npm run typecheck` locally after installing both CLI and web dependencies. See the contribution guide for the full validation commands.

The npm package includes the built CLI in `dist/`, along with package metadata, the README, and license. The Cloud app is developed and deployed separately; its setup and validation instructions are in the [Cloud README](https://github.com/daviddozie/forjex/blob/main/apps/web/README.md).

Read the [contribution guide](https://github.com/daviddozie/forjex/blob/main/CONTRIBUTING.md) before opening a pull request.

Every contribution starts with an issue. Wait for explicit maintainer approval before implementing the agreed change, then open a pull request linked to that issue.

## License

[MIT](LICENSE) © David Mgbede.
