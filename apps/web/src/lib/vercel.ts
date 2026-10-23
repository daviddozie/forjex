export type DeploymentStatus =
  | 'ready'
  | 'building'
  | 'queued'
  | 'failed'
  | 'canceled'
  | 'awaiting_deployment'
  | 'awaiting_setup'
  | 'unknown'
  | 'disabled'
  | 'demo';
export interface DeploymentState {
  status: DeploymentStatus;
  url: string | null;
  linked: boolean;
}

export function deploymentState(deployment?: {
  state?: string;
  readyState?: string;
  url?: string | null;
}): DeploymentState {
  const state = deployment?.readyState || deployment?.state;
  const status: DeploymentStatus =
    state === 'READY'
      ? 'ready'
      : state === 'BUILDING'
        ? 'building'
        : state === 'QUEUED' || state === 'INITIALIZING'
          ? 'queued'
          : state === 'ERROR'
            ? 'failed'
            : state === 'CANCELED'
              ? 'canceled'
              : 'awaiting_deployment';
  const host = deployment?.url;
  return {
    status,
    linked: true,
    url:
      status === 'ready' && host && /^[a-z0-9.-]+\.vercel\.app$/i.test(host)
        ? `https://${host}`
        : null,
  };
}

export async function getDeploymentState(
  token: string,
  name: string,
  owner: string,
  repo: string,
): Promise<DeploymentState> {
  const headers = { Authorization: `Bearer ${token}` };
  try {
    const response = await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(name)}`, {
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      return {
        status: response.status === 404 ? 'awaiting_setup' : 'unknown',
        url: null,
        linked: false,
      };
    const project = await response.json();
    const link = project.link;
    if (
      link?.type !== 'github' ||
      link.org?.toLowerCase() !== owner.toLowerCase() ||
      link.repo?.toLowerCase() !== repo.toLowerCase()
    ) {
      return { status: 'awaiting_setup', url: null, linked: false };
    }
    const query = new URLSearchParams({ projectId: project.id, target: 'production', limit: '1' });
    const deployments = await fetch(`https://api.vercel.com/v7/deployments?${query}`, {
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (!deployments.ok) return { status: 'unknown', url: null, linked: true };
    const data = await deployments.json();
    return deploymentState(data.deployments?.[0]);
  } catch {
    return { status: 'unknown', url: null, linked: false };
  }
}
