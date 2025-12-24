
import { NextRequest, NextResponse } from 'next/server';
import { getIkas } from '@/helpers/api-helpers';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { getLoyaltyProfile, updateLoyaltyBalance } from '@/lib/loyalty/attributes';
import { NotificationService } from '@/lib/notifications/service';
import { LocalDB } from '@/lib/db/local-db';
import { ikasAdminGraphQLAPIClient } from '@/lib/ikas-client/generated/graphql';
import { GET_CUSTOMER_LOYALTY_DATA, UPDATE_CUSTOMER_TAGS } from '@/lib/graphql/loyalty';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { referrerId, refereeId } = body;

        if (!referrerId || !refereeId) {
            return NextResponse.json({ success: false, message: 'Missing referrerId or refereeId' }, { status: 400 });
        }

        if (referrerId === refereeId) {
            return NextResponse.json({ success: false, message: 'You cannot refer yourself' }, { status: 400 });
        }

        const tokens = await AuthTokenManager.list();
        if (tokens.length === 0) return NextResponse.json({ error: 'No auth' }, { status: 500 });
        const client = getIkas(tokens[0]);

        // 1. Check Referee Profile - Has he been referred before?
        // We'll trust the presence of a "Loyalty:ReferredBy:" tag or check if he has existing points?
        // Let's assume new users start with 0 pts. If they have points from organic purchase that's fine, 
        // but we want to prevent double referral claiming.
        const refereeProfile = await getLoyaltyProfile(client, refereeId);
        if (!refereeProfile) {
            return NextResponse.json({ success: false, message: 'Referee not found' }, { status: 404 });
        }

        // Check tags manually for referred flag
        // Note: getLoyaltyProfile parses specific tags, we might need to raw check or rely on a new field.
        // Let's re-fetch raw tags here to be sure, or update getLoyaltyProfile. 
        // For speed, I'll just re-fetch raw tags here.
        const query = GET_CUSTOMER_LOYALTY_DATA;
        const resReferee = await client.query<{ listCustomer: any }>({ query, variables: { id: refereeId } });
        const refRawTags = resReferee.data?.listCustomer?.data?.[0]?.tags || [];
        const refTagsString = refRawTags.map((t: any) => typeof t === 'string' ? t : t.name || '');

        const alreadyReferred = refTagsString.some((t: string) => t.startsWith('Loyalty:ReferredBy:'));
        if (alreadyReferred) {
            return NextResponse.json({ success: false, message: 'Customer already referred' }, { status: 400 });
        }

        // 2. Award Points
        // Referrer gets 500
        await updateLoyaltyBalance(client, referrerId, 500);

        // Referee gets 100 (Welcome)
        await updateLoyaltyBalance(client, refereeId, 100);

        // 3. Mark Referee as Referred
        const newTags = [
            ...refTagsString,
            `Loyalty:ReferredBy:${referrerId}`
        ];

        await client.mutate({
            mutation: UPDATE_CUSTOMER_TAGS,
            variables: { input: { id: refereeId, tags: newTags.map((t: string) => ({ name: t })) } }
        });

        // 4. Log Transactions
        LocalDB.logTransaction({ customerId: referrerId, type: 'EARN', points: 500, metadata: { type: 'REFERRAL_BONUS', friend: refereeId } }).catch(console.error);
        LocalDB.logTransaction({ customerId: refereeId, type: 'EARN', points: 100, metadata: { type: 'REFERRAL_WELCOME', friend: referrerId } }).catch(console.error);

        return NextResponse.json({ success: true, message: 'Referral successful' });

    } catch (error: any) {
        console.error('Referral Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
