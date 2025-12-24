
export interface NotificationPayload {
    to: string; // Email or Phone
    subject: string;
    body: string;
    type: 'EMAIL' | 'SMS';
}

export class NotificationService {

    /**
     * Sends a notification to the customer.
     * Currently simulates sending by logging to console.
     */
    static async send(payload: NotificationPayload): Promise<boolean> {
        // In a real app, this would integrate with SendGrid, Twilio, or AWS SES.
        // Integration point:
        // await sendgrid.send({ to: payload.to, ... })

        console.log(`\n--- [NOTIFICATION SIMULATION] ---`);
        console.log(`TYPE: ${payload.type}`);
        console.log(`TO: ${payload.to}`);
        console.log(`SUBJECT: ${payload.subject}`);
        console.log(`BODY: ${payload.body}`);
        console.log(`---------------------------------\n`);

        return true;
    }

    /**
     * Factory method for Point Earned template
     */
    static async sendPointsEarned(email: string, points: number, newBalance: number) {
        return this.send({
            to: email,
            type: 'EMAIL',
            subject: `You earned ${points} Loyalty Points!`,
            body: `Congratulations! You've earned ${points} points from your recent order.\nYour new balance is: ${newBalance} points.\nKeep shopping to reach the next Tier!`
        });
    }

    /**
     * Factory method for Reward Redeemed template
     */
    static async sendRewardRedeemed(email: string, code: string, amount: number) {
        return this.send({
            to: email,
            type: 'EMAIL',
            subject: 'Here is your Discount Code!',
            body: `You have successfully redeemed points for a ${amount} TL discount.\nYour Code: ${code}\nUse this at checkout!`
        });
    }

    /**
     * Factory method for Refund/Clawback template
     */
    static async sendPointsRefunded(email: string, pointsDeducted: number, newBalance: number) {
        return this.send({
            to: email,
            type: 'EMAIL',
            subject: 'Points Adjustment for Return',
            body: `Due to a recent refund, ${pointsDeducted} points have been deducted from your account.\nYour new balance is: ${newBalance} points.`
        });
    }
}
