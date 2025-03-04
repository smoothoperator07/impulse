import { FS } from '../../lib/fs'; // Importing FS from Showdown's lib

// Define types for the Economy System

export interface Player {
  id: string;
  balance: number;
}

export interface Transaction {
  timestamp: number;
  type: 'add' | 'deduct' | 'transfer';
  from?: string;
  to?: string;
  amount: number;
}

export class EconomySystem {
  private players: Map<string, Player>;
  private transactionHistoryFile: string;

  constructor() {
    this.players = new Map<string, Player>();
    // File path for transaction history directly using Showdown's FS
    this.transactionHistoryFile = 'transactionHistory.json'; // Using a relative path
  }

  // Get the player's balance
  getBalance(id: string): number {
    let player = this.players.get(id);
    if (!player) {
      player = { id, balance: 0 }; // Initialize implicitly if player doesn't exist
      this.players.set(id, player);
    }
    return player.balance;
  }

  // Add currency to a player's balance and log the transaction
  addCurrency(id: string, amount: number): boolean {
    let player = this.players.get(id);
    if (!player) {
      player = { id, balance: 0 }; // Initialize implicitly if player doesn't exist
      this.players.set(id, player);
    }
    if (amount > 0) {
      player.balance += amount;
      this.logTransaction({
        type: 'add',
        amount,
        from: id,
        timestamp: Date.now(),
      });
      return true;
    }
    return false;
  }

  // Deduct currency from a player's balance and log the transaction
  deductCurrency(id: string, amount: number): boolean {
    let player = this.players.get(id);
    if (!player) {
      player = { id, balance: 0 }; // Initialize implicitly if player doesn't exist
      this.players.set(id, player);
    }
    if (player.balance >= amount && amount > 0) {
      player.balance -= amount;
      this.logTransaction({
        type: 'deduct',
        amount,
        from: id,
        timestamp: Date.now(),
      });
      return true;
    }
    return false;
  }

  // Transfer currency from one player to another and log the transaction
  transferCurrency(fromId: string, toId: string, amount: number): boolean {
    let fromPlayer = this.players.get(fromId);
    let toPlayer = this.players.get(toId);

    if (!fromPlayer) {
      fromPlayer = { id: fromId, balance: 0 };
      this.players.set(fromId, fromPlayer);
    }
    if (!toPlayer) {
      toPlayer = { id: toId, balance: 0 };
      this.players.set(toId, toPlayer);
    }

    if (fromPlayer.balance >= amount && amount > 0) {
      fromPlayer.balance -= amount;
      toPlayer.balance += amount;
      this.logTransaction({
        type: 'transfer',
        amount,
        from: fromId,
        to: toId,
        timestamp: Date.now(),
      });
      return true;
    }
    return false;
  }

  // Get leaderboard (top N players by balance)
  getLeaderboard(limit: number = 5): Player[] {
    const sortedPlayers = Array.from(this.players.values()).sort((a, b) => b.balance - a.balance);
    return sortedPlayers.slice(0, limit);
  }

  // Log the transaction to the history file using the FS module
  private logTransaction(transaction: Transaction): void {
    let transactionHistory: Transaction[] = [];
    if (FS.existsSync(this.transactionHistoryFile)) {
      const data = FS.readFileSync(this.transactionHistoryFile, 'utf8');
      transactionHistory = JSON.parse(data);
    }
    transactionHistory.push(transaction);
    FS.writeFileSync(this.transactionHistoryFile, JSON.stringify(transactionHistory, null, 2), 'utf8');
  }

  // Get all transaction history (could be useful for debugging or other features)
  getTransactionHistory(): Transaction[] {
    if (FS.existsSync(this.transactionHistoryFile)) {
      const data = FS.readFileSync(this.transactionHistoryFile, 'utf8');
      return JSON.parse(data);
    }
    return [];
  }
}

// Exporting an instance of the economy system for external use
const economySystem = new EconomySystem();
export default economySystem;
