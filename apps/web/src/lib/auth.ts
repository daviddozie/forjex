import { cookies } from 'next/headers';
import { Octokit } from '@octokit/rest';
import { getDb, isDbConfigured } from '@/db';
import { users } from '@/db/schema';
import { eq, or, and, isNull } from 'drizzle-orm';

export interface CloudUser {
  id?: string;
  username: string;
  name?: string;
  avatarUrl?: string;
  email?: string;
  githubConnected: boolean;
  vercelConnected: boolean;
  source?: 'cookie' | 'header';
}

export async function getGitHubToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const tokenFromCookie = cookieStore.get('forjex_github_token')?.value;
    if (tokenFromCookie) return tokenFromCookie;
  } catch {}

  return null;
}

export async function getVercelToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const tokenFromCookie = cookieStore.get('forjex_vercel_token')?.value;
    if (tokenFromCookie) return tokenFromCookie;
  } catch {}

  return null;
}

export async function getCurrentUser(): Promise<CloudUser | null> {
  return (await authenticateRequest())?.user || null;
}

export async function authenticateRequest(request?: Request) {
  const authorization = request?.headers.get('authorization');
  const token = authorization
    ? authorization.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : null
    : await getGitHubToken();
  if (!token) return null;
  const verified = await verifyGitHubToken(token);
  if (!verified.valid || !verified.username || !verified.id) return null;

  const stored = await upsertUserInDatabase({
    githubId: verified.id,
    githubUsername: verified.username,
    name: verified.name,
    email: verified.email,
    avatarUrl: verified.avatarUrl,
  });
  const user: CloudUser = {
    id: stored?.id || verified.id,
    username: verified.username,
    name: verified.name,
    email: verified.email,
    avatarUrl: verified.avatarUrl,
    githubConnected: true,
    vercelConnected: Boolean(await getVercelToken()),
    source: authorization ? 'header' : 'cookie',
  };
  return { user, token };
}

export async function upsertUserInDatabase(userData: {
  id?: string;
  githubId?: string;
  githubUsername: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
}) {
  if (!isDbConfigured()) return null;

  const { db } = getDb();
  if (!db) return null;

  try {
    const existing = await db.query.users.findFirst({
      where: (u) =>
        userData.githubId
          ? or(
              eq(u.githubId, userData.githubId),
              and(isNull(u.githubId), eq(u.githubUsername, userData.githubUsername)),
            )
          : eq(u.githubUsername, userData.githubUsername),
    });

    const userId =
      existing?.id || userData.id || `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    if (existing) {
      await db
        .update(users)
        .set({
          githubId: userData.githubId || existing.githubId,
          githubUsername: userData.githubUsername,
          name: userData.name || existing.name,
          email: userData.email || existing.email,
          avatarUrl: userData.avatarUrl || existing.avatarUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id));

      return { ...existing, ...userData, id: existing.id };
    } else {
      const newUser = {
        id: userId,
        githubId: userData.githubId || null,
        githubUsername: userData.githubUsername,
        name: userData.name || userData.githubUsername,
        email: userData.email || null,
        avatarUrl: userData.avatarUrl || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.insert(users).values(newUser);
      return newUser;
    }
  } catch (error: any) {
    console.warn('Could not upsert user in Neon DB:', error.message);
    return null;
  }
}

export async function verifyGitHubToken(token: string): Promise<{
  valid: boolean;
  id?: string;
  username?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  error?: string;
}> {
  try {
    const octokit = new Octokit({ auth: token, request: { timeout: 10000 } });
    const { data } = await octokit.users.getAuthenticated();
    return {
      valid: true,
      id: data.id.toString(),
      username: data.login,
      name: data.name || data.login,
      email: data.email || undefined,
      avatarUrl: data.avatar_url,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Invalid GitHub token or missing permissions',
    };
  }
}

export async function verifyVercelToken(token: string): Promise<{
  valid: boolean;
  username?: string;
  email?: string;
  error?: string;
}> {
  try {
    const res = await fetch('https://api.vercel.com/v2/user', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Vercel token invalid (HTTP ${res.status})`);
    }
    const data = await res.json();
    return {
      valid: true,
      username: data.user?.username || data.user?.name,
      email: data.user?.email,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Invalid Vercel token',
    };
  }
}
