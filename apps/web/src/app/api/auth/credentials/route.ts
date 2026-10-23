import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getGitHubToken,
  getVercelToken,
  verifyGitHubToken,
  verifyVercelToken,
  upsertUserInDatabase,
} from '@/lib/auth';

export async function GET() {
  const cookieStore = await cookies();
  const githubToken = await getGitHubToken();
  const vercelToken = await getVercelToken();

  let githubUser: any = null;
  if (githubToken) {
    const verified = await verifyGitHubToken(githubToken);
    if (verified.valid) {
      githubUser = {
        username: verified.username,
        name: verified.name,
        avatarUrl: verified.avatarUrl,
      };
    }
  }

  let vercelUser: any = null;
  if (vercelToken) {
    const verified = await verifyVercelToken(vercelToken);
    if (verified.valid) {
      vercelUser = {
        username: verified.username,
        email: verified.email,
      };
    }
  }

  return NextResponse.json({
    github: {
      connected: !!githubUser,
      user: githubUser,
      source: cookieStore.has('forjex_github_token') ? 'cookie' : 'none',
    },
    vercel: {
      connected: !!vercelUser,
      user: vercelUser,
      source: cookieStore.has('forjex_vercel_token') ? 'cookie' : 'none',
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { githubToken, vercelToken } = body;
    const response = NextResponse.json({ success: true });
    const previousToken = await getGitHubToken();

    if (githubToken) {
      const verification = await verifyGitHubToken(githubToken);
      if (!verification.valid || !verification.username) {
        return NextResponse.json(
          { error: verification.error || 'Invalid GitHub token' },
          { status: 400 },
        );
      }

      if (previousToken && previousToken !== githubToken && !vercelToken)
        response.cookies.delete('forjex_vercel_token');

      const dbUser = await upsertUserInDatabase({
        githubId: verification.id,
        githubUsername: verification.username,
        name: verification.name,
        email: verification.email,
        avatarUrl: verification.avatarUrl,
      });

      const userId = dbUser?.id || verification.id || verification.username;

      response.cookies.set('forjex_github_token', githubToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });

      response.cookies.set('forjex_user_id', userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });

      response.cookies.set('forjex_github_username', verification.username, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });

      if (verification.name) {
        response.cookies.set('forjex_github_name', verification.name, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        });
      }

      if (verification.avatarUrl) {
        response.cookies.set('forjex_github_avatar', verification.avatarUrl, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        });
      }
    }

    if (vercelToken) {
      const verification = await verifyVercelToken(vercelToken);
      if (!verification.valid) {
        return NextResponse.json(
          { error: verification.error || 'Invalid Vercel token' },
          { status: 400 },
        );
      }

      response.cookies.set('forjex_vercel_token', vercelToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
    }

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to save credentials' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('target') || 'all';
  const response = NextResponse.json({ success: true });

  if (target === 'github' || target === 'all') {
    response.cookies.delete('forjex_github_token');
    response.cookies.delete('forjex_user_id');
    response.cookies.delete('forjex_github_username');
    response.cookies.delete('forjex_github_name');
    response.cookies.delete('forjex_github_avatar');
  }

  if (target === 'vercel' || target === 'all') {
    response.cookies.delete('forjex_vercel_token');
  }

  return response;
}
