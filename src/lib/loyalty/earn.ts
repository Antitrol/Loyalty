
import { LoyaltyProfile } from './types';



// Fallback defaults if settings are missing
const DEFAULT_TIERS = [
    { name: 'Standard', threshold: 0, multiplier: 1 },
    { name: 'Bronze', threshold: 5000, multiplier: 1.1 },
    { name: 'Silver', threshold: 10000, multiplier: 1.25 },
    { name: 'Gold', threshold: 25000, multiplier: 1.5 },
    { name: 'Platinum', threshold: 50000, multiplier: 2.0 },
];

/**
 * Calculates current tier based on lifetime points and settings.
 */
export function determineTier(lifetimePoints: number, settings?: any): LoyaltyProfile['tier'] {
    const tiers = settings?.tiers || DEFAULT_TIERS;

    // Sort tiers by threshold descending to find the highest matching one
    const sortedTiers = [...tiers].sort((a, b) => b.threshold - a.threshold);

    for (const tier of sortedTiers) {
        if (lifetimePoints >= tier.threshold) {
            // Type assertion since our tier names match the types, 
            // but dynamic settings could theoretically introduce others.
            // Ideally we'd update types to string, but for now we cast.
            return tier.name as LoyaltyProfile['tier'];
        }
    }
    return 'Standard';
}

/**
 * Calculates points for a specific line item, considering category bonuses.
 */
export function calculateLineItemPoints(
    price: number,
    categories: string[],
    settings: {
        earnPerAmount: number;
        earnUnitAmount: number;
        categoryBonuses?: any
    }
): number {
    const unitAmount = settings.earnUnitAmount || 1.0;
    const earnPerAmount = settings.earnPerAmount || 1.0;

    // Check for Category Multiplier
    let categoryMultiplier = 1.0;
    if (settings.categoryBonuses && categories.length > 0) {
        for (const cat of categories) {
            const bonus = settings.categoryBonuses[cat];
            if (bonus && typeof bonus === 'number') {
                categoryMultiplier = Math.max(categoryMultiplier, bonus);
            }
        }
    }

    // Base Calc: (Price / Unit) * Earn * Multiplier
    const basePoints = (price / unitAmount) * earnPerAmount * categoryMultiplier;

    return basePoints;
}

/**
 * Calculates points to be awarded for a given transaction.
 */
export function calculatePoints(
    amount: number,
    tier: LoyaltyProfile['tier'] = 'Standard',
    settings: { earnPerAmount: number; earnUnitAmount: number; earnRatio?: number; tiers?: any[] }
): number {
    const tiers = settings.tiers || DEFAULT_TIERS;
    const currentTier = tiers.find((t: any) => t.name === tier);
    const tierMultiplier = currentTier ? currentTier.multiplier : 1;

    // New Logic: (Amount / UnitAmount) * EarnPoints
    const unitAmount = settings.earnUnitAmount || 1.0;
    const earnPerAmount = settings.earnPerAmount || 1.0;

    // Calculate base points
    const basePoints = (amount / unitAmount) * earnPerAmount;

    // Apply Tier Multiplier
    const points = Math.floor(basePoints * tierMultiplier);

    return Math.max(0, points);
}

/**
 * Calculates points to be deducted for a refund.
 */
export function calculateRefundPoints(
    amount: number,
    tier: LoyaltyProfile['tier'] = 'Standard',
    settings?: any
): number {
    const tiers = settings?.tiers || DEFAULT_TIERS;
    const currentTier = tiers.find((t: any) => t.name === tier);
    const multiplier = currentTier ? currentTier.multiplier : 1;

    const points = Math.floor(amount * multiplier);
    return Math.max(0, points);
}

