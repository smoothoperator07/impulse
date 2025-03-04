import { economy } from '../../lib/economy';

export const commands: Chat.ChatCommands = {
    balance: async function (target, room, user) {
        this.runBroadcast(); // Allows broadcasting
        if (!target) target = user.name;

        const balance = await economy.getBalance(target);
        this.sendReplyBox(`${target} has <strong>${balance}</strong> currency.`);
    },

    givemoney: async function (target, room, user) {
        if (!user.can('declare')) return this.errorReply("Access denied.");
        const [targetUser, amountStr] = target.split(',').map(p => p.trim());
        const amount = parseInt(amountStr);

        if (!targetUser || isNaN(amount) || amount <= 0) {
            return this.errorReply("Invalid usage. Example: /givemoney username, amount");
        }

        await economy.addCurrency(targetUser, amount);
        this.addGlobalModAction(`${user.name} gave ${amount} currency to ${targetUser}.`);

        // Notify sender
        this.sendReply(`You have successfully given ${amount} currency to ${targetUser}.`);

        // Notify target user
        const targetUserObj = Users.get(targetUser);
        if (targetUserObj) {
            targetUserObj.send(`|pm|${user.name}|${targetUserObj.name}|You have received ${amount} currency from ${user.name}!`);
        }
    },

    takemoney: async function (target, room, user) {
        if (!user.can('declare')) return this.errorReply("Access denied.");
        const [targetUser, amountStr] = target.split(',').map(p => p.trim());
        const amount = parseInt(amountStr);

        if (!targetUser || isNaN(amount) || amount <= 0) {
            return this.errorReply("Invalid usage. Example: /takemoney username, amount");
        }

        const balance = await economy.getBalance(targetUser);
        if (balance < amount) return this.errorReply("User does not have enough currency.");

        await economy.removeCurrency(targetUser, amount);
        this.addGlobalModAction(`${user.name} took ${amount} currency from ${targetUser}.`);

        // Notify target user
        const targetUserObj = Users.get(targetUser);
        if (targetUserObj) {
            targetUserObj.send(`|pm|${user.name}|${targetUserObj.name}|${user.name} has taken ${amount} currency from you.`);
        }
    },

    transfermoney: async function (target, room, user) {
        const [targetUser, amountStr] = target.split(',').map(p => p.trim());
        const amount = parseInt(amountStr);

        if (!targetUser || isNaN(amount) || amount <= 0) {
            return this.errorReply("Invalid usage. Example: /transfermoney username, amount");
        }

        const balance = await economy.getBalance(user.name);
        if (balance < amount) return this.errorReply("You do not have enough currency.");

        await economy.transferCurrency(user.name, targetUser, amount);
        this.addGlobalModAction(`${user.name} transferred ${amount} currency to ${targetUser}.`);

        // Notify both users
        this.sendReply(`You successfully transferred ${amount} currency to ${targetUser}.`);
        const targetUserObj = Users.get(targetUser);
        if (targetUserObj) {
            targetUserObj.send(`|pm|${user.name}|${targetUserObj.name}|${user.name} has transferred ${amount} currency to you.`);
        }
    },

    richestuser: async function (target, room, user) {
        this.runBroadcast(); // Allows broadcasting

        const limit = target.toLowerCase() === 'all' ? 100 : 20;
        if (target.toLowerCase() === 'all' && this.broadcasting) {
            return this.errorReply("You cannot broadcast the full top 100 list.");
        }

        const topUsers = await economy.getRichestUsers(limit);
        if (!topUsers.length) return this.sendReplyBox("No users found in the economy system.");

        let msg = `<div style="max-height:300px; overflow:auto; padding:5px; border:1px solid #444; background:#222; color:white;">`;
        msg += `<strong>Richest Users:</strong><br>`;
        topUsers.forEach((user, i) => {
            msg += `${i + 1}. <strong>${user.user}</strong>: ${user.balance} currency<br>`;
        });
        msg += `</div>`;

        this.sendReplyBox(msg);
    },

    reset: async function (target, room, user) {
        if (!user.can('declare')) return this.errorReply("Access denied.");

        await economy.resetAll();
        this.addGlobalModAction(`${user.name} reset all user balances.`);

        // Notify all online users
        Users.broadcast(`|html|<div style="background:#222; color:white; padding:10px; border:1px solid #444;"><strong>Alert:</strong> All economy balances have been reset by ${user.name}.</div>`);
    },

    deleteuser: async function (target, room, user) {
        if (!user.can('declare')) return this.errorReply("Access denied.");
        if (!target) return this.errorReply("Please specify a user to delete.");

        await economy.deleteUser(target);
        this.addGlobalModAction(`${user.name} deleted ${target} from the economy system.`);

        // Notify target user
        const targetUserObj = Users.get(target);
        if (targetUserObj) {
            targetUserObj.send(`|pm|${user.name}|${targetUserObj.name}|Your economy data has been deleted by ${user.name}.`);
        }
    },

    economyhelp: function (target, room, user) {
        this.runBroadcast();
		 this.sendReplyBox(`<div style="max-height:300px; overflow:auto; padding:5px; border:1px solid #444; background:#222; color:white;"><strong>Economy Commands:</strong><br><strong>/balance [username]</strong> - Shows your or another user's balance.<br><strong>/givemoney [username], [amount]</strong> - Give a user currency. (Admin only)<br><strong>/takemoney [username], [amount]</strong> - Remove currency from a user. (Admin only)<br><strong>/transfermoney [username], [amount]</strong> - Transfer currency to another user.<br><strong>/richestuser</strong> - Show the top 20 richest users.<br><strong>/richestuser all</strong> - Show the top 100 richest users (non-broadcast).<br><strong>/reset</strong> - Reset all balances. (Admin only)<br><strong>/deleteuser [username]</strong> - Delete a user's economy data. (Admin only)<br></div>`);
    },
};
