import { FS } from './fs';
import { MongoClient, Collection } from 'mongodb';

const economyConfig = {
    useMongoDB: false, // Set to false to use FS (JSON) mode
    mongoUrl: "mongodb://localhost:27017", // Change this if using a remote database
    databaseName: "pokemonshowdown",
    jsonFilePath: "databases/economy.json", // Used only if MongoDB is disabled
};

export class EconomySystem {
    private data: Record<string, number>;
    private filePath: string;
    private balancesCollection: Collection | null;

    constructor() {
        this.filePath = economyConfig.jsonFilePath;
        this.data = {};
        this.balancesCollection = null;

        if (economyConfig.useMongoDB) {
            this.connectMongoDB().catch(console.error);
        } else {
            this.load();
        }
    }

    private async connectMongoDB() {
        const client = new MongoClient(economyConfig.mongoUrl);
        await client.connect();
        this.balancesCollection = client.db(economyConfig.databaseName).collection("economy");
    }

    private load(): void {
        if (!FS(this.filePath).existsSync()) return;
        try {
            this.data = JSON.parse(FS(this.filePath).readSync());
        } catch (e) {
            console.error("Failed to load economy data:", e);
        }
    }

    private async save(): Promise<void> {
        if (!this.balancesCollection) {
            FS(this.filePath).writeUpdate(() => JSON.stringify(this.data, null, 2));
        }
    }

    async getBalance(userid: string): Promise<number> {
        userid = userid.trim().toLowerCase();
        if (this.balancesCollection) {
            const user = await this.balancesCollection.findOne({ userid });
            return user ? user.balance : 0;
        }
        return this.data[userid] || 0;
    }

    async addCurrency(userid: string, amount: number): Promise<void> {
        userid = userid.trim().toLowerCase();
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
            await this.save();
        }
    }

    async removeCurrency(userid: string, amount: number): Promise<void> {
        userid = userid.trim().toLowerCase();
        if (amount <= 0) throw new Error("Amount must be greater than zero.");

        const balance = await this.getBalance(userid);
        if (balance < amount) throw new Error("Insufficient funds.");

        if (this.balancesCollection) {
            await this.balancesCollection.updateOne(
                { userid },
                { $inc: { balance: -amount } }
            );
        } else {
            this.data[userid] = Math.max(0, balance - amount);
            await this.save();
        }
    }

    async transferCurrency(fromUser: string, toUser: string, amount: number): Promise<void> {
        fromUser = fromUser.trim().toLowerCase();
        toUser = toUser.trim().toLowerCase();
        if (amount <= 0) throw new Error("Amount must be greater than zero.");

        const balance = await this.getBalance(fromUser);
        if (balance < amount) throw new Error("Insufficient funds.");

        await this.removeCurrency(fromUser, amount);
        await this.addCurrency(toUser, amount);
    }

    async resetAll(): Promise<void> {
        if (this.balancesCollection) {
            await this.balancesCollection.deleteMany({});
        } else {
            this.data = {};
            await this.save();
        }
    }

    async deleteUser(userid: string): Promise<void> {
        userid = userid.trim().toLowerCase();

        if (this.balancesCollection) {
            await this.balancesCollection.deleteOne({ userid });
        } else {
            delete this.data[userid];
            await this.save();
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
