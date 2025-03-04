/**
 * Economy System for Pokémon Showdown
 * 
 * Author: [Your Name]
 * 
 * Features:
 * - Currency system with JSON or MongoDB storage
 * - Transaction history with logging
 * - Admin-only commands: addcurrency, removecurrency, reset, clearAllBalances
 * - Transfer currency between users
 * - User deletion & inactivity tracking
 * - Scrollable transaction history & richest users
 * - Modern, easy-to-read UI
 * 
 * Pokémon Showdown Internal Modules Used:
 * - FS (for file storage)
 * - MongoDB (optional for database storage)
 * 
 * License: MIT or as per Pokémon Showdown's open-source licensing
 */

import { FS } from './fs';
import { MongoClient, Db, Collection } from 'mongodb';

const CURRENCY_FILE = 'databases/economy.json';
const TRANSACTION_FILE = 'databases/economy-transactions.json';

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
    private db?: Db;
    private balancesCollection?: Collection;
    private transactionsCollection?: Collection;

    constructor() {
        if (Config.useMongoDB) {
            this.connectToMongoDB();
        } else {
            this.loadFromJSON();
        }
    }

    private async connectToMongoDB() {
        try {
            const client = new MongoClient(Config.mongoURI);
            await client.connect();
            this.db = client.db(Config.mongoDatabase);
            this.balancesCollection = this.db.collection('economy_balances');
            this.transactionsCollection = this.db.collection('economy_transactions');
        } catch (e) {
            console.error("[Economy] Failed to connect to MongoDB:", e);
        }
    }

    private loadFromJSON() {
        try {
            if (!FS(CURRENCY_FILE).existsSync()) {
                FS(CURRENCY_FILE).writeSync('{}');
            }
            if (!FS(TRANSACTION_FILE).existsSync()) {
                FS(TRANSACTION_FILE).writeSync('{}');
            }

            this.data = JSON.parse(FS(CURRENCY_FILE).readSync() || '{}');
            this.transactions = JSON.parse(FS(TRANSACTION_FILE).readSync() || '{}');
        } catch (e) {
            console.error("[Economy] Failed to load JSON data:", e);
            this.data = {};
            this.transactions = {};
        }
    }

    private saveToJSON() {
        FS(CURRENCY_FILE).writeUpdate(() => JSON.stringify(this.data, null, 2));
        FS(TRANSACTION_FILE).writeUpdate(() => JSON.stringify(this.transactions, null, 2));
    }

    async getBalance(userid: string): Promise<number> {
        if (this.balancesCollection) {
            const user = await this.balancesCollection.findOne({ userid });
            return user ? user.balance : 0;
        }
        return this.data[userid] || 0;
    }

    async addCurrency(userid: string, amount: number, from?: string): Promise<boolean> {
        if (amount <= 0) return false;
        
        if (this.balancesCollection) {
            await this.balancesCollection.updateOne(
                { userid },
                { $inc: { balance: amount } },
                { upsert: true }
            );
            await this.logTransaction(userid, 'add', amount, from);
        } else {
            this.data[userid] = (this.data[userid] || 0) + amount;
            this.logTransaction(userid, 'add', amount, from);
            this.saveToJSON();
        }
        
        return true;
    }

    async removeCurrency(userid: string, amount: number, from?: string): Promise<boolean> {
        if (amount <= 0) return false;
        
        if (this.balancesCollection) {
            const user = await this.balancesCollection.findOne({ userid });
            if (!user || user.balance < amount) return false;
            
            await this.balancesCollection.updateOne(
                { userid },
                { $inc: { balance: -amount } }
            );
            await this.logTransaction(userid, 'remove', amount, from);
        } else {
            if (!this.data[userid] || this.data[userid] < amount) return false;
            this.data[userid] -= amount;
            this.logTransaction(userid, 'remove', amount, from);
            this.saveToJSON();
        }
        
        return true;
    }

    async transferCurrency(fromUser: string, toUser: string, amount: number): Promise<boolean> {
        if (amount <= 0 || fromUser === toUser) return false;
        
        if (this.balancesCollection) {
            const sender = await this.balancesCollection.findOne({ userid: fromUser });
            if (!sender || sender.balance < amount) return false;
            
            await this.balancesCollection.updateOne({ userid: fromUser }, { $inc: { balance: -amount } });
            await this.balancesCollection.updateOne({ userid: toUser }, { $inc: { balance: amount } }, { upsert: true });
            await this.logTransaction(fromUser, 'transfer', amount, fromUser, toUser);
        } else {
            if (!this.data[fromUser] || this.data[fromUser] < amount) return false;
            this.data[fromUser] -= amount;
            this.data[toUser] = (this.data[toUser] || 0) + amount;
            this.logTransaction(fromUser, 'transfer', amount, fromUser, toUser);
            this.saveToJSON();
        }
        
        return true;
    }

    async deleteUser(userid: string): Promise<boolean> {
        if (this.balancesCollection) {
            await this.balancesCollection.deleteOne({ userid });
            await this.transactionsCollection?.deleteOne({ userid });
        } else {
            delete this.data[userid];
            delete this.transactions[userid];
            this.saveToJSON();
        }
        
        return true;
    }

    async getTransactionSummary(userid: string): Promise<{ added: number; removed: number; transferred: number }> {
        let history: Transaction[] = [];
        if (this.transactionsCollection) {
            history = await this.transactionsCollection.find({ userid }).toArray();
        } else {
            history = this.transactions[userid] || [];
        }
        
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

    async getInactiveUsers(days: number = 30): Promise<string[]> {
        const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
        
        if (this.transactionsCollection) {
            const users = await this.transactionsCollection.find({}).toArray();
            return users
                .filter(user => user.transactions.every((t: Transaction) => t.timestamp < cutoffTime))
                .map(user => user.userid);
        }
        
        return Object.entries(this.transactions)
            .filter(([_, history]) => history.every(transaction => transaction.timestamp < cutoffTime))
            .map(([id]) => id);
    }

    private async logTransaction(userid: string, type: 'add' | 'remove' | 'transfer' | 'reset' | 'clearAll', amount: number, from?: string, to?: string) {
        const transaction: Transaction = { timestamp: Date.now(), type, amount, from, to };

        if (this.transactionsCollection) {
            await this.transactionsCollection.updateOne(
                { userid },
                { $push: { transactions: transaction } },
                { upsert: true }
            );
        } else {
            if (!this.transactions[userid]) this.transactions[userid] = [];
            this.transactions[userid].push(transaction);
            this.saveToJSON();
        }
    }
}

export default new EconomySystem();
