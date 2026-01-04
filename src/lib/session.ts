// this file is a wrapper with defaults to be used in both API routes and `getServerSideProps` functions
import { config } from '@/globals/config';
import { TOKEN_COOKIE } from '@/globals/constants';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  merchantId?: string;
  authorizedAppId?: string;
  state?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  [key: string]: any;
}

export async function getSession(): Promise<SessionData> {
  const password = config.cookiePassword || process.env.SECRET_COOKIE_PASSWORD;

  // Debug logging
  console.log('🔐 Session Password Check:');
  console.log('  - config.cookiePassword:', !!config.cookiePassword);
  console.log('  - process.env.SECRET_COOKIE_PASSWORD:', !!process.env.SECRET_COOKIE_PASSWORD);
  console.log('  - Final password exists:', !!password);

  // Iron-session requires password to be at least 32 characters
  // If missing, use a fallback (NOT SECURE for production, but better than crashing)
  const finalPassword = password || 'kJ9mP2xL5nQ8rT4wY7uB3gNH6zC1vN0aE-TEMP-FALLBACK';

  if (!password) {
    console.warn('⚠️ WARNING: SECRET_COOKIE_PASSWORD is not set! Using temporary fallback. Set this environment variable in Vercel!');
  }

  const session = await getIronSession(await cookies(), {
    password: finalPassword,
    cookieName: TOKEN_COOKIE || '_session_data'
  });
  return session;
}

export async function setSession(data: SessionData) {
  const session = await getSession();
  Object.assign(session, data);
  await session.save();
}
