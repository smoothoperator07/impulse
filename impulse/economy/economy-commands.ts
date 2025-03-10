/* Economy Commands
* Impulse - impulse.psim.us
* @author TrainerSky <clarkj338@gmail.com>
* @license MIT
* If you want to contribute
* Contact Prince Sy On Main Server
* Or directly create a pull request.
*/

import { getBalance, addMoney, takeMoney, hasBalance, resetBalance, transferMoney, resetAllBalances } from '../../impulse/economy/economy';
import { FS } from '../../lib/fs';

const LOG_FILE = './logs/transactions.log';

global.currencyName = 'Pokèdollars';

export const commands: Chat.ChatCommands = {
    async balance(target, room, user) {
        this.requireRoom();
        const targetUser = toID(target) || toID(user.name);
        const balance = await getBalance(targetUser);
        this.sendReplyBox(`<strong>${targetUser}</strong> has <strong>${balance} ${currencyName}</strong>.`);
    },

    transactionlog(target, room, user) {
        this.checkCan('ban'); // Permission required (@ +)
        if (!FS(LOG_FILE).existsSync()) return this.errorReply("No transaction logs found.");

        let logs = FS(LOG_FILE).readSync().split('\n').filter(line => line.trim().length).reverse();
        let [pageOrUser, pageNumber] = target.split(',').map(t => t.trim());

        let isUserSearch = !!pageOrUser && isNaN(Number(pageOrUser));
        let page = Number(pageOrUser) || 1;
        const perPage = 10;

        if (isUserSearch) {
            let userid = toID(pageOrUser);
            logs = logs.filter(log => log.toLowerCase().includes(userid));
            page = Number(pageNumber) || 1;
        }

        const totalPages = Math.ceil(logs.length / perPage);
        if (page < 1 || page > totalPages) return this.errorReply(`Invalid page. There are ${totalPages || 1} pages.`);

        const start = (page - 1) * perPage;
        const pageLogs = logs.slice(start, start + perPage)
            .map((log, index) => `<strong>${start + index + 1}.</strong> ${log}`).join('<br>');

        user.send(`|uhtmlchange|transactionlog-${user.id}|<div class="infobox"><strong>Transaction Log (Page ${page} of ${totalPages} - Newest First):</strong><br>${pageLogs || "No transactions found."}</div>`);
    },

    eco: {
        async give(target, room, user) {
            this.checkCan('ban'); // Permission required (@ +)
            const [targetUser, amountStr, reason] = target.split(',').map(t => t.trim());

            if (!targetUser || !amountStr || isNaN(Number(amountStr)) || Number(amountStr) <= 0 || !reason) {
                return this.errorReply("Usage: /eco give [user], [positive amount], [reason]");
            }

            const amount = Math.floor(Number(amountStr));
            await addMoney(toID(targetUser), amount, reason);
            
            this.sendReply(`${targetUser} has been given ${amount} ${currencyName}. Reason: ${reason}`);

            // Private notification to target user
            let targetU = Users.get(targetUser);
            if (targetU) targetU.send(`|pm|~|${targetUser}|You have received ${amount} ${currencyName}. Reason: ${reason}`);
        },

        async take(target, room, user) {
            this.checkCan('ban'); // Permission required (@ +)
            const [targetUser, amountStr, reason] = target.split(',').map(t => t.trim());

            if (!targetUser || !amountStr || isNaN(Number(amountStr)) || Number(amountStr) <= 0 || !reason) {
                return this.errorReply("Usage: /eco take [user], [positive amount], [reason]");
            }

            const amount = Math.floor(Number(amountStr));
            const success = await takeMoney(toID(targetUser), amount, reason);

            if (success) {
                this.sendReply(`${amount} ${currencyName} has been taken from ${targetUser}. Reason: ${reason}`);

                // Private notification to target user
                let targetU = Users.get(targetUser);
                if (targetU) targetU.send(`|pm|~|${targetUser}|${amount} ${currencyName} has been taken from you. Reason: ${reason}`);
            } else {
                this.errorReply(`${targetUser} does not have enough ${currencyName}.`);
            }
        },

        async transfer(target, room, user) {
            const [targetUser, amountStr, reason] = target.split(',').map(t => t.trim());

            if (!targetUser || !amountStr || isNaN(Number(amountStr)) || Number(amountStr) <= 0 || !reason) {
                return this.errorReply("Usage: /eco transfer [user], [positive amount], [reason]");
            }

            const amount = Math.floor(Number(amountStr));
            const success = await transferMoney(toID(user.name), toID(targetUser), amount, reason);

            if (success) {
                this.sendReply(`Successfully transferred ${amount} ${currencyName} to ${targetUser}. Reason: ${reason}`);

                // Private notification to recipient
                let targetU = Users.get(targetUser);
                if (targetU) targetU.send(`|pm|~|${targetUser}|You have received ${amount} ${currencyName} from ${user.name}. Reason: ${reason}`);
            } else {
                this.errorReply("Transfer failed. Check your balance.");
            }
        },
        async reset(target, room, user) {
            this.checkCan('ban'); // Permission required (@ +)
            const targetUser = toID(target);
            if (!targetUser) return this.errorReply("Usage: /eco reset [user]");

            await resetBalance(targetUser);
            this.sendReply(`Reset ${targetUser}'s balance to 0.`);
        },

        async resetall(target, room, user) {
            this.checkCan('bypassall'); // Requires admin privileges
            await resetAllBalances();
            this.sendReply(`All users' balances have been reset to 0.`);
        },
			
			async help(target, room, user) {
				this.checkBroadcast(); // Allow + and higher to broadcast
				let content = '<div class="infobox" style="border: 2px solid #FFD700; background: #111;';
				content += ' color: #FFD700; padding: 8px; border-radius: 8px;">';
				content += '<center>';
				content += '<h2 style="color: #FFEA00; text-shadow: 0 0 8px #FFD700; background: none; margin: 0; padding: 0;">⚡ Pokémon Showdown Economy ⚡</h2>';
				content += '<p><em>Manage your ${currencyName} and transactions!</em></p>';
				content += '</center>';
				content += '<strong style="color: #FFDD44;">Commands:</strong><br>';
				content += '<strong>/eco balance [user]</strong> - Check your or another user\'s balance.<br>';
				content += '<strong>/eco give [user], [amount], [reason]</strong> - Give money to a user. <span style="color: #FFAA00;">(Requires @ or higher)</span><br>';
				content += '<strong>/eco take [user], [amount], [reason]</strong> - Take money from a user. <span style="color: #FFAA00;">(Requires @ or higher)</span><br>';
				content += '<strong>/eco transfer [user], [amount], [reason]</strong> - Transfer money to another user.<br>';
				content += '<strong>/eco reset [user]</strong> - Reset a user\'s balance. <span style="color: #FFAA00;">(Requires @ or higher)</span><br>';
				content += '<strong>/eco resetall</strong> - Reset all balances. <span style="color: #FF5500;">(Requires Admin)</span><br>';
				content += '<strong>/eco transactionlog [user or page number]</strong> - View transaction logs. <span style="color: #FFAA00;">(Requires @ or higher)</span>';
				content += '</div>';
				this.sendReplyBox(content);
			},
	 },

    economy: 'eco', // Alias for /eco
};

export default commands;
