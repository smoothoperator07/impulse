import { FS } from '../../lib';
import { economy } from '../../lib'; // Adjust the import path as needed

export const commands: Chat.ChatCommands = {
  balance(target, room, user) {
      if (!target) target = user.name;
      this.runBroadcast(); // Allows broadcasting in chat
      const balance = economy.getBalance(target);
      return this.sendReplyBox(`<strong>${target}</strong> has <strong>${balance}</strong> currency.`);
    },
  
  givemoney(target, room, user) {
    if (!user.can('declare')) return this.errorReply("Access denied.");
    const [targetUser, amountStr] = target.split(',').map(p => p.trim());
    const amount = parseInt(amountStr);
    if (!targetUser || isNaN(amount) || amount <= 0) {
      return this.errorReply("Invalid command usage. Example: /givemoney username, amount");
    }
    economy.addCurrency(targetUser, amount);
    this.addGlobalModAction(`${user.name} gave ${amount} currency to ${targetUser}.`);
    // Notify sender
    this.sendReply(`You have successfully given ${amount} currency to ${targetUser}.`); 
    // Notify the target user
    const targetUserObj = Users.get(targetUser);
    if (targetUserObj) {
      targetUserObj.send(`|pm|${user.name}|${targetUserObj.name}|You have received ${amount} currency from ${user.name}!`);
    }
    },
  
  takemoney(target, room, user) {
    if (!user.can('declare')) return this.errorReply("Access denied.");
    const [targetUser, amountStr] = target.split(',').map(p => p.trim());
    const amount = parseInt(amountStr);
    
    if (!targetUser || isNaN(amount) || amount <= 0) {
        return this.errorReply("Invalid command usage. Example: /takemoney username, amount");
    }

    if (economy.getBalance(targetUser) < amount) {
        return this.errorReply("User does not have enough currency.");
    }

    economy.removeCurrency(targetUser, amount);
    this.addGlobalModAction(`${user.name} took ${amount} currency from ${targetUser}.`);
    // Notify sender
    this.sendReply(`You have successfully taken ${amount} currency to ${targetUser}.`);
    // Notify the target user
    const targetUserObj = Users.get(targetUser);
    if (targetUserObj) {
        targetUserObj.send(`|pm|${user.name}|${targetUserObj.name}|${user.name} has taken ${amount} currency from you.`);
    }
},

  transfermoney(target, room, user) {
    const [targetUser, amountStr] = target.split(',').map(p => p.trim());
    const amount = parseInt(amountStr);
    
    if (!targetUser || isNaN(amount) || amount <= 0) {
        return this.errorReply("Invalid command usage. Example: /transfermoney username, amount");
    }

    if (economy.getBalance(user.name) < amount) {
        return this.errorReply("You do not have enough currency.");
    }

    economy.transferCurrency(user.name, targetUser, amount);
    this.addGlobalModAction(`${user.name} transferred ${amount} currency to ${targetUser}.`);

    // Notify sender
    this.sendReply(`You have successfully transferred ${amount} currency to ${targetUser}.`);

    // Notify recipient
    const targetUserObj = Users.get(targetUser);
    if (targetUserObj) {
        targetUserObj.send(`|pm|${user.name}|${targetUserObj.name}|${user.name} has sent you ${amount} currency.`);
    }
},

    richestuser(target, room, user) {
        const topUsers = economy.getRichestUsers();
        if (!topUsers.length) return this.sendReply("No users found in the economy system.");
        let msg = `Richest Users:\n`;
        for (let i = 0; i < topUsers.length; i++) {
            msg += `${i + 1}. ${topUsers[i].user}: ${topUsers[i].balance} currency\n`;
        }
        return this.sendReplyBox(msg);
    },

  deleteuser(target, room, user) {
    if (!user.can('declare')) return this.errorReply("Access denied.");
    if (!target) return this.errorReply("Please specify a user to delete.");
    
    economy.deleteUser(target);
    this.addGlobalModAction(`${user.name} deleted ${target} from the economy system.`);
    
    // Notify the admin
    this.sendReply(`You have successfully removed ${target} from the economy system.`);

    // Notify the deleted user (if online)
    const targetUserObj = Users.get(target);
    if (targetUserObj) {
        targetUserObj.send(`|pm|${user.name}|${targetUserObj.name}|Your economy data has been deleted by ${user.name}.`);
    }
},

  reset(target, room, user) {
    if (!user.can('declare')) return this.errorReply("Access denied.");
    
    economy.resetAll();
    this.addGlobalModAction(`${user.name} reset all user balances.`);
    this.add('|html|<div class="broadcast-red"><b>The economy has been reset by ' + Chat.escapeHTML(user.name) + '.</b> All balances have been cleared.</div>');

    // Notify all online users via PM
    for (const curUser of Users.users.values()) {
        curUser.send(`|pm|~Server|${curUser.name}|The economy has been reset by ${user.name}. All balances have been cleared.`);
    }
},
  
  transactionssummary(target, room, user) {
    this.runBroadcast(); // Allows broadcasting in chat
    if (!target) target = user.name;
    const transactions = economy.getTransactionHistory(target);
    if (!transactions.length) return this.sendReply("No transactions found for this user.");
    let msg = `Transaction Summary for ${target}:\n`;
    for (const t of transactions) {
      msg += `${new Date(t.timestamp).toLocaleString()} - ${t.type} - ${t.amount}\n`;
    }
    return this.sendReplyBox(msg);
  },
};

