import { config } from '@/globals/config';
import { getRedirectUri } from '@/helpers/api-helpers';
import { getSession, setSession } from '@/lib/session';
import { validateRequest } from '@/lib/validation';
import { OAuthAPI } from '@ikas/admin-api-client';
import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';

// Validation schemas
const authorizeSchema = z.object({
  storeName: z.string().min(1, 'storeName is required'),
});

/**
 * Handles the OAuth authorization initiation for Ikas.
 * Validates the incoming request, generates a secure state, updates the session,
 * and redirects the user to the Ikas OAuth authorization URL.
 */
export async function GET(request: NextRequest) {
  try {
    // Parse the request URL to extract query parameters
    const url = new URL(request.url as string, `http://${request.headers.get('host')}`);
    const { searchParams } = url;

    // Validate the incoming request parameters (expects storeName)
    const validation = validateRequest(authorizeSchema, {
      storeName: searchParams.get('storeName'),
    });

    if (!validation.success) {
      // If validation fails, return a 400 error with details
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { storeName } = validation.data;

    // Check if required environment variables are present
    if (!config.oauth.clientId) {
      return NextResponse.json({
        error: 'NEXT_PUBLIC_CLIENT_ID environment variable is not set',
        debug: {
          clientId: config.oauth.clientId,
          clientSecret: !!config.oauth.clientSecret,
          deployUrl: process.env.NEXT_PUBLIC_DEPLOY_URL,
          allEnvVars: {
            NEXT_PUBLIC_CLIENT_ID: !!process.env.NEXT_PUBLIC_CLIENT_ID,
            CLIENT_SECRET: !!process.env.CLIENT_SECRET,
            NEXT_PUBLIC_DEPLOY_URL: !!process.env.NEXT_PUBLIC_DEPLOY_URL,
            NEXT_PUBLIC_GRAPH_API_URL: !!process.env.NEXT_PUBLIC_GRAPH_API_URL,
          }
        }
      }, { status: 500 });
    }

    // Generate a random state string for CSRF protection
    const state = Math.random().toFixed(16);

    // Retrieve the current session and update it with state and storeName
    const session = await getSession();
    session.state = state;
    session.storeName = storeName;

    // Save the updated session before redirecting
    await setSession(session);

    // Generate the base OAuth URL for the given store
    const oauthBaseUrl = OAuthAPI.getOAuthUrl({ storeName });

    // Get redirect URI
    const redirectUri = getRedirectUri(request.headers.get('host')!);

    // Construct the full Ikas OAuth authorize URL with required query parameters
    const authorizeUrl =
      `${oauthBaseUrl}/authorize` +
      `?client_id=${encodeURIComponent(config.oauth.clientId!)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(config.oauth.scope)}` +
      `&state=${encodeURIComponent(state)}`;

    // Debug: Log the authorize URL and client_id
    console.log('DEBUG client_id:', config.oauth.clientId);
    console.log('DEBUG redirect_uri:', redirectUri);
    console.log('DEBUG authorizeUrl:', authorizeUrl);

    // Redirect the user to the Ikas OAuth authorization page
    return NextResponse.redirect(authorizeUrl);
  } catch (error) {
    // Log and return a 500 error if something goes wrong
    console.error('Authorize error:', error);
    return NextResponse.json({
      error: 'Authorization failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      debug: {
        clientIdConfigured: !!config.oauth.clientId,
        clientSecretConfigured: !!config.oauth.clientSecret,
        deployUrlConfigured: !!process.env.NEXT_PUBLIC_DEPLOY_URL,
      }
    }, { status: 500 });
  }
}
