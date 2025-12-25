
import { LoyaltyProfile } from './types';

export const TIER_MULTIPLIERS: Record<LoyaltyProfile['tier'], number> = {
    'Standard': 1,
    'Bronze': 1.1,
    'Silver': 1.25,
    'Gold': 1.5,
    'Platinum': 2.0,
};

// Tier Thresholds (Lifetime Points)
export const TIER_THRESHOLDS = {
    Standard: 0,
    Bronze: 5000,
    Silver: 10000,
    Gold: 25000,
    Platinum: 50000
};

/**
 * Calculates current tier based on lifetime points.
 */
export function determineTier(lifetimePoints: number): LoyaltyProfile['tier'] {
    if (lifetimePoints >= TIER_THRESHOLDS.Platinum) return 'Platinum';
    if (lifetimePoints >= TIER_THRESHOLDS.Gold) return 'Gold';
    if (lifetimePoints >= TIER_THRESHOLDS.Silver) return 'Silver';
    if (lifetimePoints >= TIER_THRESHOLDS.Bronze) return 'Bronze';
    return 'Standard';
}

/**
 * Calculates points to be awarded for a given transaction.
 * 
 * @param amount - The total final price of the order (in TL/USD etc.)
 * @param tier - The current loyalty tier of the customer
 * @returns The integer number of points to award.
 */
export function calculatePoints(amount: number, tier: LoyaltyProfile['tier'] = 'Standard', earnRatio: number = 1.0): number {
    const tierMultiplier = TIER_MULTIPLIERS[tier] || 1;
    // Formula: Amount * BaseRatio * TierMultiplier
    const points = Math.floor(amount * earnRatio * tierMultiplier);
    return Math.max(0, points);
}

/**
 * Calculates points to be deducted for a refund.
 * 
 * @param amount - The refunded amount
 * @param tier - The current loyalty tier
 * @returns The integer number of points to deduct.
 */
export function calculateRefundPoints(amount: number, tier: LoyaltyProfile['tier'] = 'Standard'): number {
    const multiplier = TIER_MULTIPLIERS[tier] || 1;
    const points = Math.floor(amount * multiplier);
    return Math.max(0, points);
}
