
import { NextResponse } from 'next/server';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { getIkas } from '@/helpers/api-helpers';
import { gql } from 'graphql-request';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const tokens = await AuthTokenManager.list();
        if (!tokens.length) {
            return NextResponse.json({ error: 'Unauthorized', categories: [] }, { status: 401 });
        }
        const client = getIkas(tokens[0]);

        const query = gql`
      query ListCategory {
        listCategory {
          data {
            id
            name
          }
        }
      }
    `;

        const res = await client.query<any>({ query });
        const categories = res.data?.listCategory?.data || [];

        return NextResponse.json(categories);
    } catch (error: any) {
        console.error('Failed to fetch categories:', error);
        return NextResponse.json({ error: error.message, categories: [] }, { status: 500 });
    }
}
