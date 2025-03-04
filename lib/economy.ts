import { FS } from './fs';
import { MongoClient, Collection } from 'mongodb';

class EconomySystem {
    data: Record<string, number> = {};
    filePath: string;
    balancesCollection: Collection | null;

    constructor(filePath: string, balancesCollection: Collection | null = null) {
        this.filePath = filePath;
        this.balancesCollection = balancesCollection;

        if (!this.balancesCollection) {
            this.loadData();
        }
    }

    async loadData() {
        if (!this.filePath) throw new Error("filePath is not set for FS storage.");
        if (FS(this.filePath).existsSync()) {
            this.data = JSON.parse(FS(this.filePath).readIfExistsSync() || "{}");
        }
    }

    async getBalance(userid: string): Promise<number> {
        userid = userid.toLowerCase();

        if (this.balancesCollection) {
            const user = await this.balancesCollection.findOne({ userid });
            return user ? user.balance : 0;
        }

        return this.data[userid] || 0;
    }

    async addCurrency(userid: string, amount: number): Promise<void> {
        userid = userid.toLowerCase();
        if (amount <= 0) throw new Error("Amount must be greater than zero.");

        if (this.balancesCollection) {
            await this.balancesCollection.updateOne(
                { userid },
                { $inc: { balance: amount } },
                { upsert: true }
            );
        } else {
            if (!this.filePath) throw new Error("filePath is undefined in FS mode.");
            if (!this.data[userid]) this.data[userid] = 0;
            this.data[userid] += amount;

            FS(this.filePath).writeUpdate(() => JSON.stringify(this.data, null, 2));
        }
    }

    async removeCurrency(userid: string, amount: number): Promise<void> {
        userid = userid.toLowerCase();
        if (amount <= 0) throw new Error("Amount must be greater than zero.");

        const balance = await this.getBalance(userid);
        if (balance < amount) throw new Error("Insufficient funds.");

        if (this.balancesCollection) {
            await this.balancesCollection.updateOne(
                { userid },
                { $inc: { balance: -amount } }
            );
        } else {
            if (!this.filePath) throw new Error("filePath is undefined in FS mode.");
            this.data[userid] = Math.max(0, balance - amount);

            FS(this.filePath).writeUpdate(() => JSON.stringify(this.data, null, 2));
        }
    }

    async transferCurrency(fromUser: string, toUser: string, amount: number): Promise<void> {
        fromUser = fromUser.toLowerCase();
        toUser = toUser.toLowerCase();
        if (fromUser === toUser) throw new Error("You cannot transfer money to yourself.");
        if (amount <= 0) throw new Error("Amount must be greater than zero.");

        const senderBalance = await this.getBalance(fromUser);
        if (senderBalance < amount) throw new Error("Insufficient funds.");

        await this.removeCurrency(fromUser, amount);
        await this.addCurrency(toUser, amount);
    }

    async resetAll(): Promise<void> {
        if (this.balancesCollection) {
            await this.balancesCollection.deleteMany({});
        } else {
            this.data = {};
            FS(this.filePath).writeUpdate(() => "{}");
        }
    }

    async deleteUser(userid: string): Promise<void> {
        userid = userid.toLowerCase();

        if (this.balancesCollection) {
            await this.balancesCollection.deleteOne({ userid });
        } else {
            delete this.data[userid];
            FS(this.filePath).writeUpdate(() => JSON.stringify(this.data, null, 2));
        }
    }

    async getRichestUsers(limit: number = 20): Promise<{ user: string; balance: number }[]> {
        if (this.balancesCollection) {
            const users = await this.balancesCollection.find().sort({ balance: -1 }).limit(limit).toArray();
            return users.map(user => ({ user: user.userid, balance: user.balance }));
        } else {
            return Object.entries(this.data)
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit)
                .map(([user, balance]) => ({ user, balance }));
        }
    }
}

// Initialize economy system with both FS and MongoDB support
const mongoUri = process.env.MONGO_URI || '';
const mongoClient = mongoUri ? new MongoClient(mongoUri) : null;
const database = mongoClient ? mongoClient.db('pokemonshowdown') : null;
const balancesCollection = database ? database.collection('balances') : null;

export const economy = new EconomySystem('databases/economy.json', balancesCollection);
