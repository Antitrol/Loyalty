
export interface LoyaltyProfile {
    customerId: string;
    email?: string;
    pointsBalance: number;
    tier: 'Standard' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
    lifetimePoints: number;
    referralCode?: string;
    pointsExpirationDate?: string;
}

export type TierName = LoyaltyProfile['tier'];

export interface TierConfig {
    name: TierName;
    threshold: number;
    multiplier: number;
}

export interface LoyaltySettings {
    id: string;

    // Earning Rules
    earnPerAmount: number;
    earnUnitAmount: number;
    earnRatio: number;
    welcomeBonus: number;
    excludeShipping: boolean;
    excludeDiscounted: boolean;
    categoryBonuses: Record<string, number> | null;
    tiers: TierConfig[] | null;

    // Redemption Rules
    burnRatio: number;
    minSpendLimit: number;
    maxPointUsage: number;

    // Widget/Branding
    widgetPrimaryColor: string;
    widgetSecondaryColor: string;
    widgetLabel: string;

    // Widget Customization
    widgetTheme: 'light' | 'dark' | 'gradient' | 'minimal' | 'colorful';
    widgetPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    widgetStyle: 'default' | 'minimal' | 'card' | 'compact';
    widgetAnimations: boolean;
    widgetAutoExpand: boolean;
    widgetBorderRadius: number;
    widgetShadowIntensity: 'low' | 'medium' | 'high';

    // Timestamps
    updatedAt?: Date;
}

export type CategoryBonuses = Record<string, number>;

export const ATTRIBUTE_KEYS = {
    BALANCE: 'loyalty_points_balance',
    TIER: 'loyalty_tier',
    LIFETIME: 'lifetime_points_earned',
    EXPIRATION: 'points_expiration_date',
    REFERRAL: 'referral_code',
};
