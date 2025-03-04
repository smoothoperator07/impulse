/**
 * Impulse Server Economy System
 * Developed by: Clark Jones @Prince Sky
 * Features: Balance tracking, banking, interest, leaderboards, and transactions.
 */

import { FS } from '../../lib/fs';

const ECONOMY_FILE = '../../impulse/economy.json';

interface EconomyData {
    [userID: string]: {
        balance: number;
    };
}

// Load economy data
function loadEconomy(): EconomyData {
    try {
        return JSON.parse(FS(ECONOMY_FILE).readIfExistsSync() || '{}');
    } catch {
        return {};
    }
}

// Save economy data
function saveEconomy(data: EconomyData) {
    FS(ECONOMY_FILE).writeUpdate(() => JSON.stringify(data, null, 2));
}

// Economy Functions
function getBalance(userID: string): number {
    const economy = loadEconomy();
    return economy[userID]?.balance || 0;
}

// Give money
function giveMoney(userID: string, amount: number) {
    const economy = loadEconomy();
    if (!economy[userID]) economy[userID] = { balance: 0, bank: 0 };
    economy[userID].balance += amount;
    saveEconomy(economy);
}

// Take money
function takeMoney(userID: string, amount: number) {
    const economy = loadEconomy();
    if (!economy[userID]) return;
    economy[userID].balance = Math.max(0, economy[userID].balance - amount);
    saveEconomy(economy);
}

// Transfer money
function transferMoney(fromID: string, toID: string, amount: number): string {
    const economy = loadEconomy();
    if (!economy[fromID] || economy[fromID].balance < amount) return "You don't have enough PokéCoins.";
    if (amount <= 0) return "Invalid amount.";

    economy[fromID].balance -= amount;
    if (!economy[toID]) economy[toID] = { balance: 0, bank: 0 };
    economy[toID].balance += amount;
    saveEconomy(economy);
    return `You sent ${amount} PokéCoins to ${toID}.`;
}

// Get the richest users leaderboard
function getRichestUsers(start: number, end: number): string {
    const economy = loadEconomy();
    const sortedUsers = Object.entries(economy)
        .sort(([, a], [, b]) => (b.balance + b.bank) - (a.balance + a.bank))
        .slice(start - 1, end);

    if (sortedUsers.length === 0) return "No users found in this range.";

    let leaderboard = `<div style="max-height: 300px; overflow-y: auto;"><b>🏆 Richest Users Leaderboard</b><br>`;
    sortedUsers.forEach(([userID, { balance, bank }], index) => {
        leaderboard += `#${start + index}: ${userID} - ${balance + bank} PokéCoins<br>`;
    });
    leaderboard += "</div>";

    return leaderboard;
}

export { getBalance, giveMoney, takeMoney };

// Get help information
function getEconomyHelp(): string {
    return `<div style="max-height: 300px; overflow-y: auto;"><b>💰 Economy Commands Help</b><br>
    <b>/balance [user]</b> - Check your or another user's balance.<br>
    <b>/givemoney [user], [amount]</b> - Give money to a user (Admin only).<br>
    <b>/takemoney [user], [amount]</b> - Take money from a user (Admin only).<br>
    <b>/transfermoney [user], [amount]</b> - Transfer money to another user.<br>
    <b>/richestusers [start]-[end]</b> - View the richest users leaderboard.<br>
	 <b>/economyhelp</b> - View this help menu.<br>
    </div>`;
}

// Economy Commands
export const commands: ChatCommands = {
    balance(target, room, user) {
        const targetUser = target.trim() || user.id;
        return this.sendReply(`${targetUser} has ${getBalance(targetUser)} PokéCoins.`);
    },

    givemoney(target, room, user) {
        if (!user.hasRank('%')) return this.sendReply("You don't have permission.");
        const [targetUser, amountStr] = target.split(',').map(x => x.trim());
        const amount = Number(amountStr);
        if (!targetUser || isNaN(amount) || amount <= 0) return this.sendReply("Usage: /givemoney [user], [amount]");

        giveMoney(targetUser, amount);
        return this.sendReply(`Gave ${amount} PokéCoins to ${targetUser}.`);
    },

    takemoney(target, room, user) {
        if (!user.hasRank('%')) return this.sendReply("You don't have permission.");
        const [targetUser, amountStr] = target.split(',').map(x => x.trim());
        const amount = Number(amountStr);
        if (!targetUser || isNaN(amount) || amount <= 0) return this.sendReply("Usage: /takemoney [user], [amount]");

        takeMoney(targetUser, amount);
        return this.sendReply(`Took ${amount} PokéCoins from ${targetUser}.`);
    },

    transfermoney(target, room, user) {
        const [targetUser, amountStr] = target.split(',').map(x => x.trim());
        const amount = Number(amountStr);
        if (!targetUser || isNaN(amount) || amount <= 0) return this.sendReply("Usage: /transfermoney [user], [amount]");

        return this.sendReply(transferMoney(user.id, targetUser, amount));
    },

	richestusers(target, room, user) {
        if (!target) return this.sendReply("Usage: /richestusers [start]-[end] (e.g., /richestusers 1-10)");

        const [startStr, endStr] = target.split('-').map(x => x.trim());
        const start = Number(startStr) || 1;
        const end = Number(endStr) || start + 9;

        if (start <= 0 || end < start) return this.sendReply("Invalid range. Use /richestusers 1-10.");

        return this.sendReplyBox(getRichestUsers(start, end));
    },

	economyhelp(target, room, user) {
        return this.sendReplyBox(getEconomyHelp());
    },
};
