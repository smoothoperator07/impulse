import { getBalance, addMoney, takeMoney } from '../../impulse/economy/economy';

const SLOT_COST = 3;
const SLOT_ROOM = 'casino';

const slotSprites = {
        bulbasaur: 'https://play.pokemonshowdown.com/sprites/gen3/bulbasaur.png', squirtle: 'https://play.pokemonshowdown.com/sprites/gen3/squirtle.png',
        charmander: 'https://play.pokemonshowdown.com/sprites/gen3/charmander.png', pikachu: 'https://play.pokemonshowdown.com/sprites/gen3/pikachu.png',
        eevee: 'https://play.pokemonshowdown.com/sprites/gen3/eevee.png', snorlax: 'https://play.pokemonshowdown.com/sprites/gen3/snorlax.png',
        dragonite: 'https://play.pokemonshowdown.com/sprites/gen3/dragonite.png', mew: 'https://play.pokemonshowdown.com/sprites/gen3/mew.png',
        mewtwo: 'https://play.pokemonshowdown.com/sprites/gen3/mewtwo.png',
    };

function spin(): string {
    const availableSlots = Object.keys(slotSprites); // Get available Pokémon names dynamically
    return availableSlots[Math.floor(Math.random() * availableSlots.length)];
}

// Helper function to build the slot machine UI
function buildSlotUI(user: User, resultSlots: string[], won: string | null, isTest: boolean): string {

    let content = `<div style="display: flex; justify-content: center; width: 100%;">`; // Center entire slot machine
    content += `<div style="background: #0d0d0d; color: #ffffff; border: 1px solid #4f4f4f; border-radius: 8px; padding: 10px; text-align: center; font-family: Verdana, sans-serif;">`;
    content += `<h2 style="color: #ffcc00; text-transform: uppercase;">🎰 Pokémon Showdown Slot Machine 🎰</h2>`;
    content += `<p><strong>${user.name}</strong> pulls the lever...</p>`;

    // Center the sprite section
    content += `<div style="display: flex; justify-content: center; align-items: center; gap: 500px; padding: 10px;">`;
    for (const slot of resultSlots) {
        content += `<img src="${slotSprites[slot]}" width="50" style="border: 2px solid #ffcc00; border-radius: 3px; display: block;">`;
    }
    content += `</div>`;

    content += `<br>`;
    content += won 
        ? `<h2 style="color: #66ff66;">🎉 JACKPOT! You won <strong>15 Pokédollars!</strong></h2>` 
        : `<h2 style="color: #ff6666;">😔 Oh no! You lost this round.</h2>`;

    if (isTest) {
        content += `<p style="color: #ffcc00;"><strong>[TEST MODE - No money was modified]</strong></p>`;
    }

    content += `<div style="margin-top: 10px;">`;
    content += `<button name="send" value="/slots ${isTest ? 'testspin' : 'spin'}" style="background: #4f4f4f; border: 1px solid #ffcc00; padding: 5px 10px; border-radius: 5px; font-weight: bold; color: white; cursor: pointer;">🔄 Roll Again</button>`;
    content += `</div>`;

    content += `</div></div>`; // Close outer div to center everything

    return content;
}

export const commands: Chat.ChatCommands = {
    slots: {
		 async spin(target, room, user) {
            if (!room || room.roomid !== SLOT_ROOM) {
                return this.errorReply(`Casino games can only be played in the "${SLOT_ROOM}" room.`);
            }

            this.checkChat();
            if (!this.runBroadcast()) return;

            const userBalance = await getBalance(user.id);
            if (userBalance < SLOT_COST) {
                return this.errorReply(`You need at least ${SLOT_COST} ${currencyName} to play. You are missing ${SLOT_COST - userBalance}.`);
            }

            const resultSlots = [spin(), spin(), spin()];
            const winChance = 70 + Object.keys(slotSprites).indexOf(resultSlots[0]) * 3;
            const won = Math.random() * 100 >= winChance ? resultSlots[0] : null;

            if (won) {
					await addMoney(user.id, 15, 'Slot Machine Win');
            } else {
                await takeMoney(user.id, SLOT_COST, 'Slot Machine Spin');
            }

			 this.sendReply(buildSlotUI(user, resultSlots, won, false)); // Now always executes
        },

		 async testspin(target, room, user) {
            if (!room || room.roomid !== SLOT_ROOM) {
                return this.errorReply(`Casino games can only be tested in the "${SLOT_ROOM}" room.`);
            }

            this.checkCan('ban');
            if (!this.runBroadcast()) return;

            const resultSlots = [spin(), spin(), spin()];
            const won = Math.random() * 100 >= 70 ? resultSlots[0] : null;

			 this.sendReplyBox(buildSlotUI(user, resultSlots, won, true)); // Now always executes
        },

        help(target, room, user) {
            if (!this.runBroadcast()) return;
            
            let content = `<div style="background: #0d0d0d; color: white; border: 1px solid #4f4f4f; border-radius: 8px; padding: 10px; max-width: 100%; font-family: Verdana, sans-serif;">`;
            content += `<h2 style="color: #ffcc00; text-transform: uppercase; text-align: center;">🎰 Pokémon Showdown Slots 🎰</h2>`;
            content += `<p style="text-align: center;">Try your luck with the slot machine and win Pokédollars!</p>`;
            content += `<strong>How to Play:</strong><ul>`;
            content += `<li><strong>/slots spin</strong> - Play the game (Costs ${SLOT_COST} ${currencyName} per spin)</li>`;
            content += `<li><strong>/slots testspin</strong> - Test mode (No balance required, Admins Only)</li>`;
            content += `</ul><strong>Winning Pokémon:</strong><ul>`;
            
            for (const [pokemon, _] of Object.entries(slotSprites)) {
                content += `<li>${pokemon.charAt(0).toUpperCase() + pokemon.slice(1)}</li>`;
            }

            content += `</ul></div>`;
            return this.sendReplyBox(content);
        },
    },
};

export default commands;

