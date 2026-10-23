import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({
      authenticated: false,
      user: null,
    });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      avatarUrl: user.avatarUrl,
      email: user.email,
      githubConnected: user.githubConnected,
      vercelConnected: user.vercelConnected,
    },
  });
}
