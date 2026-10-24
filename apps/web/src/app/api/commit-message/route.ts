import { validAIModel, isAIProvider, AI_PROVIDERS } from '../../../../../../src/ai/settings';
import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { authenticateRequest } from '@/lib/auth';
import {
  prepareForgeChanges,
  commitPlanHash,
  parseGitHubRepository,
  ForgeRepositoryError,
  type ForgeRepositoryOptions,
} from '@/lib/forge-repository';
import { generateAICommitMessage } from '../../../../../../src/ai/commit-message';

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth)
      return NextResponse.json(
        { error: 'Connect GitHub before generating a message.' },
        { status: 401 },
      );
    let parsedBody: unknown;
    try {
      parsedBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }
    if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody))
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    const body = parsedBody as Record<string, unknown>;
    if (
      (body.repoMode !== 'new' && body.repoMode !== 'existing') ||
      typeof body.template !== 'string' ||
      !['nextjs', 'vite-react', 'python-fastapi', 'go-api', 'rust-app'].includes(body.template) ||
      typeof body.name !== 'string' ||
      (body.existingRepoUrl !== undefined && typeof body.existingRepoUrl !== 'string') ||
      (body.provider !== undefined && typeof body.provider !== 'string') ||
      (body.model !== undefined && typeof body.model !== 'string') ||
      ['isPrivate', 'addReadme', 'addCICD', 'deployVercel'].some(
        (field) => body[field] !== undefined && typeof body[field] !== 'boolean',
      )
    ) {
      return NextResponse.json({ error: 'Invalid project configuration.' }, { status: 400 });
    }
    const provider = body.provider ?? process.env.FORJEX_AI_PROVIDER ?? 'openai';
    if (!isAIProvider(provider))
      return NextResponse.json({ error: 'Unsupported AI provider.' }, { status: 400 });
    const model =
      body.model ||
      (provider === (process.env.FORJEX_AI_PROVIDER || 'openai')
        ? process.env.FORJEX_AI_MODEL
        : '') ||
      AI_PROVIDERS[provider].defaultModel;
    if (!validAIModel(model))
      return NextResponse.json(
        { error: 'Enter a valid model ID for the selected provider.' },
        { status: 400 },
      );
    // Bring your own key: no shared billing endpoint or persisted browser credentials.
    if (typeof body.apiKey !== 'string' || !body.apiKey.trim() || body.apiKey.length > 512) {
      return NextResponse.json(
        {
          error: `Enter your ${AI_PROVIDERS[provider].label} API key. It is used for this request only.`,
        },
        { status: 400 },
      );
    }
    const options: ForgeRepositoryOptions = {
      repoMode: body.repoMode,
      existingRepoUrl: body.existingRepoUrl as string | undefined,
      name: body.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-'),
      description: '',
      isPrivate: Boolean(body.isPrivate),
      template: body.template,
      addReadme: body.addReadme !== false,
      addCICD: body.addCICD !== false,
      deployVercel: body.deployVercel !== false,
    };
    if (!options.name || options.name.length > 100)
      return NextResponse.json({ error: 'Enter a valid repository name.' }, { status: 400 });
    const client = new Octokit({ auth: auth.token });
    let owner = auth.user.username;
    let repo = options.name;
    let branch = 'main';
    if (options.repoMode === 'existing') {
      const parsed = parseGitHubRepository(options.existingRepoUrl);
      const { data } = await client.repos.get(parsed);
      if (!data.permissions?.push && !data.permissions?.admin && !data.permissions?.maintain)
        throw new ForgeRepositoryError('Write access is required.', 403);
      owner = data.owner.login;
      repo = data.name;
      branch = data.default_branch;
    }
    const { additions } = await prepareForgeChanges(client, options, owner, repo, branch);
    if (!additions.length)
      return NextResponse.json(
        { error: 'No new configuration to commit. The existing files will be preserved.' },
        { status: 409 },
      );
    const generated = await generateAICommitMessage(
      additions.map((file) => ({
        path: file.path,
        content: file.content,
        binary: file.encoding === 'base64',
      })),
      { apiKey: body.apiKey, provider, model },
    );
    return NextResponse.json(
      { ...generated, commitPlanHash: commitPlanHash(additions, options) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    if (error instanceof ForgeRepositoryError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    // Never expose upstream error bodies, API keys, or submitted source content.
    return NextResponse.json(
      {
        error:
          'Could not generate a message. Check your key, access, and repository settings, or enter a message manually.',
      },
      { status: 502 },
    );
  }
}
