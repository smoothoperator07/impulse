import { FS } from './fs';

const CURRENCY_FILE = 'config/economy.json';
const TRANSACTION_FILE = 'config/economy-transactions.json';

interface EconomyData {
    [userid: string]: number;
}

interface Transaction {
    timestamp: number;
    type: 'add' | 'remove' | 'transfer' | 'reset' | 'clearAll';
    amount: number;
    from?: string;
    to?: string;
}

interface TransactionHistory {
    [userid: string]: Transaction[];
}

class EconomySystem {
    private data: EconomyData = {};
    private transactions: TransactionHistory = {};

    constructor() {
        this.load();
    }

    private load() {
        try {
            this.data = JSON.parse(FS(CURRENCY_FILE).readIfExistsSync() || '{}');
            this.transactions = JSON.parse(FS(TRANSACTION_FILE).readIfExistsSync() || '{}');
        } catch (e) {
            this.data = {};
            this.transactions = {};
        }
    }

    private save() {
        FS(CURRENCY_FILE).writeUpdate(() => JSON.stringify(this.data, null, 2));
        FS(TRANSACTION_FILE).writeUpdate(() => JSON.stringify(this.transactions, null, 2));
    }

    getBalance(userid: string): number {
        return this.data[userid] || 0;
    }

    addCurrency(userid: string, amount: number, from?: string): boolean {
        if (amount <= 0) return false;
        this.data[userid] = (this.data[userid] || 0) + amount;
        this.logTransaction(userid, 'add', amount, from);
        this.save();
        return true;
    }

    removeCurrency(userid: string, amount: number, from?: string): boolean {
        if (amount <= 0 || !this.data[userid] || this.data[userid] < amount) return false;
        this.data[userid] -= amount;
        this.logTransaction(userid, 'remove', amount, from);
        this.save();
        return true;
    }

    transferCurrency(fromUser: string, toUser: string, amount: number): boolean {
        if (amount <= 0 || !this.data[fromUser] || this.data[fromUser] < amount) return false;
        if (fromUser === toUser) return false; // Prevent self-transfers

        this.data[fromUser] -= amount;
        this.data[toUser] = (this.data[toUser] || 0) + amount;

        this.logTransaction(fromUser, 'transfer', amount, fromUser, toUser);
        this.logTransaction(toUser, 'add', amount, fromUser, toUser);
        this.save();
        return true;
    }

    resetCurrency(userid: string, from?: string): boolean {
        if (!this.data[userid]) return false;
        this.logTransaction(userid, 'reset', this.data[userid], from);
        this.data[userid] = 0;
        this.save();
        return true;
    }

    clearAllBalances(from?: string): boolean {
        for (const userid in this.data) {
            this.logTransaction(userid, 'clearAll', this.data[userid], from);
            this.data[userid] = 0;
        }
        this.save();
        return true;
    }

    hasEnoughCurrency(userid: string, amount: number): boolean {
        return (this.data[userid] || 0) >= amount;
    }

    getCurrencyStats() {
        const totalUsers = Object.keys(this.data).length;
        const totalCurrency = Object.values(this.data).reduce((sum, balance) => sum + balance, 0);
        const averageBalance = totalUsers ? totalCurrency / totalUsers : 0;

        return { totalUsers, totalCurrency, averageBalance };
    }

    deleteTransactionHistory(userid: string): boolean {
        if (!this.transactions[userid]) return false;
        delete this.transactions[userid];
        this.save();
        return true;
    }

    deleteUser(userid: string): boolean {
        if (!this.data[userid]) return false;
        delete this.data[userid];
        delete this.transactions[userid];
        this.save();
        return true;
    }

    getTransactionSummary(userid: string): { added: number; removed: number; transferred: number } {
        const history = this.transactions[userid] || [];
        return history.reduce(
            (summary, transaction) => {
                if (transaction.type === 'add') summary.added += transaction.amount;
                if (transaction.type === 'remove') summary.removed += transaction.amount;
                if (transaction.type === 'transfer') summary.transferred += transaction.amount;
                return summary;
            },
            { added: 0, removed: 0, transferred: 0 }
        );
    }

    getInactiveUsers(days: number = 30): string[] {
        const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
        return Object.entries(this.transactions)
            .filter(([_, history]) => history.every(transaction => transaction.timestamp < cutoffTime))
            .map(([id]) => id);
    }

    getLeaderboard(limit: number = 100): { id: string; balance: number }[] {
        return Object.entries(this.data)
            .map(([id, balance]) => ({ id, balance }))
            .sort((a, b) => b.balance - a.balance)
            .slice(0, limit);
    }

    getTransactionHistory(userid: string, limit: number = 50): Transaction[] {
        return (this.transactions[userid] || []).slice(-limit).reverse();
    }

    private logTransaction(userid: string, type: 'add' | 'remove' | 'transfer' | 'reset' | 'clearAll', amount: number, from?: string, to?: string) {
        if (!this.transactions[userid]) this.transactions[userid] = [];
        this.transactions[userid].push({
            timestamp: Date.now(),
            type,
            amount,
            from,
            to,
        });
    }
}

export default new EconomySystem();
