import { cookies } from 'next/headers';
import { safeReturnTo, validOAuthState } from '@/lib/oauth-state';
import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { upsertUserInDatabase } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const store = await cookies();
  const returnTo = safeReturnTo(store.get('forjex_oauth_return')?.value || null);
  const redirect = (key: string, value: string) => {
    const url = new URL(returnTo, origin);
    url.searchParams.set(key, value);
    const response = NextResponse.redirect(url);
    response.cookies.delete('forjex_oauth_state');
    response.cookies.delete('forjex_oauth_return');
    return response;
  };
  if (!validOAuthState(searchParams.get('state'), store.get('forjex_oauth_state')?.value))
    return redirect('error', 'invalid_oauth_state');

  if (!code) {
    return redirect('error', 'missing_code');
  }

  const clientId = process.env.GITHUB_CLIENT_ID || 'Ov23liRqj5mMaAS6fFiP';
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  try {
    if (!clientSecret) {
      return redirect('auth', 'manual');
    }

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error(tokenData.error_description || 'Failed to exchange code');
    }

    const token = tokenData.access_token;
    const octokit = new Octokit({ auth: token });
    const { data: user } = await octokit.users.getAuthenticated();

    const dbUser = await upsertUserInDatabase({
      githubId: user.id.toString(),
      githubUsername: user.login,
      name: user.name || user.login,
      email: user.email || undefined,
      avatarUrl: user.avatar_url,
    });

    const response = redirect('auth', 'success');

    response.cookies.delete('forjex_vercel_token');

    response.cookies.set('forjex_github_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    {
      response.cookies.set('forjex_user_id', dbUser?.id || user.id.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
    }

    response.cookies.set('forjex_github_username', user.login, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    if (user.name) {
      response.cookies.set('forjex_github_name', user.name, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
    }

    if (user.avatar_url) {
      response.cookies.set('forjex_github_avatar', user.avatar_url, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
    }

    return response;
  } catch (error: any) {
    console.error('OAuth Callback Error:', error);
    return redirect('error', 'oauth_failed');
  }
}
