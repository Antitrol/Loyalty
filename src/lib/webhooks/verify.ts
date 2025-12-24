
import crypto from 'crypto';

export function verifyIkasWebhook(body: string, signature: string | null): boolean {
    if (!signature) return false;

    const secret = process.env.CLIENT_SECRET;
    if (!secret) {
        console.error("CLIENT_SECRET is not defined in environment variables.");
        return false;
    }

    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(body, 'utf8').digest('base64');

    // Constant time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(digest)
    );
}
