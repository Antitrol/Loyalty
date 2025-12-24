
export interface LoyaltyProfile {
    customerId: string;
    email?: string;
    pointsBalance: number;
    tier: 'Standard' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
    lifetimePoints: number;
    referralCode?: string;
    pointsExpirationDate?: string;
}

export const ATTRIBUTE_KEYS = {
    BALANCE: 'loyalty_points_balance',
    TIER: 'loyalty_tier',
    LIFETIME: 'lifetime_points_earned',
    EXPIRATION: 'points_expiration_date',
    REFERRAL: 'referral_code',
};
