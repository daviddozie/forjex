import { getTemplateStructure } from '../../../../../src/templates/structure';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowUpRight, ArrowRight, Terminal, GitBranch, Globe } from 'lucide-react';
import { CodeBlock } from '@/components/ui/code-block';
import { PackageManagerBlock } from '@/components/ui/package-manager-block';
import { TechnologyIcon } from '@/components/ui/technology-icon';
import { FRAMEWORKS, type FrameworkGuide } from './navigation';

export interface DocSection {
  id: string;
  title: string;
  content: ReactNode;
}
const inline =
  'rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[0.85em] text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200';
const link = 'font-medium text-neutral-900 underline underline-offset-4 dark:text-neutral-100';

function Note({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900/40">
      <p className="mb-1 font-medium text-neutral-900 dark:text-white">{title}</p>
      <div className="text-sm leading-7">{children}</div>
    </aside>
  );
}
function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <div className="relative border-l border-neutral-200 pb-9 pl-7 last:pb-0 dark:border-neutral-800">
      <span className="absolute -left-3.5 top-0 flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white font-mono text-xs text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white">
        {number}
      </span>
      <h3 className="mb-3 text-base font-medium text-neutral-900 dark:text-white">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
function TaskCards({
  framework = false,
  installation = false,
}: {
  framework?: boolean;
  installation?: boolean;
}) {
  const cards = framework
    ? [
        {
          href: '#create-project',
          title: 'Create a new app',
          description: 'Generate this starter locally with the CLI.',
          icon: Terminal,
        },
        {
          href: '#existing-project',
          title: 'Use an existing app',
          description: 'Keep your files and set up your repository.',
          icon: GitBranch,
        },
        {
          href: '#next-steps',
          title: 'Connect & ship',
          description: 'Add GitHub, build checks, and deployment.',
          icon: Globe,
        },
      ]
    : [
        {
          href: installation ? '#choose-framework' : '/docs/installation',
          title: 'Start a new project',
          description: 'Choose a framework and create a local starter.',
          icon: Terminal,
        },
        {
          href: '/docs/existing-project',
          title: 'Use an existing project',
          description: 'Work with an application you already have.',
          icon: GitBranch,
        },
        {
          href: '/docs/web-wizard',
          title: 'Work in the browser',
          description: 'Use the visual wizard for repository setup.',
          icon: Globe,
        },
      ];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <Link
          key={card.href}
          href={card.href}
          className="group rounded-xl border border-neutral-200 p-5 transition-colors hover:border-neutral-400 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600 dark:hover:bg-neutral-900/60"
        >
          <card.icon aria-hidden="true" className="mb-5 h-5 w-5 text-neutral-900 dark:text-white" />
          <p className="mb-2 flex items-center justify-between gap-2 font-medium text-neutral-900 dark:text-white">
            {card.title}
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
          </p>
          <p className="text-xs leading-6 text-neutral-500">{card.description}</p>
        </Link>
      ))}
    </div>
  );
}
function FrameworkCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {FRAMEWORKS.map((framework) => (
        <Link
          key={framework.slug}
          href={`/docs/installation/${framework.slug}`}
          className="group flex min-h-40 flex-col items-center justify-center gap-4 rounded-xl border border-neutral-200 bg-neutral-50/50 p-7 text-center transition-colors hover:border-neutral-400 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-900/40 dark:hover:border-neutral-600 dark:hover:bg-neutral-900"
        >
          <TechnologyIcon technology={framework.technology} size={36} />
          <div>
            <p className="font-medium text-neutral-900 dark:text-white">{framework.name}</p>
            <p className="mt-1 text-xs leading-6 text-neutral-500">{framework.summary}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
function CreateBlock({ template, name }: { template: string; name: string }) {
  return (
    <PackageManagerBlock
      defaultManager="pnpm"
      commands={{
        npm: `npx forjex create ${name} --template ${template}`,
        pnpm: `pnpm dlx forjex create ${name} --template ${template}`,
        yarn: `yarn dlx forjex create ${name} --template ${template}`,
        bun: `bunx forjex create ${name} --template ${template}`,
      }}
    />
  );
}

function frameworkSections(framework: FrameworkGuide): DocSection[] {
  const frontend = ['nextjs', 'react', 'vue'].includes(framework.template);
  const name = `my-${framework.template}-app`;
  return [
    {
      id: 'choose-your-path',
      title: 'Choose your starting point',
      content: (
        <>
          <p className="mb-5">
            Start with a fresh {framework.name} project, or keep the application you already have.
          </p>
          <TaskCards framework />
        </>
      ),
    },
    {
      id: 'requirements',
      title: 'Before you start',
      content: (
        <>
          <p>{framework.requirements}</p>
          <p className="mt-3">
            Create your project from a folder where you keep your work. Forjex creates a new
            subfolder and refuses to overwrite an existing one. No GitHub or Vercel account is
            required to create and run the starter.
          </p>
        </>
      ),
    },
    {
      id: 'create-project',
      title: `Create your ${framework.name} project`,
      content: (
        <div className="ml-3">
          <Step number={1} title="Generate the starter">
            <p>Run this command from your terminal. It downloads and runs the Forjex CLI.</p>
            <CreateBlock template={framework.template} name={name} />
            <p>
              {frontend
                ? 'Forjex offers to install dependencies with npm. Accept to continue, or skip and run npm install yourself.'
                : 'Forjex creates the files. Install the language tools listed above, then follow the commands in the next step.'}
            </p>
            <p className="text-xs">
              The package-manager buttons select how you run Forjex. Node starter dependencies are
              installed with npm by the CLI. After creation, interactive mode offers to continue
              into GitHub, optional CI/CD, and deployment. Choose No or use --no-setup to finish
              locally.
            </p>
          </Step>
          <Step
            number={2}
            title={frontend ? 'Start the development server' : 'Run your application'}
          >
            <CodeBlock
              code={`cd ${name}\n${frontend ? '# If you skipped dependency installation:\n# npm install\n' : ''}${framework.commands}`}
              filename="Terminal"
            />
            {framework.template === 'python' && (
              <p>
                On Windows, activate the environment with{' '}
                <code className={inline}>.venv\Scripts\activate</code> instead of{' '}
                <code className={inline}>source .venv/bin/activate</code>.
              </p>
            )}
            <p>
              {framework.template === 'nextjs'
                ? 'Open the local URL printed by Next.js, normally http://localhost:3000. You will see the Forjex welcome page with a rotating logo. Open /docs for the generated file guide.'
                : framework.template === 'react' || framework.template === 'vue'
                  ? 'Open the local URL printed by Vite, normally http://localhost:5173. You will see the Forjex welcome page with a rotating logo. Open /docs for the generated file guide.'
                  : framework.template === 'python'
                    ? 'Open http://127.0.0.1:8000 for the API response, or http://127.0.0.1:8000/docs for interactive API documentation.'
                    : framework.template === 'go'
                      ? 'Open http://localhost:8080 for a JSON response. The /health endpoint returns a health check.'
                      : 'Cargo builds and runs the application. Its greeting appears in your terminal; this starter does not run a web server.'}
            </p>
          </Step>
          <Step number={3} title="Make your first change">
            <p>
              Edit <code className={inline}>{framework.edit}</code>.{' '}
              {frontend
                ? 'The development server updates the page as you save.'
                : 'Run the application again to see your changes.'}
            </p>
            <p>
              {frontend
                ? 'Start with the home feature, keep shared UI in components/ui, and add your application features alongside it.'
                : 'Use the entry point and test starter as a starting point for your own application.'}
            </p>
          </Step>
          <Step number={4} title={frontend ? 'Check the production build' : 'Run the checks'}>
            <CodeBlock code={framework.verify} filename="Terminal" />
            <p>
              Run this before sharing your work. A successful local build or test does not deploy
              the application.
            </p>
          </Step>
        </div>
      ),
    },
    {
      id: 'project-structure',
      title: 'What gets created',
      content: (
        <>
          <List items={framework.includes} />
          <div className="mt-5">
            <CodeBlock
              code={getTemplateStructure(framework.template)}
              language="tree"
              filename="Project structure"
            />
          </div>
          <p className="mt-4">
            This is the complete default local file tree before installing dependencies. It includes
            the README and a language-specific <code className={inline}>.gitignore</code>.{' '}
            {frontend
              ? 'The welcome page introduces Forjex with a pearl-white logo and a perspective-based rotation. Reduced-motion preferences disable the animation. The /docs page explains the generated files, commands, and deployment workflow. Styles use shared CSS with design tokens.'
              : framework.template === 'rust'
                ? 'This is a minimal Rust application, not an Axum service.'
                : framework.template === 'go'
                  ? 'The HTTP service uses the standard library, not Fiber.'
                  : ''}
          </p>
        </>
      ),
    },
    ...(frontend
      ? [
          {
            id: 'project-conventions',
            title: 'Where your application code belongs',
            content: (
              <>
                <List
                  items={[
                    'features/: keep a feature’s components, data, and types together.',
                    'components/ui and components/layout: reusable controls and shared page structure.',
                    framework.template === 'vue'
                      ? 'composables/: reusable reactive state, demonstrated by use-counter.'
                      : 'hooks/: reusable client state, demonstrated by use-counter.',
                    'types/, constants/, and config/: shared contracts, route constants, public environment settings, and app identity.',
                    'services/, lib/, and utils/: typed API requests, shared errors, and pure formatting helpers.',
                    'tests/: mocked API-client tests and utility tests; no provider credentials are needed.',
                  ]}
                />
                <CodeBlock code={'npm run check\nnpm run build'} filename="Verify the starter" />
                <p>
                  Copy <code className={inline}>.env.example</code> to{' '}
                  <code className={inline}>.env.local</code> if you want to configure an API origin.
                  The API client makes no requests until you call it. Dependency installation
                  creates <code className={inline}>node_modules/</code> and the lockfile; CI/CD and
                  deployment configuration are added only when selected.
                </p>
              </>
            ),
          },
        ]
      : []),
    {
      id: 'existing-project',
      title: 'Already have a project?',
      content: (
        <>
          <p>
            Skip the create command. Open your existing {framework.name} project folder and run:
          </p>
          <div className="mt-4">
            <CodeBlock code="npx forjex forge" filename="Terminal" />
          </div>
          <p className="mt-4">
            Choose <strong>Use the existing project in this directory</strong>. The CLI uses your
            local application files for repository setup; it does not replace them with a starter.
            Review existing workflows and configuration before enabling generation.
          </p>
          <Link href="/docs/existing-project" className={link}>
            Follow the existing-project guide →
          </Link>
        </>
      ),
    },
    {
      id: 'next-steps',
      title: 'Connect GitHub and ship',
      content: (
        <>
          <p>
            Creation offers to continue into GitHub, optional CI/CD, and deployment. To continue
            later, run <code className={inline}>npx forjex forge</code> from the generated project
            folder and choose the existing-project path. You can create a GitHub repository, add
            CI/CD, and push your code.
          </p>
          <p className="mt-3">
            {frontend
              ? 'Vercel deployment is optional. Follow the deployment guide for credentials and status details.'
              : 'Use a host that supports your language and runtime. These backend starters do not include a Vercel deployment setup.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
            <Link className={link} href="/docs/github">
              GitHub setup
            </Link>
            <Link className={link} href="/docs/ci-cd">
              Build checks & CI/CD
            </Link>
            {frontend && (
              <Link className={link} href="/docs/deployment">
                Deploy to Vercel
              </Link>
            )}
          </div>
          {framework.webWizard && (
            <p className="mt-5">
              Prefer a visual setup? The{' '}
              <Link className={link} href="/docs/web-wizard">
                browser wizard
              </Link>{' '}
              also offers this framework.
            </p>
          )}
        </>
      ),
    },
  ];
}

export function getDocSections(slug: string): DocSection[] {
  const framework = FRAMEWORKS.find((item) => `installation/${item.slug}` === slug);
  if (framework) return frameworkSections(framework);
  switch (slug) {
    case '':
      return [
        {
          id: 'choose-your-path',
          title: 'What would you like to do?',
          content: (
            <>
              <p className="mb-5">
                Forjex helps you start an application, connect it to GitHub, add build checks, and
                deploy supported frontends. Choose the path that matches the work in front of you.
              </p>
              <TaskCards />
            </>
          ),
        },
        {
          id: 'how-it-works',
          title: 'From an idea to a running app',
          content: (
            <div className="ml-3">
              <Step number={1} title="Choose your framework">
                <p>
                  Next.js, React, Vue, Python, Go, and Rust have local starter templates. Each
                  framework guide shows its requirements, files, and run commands.
                </p>
              </Step>
              <Step number={2} title="Create and run locally">
                <p>
                  Generate the files, install dependencies, and start the application. You can do
                  this without signing in.
                </p>
              </Step>
              <Step number={3} title="Connect and publish when ready">
                <p>
                  Use the GitHub workflow to push your project. CI/CD, account sync, and Vercel
                  deployment are separate steps you can choose when you need them.
                </p>
              </Step>
            </div>
          ),
        },
        {
          id: 'find-a-guide',
          title: 'Find a focused guide',
          content: (
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  href: '/docs/cli',
                  title: 'Look up a CLI command',
                  text: 'Arguments, options, and examples.',
                },
                {
                  href: '/docs/troubleshooting',
                  title: 'Fix a setup problem',
                  text: 'Installation, build, and authentication help.',
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-neutral-200 p-5 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                >
                  <p className="font-medium text-neutral-900 dark:text-white">
                    {item.title}
                    <ArrowRight aria-hidden="true" className="ml-2 inline h-4 w-4" />
                  </p>
                  <p className="mt-2 text-xs">{item.text}</p>
                </Link>
              ))}
            </div>
          ),
        },
      ];
    case 'installation':
      return [
        {
          id: 'choose-your-path',
          title: 'Choose your starting point',
          content: <TaskCards installation />,
        },
        {
          id: 'install-cli',
          title: 'Install the CLI',
          content: (
            <>
              <p className="mb-4">
                Install Node.js 20 or newer with npm available, then install Forjex using your
                package manager. Check the version afterward to confirm the command is available.
              </p>
              <PackageManagerBlock
                defaultManager="pnpm"
                commands={{
                  npm: 'npm install -g forjex\nforjex --version',
                  pnpm: 'pnpm add -g forjex\nforjex --version',
                  yarn: 'yarn global add forjex\nforjex --version',
                  bun: 'bun add -g forjex\nforjex --version',
                }}
              />
              <p className="mt-4">
                You can also run Forjex on demand with <code className={inline}>npx forjex</code>.
                No global installation is needed for the commands shown in the framework guides.
              </p>
            </>
          ),
        },
        {
          id: 'choose-framework',
          title: 'Choose your framework',
          content: (
            <>
              <p className="mb-5">
                Each guide takes you from a new folder to a running application, then shows how to
                continue with a repository.
              </p>
              <FrameworkCards />
            </>
          ),
        },
        {
          id: 'guided-setup',
          title: 'Prefer a guided setup?',
          content: (
            <>
              <CodeBlock code="forjex forge" filename="Terminal" />
              <p className="mt-4">
                Choose <strong>Start a new project from a Forjex template</strong>, enter a project
                name, and select a framework. Names must start with a lowercase letter and contain
                only lowercase letters, numbers, or hyphens, up to 64 characters.
              </p>
              <p className="mt-3">
                For Node starters, the CLI offers to install dependencies with npm. GitHub setup is
                optional after the files are created.
              </p>
            </>
          ),
        },
        {
          id: 'installation-help',
          title: 'If a command is unavailable',
          content: (
            <Note title="Check your installed CLI">
              <p>
                If <code className={inline}>create</code> or{' '}
                <code className={inline}>--template</code> is unknown, your installed version does
                not include starter generation. Updating helps once that release is published. See{' '}
                <Link className={link} href="/docs/troubleshooting#unknown-command">
                  unknown command help
                </Link>{' '}
                for how to check a local development build.
              </p>
            </Note>
          ),
        },
      ];
    case 'existing-project':
      return [
        {
          id: 'before-you-start',
          title: 'Before you start',
          content: (
            <>
              <p>
                Use this path when your application files already exist locally. Install its
                dependencies and confirm its build works first. You also need Git and a GitHub
                account with access to the destination repository.
              </p>
              <Note title="Run from your project folder">
                <p>
                  The CLI works with the current directory. Enter the application folder before
                  starting; do not run repository setup from your home folder.
                </p>
              </Note>
            </>
          ),
        },
        {
          id: 'start-wizard',
          title: 'Open the existing-project flow',
          content: (
            <div className="ml-3">
              <Step number={1} title="Enter your application folder">
                <CodeBlock code={'cd my-project\nforjex forge'} filename="Terminal" />
              </Step>
              <Step number={2} title="Choose your starting point">
                <p>
                  Select <strong>Use the existing project in this directory</strong>. This uses your
                  local files instead of generating a template.
                </p>
              </Step>
              <Step number={3} title="Choose a repository">
                <p>
                  Select <strong>Create a new GitHub repository</strong> to publish these files to a
                  new repository, or <strong>Push to an existing GitHub repository</strong> to use
                  an existing remote. Review the destination before continuing.
                </p>
              </Step>
            </div>
          ),
        },
        {
          id: 'review-options',
          title: 'Review generated configuration',
          content: (
            <>
              <p>
                The CLI asks about GitHub Actions and Vercel. Enable only what you want to
                configure. The CLI writes a workflow when CI/CD is selected; review an existing
                workflow before doing this.
              </p>
              <p className="mt-3">
                The browser&apos;s <strong>Connect Existing Repo</strong> flow is different: it
                works on the remote repository, requires an initial commit, and adds only missing
                selected configuration. It preserves existing source files, README, workflows, and
                Vercel configuration.
              </p>
            </>
          ),
        },
        {
          id: 'build-and-push',
          title: 'Build, commit, and push',
          content: (
            <>
              <p>
                The CLI runs the detected build command before pushing. Fix a failed build locally,
                then run the existing-project flow again.
              </p>
              <p className="mt-3">
                For an existing remote, the current CLI pulls from and pushes to{' '}
                <code className={inline}>main</code>. Check your branch and remote first; if your
                repository uses another default branch, use the browser connection flow or configure
                the repository manually.
              </p>
              <div className="mt-4">
                <CodeBlock
                  code={'git status\ngit branch --show-current\ngit remote -v'}
                  filename="Inspect your repository"
                />
              </div>
              <p className="mt-4">
                Review local changes and remove secrets before committing. A successful push makes
                the selected files available to everyone with access to that GitHub repository.
              </p>
            </>
          ),
        },
      ];
    case 'github':
      return [
        {
          id: 'choose-repository',
          title: 'Choose a new or existing repository',
          content: (
            <>
              <p>
                Run <code className={inline}>forjex forge</code> inside your application folder and
                choose the existing-project path. Create a new GitHub repository for an unpublished
                project, or select an existing remote.
              </p>
              <p className="mt-3">
                A new GitHub repository is a destination for your files. To generate application
                files first, use{' '}
                <Link className={link} href="/docs/installation">
                  a starter template
                </Link>
                .
              </p>
            </>
          ),
        },
        {
          id: 'permissions',
          title: 'Connect your GitHub account',
          content: (
            <>
              <p>
                Repository setup authenticates with GitHub. Your account needs permission to create
                a repository or write to the selected existing repository. Generating a local
                starter alone does not require this connection.
              </p>
              <p className="mt-3">
                For account login, use <code className={inline}>forjex login</code> and follow the
                browser flow. See{' '}
                <Link className={link} href="/docs/authentication">
                  authentication
                </Link>{' '}
                for token and sign-out options.
              </p>
            </>
          ),
        },
        {
          id: 'commit-and-push',
          title: 'Commit and push',
          content: (
            <>
              <p>
                During repository setup, the CLI checks the build when a build command and the
                required dependencies are available. A new frontend starter without installed
                dependencies reports that local build verification was skipped. Commit messages can
                be reviewed and edited before the setup commits and pushes your files.
              </p>
              <div className="mt-4">
                <CodeBlock
                  code={
                    'feat: add account settings form\nfix: handle an expired session\ndocs: update setup instructions'
                  }
                  language="text"
                  filename="Example commit messages"
                />
              </div>
              <p className="mt-4">
                Check <code className={inline}>git status</code> and your{' '}
                <code className={inline}>.gitignore</code> before the operation. The CLI stages
                files from the project directory during setup. For later changes, use the dedicated
                push command, which preserves existing staged selections and pushes the current
                branch.
              </p>
              <CodeBlock
                code={
                  'forjex ai configure\nforjex push --ai\nforjex push -m "feat: add project search"'
                }
                filename="Later commits"
              />
              <p className="mt-4">
                Set <code className={inline}>OPENAI_API_KEY</code> in your terminal environment to
                generate a message from staged text changes. Accept, edit, regenerate, or cancel
                before committing. Existing commits keep their messages. The push command does not
                run build checks; run your project checks before pushing.
              </p>
              <Link href="/docs/cli#push" className={link}>
                Read the push and AI reference →
              </Link>
            </>
          ),
        },
        {
          id: 'after-push',
          title: 'After your code is on GitHub',
          content: (
            <>
              <p>
                Open the repository URL printed by the CLI and verify your files. If you enabled
                CI/CD, inspect the Actions tab. If you requested deployment, check the deployment
                result separately.
              </p>
              <p className="mt-3">
                A successful GitHub push does not by itself confirm that tests passed or that the
                application is live.
              </p>
              <div className="mt-4 flex gap-5">
                <Link className={link} href="/docs/ci-cd">
                  Configure build checks
                </Link>
                <Link className={link} href="/docs/deployment">
                  Deploy your frontend
                </Link>
              </div>
            </>
          ),
        },
      ];
    case 'ci-cd':
      return [
        {
          id: 'local-build-check',
          title: 'Check the build locally',
          content: (
            <>
              <p>
                Before pushing through the CLI, Forjex detects the project type and runs a build
                check. If it fails, the push stops so you can fix the errors first.
              </p>
              <div className="mt-4">
                <CodeBlock
                  code={
                    '# Node frontends\nnpm run build\n\n# Go\ngo build ./...\n\n# Rust\ncargo build --release'
                  }
                  filename="Run the relevant check"
                />
              </div>
              <p className="mt-4">
                For Python projects, the current CLI build check installs requirements. Run{' '}
                <code className={inline}>pytest</code> separately to check your tests, preferably in
                an activated virtual environment.
              </p>
            </>
          ),
        },
        {
          id: 'github-actions',
          title: 'Add GitHub Actions',
          content: (
            <>
              <p>
                Enable the CI/CD option during repository setup to generate{' '}
                <code className={inline}>.github/workflows/ci.yml</code>. The workflow is based on
                the detected language.
              </p>
              <List
                items={[
                  'Node.js: dependency installation, available tests, and the build script.',
                  'Python: dependency installation and pytest.',
                  'Go: build and test steps.',
                  'Rust: Cargo checks and tests.',
                ]}
              />
              <p className="mt-4">
                The CLI generator can replace an existing workflow at this path. The browser
                connection flow preserves existing workflows and adds missing selected
                configuration.
              </p>
            </>
          ),
        },
        {
          id: 'verify-workflow',
          title: 'Verify the workflow',
          content: (
            <>
              <p>
                After pushing, open your GitHub repository&apos;s <strong>Actions</strong> tab and
                inspect the run. A generated workflow file is not evidence that the workflow passed.
              </p>
              <p className="mt-3">
                The CLI-generated workflow targets <code className={inline}>main</code>. The browser
                connection flow uses the existing repository&apos;s default branch. Review branch
                filters, environment variables, and test commands for your project.
              </p>
            </>
          ),
        },
        {
          id: 'deployment-relationship',
          title: 'How CI relates to deployment',
          content: (
            <p>
              GitHub Actions and Vercel can run independently on the same push. The generated setup
              does not guarantee that Vercel waits for a successful Actions run. Configure
              deployment protection or a deployment workflow if that ordering is required.
            </p>
          ),
        },
      ];
    case 'deployment':
      return [
        {
          id: 'requirements',
          title: 'Before deploying',
          content: (
            <>
              <p>
                This path is for Next.js, React/Vite, and Vue/Vite applications. Confirm the
                production build works locally, then connect your GitHub and Vercel accounts.
              </p>
              <p className="mt-3">
                Python, Go, and Rust starters need a host that supports their runtime. The starter
                guides show their local run and build commands.
              </p>
            </>
          ),
        },
        {
          id: 'deploy-cli',
          title: 'Deploy from the CLI',
          content: (
            <div className="ml-3">
              <Step number={1} title="Open repository setup">
                <CodeBlock code="forjex forge" filename="From your application folder" />
                <p>Choose the existing-project path if you have already generated your app.</p>
              </Step>
              <Step number={2} title="Enable Vercel deployment">
                <p>
                  Select your GitHub destination, choose whether to add CI/CD, and enable deployment
                  when asked. Follow the Vercel authentication prompts.
                </p>
              </Step>
              <Step number={3} title="Review the result">
                <p>
                  Open the deployment URL reported by the provider and check the actual application.
                  If deployment fails, inspect the Vercel build logs before retrying.
                </p>
              </Step>
            </div>
          ),
        },
        {
          id: 'deploy-browser',
          title: 'Deploy from the browser wizard',
          content: (
            <>
              <p>
                In the{' '}
                <Link className={link} href="/forge">
                  Forge Wizard
                </Link>
                , connect your credentials, select a frontend template, and enable Vercel. Forjex
                links the repository to the Vercel project and checks the latest production
                deployment.
              </p>
              <p className="mt-3">
                The dashboard shows a live URL only when the provider confirms a{' '}
                <strong>READY</strong> deployment. Creating a Vercel project alone does not mean
                your application is live.
              </p>
            </>
          ),
        },
        {
          id: 'deployment-status',
          title: 'Understand deployment status',
          content: (
            <List
              items={[
                'Ready: the provider confirms a completed deployment.',
                'Queued or building: wait and refresh the status.',
                'Failed or canceled: inspect the provider logs and retry after fixing the cause.',
                'Pending setup or unknown: check the linked repository, credentials, and provider configuration.',
              ]}
            />
          ),
        },
        {
          id: 'future-pushes',
          title: 'Future updates',
          content: (
            <p>
              When the GitHub integration is connected, pushes can trigger Vercel deployments.
              Verify the integration, production branch, environment variables, and build settings
              in Vercel. A local build can pass while deployment fails because the environments
              differ.
            </p>
          ),
        },
      ];
    case 'web-wizard':
      return [
        {
          id: 'choose-mode',
          title: 'Choose your starting point',
          content: (
            <>
              <p>
                The{' '}
                <Link className={link} href="/forge">
                  Forge Wizard
                </Link>{' '}
                is the visual path for creating a GitHub repository from a template or connecting an
                existing remote repository.
              </p>
              <p className="mt-3">
                The CLI creates files on your computer. The browser wizard creates or configures
                files on GitHub; clone that repository if you want to develop locally.
              </p>
            </>
          ),
        },
        {
          id: 'new-repository',
          title: 'Create a repository from a template',
          content: (
            <div className="ml-3">
              <Step number={1} title="Select a framework">
                <p>
                  Choose from the templates offered by the wizard. The current browser selection
                  includes Next.js, React/Vite, FastAPI, Go, and Rust.
                </p>
              </Step>
              <Step number={2} title="Configure your repository">
                <p>
                  Enter a name and description, review visibility, and choose whether to include a
                  README, CI/CD, and Vercel configuration where supported.
                </p>
              </Step>
              <Step number={3} title="Connect credentials and run">
                <p>
                  Use your own verified GitHub account and, for deployment, Vercel credentials.
                  Review the summary, then start the operation and inspect the result.
                </p>
              </Step>
            </div>
          ),
        },
        {
          id: 'ai-commit-messages',
          title: 'Review an AI commit message',
          content: (
            <>
              <p>
                In the Pipelines step, use the optional commit-message editor to write a message
                manually or choose <strong>Generate with AI</strong>. AI generation requires a
                connected GitHub account, an OpenAI model ID, and your API key. Generation previews
                the planned starter or configuration additions without writing to GitHub.
              </p>
              <List
                items={[
                  'Choose an OpenAI model ID available to your account that supports structured text output. The default is gpt-4.1-mini. Model selection stays in page memory.',
                  'Enter your OpenAI API key in the password field. It stays in page memory, is used by the Forjex server for generation, and is not saved to storage.',
                  'Review the generated title and description. Edit them or regenerate before selecting Forge Project Now.',
                  'If setup options change, regenerate or clear the preview. If repository additions change before committing, generate a new preview.',
                  'If AI fails, enter a message manually or clear the message to use the default. A message is used only when setup creates a commit.',
                ]}
              />
              <p className="mt-4">
                AI sends a bounded snapshot of planned text additions to OpenAI, with sensitive
                paths and recognized secrets filtered. Review your code for other confidential
                content. Usage is billed to your API key. The key is cleared after a successful
                forge or wizard reset. Cloud cannot see unpushed local changes; use{' '}
                <code className={inline}>forjex push --ai</code> for those.
              </p>
            </>
          ),
        },
        {
          id: 'connect-existing',
          title: 'Connect an existing repository',
          content: (
            <>
              <p>
                Select <strong>Connect Existing Repo</strong> and enter an HTTPS GitHub URL such as{' '}
                <code className={inline}>https://github.com/owner/repository</code>. You need write
                access, and the repository must already contain an initial commit.
              </p>
              <p className="mt-3">
                Forjex preserves application files, README, visibility, existing workflows, and
                Vercel configuration. It adds missing selected configuration and uses the
                repository&apos;s actual default branch.
              </p>
            </>
          ),
        },
        {
          id: 'demo-mode',
          title: 'Preview before connecting',
          content: (
            <Note title="Demo preview">
              <p>
                Without credentials, the wizard offers a demo preview. It does not create a GitHub
                repository, deploy an application, or save a real project record. Connect your
                accounts when you want to perform the operation.
              </p>
            </Note>
          ),
        },
        {
          id: 'develop-locally',
          title: 'Work on the generated project locally',
          content: (
            <>
              <CodeBlock
                code={
                  'git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git\ncd YOUR-REPOSITORY'
                }
                filename="Clone your repository"
              />
              <p className="mt-4">
                Replace the placeholders with the repository shown in your result. Follow its README
                or the matching{' '}
                <Link className={link} href="/docs/installation#choose-framework">
                  framework guide
                </Link>{' '}
                to install dependencies and run the application.
              </p>
            </>
          ),
        },
      ];
    case 'cli':
      return [
        {
          id: 'create',
          title: 'create',
          content: (
            <>
              <p>
                Create a local starter without provider login, then optionally continue into GitHub,
                CI/CD, and deployment. Non-interactive creation finishes locally.
              </p>
              <div className="mt-4">
                <CodeBlock
                  code={
                    'forjex create [name] --template <template> [--no-install] [--no-setup] [--ai]\n\nforjex create my-app --template nextjs\nforjex create my-api --template python --no-install'
                  }
                  filename="Usage"
                />
              </div>
              <List
                items={[
                  'name: a new folder name. If omitted, the CLI asks for it.',
                  '--template: nextjs, react, vue, python, go, or rust. If omitted, choose interactively.',
                  '--no-install: skip the npm installation offer for Node starters.',
                  '--no-setup: finish locally without offering GitHub, CI/CD, and deployment.',
                  '--ai: offer an AI commit message if you continue into GitHub setup. Requires OPENAI_API_KEY in the terminal environment.',
                ]}
              />
              <p className="mt-3">
                Supported aliases are <code className={inline}>vite-react</code>,{' '}
                <code className={inline}>python-fastapi</code>,{' '}
                <code className={inline}>go-api</code>, and <code className={inline}>rust-app</code>
                .
              </p>
            </>
          ),
        },
        {
          id: 'forge',
          title: 'forge',
          content: (
            <>
              <p>
                Choose between a new starter and the current local project, then optionally set up
                GitHub.
              </p>
              <div className="mt-4">
                <CodeBlock
                  code={
                    'forjex forge [name] [--template <template>] [--no-install] [--ci] [--vercel] [--ai]\n\nforjex forge\nforjex forge my-app --template react --ci --vercel'
                  }
                  filename="Usage"
                />
              </div>
              <List
                items={[
                  'A name or --template starts the new-project path.',
                  '--ci enables CI/CD if you continue to GitHub setup.',
                  '--vercel enables Vercel if you continue to GitHub setup for a supported frontend.',
                  'Without a name or template, choose a new starter or the existing local project.',
                  'After generating a starter, GitHub setup is optional. These flags do not publish without the interactive setup.',
                ]}
              />
            </>
          ),
        },
        {
          id: 'push',
          title: 'push and AI commit messages',
          content: (
            <>
              <p>
                Commit staged changes and push the current branch to its existing origin. If nothing
                is staged, interactive mode offers to stage the changes shown. Existing commits keep
                their messages.
              </p>
              <CodeBlock
                code={
                  'forjex ai configure\nforjex push --ai\nforjex push -m "feat: add project search"'
                }
                filename="Commit and push"
              />
              <p className="mt-4">
                Run <code className={inline}>forjex ai configure</code> to choose your OpenAI model
                and optionally save an API key. Saved settings live in{' '}
                <code className={inline}>~/.forjex/ai.json</code>; a saved key is plaintext in a
                user-only file. Alternatively set <code className={inline}>OPENAI_API_KEY</code> in
                your terminal environment. Environment variables override saved settings. Optionally
                set <code className={inline}>FORJEX_AI_MODEL</code> (default: gpt-4.1-mini). Review,
                edit, or regenerate before committing. Sensitive paths and recognized secrets are
                filtered from bounded text diffs; review your changes for other confidential
                content. AI failure leaves manual messages available. Non-interactive commits
                require staged files and <code className={inline}>--message</code>.
              </p>
              <p className="mt-4">
                The cloud wizard also offers AI messages before forging. Connect GitHub and supply
                your OpenAI model ID and API key in the commit-message panel. The key stays in page
                memory and is used by our server only for generation; it is not saved. Cloud
                summarizes its planned additions, while the CLI can summarize your local staged
                changes.
              </p>
            </>
          ),
        },
        {
          id: 'ai-configuration',
          title: 'AI configuration',
          content: (
            <>
              <CodeBlock
                code={'forjex ai configure\nforjex ai status\nforjex ai clear'}
                filename="AI settings"
              />
              <p className="mt-4">
                OpenAI is the supported provider. Configure selects a model and asks before saving a
                key to a plaintext file with user-only permissions. Status shows the effective model
                and key source without revealing the key. Clear removes saved AI settings;
                environment variables still apply. Saving AI settings does not change GitHub or
                Vercel credentials.
              </p>
            </>
          ),
        },
        {
          id: 'account-commands',
          title: 'Account commands',
          content: (
            <>
              <CodeBlock
                code={
                  'forjex login\nforjex login --token <github-personal-access-token>\nforjex whoami\nforjex logout'
                }
                filename="Authentication"
              />
              <p className="mt-4">
                Login connects the CLI to your account. <code className={inline}>whoami</code>{' '}
                reports the saved identity; <code className={inline}>logout</code> clears locally
                saved CLI credentials. See{' '}
                <Link className={link} href="/docs/authentication">
                  authentication
                </Link>
                .
              </p>
            </>
          ),
        },
        {
          id: 'sync',
          title: 'sync',
          content: (
            <>
              <CodeBlock code="forjex sync" filename="Dashboard sync" />
              <p className="mt-4">
                Fetch synchronized projects from your Forjex account. See{' '}
                <Link className={link} href="/docs/sync">
                  dashboard and sync
                </Link>{' '}
                for connection and persistence requirements.
              </p>
            </>
          ),
        },
        {
          id: 'help',
          title: 'Help and version',
          content: (
            <CodeBlock
              code={'forjex --help\nforjex create --help\nforjex forge --help\nforjex --version'}
              filename="Inspect your installed CLI"
            />
          ),
        },
      ];
    case 'authentication':
      return [
        {
          id: 'when-to-sign-in',
          title: 'When you need an account',
          content: (
            <>
              <p>
                Creating and running a local starter requires no GitHub or Vercel login. Repository
                operations need GitHub access; Vercel deployment needs Vercel access. Dashboard sync
                also needs a valid Forjex account connection.
              </p>
            </>
          ),
        },
        {
          id: 'browser-login',
          title: 'Sign in through the browser',
          content: (
            <>
              <CodeBlock code="forjex login" filename="Terminal" />
              <p className="mt-4">
                The CLI opens an authorization page on your configured Forjex origin. Sign in,
                review the connection, and authorize the CLI. Return to your terminal when
                authorization succeeds.
              </p>
              <p className="mt-3">
                The authorization request expires after three minutes and can be consumed once. If
                it expires, run the login command again.
              </p>
            </>
          ),
        },
        {
          id: 'personal-access-token',
          title: 'Use a GitHub personal access token',
          content: (
            <>
              <CodeBlock
                code="forjex login --token <your-github-token>"
                filename="Alternative login"
              />
              <p className="mt-4">
                Replace the placeholder with your own GitHub token. The CLI validates it with
                GitHub. The token needs appropriate access for your repository operations.
              </p>
              <p className="mt-3">
                Treat tokens as secrets. Supplying a token on the command line can leave it in shell
                history; prefer the browser flow for routine login.
              </p>
            </>
          ),
        },
        {
          id: 'stored-credentials',
          title: 'Saved credentials and sign-out',
          content: (
            <>
              <p>
                The CLI stores credentials in <code className={inline}>~/.forjex/config.json</code>{' '}
                with owner-only file permissions. Do not commit or share this file.
              </p>
              <div className="mt-4">
                <CodeBlock
                  code={'forjex whoami\nforjex logout'}
                  filename="Inspect or clear the local login"
                />
              </div>
              <p className="mt-4">
                Logging out clears the local CLI configuration. Revoke a provider token in its
                provider settings if you need to invalidate it everywhere.
              </p>
            </>
          ),
        },
        {
          id: 'vercel-access',
          title: 'Vercel access',
          content: (
            <p>
              Connect Vercel separately when deploying. Signing in with GitHub alone does not grant
              Vercel access. Follow the deployment prompts or the website&apos;s credentials dialog,
              and check that the correct account or team owns the target project.
            </p>
          ),
        },
      ];
    case 'sync':
      return [
        {
          id: 'dashboard',
          title: 'View your projects',
          content: (
            <>
              <p>
                The{' '}
                <Link className={link} href="/dashboard">
                  Dashboard
                </Link>{' '}
                shows project records associated with your signed-in account. A repository created
                outside Forjex is not automatically a saved Forjex project.
              </p>
              <p className="mt-3">
                A local starter created with <code className={inline}>forjex create</code> stays
                local unless you continue into GitHub setup. Local creation alone does not create a
                dashboard record.
              </p>
            </>
          ),
        },
        {
          id: 'connect-cli',
          title: 'Connect your terminal',
          content: (
            <>
              <CodeBlock code={'forjex login\nforjex whoami\nforjex sync'} filename="Terminal" />
              <p className="mt-4">
                Use the same GitHub identity in the CLI and website. Sync needs a reachable Forjex
                server and persistent storage configured on that server.
              </p>
            </>
          ),
        },
        {
          id: 'persistence',
          title: 'Understand persistence',
          content: (
            <>
              <p>
                After repository setup, the CLI attempts to save a project record. Read the sync
                result separately from the GitHub result. A repository can be created successfully
                while account sync remains unavailable.
              </p>
              <p className="mt-3">
                If storage is unavailable, the browser reports that cloud persistence is
                unavailable. A demo preview does not save real projects.
              </p>
            </>
          ),
        },
        {
          id: 'refresh-status',
          title: 'Refresh deployment status',
          content: (
            <p>
              Use the dashboard refresh action to check the linked Vercel deployment. Inspect
              provider status and logs if a project is still building or has failed. The web
              dashboard reports a live URL only after a provider-confirmed READY deployment.
            </p>
          ),
        },
      ];
    case 'troubleshooting':
      return [
        {
          id: 'command-not-found',
          title: 'The forjex command is not found',
          content: (
            <>
              <p>
                Confirm Node.js and your package manager are available. Reinstall the CLI, or use it
                on demand:
              </p>
              <div className="mt-4">
                <CodeBlock
                  code={
                    'node --version\nnpm install -g forjex\nforjex --version\n\n# Run without a global installation\nnpx forjex --help'
                  }
                  filename="Terminal"
                />
              </div>
            </>
          ),
        },
        {
          id: 'unknown-command',
          title: 'create or --template is unknown',
          content: (
            <>
              <p>
                Your installed CLI predates starter generation. Inspect{' '}
                <code className={inline}>forjex --help</code> and update after the starter release
                is published. Reinstalling an older published release will not add the feature.
              </p>
              <p className="mt-3">
                If you are working from the Forjex source repository, build and run that local CLI:
              </p>
              <div className="mt-4">
                <CodeBlock
                  code={'npm run build:cli\nnode dist/index.js create my-app --template nextjs'}
                  filename="From the Forjex source checkout"
                />
              </div>
            </>
          ),
        },
        {
          id: 'folder-exists',
          title: 'The project folder already exists',
          content: (
            <p>
              Choose a different project name, or enter that folder and use the existing-project
              path. Forjex refuses to overwrite an existing directory, even when it is empty.
            </p>
          ),
        },
        {
          id: 'install-fails',
          title: 'Dependency installation fails',
          content: (
            <>
              <p>
                The starter files remain in the generated folder. Check your connection, Node
                version, and package registry access, then retry:
              </p>
              <div className="mt-4">
                <CodeBlock
                  code={'cd my-app\nnpm install\nnpm run dev'}
                  filename="For a Node frontend"
                />
              </div>
              <p className="mt-3">
                For Python, activate the virtual environment and install requirements. For Go and
                Rust, confirm the language toolchain is on your PATH.
              </p>
            </>
          ),
        },
        {
          id: 'build-fails',
          title: 'The build stops a push',
          content: (
            <>
              <p>
                Run the same build command locally and fix the reported errors. The CLI stops before
                pushing when its build check fails.
              </p>
              <div className="mt-4">
                <CodeBlock code="npm run build" filename="For a Node frontend" />
              </div>
              <p className="mt-3">
                After fixing the issue, rerun <code className={inline}>forjex forge</code> and
                choose your existing project and repository. Inspect GitHub if an earlier attempt
                already created the repository.
              </p>
            </>
          ),
        },
        {
          id: 'provider-errors',
          title: 'GitHub, login, or deployment fails',
          content: (
            <List
              items={[
                'Login expired: run forjex login again and complete authorization within three minutes.',
                'Repository denied: verify the selected identity and its write access.',
                'Existing remote is empty: create an initial commit before using the browser connection flow.',
                'Deployment failed: inspect Vercel logs, runtime versions, build settings, and environment variables.',
                'Project missing from Dashboard: inspect the sync result and confirm the same account is signed in.',
              ]}
            />
          ),
        },
      ];
    default:
      return [];
  }
}

export function DocSections({ sections }: { sections: DocSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-36 lg:scroll-mt-24">
          <h2 className="mb-5 text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl dark:text-white">
            <a href={`#${section.id}`} className="group inline-flex items-center gap-2">
              {section.title}
              <span
                aria-hidden="true"
                className="text-sm font-normal text-neutral-400 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                #
              </span>
            </a>
          </h2>
          <div className="space-y-4">{section.content}</div>
        </section>
      ))}
    </>
  );
}
