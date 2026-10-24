import { validateCommitMessage } from '../../../../../../src/ai/commit-message';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { getGitHubToken, getVercelToken, authenticateRequest } from '@/lib/auth';
import {
  forgeRepository,
  ForgeRepositoryError,
  parseGitHubRepository,
} from '@/lib/forge-repository';
import { getDb, projects, deployments } from '@/db';

import { deploymentState, getDeploymentState, type DeploymentState } from '@/lib/vercel';

const FRAMEWORK_LABELS: Record<string, string> = {
  nextjs: 'Next.js 15',
  'vite-react': 'Vite + React',
  'python-fastapi': 'Python FastAPI',
  'go-api': 'Go Fiber',
  'rust-app': 'Rust Axum',
};

async function persistToNeon(params: {
  id: string;
  userId?: string;
  name: string;
  repoOwner: string;
  repoName: string;
  repoUrl: string;
  description: string;
  framework: string;
  template: string;
  isPrivate: boolean;
  isLive: boolean;
  addCICD: boolean;
  deployVercel: boolean;
  vercelUrl?: string;
  status?: string;
  branch?: string;
}): Promise<{ persisted: boolean; id: string }> {
  const { db, isConfigured } = getDb();
  if (!isConfigured || !db) return { persisted: false, id: params.id };
  try {
    const existing = params.userId
      ? await db.query.projects.findFirst({
          where: and(
            eq(projects.userId, params.userId),
            eq(projects.repoOwner, params.repoOwner),
            eq(projects.repoName, params.repoName),
          ),
        })
      : null;
    const id = existing?.id || params.id;
    const values = {
      userId: params.userId,
      name: params.name,
      repoOwner: params.repoOwner,
      repoName: params.repoName,
      repoUrl: params.repoUrl,
      description: params.description,
      framework: params.framework,
      template: params.template,
      isPrivate: params.isPrivate,
      isLive: params.isLive,
      branch: params.branch || 'main',
      status: params.status || 'unknown',
      addCICD: params.addCICD,
      deployVercel: params.deployVercel,
      vercelUrl: params.vercelUrl,
      updatedAt: new Date(),
    };
    if (existing) await db.update(projects).set(values).where(eq(projects.id, id));
    else await db.insert(projects).values({ id, ...values });
    if (params.deployVercel && params.vercelUrl) {
      const recorded = await db.query.deployments.findFirst({
        where: and(eq(deployments.projectId, id), eq(deployments.url, params.vercelUrl)),
      });
      if (!recorded)
        await db.insert(deployments).values({
          id: `dep_${randomUUID()}`,
          projectId: id,
          provider: 'vercel',
          url: params.vercelUrl,
          status: params.status || 'unknown',
          environment: 'production',
        });
    }
    return { persisted: true, id };
  } catch (error) {
    console.warn('Neon PostgreSQL persistence notice:', error);
    return { persisted: false, id: params.id };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      repoMode = 'new',
      existingRepoUrl,
      addReadme = true,
      description = 'Bootstrapped with Forjex',
      isPrivate = false,
      template = 'nextjs',
      addCICD = true,
      deployVercel = true,
      manualGithubToken,
      manualVercelToken,
      commitMessage,
      commitPlanHash,
    } = body;

    if (commitMessage !== undefined) {
      try {
        validateCommitMessage(commitMessage);
      } catch {
        return NextResponse.json({ error: 'Invalid commit message.' }, { status: 400 });
      }
    }
    if (
      commitPlanHash !== undefined &&
      (typeof commitPlanHash !== 'string' || !/^[a-f0-9]{64}$/.test(commitPlanHash))
    )
      return NextResponse.json({ error: 'Invalid commit preview.' }, { status: 400 });

    if (!['new', 'existing'].includes(repoMode))
      return NextResponse.json({ error: 'Invalid repository action' }, { status: 400 });
    if (repoMode === 'existing') parseGitHubRepository(existingRepoUrl);
    if (repoMode === 'new' && (typeof name !== 'string' || !name.trim())) {
      return NextResponse.json({ error: 'Repository name is required' }, { status: 400 });
    }

    if (!Object.hasOwn(FRAMEWORK_LABELS, template))
      return NextResponse.json({ error: 'Unsupported template' }, { status: 400 });
    const auth = manualGithubToken
      ? await authenticateRequest(
          new Request(request.url, { headers: { Authorization: `Bearer ${manualGithubToken}` } }),
        )
      : await authenticateRequest(request);
    const currentUser = auth?.user;
    const requestedName =
      repoMode === 'existing'
        ? parseGitHubRepository(existingRepoUrl).repo
        : name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-_]/g, '-');
    const suppliedToken =
      manualGithubToken || request.headers.has('authorization') || (await getGitHubToken());
    if (suppliedToken && !auth)
      return NextResponse.json({ error: 'Invalid GitHub credentials' }, { status: 401 });
    const githubToken = auth?.token;
    const vercelToken = manualVercelToken || (await getVercelToken());

    if (githubToken) {
      try {
        const octokit = new Octokit({ auth: githubToken });
        const prepared = await forgeRepository(octokit, {
          repoMode,
          existingRepoUrl,
          name: requestedName,
          description,
          isPrivate,
          template,
          addReadme,
          addCICD,
          deployVercel,
          commitMessage,
          commitPlanHash,
        });
        const repo = prepared.repository;
        const owner = repo.owner.login;
        const sanitizedName = repo.name;
        const repoUrl = repo.html_url;
        const defaultBranch = prepared.branch;
        const deploymentSha = prepared.sha;
        const pipelineCreated = addCICD;

        const vercelImportUrl = `https://vercel.com/new/import?s=${encodeURIComponent(repoUrl)}`;
        const vercelDashboardUrl = 'https://vercel.com/dashboard';
        let deployment: DeploymentState = { status: 'awaiting_setup', url: null, linked: false };
        if (deployVercel && vercelToken && ['nextjs', 'vite-react'].includes(template)) {
          try {
            const response = await fetch('https://api.vercel.com/v9/projects', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${vercelToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: sanitizedName,
                framework: template === 'nextjs' ? 'nextjs' : 'vite',
                gitRepository: { type: 'github', repo: `${owner}/${sanitizedName}` },
              }),
              signal: AbortSignal.timeout(10000),
            });
            if (response.ok || response.status === 409) {
              deployment = await getDeploymentState(
                vercelToken,
                sanitizedName,
                owner,
                sanitizedName,
              );
              if (deployment.linked && deployment.status === 'awaiting_deployment') {
                const started = await fetch('https://api.vercel.com/v13/deployments', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${vercelToken}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    name: sanitizedName,
                    project: sanitizedName,
                    target: 'production',
                    gitSource: {
                      type: 'github',
                      repoId: String(repo.id),
                      ref: defaultBranch,
                      sha: deploymentSha,
                    },
                    projectSettings: { framework: template === 'nextjs' ? 'nextjs' : 'vite' },
                  }),
                  signal: AbortSignal.timeout(15000),
                });
                deployment = started.ok
                  ? deploymentState(await started.json())
                  : { status: 'failed', linked: true, url: null };
              }
            } else deployment = { status: 'failed', url: null, linked: false };
          } catch {
            deployment = { status: 'unknown', url: null, linked: false };
          }
        }
        const { persisted: dbPersisted, id: projectId } = await persistToNeon({
          id: `proj_${randomUUID()}`,
          userId: currentUser?.id,
          name: sanitizedName,
          repoOwner: owner,
          repoName: sanitizedName,
          repoUrl,
          description: repo.description || description,
          framework: FRAMEWORK_LABELS[template] || template,
          template,
          isPrivate: repo.private,
          branch: defaultBranch,
          isLive: true,
          addCICD,
          deployVercel,
          vercelUrl: deployment.url || undefined,
          status: deployVercel ? deployment.status : 'disabled',
        });

        return NextResponse.json({
          success: true,
          mode: 'live',
          action: prepared.action,
          skippedFiles: prepared.skippedFiles,
          changedFiles: prepared.changedFiles,
          notice:
            [
              prepared.skippedFiles.length
                ? `Kept existing configuration: ${prepared.skippedFiles.join(', ')}.`
                : '',
              deployVercel && deployment.status !== 'ready'
                ? `Deployment status: ${deployment.status.replaceAll('_', ' ')}. Check Vercel for the next step.`
                : '',
              !dbPersisted
                ? 'Cloud persistence is unavailable; this repository has not been saved to your dashboard.'
                : '',
            ]
              .filter(Boolean)
              .join(' ') || undefined,
          projectId,
          dbPersisted,
          repository: {
            name: sanitizedName,
            owner,
            url: repoUrl,
            isPrivate: repo.private,
            description: repo.description || description,
            branch: defaultBranch,
          },
          deployment: deployVercel
            ? {
                provider: 'vercel',
                url: deployment.url,
                dashboardUrl: vercelDashboardUrl,
                importUrl: vercelImportUrl,
                status: deployment.status,
                autoDeploy: deployment.linked,
                linked: deployment.linked,
              }
            : null,
          pipeline: pipelineCreated
            ? {
                provider: 'github-actions',
                path: '.github/workflows/ci.yml',
                status: prepared.skippedFiles.includes('.github/workflows/ci.yml')
                  ? 'existing'
                  : 'configured',
              }
            : null,
          cliEquivalent: 'forjex forge',
        });
      } catch (ghError: any) {
        if (ghError instanceof ForgeRepositoryError)
          return NextResponse.json({ error: ghError.message }, { status: ghError.status });
        if (ghError.status === 422) {
          return NextResponse.json(
            {
              error:
                repoMode === 'new'
                  ? `Repository "${requestedName}" could not be created. It may already exist.`
                  : 'GitHub rejected the configuration update. The repository may have changed; refresh and retry.',
            },
            { status: 422 },
          );
        }
        if (ghError.status === 401) {
          return NextResponse.json(
            { error: 'GitHub token is invalid or has expired. Please re-authenticate.' },
            { status: 401 },
          );
        }
        throw ghError;
      }
    }

    return NextResponse.json({
      success: true,
      mode: 'simulation',
      dbPersisted: false,
      notice:
        repoMode === 'existing'
          ? 'Demo preview only. Connect GitHub to configure this repository. No files have been changed.'
          : 'Demo preview only. Connect GitHub to create a repository and Vercel to deploy it.',
      repository: {
        name: requestedName,
        owner: repoMode === 'existing' ? parseGitHubRepository(existingRepoUrl).owner : 'user',
        url: null,
        isPrivate,
        description,
      },
      deployment: deployVercel
        ? { provider: 'vercel', url: null, status: 'demo', autoDeploy: false, linked: false }
        : null,
      pipeline: addCICD
        ? { provider: 'github-actions', path: '.github/workflows/ci.yml', status: 'demo' }
        : null,
      cliEquivalent: 'forjex forge',
    });
  } catch (error: any) {
    if (error instanceof ForgeRepositoryError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json(
      { error: error.message || 'Failed to forge project' },
      { status: 500 },
    );
  }
}
