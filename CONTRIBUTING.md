# Contributing to Forjex

Forjex welcomes bug fixes, features, documentation improvements, and starter-template updates. Contributions follow this process:

**Open an issue → wait for maintainer approval → implement the agreed change → open a pull request → address review feedback.**

## 1. Discuss the change first

Search [existing issues](https://github.com/daviddozie/forjex/issues) and pull requests before opening a new issue. If the change is already being discussed, join that issue and ask whether you can work on it.

Every contribution, including documentation changes, must have an issue approved by the project maintainer before implementation begins. Include:

- The problem or proposed improvement and why it matters.
- The affected area: CLI, starter templates, Cloud web app, or documentation.
- Reproduction steps, expected behavior, and actual behavior for bugs.
- Your proposed approach and any compatibility or UI changes.
- Whether you would like to implement the change.

Wait for an explicit approval comment from the project maintainer confirming the scope and that you may start. Opening an issue, receiving an automated response, or getting reactions does not count as approval. If the scope changes during implementation, discuss it in the issue and wait for approval of the revised scope.

Pull requests without a linked, approved issue may be closed until this process is followed. Approval to start work does not guarantee that a pull request will be merged.

Do not post access tokens, passwords, database URLs, personal data, or exploitable security details in public issues. Report suspected vulnerabilities privately to the maintainer; use GitHub's **Report a vulnerability** option in the repository's Security tab if available.

## 2. Set up your fork

Fork [daviddozie/forjex](https://github.com/daviddozie/forjex) on GitHub, then clone your fork. Replace `YOUR_GITHUB_USERNAME` with your username:

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/forjex.git
cd forjex
git remote add upstream https://github.com/daviddozie/forjex.git
git fetch upstream
git switch -c feat/123-short-description upstream/main
```

Use a descriptive branch name with the issue number, such as `fix/123-cli-login`, `feat/123-new-template`, or `docs/123-setup-guide`.

### Prerequisites

- Node.js compatible with the dependencies. Use Node.js 22.13 or later within the 22.x line, or Node.js 24 or later; frontend starters declare `^20.19.0 || ^22.13.0 || >=24`.
- npm for root CLI dependencies and pnpm for the Cloud web app.
- Git for version control.
- The corresponding language toolchain when validating Python, Go, or Rust starters.

### CLI development

From the repository root:

```bash
npm ci
npm run dev -- --help
```

To create a starter using the local CLI:

```bash
npm run dev -- create my-example --template react --no-install
```

Use a fresh directory for generated examples and remove them before committing. Local starter creation does not require GitHub, Vercel, or a database.

### Cloud web app development

Install the root dependencies first; the web test runner uses the root TypeScript loader. Then install the web dependencies:

```bash
cd apps/web
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

Use demo mode for UI work that does not require live providers. For authenticated or database-backed flows, configure your own GitHub OAuth app, Neon database, and session secret in `.env`. The local GitHub OAuth callback is `http://localhost:3000/api/auth/github/callback`. Apply migrations to your development database with `pnpm db:migrate` after configuring it.

Never use production credentials or databases for contribution testing. See the [Cloud README](apps/web/README.md) for authentication, migrations, existing-repository behavior, and deployment reporting.

## Project structure

| Path                                       | Responsibility                                                             |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| `src/index.ts`                             | CLI entry point and command registration                                   |
| `src/commands/`                            | `create`, `forge`, authentication, and Cloud commands                      |
| `src/services/`                            | Git, GitHub, Vercel, CI generation, detection, and starter creation        |
| `src/templates/`                           | Shared starter files, frontend foundations, structure, and assets          |
| `src/types/` and `src/utils/`              | CLI types, configuration, and logging                                      |
| `tests/`                                   | CLI and starter regression tests                                           |
| `apps/web/src/app/`                        | Next.js routes, pages, and API handlers                                    |
| `apps/web/src/components/`                 | Web components and shared UI primitives                                    |
| `apps/web/src/lib/`                        | Web authentication, providers, repository logic, and documentation content |
| `apps/web/src/db/` and `apps/web/drizzle/` | Database schema, connection, and migrations                                |
| `apps/web/tests/`                          | Web regression tests with mocked providers                                 |

## 3. Implement the approved scope

- Keep each pull request focused on one approved issue. Avoid unrelated refactors, formatting changes, and dependency upgrades.
- Follow the existing TypeScript, component, and service patterns. Put shared behavior in the existing shared modules instead of duplicating it.
- Reuse the web app's UI primitives and styles. Check keyboard access, focus states, responsive layouts, and light/dark themes for UI changes.
- Keep source files free of explanatory comments and commented-out code. Prefer clear names and small functions; put longer explanations in documentation. Preserve required compiler/tool directives, shebangs, and license notices.
- Keep secrets out of source control and browser-exposed environment variables. Preserve authentication, ownership checks, and safe error handling.
- Add or update meaningful regression tests for behavior changes. Mock provider requests and isolate credentials; automated tests must not create real repositories, deployments, or database records.
- For starter changes, check the generated application as well as the generator. Keep CLI and web scaffolding consistent through `src/templates/`.
- Update user-facing documentation when commands, setup, or behavior change.
- Include lockfile changes only when dependencies change, and use the existing package manager for each part of the repository.
- Leave package versions and publishing to the maintainer unless the approved issue explicitly covers release work.

## 4. Validate your changes

Run commands from the repository root unless stated otherwise.

GitHub Actions runs the CI workflow on every pull request, pushes to `main`, and manual runs. The `Checks (Node 22)` and `Checks (Node 24)` jobs install from both lockfiles, then check formatting, linting, types, tests, CLI/web builds, and npm package contents. These checks use mocked providers and do not require production secrets.

Run the same quality checks locally after installing root and web dependencies:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build:all
npm pack --dry-run
```

Lint warnings fail CI. Use `npm run lint:fix` for automatically fixable issues and review the resulting diff. The initial lint configuration permits existing explicit `any` types and sanitized provider errors without raw error causes; it still checks unused variables, JavaScript/TypeScript correctness, React Hooks, and Next.js rules.

The workflow validates changes without deploying or publishing them. The maintainer can select both check jobs as required status checks in GitHub's rules for `main`; adding the workflow alone does not enable merge protection.

### CLI and starter changes

```bash
npm run test:cli
npx tsc --noEmit
npm run build:cli
```

For a frontend starter change, generate the affected starter into a fresh directory, install its dependencies, then run `npm run check` and `npm run build` inside that generated project. For backend starters, run the corresponding tests and build/run checks with the language toolchain.

### Web changes

After installing both root and web dependencies:

```bash
npm --prefix apps/web test
cd apps/web
pnpm exec tsc --noEmit --incremental false
pnpm build
```

Web production builds fetch Google Fonts and need network access. If a check is blocked by your environment, report the command and limitation in the pull request; do not describe it as passed.

### Changes shared by the CLI and web app

```bash
npm test
npm run build:all
```

Run both TypeScript checks above when changing shared code.

### Formatting and whitespace

```bash
npm run format:check
git diff --check
```

Use Prettier on the files you changed if formatting fails. Avoid formatting unrelated files. Before submitting, review `git diff` and `git status` for unintended files, local credentials, build output, and generated example projects.

## 5. Open a pull request

Commit your changes with a descriptive Conventional Commit message, then push your branch:

```bash
git add PATH_TO_CHANGED_FILE
git commit -m "feat: describe the approved change"
git push -u origin feat/123-short-description
```

Common commit prefixes are `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, and `chore:`.

Open a pull request from your fork against the upstream repository's `main` branch. Complete the pull request template and include:

- `Closes #123` with the approved issue number.
- A link to the maintainer's approval comment.
- What changed, why it changed, and any compatibility impact.
- The validation commands you ran and their actual results.
- Screenshots or recordings for UI changes, including relevant mobile and theme states.
- Any remaining limitations or follow-up work.

Use a draft PR if review would be useful before the implementation is ready. The issue must still be approved before implementation starts.

## 6. Respond to review

The maintainer reviews scope, behavior, tests, security, and documentation before merging. Address feedback on the same branch, resolve conflicts, and rerun the relevant checks after changes. Keep discussion respectful and focused on the code; ask for clarification when a review request is unclear.

If you can no longer work on an approved issue, leave a note so another contributor can pick it up. The maintainer handles merge decisions, releases, and npm publishing.

## License

By submitting a contribution, you agree that your contribution is licensed under the project's [MIT License](LICENSE). Only submit work you have the right to contribute, and preserve required third-party attribution.
