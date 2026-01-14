/**
 * Coupon Pool Manager (Database-Based)
 * Manages fetching and marking coupons from database pool
 */

import { prisma } from '../prisma';

export interface CouponPoolStats {
    total: number;
    used: number;
    available: number;
    percentage: number;
}

/**
 * Get an unused coupon from database pool
 * Returns null if no coupons available
 */
export async function getUnusedCouponFromPool(
    campaignId: string,
    tier: number
): Promise<string | null> {
    try {
        console.log(`🎫 Fetching unused coupon from pool (campaign: ${campaignId}, tier: ${tier})...`);

        // Find first unused coupon with atomic transaction
        const coupon = await prisma.$transaction(async (tx) => {
            // Find unused coupon
            const unused = await tx.couponPool.findFirst({
                where: {
                    campaignId,
                    tier,
                    usedAt: null
                },
                orderBy: {
                    createdAt: 'asc' // FIFO
                }
            });

            if (!unused) {
                return null;
            }

            // Mark as reserved immediately (optimistic locking)
            await tx.couponPool.update({
                where: { id: unused.id },
                data: {
                    usedAt: new Date(),
                    usedBy: 'RESERVED' // Will be updated with actual customerId later
                }
            });

            return unused;
        });

        if (!coupon) {
            console.error('❌ No unused coupons available in pool');
            console.error(`   Campaign: ${campaignId}, Tier: ${tier}`);
            return null;
        }

        console.log(`✅ Found unused coupon: ${coupon.code}`);
        return coupon.code;

    } catch (error: any) {
        console.error('❌ Error fetching coupon from pool:', error.message);
        return null;
    }
}

/**
 * Mark a coupon as used by a specific customer
 */
export async function markCouponAsUsed(
    code: string,
    customerId: string
): Promise<boolean> {
    try {
        await prisma.couponPool.update({
            where: { code },
            data: {
                usedBy: customerId,
                usedAt: new Date()
            }
        });

        console.log(`✅ Marked coupon ${code} as used by ${customerId}`);
        return true;

    } catch (error: any) {
        console.error(`❌ Failed to mark coupon ${code} as used:`, error.message);
        return false;
    }
}

/**
 * Get pool statistics
 */
export async function getCouponPoolStats(
    campaignId: string,
    tier: number
): Promise<CouponPoolStats> {
    try {
        const total = await prisma.couponPool.count({
            where: { campaignId, tier }
        });

        const used = await prisma.couponPool.count({
            where: {
                campaignId,
                tier,
                usedAt: { not: null }
            }
        });

        const available = total - used;

        return {
            total,
            used,
            available,
            percentage: total > 0 ? Math.round((available / total) * 100) : 0
        };

    } catch (error: any) {
        console.error('❌ Error getting pool stats:', error.message);
        return {
            total: 0,
            used: 0,
            available: 0,
            percentage: 0
        };
    }
}

/**
 * Check if pool needs replenishment
 */
export async function shouldReplenishPool(
    campaignId: string,
    tier: number,
    threshold: number = 100
): Promise<boolean> {
    const stats = await getCouponPoolStats(campaignId, tier);
    return stats.available < threshold;
}
