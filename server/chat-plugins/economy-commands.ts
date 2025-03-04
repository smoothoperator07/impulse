import { EconomySystem } from '../../lib/economy';
const economy = new EconomySystem();

export const commands: Chat.ChatCommands = {
	balance: async function (target, room, user) {
    this.runBroadcast(); // Allows broadcasting
    const targetUser = (target ? target.trim().toLowerCase() : user.name.toLowerCase());

    const balance = await economy.getBalance(targetUser);
    this.sendReplyBox(`${targetUser} has ${balance} currency.`);
},
	
	givemoney: async function (target, room, user) {
    if (!user.can('declare')) return this.errorReply("Access denied.");
    
    const [targetUserRaw, amountStr] = target.split(',').map(p => p.trim());
    const targetUser = targetUserRaw?.toLowerCase(); // Trim and lowercase username
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

    const [targetUserRaw, amountStr] = target.split(',').map(p => p.trim());
    const targetUser = targetUserRaw?.toLowerCase();
    const amount = parseInt(amountStr);

    if (!targetUser || isNaN(amount) || amount <= 0) {
        return this.errorReply("Invalid usage. Example: /takemoney username, amount");
    }

    const balance = await economy.getBalance(targetUser);
    if (balance < amount) return this.errorReply("User does not have enough currency.");

    await economy.removeCurrency(targetUser, amount);
    this.addGlobalModAction(`${user.name} took ${amount} currency from ${targetUser}.`);

    // Notify sender
    this.sendReply(`You have successfully taken ${amount} currency from ${targetUser}.`);

    // Notify target user
    const targetUserObj = Users.get(targetUser);
    if (targetUserObj) {
        targetUserObj.send(`|pm|${user.name}|${targetUserObj.name}|${user.name} has taken ${amount} currency from you.`);
    }
},

	transfermoney: async function (target, room, user) {
    const [targetUserRaw, amountStr] = target.split(',').map(p => p.trim());
    const targetUser = targetUserRaw?.toLowerCase();
    const amount = parseInt(amountStr);

    if (!targetUser || isNaN(amount) || amount <= 0) {
        return this.errorReply("Invalid usage. Example: /transfermoney username, amount");
    }

    const sender = user.name.toLowerCase();
    if (sender === targetUser) return this.errorReply("You cannot transfer money to yourself.");
    if (await economy.getBalance(sender) < amount) return this.errorReply("You do not have enough currency.");

    await economy.transferCurrency(sender, targetUser, amount);
    this.addGlobalModAction(`${user.name} transferred ${amount} currency to ${targetUser}.`);

    // Notify sender
    this.sendReply(`You have successfully transferred ${amount} currency to ${targetUser}.`);

    // Notify recipient
    const targetUserObj = Users.get(targetUser);
    if (targetUserObj) {
        targetUserObj.send(`|pm|${user.name}|${targetUserObj.name}|You have received ${amount} currency from ${user.name}!`);
    }
},

	richestuser: async function (target, room, user) {
    if (target && target.trim().toLowerCase() === "all") {
        // Show top 100 but do not broadcast
        const topUsers = await economy.getRichestUsers(100);
        if (!topUsers.length) return this.sendReplyBox("No users found in the economy system.");

        let msg = `<strong>Top 100 Richest Users:</strong><br>`;
        for (let i = 0; i < topUsers.length; i++) {
            msg += `${i + 1}. <strong>${topUsers[i].user}</strong>: ${topUsers[i].balance} currency<br>`;
        }

        return this.sendReplyBox(
            `<div style="max-height: 300px; overflow: auto; padding: 5px; border: 1px solid #444; background: #222; color: white;">${msg}</div>`
        );
    }

    this.runBroadcast(); // Allow broadcasting

    const topUsers = await economy.getRichestUsers(20); // Get top 20 users
    if (!topUsers.length) return this.sendReplyBox("No users found in the economy system.");

    let msg = `<strong>Top 20 Richest Users:</strong><br>`;
    for (let i = 0; i < topUsers.length; i++) {
        msg += `${i + 1}. <strong>${topUsers[i].user}</strong>: ${topUsers[i].balance} currency<br>`;
    }

    return this.sendReplyBox(
        `<div style="max-height: 300px; overflow: auto; padding: 5px; border: 1px solid #444; background: #222; color: white;">${msg}</div>`
    );
},
	
	reset: async function (target, room, user) {
    if (!user.can('declare')) return this.errorReply("Access denied.");

    await economy.resetAll();
    this.addGlobalModAction(`${user.name} has reset all user balances.`);

    // Notify all online users
    room.add(`|html|<div style="border: 1px solid #444; background: #222; color: white; padding: 5px;">All user balances have been reset by ${user.name}.</div>`);
},

	deleteuser: async function (target, room, user) {
    if (!user.can('declare')) return this.errorReply("Access denied.");
    
    const targetUser = target.trim().toLowerCase();
    if (!targetUser) return this.errorReply("Please specify a user to delete.");

    await economy.deleteUser(targetUser);
    this.addGlobalModAction(`${user.name} deleted ${targetUser} from the economy system.`);

    // Notify sender
    this.sendReply(`You have successfully deleted ${targetUser} from the economy system.`);

    // Notify target user if online
    const targetUserObj = Users.get(targetUser);
    if (targetUserObj) {
        targetUserObj.send(`|pm|${user.name}|${targetUserObj.name}|Your economy data has been deleted by ${user.name}.`);
    }
},

    economyhelp: function (target, room, user) {
        this.runBroadcast();
		 this.sendReplyBox(`<div style="max-height:300px; overflow:auto; padding:5px; border:1px solid #444; background:#222; color:white;"><strong><center>Economy Commands:</center></strong><br><strong>/balance [username]</strong> - Shows your or another user's balance.<br><strong>/givemoney [username], [amount]</strong> - Give a user currency. (Admin only)<br><strong>/takemoney [username], [amount]</strong> - Remove currency from a user. (Admin only)<br><strong>/transfermoney [username], [amount]</strong> - Transfer currency to another user.<br><strong>/richestuser</strong> - Show the top 20 richest users.<br><strong>/richestuser all</strong> - Show the top 100 richest users (non-broadcast).<br><strong>/reset</strong> - Reset all balances. (Admin only)<br><strong>/deleteuser [username]</strong> - Delete a user's economy data. (Admin only)<br></div>`);
    },
};
