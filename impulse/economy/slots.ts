import { getBalance, addMoney, takeMoney } from '../../impulse/economy/economy';

const SLOT_COST = 3;
const SLOT_ROOM = 'casino';

// Available Pokémon and their payouts
const slots: Record<string, number> = {
    bulbasaur: 3, squirtle: 6, charmander: 9, pikachu: 12, eevee: 15,
    snorlax: 17, dragonite: 21, mew: 24, mewtwo: 27,
};

// Pokémon Trozei sprites
const slotsTrozei: Record<string, string> = {
    bulbasaur: 'http://www.pokestadium.com/assets/img/sprites/misc/trozei/bulbasaur.gif',
    squirtle: 'http://www.pokestadium.com/assets/img/sprites/misc/trozei/squirtle.gif',
    charmander: 'http://www.pokestadium.com/assets/img/sprites/misc/trozei/charmander.gif',
    pikachu: 'http://www.pokestadium.com/assets/img/sprites/misc/trozei/pikachu.gif',
    eevee: 'http://www.pokestadium.com/assets/img/sprites/misc/trozei/eevee.gif',
    snorlax: 'http://www.pokestadium.com/assets/img/sprites/misc/trozei/snorlax.gif',
    dragonite: 'http://www.pokestadium.com/assets/img/sprites/misc/trozei/dragonite.gif',
    mew: 'http://www.pokestadium.com/assets/img/sprites/misc/trozei/mew.gif',
    mewtwo: 'http://www.pokestadium.com/assets/img/sprites/misc/trozei/mewtwo.gif',
};

const availableSlots = Object.keys(slots);

// Get a random Pokémon slot
function spin(): string {
    return availableSlots[Math.floor(Math.random() * availableSlots.length)];
}

// Generate a random number (0-99)
function rng(): number {
    return Math.floor(Math.random() * 100);
}

// Display the slot results
function displayResult(user: User, slotOne: string, slotTwo: string, slotThree: string, wonAmount?: number, isTest = false): string {
    let content = `<div style="padding: 5px; background: black; border-radius: 5px; text-align: center;">`;
    content += `<center>`;
    content += `<img src="http://i.imgur.com/p2nObtE.gif" width="300" height="70"><br>`;
    content += `<img src="${slotsTrozei[slotOne]}" style="border: 2px solid gold; border-radius: 5px;"> `;
    content += `<img src="${slotsTrozei[slotTwo]}" style="border: 2px solid gold; border-radius: 5px;"> `;
    content += `<img src="${slotsTrozei[slotThree]}" style="border: 2px solid gold; border-radius: 5px;">`;
    content += `<br><br>`;

    const winText = wonAmount
        ? `🎉 Congratulations, ${user.name}! You won <strong>${wonAmount} Pokédollars!</strong>`
        : `😔 Aww... bad luck, ${user.name}. Better luck next time!`;

    content += `<font style="color: white;">${winText}</font>`;
    if (isTest) content += `<br><strong>[TEST MODE - No money was modified]</strong>`;
    
    content += `</center>`;
    content += `</div>`;

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

            const selectedSlot = spin();
            const chancePercentage = rng();
            const winChance = 70 + availableSlots.indexOf(selectedSlot) * 3;

            if (chancePercentage >= winChance) {
                await addMoney(user.id, slots[selectedSlot], 'Slot Machine Win');
                return this.sendReplyBox(displayResult(user, selectedSlot, selectedSlot, selectedSlot, slots[selectedSlot]));
            }

            let [outcomeOne, outcomeTwo, outcomeThree] = [spin(), spin(), spin()];
            while (outcomeOne === outcomeTwo && outcomeTwo === outcomeThree) {
                [outcomeOne, outcomeTwo, outcomeThree] = [spin(), spin(), spin()];
            }

            await takeMoney(user.id, SLOT_COST, 'Slot Machine Spin');
            return this.sendReplyBox(displayResult(user, outcomeOne, outcomeTwo, outcomeThree));
        },

        async testspin(target, room, user) {
            if (!room || room.roomid !== SLOT_ROOM) {
                return this.errorReply(`Casino games can only be tested in the "${SLOT_ROOM}" room.`);
            }

            this.checkCan('ban'); // Restrict test mode to room auth (@ and above)
            if (!this.runBroadcast()) return;

            const selectedSlot = spin();
            const chancePercentage = rng();
            const winChance = 70 + availableSlots.indexOf(selectedSlot) * 3;

            if (chancePercentage >= winChance) {
                return this.sendReplyBox(displayResult(user, selectedSlot, selectedSlot, selectedSlot, slots[selectedSlot], true));
            }

            let [outcomeOne, outcomeTwo, outcomeThree] = [spin(), spin(), spin()];
            while (outcomeOne === outcomeTwo && outcomeTwo === outcomeThree) {
                [outcomeOne, outcomeTwo, outcomeThree] = [spin(), spin(), spin()];
            }

            return this.sendReplyBox(displayResult(user, outcomeOne, outcomeTwo, outcomeThree, undefined, true));
        },
      
      help(target, room, user) {
        if (!this.runBroadcast()) return;
        let content = `<div class="infobox">`;
        content += `<h2>🎰 Pokémon Showdown Slots 🎰</h2>`;
        content += `<p>Try your luck with the slot machine and win Pokédollars!</p>`;
        content += `<strong>How to Play:</strong>`;
        content += `<ul>`;
        content += `<li><strong>/slots spin</strong> - Play the game (Costs ${SLOT_COST} ${currencyName} per spin)</li>`;
        content += `<li><strong>/slots testspin</strong> - Test the game (No balance required, Admins Only)</li>`;
        content += `</ul>`;
        content += `<strong>Winnings:</strong>`;
        content += `<ul>`;
        for (const [pokemon, amount] of Object.entries(slots)) {
          content += `<li>${pokemon.charAt(0).toUpperCase() + pokemon.slice(1)}: ${amount} Pokédollars</li>`;
        }
        content += `</ul>`;
        content += `</div>`;
        return this.sendReplyBox(content);
      },
    },

    slotshelp(target, room, user) {
        return this.parse('/slots help');
    },
};

export default commands;
