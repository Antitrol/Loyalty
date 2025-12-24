
import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'src/data/transactions.json');

export type TransactionType = 'EARN' | 'REDEEM' | 'REFUND';

export interface Transaction {
    id: string;
    date: string;
    customerId: string;
    type: TransactionType;
    points: number;
    amount?: number; // Related monetary amount (order total or discount value)
    metadata?: any;
}

export class LocalDB {

    // Ensure DB file exists
    private static ensureDB() {
        if (!fs.existsSync(DB_PATH)) {
            // Ensure dir exists
            const dir = path.dirname(DB_PATH);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(DB_PATH, '[]', 'utf-8');
        }
    }

    static async getTransactions(): Promise<Transaction[]> {
        this.ensureDB();
        try {
            const data = fs.readFileSync(DB_PATH, 'utf-8');
            return JSON.parse(data) as Transaction[];
        } catch (error) {
            console.error('LocalDB Read Error:', error);
            return [];
        }
    }

    static async logTransaction(transaction: Omit<Transaction, 'id' | 'date'>): Promise<Transaction> {
        this.ensureDB();
        const transactions = await this.getTransactions();

        const newTransaction: Transaction = {
            ...transaction,
            id: Math.random().toString(36).substring(7),
            date: new Date().toISOString()
        };

        transactions.push(newTransaction);

        // Keep last 1000 transactions to avoid file growing too large in this demo
        if (transactions.length > 1000) {
            transactions.splice(0, transactions.length - 1000);
        }

        fs.writeFileSync(DB_PATH, JSON.stringify(transactions, null, 2), 'utf-8');
        return newTransaction;
    }

    static async getStats() {
        const transactions = await this.getTransactions();

        const totalEarned = transactions
            .filter(t => t.type === 'EARN')
            .reduce((sum, t) => sum + t.points, 0);

        const totalRedeemed = transactions
            .filter(t => t.type === 'REDEEM')
            .reduce((sum, t) => sum + Math.abs(t.points), 0); // Points are likely stored as negative or positive? 
        // Decision: Let's store logged points as positive values for 'points involved',
        // but the type determines direction.
        // Or stick to: EARN (+), REDEEM (-), REFUND (-)
        // Checking logic below..

        // Let's count REFUND as deduction
        const totalRefunded = transactions
            .filter(t => t.type === 'REFUND')
            .reduce((sum, t) => sum + Math.abs(t.points), 0);

        return {
            totalTransactions: transactions.length,
            totalEarned,
            totalRedeemed,
            totalRefunded,
            netPointsOutstanding: totalEarned - totalRedeemed - totalRefunded,
            recentActivity: transactions.slice(-10).reverse() // Last 10
        };
    }
}
