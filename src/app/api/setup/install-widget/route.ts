
import { NextResponse } from 'next/server';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { getIkas } from '@/helpers/api-helpers';
import { gql } from 'graphql-request';

export async function POST(req: Request) {
    try {
        const tokens = await AuthTokenManager.list();
        if (!tokens.length) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const client = getIkas(tokens[0]);

        // Check if script already exists (optional, but good practice to avoid duplicates)
        // For now, we just attempt to create.

        const mutation = gql`
      mutation CreateLoyaltyWidgetScript($input: StorefrontJSScriptInput!) {
        createStorefrontJSScript(input: $input) {
          storefrontJSScript {
            id
            name
          }
        }
      }
    `;

        // Script to inject
        // We inject a loader script that appends our widget to the body.
        // In production, this should point to the deployed URL.
        const scriptContent = `
      (function() {
        var script = document.createElement('script');
        script.src = 'https://my-admin-app.vercel.app/loyalty-widget.js'; // Replace with actual Vercel URL or make dynamic
        script.async = true;
        document.body.appendChild(script);
      })();
    `;

        const variables = {
            input: {
                name: "Ikas Loyalty Widget",
                scriptSource: scriptContent,
                location: "HEAD" // or BODY_END
            }
        };

        const res = await client.query<any>({ query: mutation, variables });

        // Check for GraphQL errors in response if the client doesn't throw automatically
        if (res.errors) {
            throw new Error(JSON.stringify(res.errors));
        }

        return NextResponse.json({ success: true, data: res.data });

    } catch (error: any) {
        console.error('Failed to install widget:', error);
        return NextResponse.json({ error: error.message || "Installation failed" }, { status: 500 });
    }
}
