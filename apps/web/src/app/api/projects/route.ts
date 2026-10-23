import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { isDbConfigured, getDb } from '@/db';
import { projects, deployments } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { authenticateRequest, getVercelToken } from '@/lib/auth';
import { getDeploymentState } from '@/lib/vercel';
import { ownedProjects, ownsProject } from '@/lib/project-policy';

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth)
    return NextResponse.json({ error: 'Sign in to view projects', projects: [] }, { status: 401 });
  const { user, token: githubToken } = auth;
  const configured = isDbConfigured();

  if (!configured) {
    return NextResponse.json({
      dbConnected: false,
      authenticated: false,
      projects: [],
      message: 'Neon PostgreSQL not configured.',
    });
  }

  const { db } = getDb();
  if (!db) {
    return NextResponse.json({
      dbConnected: false,
      authenticated: false,
      projects: [],
      error: 'Failed to connect to Neon PostgreSQL.',
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const pruneRequested = searchParams.get('prune') === 'true';

    const dbProjects = await db.query.projects.findMany({
      where: ownedProjects(user),
      orderBy: [desc(projects.createdAt)],
      with: {
        deployments: true,
      },
    });

    let octokit: Octokit | null = null;
    if (githubToken) {
      try {
        octokit = new Octokit({ auth: githubToken });
      } catch {}
    }

    const verifiedProjects = await Promise.all(
      dbProjects.map(async (p) => {
        let repoExists = true;
        if (octokit && p.isLive && p.repoOwner && p.repoName) {
          try {
            await octokit.repos.get({
              owner: p.repoOwner,
              repo: p.repoName,
            });
          } catch (err: any) {
            if (err.status === 404) {
              repoExists = false;
            }
          }
        }
        return {
          ...p,
          repoExists,
        };
      }),
    );

    const activeList = pruneRequested
      ? verifiedProjects.filter((p) => p.repoExists)
      : verifiedProjects;

    const vercelToken = request.headers.get('x-forjex-vercel-token') || (await getVercelToken());
    const formattedProjects = await Promise.all(
      activeList.map(async (p) => {
        const deployment = !p.isLive
          ? { status: 'demo', url: null }
          : !p.deployVercel
            ? { status: 'disabled', url: null }
            : vercelToken
              ? await getDeploymentState(vercelToken, p.name, p.repoOwner, p.repoName)
              : { status: 'unknown', url: null };
        return {
          id: p.id,
          name: p.name,
          repo: `${p.repoOwner}/${p.repoName}`,
          deploymentUrl: deployment.url,
          framework: p.framework,
          status: !p.repoExists ? ('deleted' as const) : deployment.status,
          updatedAt: p.updatedAt
            ? new Date(p.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            : 'just now',
          branch: p.branch,
          isLive: p.isLive && p.repoExists,
          repoExists: p.repoExists,
          addCICD: p.addCICD,
          deployVercel: p.deployVercel,
          createdAt: p.createdAt,
        };
      }),
    );

    return NextResponse.json({
      dbConnected: true,
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
      },
      projects: formattedProjects,
      count: formattedProjects.filter((p) => p.repoExists !== false).length,
      hasDeletedRepos: formattedProjects.some((p) => p.repoExists === false),
    });
  } catch (error: any) {
    console.warn('Neon PostgreSQL project query warning:', error.message);
    return NextResponse.json({
      dbConnected: true,
      authenticated: true,
      projects: [],
      warning: error.message || 'Database tables may not be pushed yet.',
    });
  }
}

export async function DELETE(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth) return NextResponse.json({ error: 'Sign in to delete projects' }, { status: 401 });
  const { user, token: githubToken } = auth;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const pruneDeleted = searchParams.get('pruneDeleted') === 'true';

    const { db, isConfigured } = getDb();
    if (!isConfigured || !db) {
      return NextResponse.json({
        success: true,
        message: 'Project removed locally.',
      });
    }

    if (pruneDeleted) {
      const octokit = new Octokit({ auth: githubToken });
      const userProjects = await db.query.projects.findMany({
        where: ownedProjects(user),
      });

      const prunedIds: string[] = [];
      for (const p of userProjects) {
        try {
          await octokit.repos.get({ owner: p.repoOwner, repo: p.repoName });
        } catch (err: any) {
          if (err.status === 404) {
            await db.delete(projects).where(eq(projects.id, p.id));
            prunedIds.push(p.id);
          }
        }
      }

      return NextResponse.json({
        success: true,
        prunedCount: prunedIds.length,
        prunedIds,
      });
    }

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const target = await db.query.projects.findFirst({
      where: eq(projects.id, id),
    });

    if (!target) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!ownsProject(user, target)) {
      return NextResponse.json({ error: 'Unauthorized to delete this project' }, { status: 403 });
    }

    await db.delete(projects).where(eq(projects.id, id));

    return NextResponse.json({
      success: true,
      deletedId: id,
      message: 'Project deleted successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete project' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth) return NextResponse.json({ error: 'Sign in to sync projects' }, { status: 401 });
  const { user } = auth;
  try {
    const body = await request.json();
    const {
      name,
      repoOwner,
      repoName,
      repoUrl,
      description,
      framework = 'Next.js 15',
      template = 'nextjs',
      branch = 'main',
      addCICD = true,
      deployVercel = true,
      vercelUrl,
    } = body;

    if (
      ![name, repoOwner, repoName, repoUrl].every(
        (value) => typeof value === 'string' && value.trim(),
      )
    ) {
      return NextResponse.json(
        { error: 'name, repoOwner, repoName, and repoUrl are required' },
        { status: 400 },
      );
    }

    const octokit = new Octokit({ auth: auth.token });
    const { data: repository } = await octokit.repos.get({ owner: repoOwner, repo: repoName });
    if (
      repository.owner.login.toLowerCase() !== user.username.toLowerCase() &&
      !repository.permissions?.push
    ) {
      return NextResponse.json(
        { error: 'You need write access to sync this repository' },
        { status: 403 },
      );
    }
    const { db, isConfigured } = getDb();
    const projectId = `proj_${Date.now()}`;

    if (isConfigured && db) {
      await db.insert(projects).values({
        id: projectId,
        userId: user.id,
        name,
        repoOwner: repository.owner.login,
        repoName: repository.name,
        repoUrl: repository.html_url,
        description,
        framework,
        template,
        isPrivate: repository.private,
        isLive: true,
        branch,
        status: deployVercel ? 'unknown' : 'disabled',
        addCICD,
        deployVercel,
        vercelUrl,
      });

      if (deployVercel && vercelUrl) {
        await db.insert(deployments).values({
          id: `dep_${Date.now()}`,
          projectId,
          provider: 'vercel',
          url: vercelUrl,
          status: 'unknown',
          environment: 'production',
        });
      }
    }

    return NextResponse.json({
      success: true,
      id: projectId,
      persisted: Boolean(isConfigured && db),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 },
    );
  }
}
