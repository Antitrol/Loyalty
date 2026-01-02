
import { ikasAdminGraphQLAPIClient } from '../ikas-client/generated/graphql';
import { GET_CUSTOMER_LOYALTY_DATA, UPDATE_CUSTOMER_TAGS } from '../graphql/loyalty';
import { LoyaltyProfile, LoyaltySettings } from './types';
import { determineTier } from './earn';

// GraphQL Response Types
interface CustomerTag {
    name: string;
}

interface CustomerData {
    id: string;
    email: string;
    tags: (CustomerTag | string)[];
}

interface CustomerQueryResponse {
    listCustomer: {
        data: CustomerData[];
    };
}

interface UpdateCustomerResponse {
    updateCustomer: CustomerData;
}

// Tag Prefixes
const TAG_PREFIX_POINTS = "Loyalty:Points:";
const TAG_PREFIX_TIER = "Loyalty:Tier:";
const TAG_PREFIX_LIFETIME = "Loyalty:Lifetime:";

function parseTags(customerId: string, tags: string[], email?: string): LoyaltyProfile {
    let points = 0;
    let tier = 'Standard';
    let lifetime = 0;

    for (const tag of tags) {
        if (tag.startsWith(TAG_PREFIX_POINTS)) {
            points = parseInt(tag.replace(TAG_PREFIX_POINTS, ''), 10) || 0;
        } else if (tag.startsWith(TAG_PREFIX_TIER)) {
            tier = tag.replace(TAG_PREFIX_TIER, '');
        } else if (tag.startsWith(TAG_PREFIX_LIFETIME)) {
            lifetime = parseInt(tag.replace(TAG_PREFIX_LIFETIME, ''), 10) || 0;
        }
    }

    return {
        customerId,
        email,
        pointsBalance: points,
        tier: tier as LoyaltyProfile['tier'],
        lifetimePoints: lifetime,
        referralCode: undefined,
        pointsExpirationDate: undefined,
    };
}

export async function getLoyaltyProfile<T = unknown>(
    client: ikasAdminGraphQLAPIClient<T>,
    customerId: string
): Promise<LoyaltyProfile | null> {
    const query = GET_CUSTOMER_LOYALTY_DATA;
    try {

        console.log(`[getLoyaltyProfile] Querying ID: ${customerId}`);
        const response = await client.query<CustomerQueryResponse>({ query, variables: { id: customerId } });
        // console.log(\`[getLoyaltyProfile] Response: \${JSON.stringify(response)}\`);


        if (!response.data || !response.data.listCustomer?.data?.length) {
            console.log(`[getLoyaltyProfile] No customer found`);
            return null;
        }
        const customer = response.data.listCustomer.data[0];

        const rawTags = customer.tags || [];
        const tags = rawTags.map((t: CustomerTag | string) => typeof t === 'string' ? t : t.name || '');

        return parseTags(customer.id, tags, customer.email);
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        console.error(`[getLoyaltyProfile] Error: ${message}`);
        console.error("getLoyaltyProfile Error:", message);
        throw e;
    }
}

export async function updateLoyaltyBalance<T = unknown>(
    client: ikasAdminGraphQLAPIClient<T>,
    customerId: string,
    delta: number,
    newTier?: string, // Manual override
    settings?: Partial<LoyaltySettings>
): Promise<LoyaltyProfile | null> {
    const currentProfile = await getLoyaltyProfile(client, customerId);
    if (!currentProfile) throw new Error('Customer not found');

    const newBalance = currentProfile.pointsBalance + delta;

    // Helper logic: If earning points (positive delta), increase lifetime points.
    let newLifetime = currentProfile.lifetimePoints;
    if (delta > 0) {
        newLifetime += delta;
    }

    // Determine Tier based on Lifetime Points (or manual override)
    const calculatedTier = determineTier(newLifetime, settings);
    const finalTier = newTier || calculatedTier;
    // Logic: We prioritize manual override if provided (e.g. admin setting), otherwise auto-calculate.
    // However, if manual tier is lower than calculated tier from lifetime, should we downgrade?
    // Let's assume calculatedTier is the source of truth unless override is explicit.

    // Fetch tags again to be safe
    const query = GET_CUSTOMER_LOYALTY_DATA;
    const response = await client.query<CustomerQueryResponse>({ query, variables: { id: customerId } });
    const customer = response.data?.listCustomer?.data?.[0];
    if (!customer) throw new Error("Customer not found during update");

    const validTags: string[] = (customer.tags || []).map((t: CustomerTag | string) => typeof t === 'string' ? t : t.name || '');

    const otherTags = validTags.filter(t =>
        !t.startsWith(TAG_PREFIX_POINTS) &&
        !t.startsWith(TAG_PREFIX_TIER) &&
        !t.startsWith(TAG_PREFIX_LIFETIME)
    );

    const newTags = [
        ...otherTags,
        `${TAG_PREFIX_POINTS}${newBalance}`,
        `${TAG_PREFIX_TIER}${finalTier}`,
        `${TAG_PREFIX_LIFETIME}${newLifetime}`
    ];

    const mutation = UPDATE_CUSTOMER_TAGS;
    const input = {
        id: customerId,
        tags: newTags.map(t => ({ name: t }))
    };

    console.log(`[updateLoyaltyBalance] Updating tags: ${JSON.stringify(newTags)}`);

    try {
        const updateRes = await client.mutate<UpdateCustomerResponse>({ mutation, variables: { input } });
        // console.log(\`[updateLoyaltyBalance] Response: \${JSON.stringify(updateRes)}\`);
        const updatedCustomer = updateRes.data?.updateCustomer;

        if (!updatedCustomer) throw new Error("Failed to update tags");

        // Convert object tags to strings for parsing
        const updatedTagsString = (updatedCustomer.tags || []).map((t: CustomerTag | string) => typeof t === 'string' ? t : t.name || '');

        // Use the email we already have from valid customer or currentProfile
        return parseTags(updatedCustomer.id, updatedTagsString, currentProfile.email);
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        console.error(`[updateLoyaltyBalance] Error: ${message}`);
        throw e;
    }
}
