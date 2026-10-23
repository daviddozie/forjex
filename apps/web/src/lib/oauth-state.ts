import { timingSafeEqual } from 'node:crypto';

export function safeReturnTo(value: string | null): string {
  if (!value?.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value))
    return '/dashboard';
  return ['/dashboard', '/forge', '/login', '/auth/cli'].includes(value.split(/[?#]/)[0])
    ? value
    : '/dashboard';
}

export function validOAuthState(received: string | null, expected?: string): boolean {
  if (
    !received ||
    !expected ||
    !/^[a-f0-9]{64}$/.test(received) ||
    !/^[a-f0-9]{64}$/.test(expected)
  )
    return false;
  return timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}
