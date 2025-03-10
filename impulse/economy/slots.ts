import { getBalance, addMoney, takeMoney } from '../../impulse/economy/economy';

const SLOT_COST = 3;
const SLOT_ROOM = 'casino';

// Animated Pokémon Sprites (Gen 3 style)
const slotsTrozei: Record<string, string> = {
    bulbasaur: 'https://play.pokemonshowdown.com/sprites/ani/bulbasaur.gif',
    squirtle: 'https://play.pokemonshowdown.com/sprites/ani/squirtle.gif',
    charmander: 'https://play.pokemonshowdown.com/sprites/ani/charmander.gif',
    pikachu: 'https://play.pokemonshowdown.com/sprites/ani/pikachu.gif',
    eevee: 'https://play.pokemonshowdown.com/sprites/ani/eevee.gif',
    snorlax: 'https://play.pokemonshowdown.com/sprites/ani/snorlax.gif',
    dragonite: 'https://play.pokemonshowdown.com/sprites/ani/dragonite.gif',
    mew: 'https://play.pokemonshowdown.com/sprites/ani/mew.gif',
    mewtwo: 'https://play.pokemonshowdown.com/sprites/ani/mewtwo.gif',
};

function spin(): string {
    const availableSlots = Object.keys(slotsTrozei); // Get available Pokémon names dynamically
    return availableSlots[Math.floor(Math.random() * availableSlots.length)];
}

// Helper function to build the slot machine UI
function buildSlotUI(user: User, resultSlots: string[], won: string | null, isTest: boolean): string {
    const slotSprites = {
        bulbasaur: 'https://play.pokemonshowdown.com/sprites/ani/bulbasaur.gif', squirtle: 'https://play.pokemonshowdown.com/sprites/ani/squirtle.gif',
        charmander: 'https://play.pokemonshowdown.com/sprites/ani/charmander.gif', pikachu: 'https://play.pokemonshowdown.com/sprites/ani/pikachu.gif',
        eevee: 'https://play.pokemonshowdown.com/sprites/ani/eevee.gif', snorlax: 'https://play.pokemonshowdown.com/sprites/ani/snorlax.gif',
        dragonite: 'https://play.pokemonshowdown.com/sprites/ani/dragonite.gif', mew: 'https://play.pokemonshowdown.com/sprites/ani/mew.gif',
        mewtwo: 'https://play.pokemonshowdown.com/sprites/ani/mewtwo.gif',
    };

    let content = `<div style="background: #0d0d0d; color: #fff; border: 1px solid #4f4f4f; border-radius: 8px; padding: 10px; text-align: center; max-width: 100%; font-family: Verdana, sans-serif;">`;
    content += `<h2 style="color: #ffcc00; text-transform: uppercase;">🎰 Pokémon Showdown Slot Machine 🎰</h2>`;
    content += `<p><strong>${user.name}</strong> spins the reels...</p>`;
    content += `<div style="display: flex; justify-content: center; gap: 10px;">`;
    content += `<img src="${slotSprites[resultSlots[0]]}" width="50"> <img src="${slotSprites[resultSlots[1]]}" width="50"> <img src="${slotSprites[resultSlots[2]]}" width="50">`;
    content += `</div><br>`;
    content += won ? `<h2 style="color: #66ff66;">🎉 JACKPOT! You won <strong>15 ${currencyName}!</strong></h2>` 
                   : `<h2 style="color: #ff6666;">😔 Oh no! You lost this round.</h2>`;
    if (isTest) content += `<br><strong style="color: #ffcc00;">[TEST MODE - No money was modified]</strong>`;
    content += `<br><button name="send" value="/slots ${isTest ? 'testspin' : 'spin'}" style="background: #4f4f4f; border: 1px solid #ffcc00; padding: 5px 10px; border-radius: 5px; font-weight: bold; color: white; cursor: pointer;">🔄 Roll Again</button>`;
    content += `</div>`;
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
            const winChance = 70 + Object.keys(slotsTrozei).indexOf(resultSlots[0]) * 3;
            const won = Math.random() * 100 >= winChance ? resultSlots[0] : null;

            if (won) {
                await addMoney(user.id, 15, 'Slot Machine Win');
            } else {
                await takeMoney(user.id, SLOT_COST, 'Slot Machine Spin');
            }

            return this.sendReply(`|uhtml|slot-${user.id}|${buildSlotUI(user, resultSlots, won, false)}`); // Always return this.sendReplyBox()
        },

        async testspin(target, room, user) {
            if (!room || room.roomid !== SLOT_ROOM) {
                return this.errorReply(`Casino games can only be tested in the "${SLOT_ROOM}" room.`);
            }

            this.checkCan('ban');
            if (!this.runBroadcast()) return;

            const resultSlots = [spin(), spin(), spin()];
            const won = Math.random() * 100 >= 70 ? resultSlots[0] : null;

            return this.sendReply(`|uhtml|slot-${user.id}-test|${buildSlotUI(user, resultSlots, won, true)}`); // ✅ Always return this.sendReply()
        },

        help(target, room, user) {
            if (!this.runBroadcast()) return;
            
            let content = `<div style="background: #0d0d0d; color: white; border: 1px solid #4f4f4f; border-radius: 8px; padding: 10px; max-width: 100%; font-family: Verdana, sans-serif;">`;
            content += `<h2 style="color: #ffcc00; text-transform: uppercase; text-align: center;">🎰 Pokémon Showdown Slots 🎰</h2>`;
            content += `<p style="text-align: center;">Try your luck with the slot machine and win Pokédollars!</p>`;
            content += `<strong>How to Play:</strong><ul>`;
            content += `<li><strong>/slots spin</strong> - Play the game (Costs ${SLOT_COST} Pokédollars per spin)</li>`;
            content += `<li><strong>/slots testspin</strong> - Test mode (No balance required, Admins Only)</li>`;
            content += `</ul><strong>Winning Pokémon:</strong><ul>`;
            
            for (const [pokemon, _] of Object.entries(slotsTrozei)) {
                content += `<li>${pokemon.charAt(0).toUpperCase() + pokemon.slice(1)}</li>`;
            }

            content += `</ul></div>`;
            return this.sendReplyBox(content);
        },
    },
};

export default commands;

