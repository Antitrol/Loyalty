import { config } from '@/globals/config';
import { getSession, setSession } from '@/lib/session';
import { validateRequest } from '@/lib/validation';
import { OAuthAPI } from '@ikas/admin-api-client';
import moment from 'moment';
import { getIkas, getRedirectUri } from '@/helpers/api-helpers';
import { JwtHelpers } from '@/helpers/jwt-helpers';
import { TokenHelpers } from '@/helpers/token-helpers';
import { AuthToken } from '@/models/auth-token';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';

const callbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional(),
  signature: z.string().optional(),
});

/**
 * Handles the OAuth callback for Ikas.
 * Validates code signature, optionally validates state for CSRF protection,
 * exchanges the authorization code for tokens, updates session, and redirects.
 */
export async function GET(request: NextRequest) {
  try {
    // Parse the request URL to extract query parameters
    const url = new URL(request.url as string, `http://${request.headers.get('host')}`);
    const { searchParams } = url;

    // Validate the incoming request parameters (code, state, signature)
    const validation = validateRequest(callbackSchema, {
      code: searchParams.get('code'),
      state: searchParams.get('state') || undefined,
      signature: searchParams.get('signature') || undefined,
    });

    if (!validation.success) {
      // Invalid parameters
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { code, state, signature } = validation.data;

    // Validate code signature
    if (signature && !TokenHelpers.validateCodeSignature(code, signature, config.oauth.clientSecret!)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Retrieve session and optionally check state for CSRF protection
    const session = await getSession();
    if (state && session.state && session.state !== state) {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    // Hardcode URI to rule out Env var issues
    const computedRedirectUri = 'https://loyalty-8isa.vercel.app/api/oauth/callback/ikas';

    // Debug logging - will appear in Vercel logs
    console.log('=== OAuth Token Exchange Debug ===');
    console.log('code:', code);
    console.log('client_id:', config.oauth.clientId);
    console.log('client_secret exists:', !!config.oauth.clientSecret);
    console.log('client_secret length:', config.oauth.clientSecret?.length);
    console.log('redirect_uri:', computedRedirectUri);
    console.log('storeName from session:', session.storeName);
    console.log('=================================');

    // Exchange authorization code for access/refresh tokens
    const tokenResponse = await OAuthAPI.getTokenWithAuthorizationCode(
      {
        code: code as string,
        client_id: config.oauth.clientId!,
        client_secret: config.oauth.clientSecret!,
        redirect_uri: computedRedirectUri,
      },
      {
        storeName: (session.storeName || 'api') as string,
      },
    );

    if (!tokenResponse.data) {
      // Failed to get token
      console.error("Token Exchange Failed:", JSON.stringify(tokenResponse));
      return NextResponse.json({
        error: {
          statusCode: 500,
          message: 'Failed to retrieve token',
          details: tokenResponse,
          usedRedirectUri: computedRedirectUri,
          usedClientId: config.oauth.clientId,
          debug: {
            clientSecretExists: !!config.oauth.clientSecret,
            clientSecretLength: config.oauth.clientSecret?.length,
          }
        }
      }, { status: 500 });
    }

    // Prepare a temporary token object
    const tokenTemp: Partial<AuthToken> = {
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token,
      tokenType: tokenResponse.data.token_type,
      expiresIn: tokenResponse.data.expires_in,
      expireDate: '',
      scope: tokenResponse.data.scope,
      salesChannelId: null,
    };

    // Create an Ikas client with the new token
    const ikas = getIkas(tokenTemp as AuthToken);

    // Fetch merchant and authorized app details
    const [merchantResponse, authorizedAppResponse] = await Promise.all([ikas.queries.getMerchant(), ikas.queries.getAuthorizedApp()]);

    // Validate responses
    if (
      !merchantResponse.isSuccess ||
      !merchantResponse.data ||
      !authorizedAppResponse.isSuccess ||
      !authorizedAppResponse.data ||
      !authorizedAppResponse.data.getAuthorizedApp ||
      !merchantResponse.data.getMerchant
    ) {
      console.error("API Fetch Failed:", JSON.stringify({ merchant: merchantResponse, app: authorizedAppResponse }));
      return NextResponse.json(
        {
          error: {
            statusCode: 403,
            message: 'Unable to retrieve merchant or authorized app',
            debug: { merchantSuccess: merchantResponse.isSuccess, appSuccess: authorizedAppResponse.isSuccess }
          },
        },
        { status: 403 },
      );
    }

    // Extract necessary IDs and calculate token expiration date
    const authorizedAppId = authorizedAppResponse.data.getAuthorizedApp.id!;
    const merchantId = merchantResponse.data.getMerchant.id!;
    const expireDate = moment().add(tokenResponse.data.expires_in, 'seconds').toDate().toISOString();

    // Build the final AuthToken object
    const token: AuthToken = {
      ...tokenTemp,
      id: authorizedAppId,
      authorizedAppId,
      merchantId,
      expireDate,
      salesChannelId: authorizedAppResponse.data.getAuthorizedApp.salesChannelId || null,
    } as AuthToken;

    // Store the token for future use
    console.log("Saving token to DB...");
    await AuthTokenManager.put(token);
    console.log("Token saved successfully.");

    // Update session with new merchant and app IDs, clear state, and set expiration
    session.expiresAt = new Date(Date.now() + 3600 * 1000);
    session.merchantId = merchantId;
    session.authorizedAppId = authorizedAppId;
    delete session.state;

    // Save updated session
    await setSession(session);

    // Create a JWT for the merchant and authorized app
    const jwtToken = JwtHelpers.createToken(merchantId, authorizedAppId);

    // Build the redirect URL for the admin panel
    const redirectUrl = `${config.adminUrl!.replace(
      '{storeName}',
      merchantResponse.data.getMerchant.storeName as string,
    )}/authorized-app/${authorizedAppId}`;

    // Build the callback URL with token and redirect info
    const callbackUrl = new URLSearchParams();
    callbackUrl.set('token', jwtToken);
    callbackUrl.set('redirectUrl', redirectUrl);
    callbackUrl.set('authorizedAppId', authorizedAppId);

    // Redirect the user to the callback URL
    // Hardcoded base URL to prevent Invalid URL error if Env var is missing
    const baseUrl = 'https://loyalty-8isa.vercel.app';
    return NextResponse.redirect(new URL(`/callback?${callbackUrl.toString()}`, baseUrl));
  } catch (error: any) {
    // Log and return error response
    console.error('Callback error:', error);

    // Log Axios response data if available (this contains the real error reason from Ikas)
    if (error.response && error.response.data) {
      console.error('Ikas API Error Response:', JSON.stringify(error.response.data, null, 2));
    }

    return NextResponse.json({
      error: {
        statusCode: error.response?.status || 500,
        message: 'Callback failed: ' + error.message,
        apiError: error.response?.data,
        usedRedirectUri: 'https://loyalty-8isa.vercel.app/api/oauth/callback/ikas', // Hardcoded here too for clarity
        stack: error.stack
      }
    }, { status: error.response?.status || 500 });
  }
}
