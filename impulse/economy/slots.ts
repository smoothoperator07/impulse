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

/*
// Slot result display with rolling animation
function displaySlotResult(user: User, finalSlots: string[], wonAmount?: number, isTest = false): string {
    let content = `<div style="padding: 10px; background: black; border: 3px solid gold; border-radius: 10px; text-align: center;">`;
    content += `<center>`;
    content += `<h2 style="color: gold;">🎰 Pokémon Showdown Slot Machine 🎰</h2>`;
    content += `<p><strong>${user.name}</strong> pulls the lever...</p>`;

    // Slot reels (rolling animation)
    content += `<table style="margin: auto; border-spacing: 10px;">`;
    content += `<tr>`;
    for (let i = 0; i < 3; i++) {
        content += `<td style="border: 2px solid gold; padding: 5px;">`;
        content += `<img src="https://play.pokemonshowdown.com/sprites/ani/rotom.gif" width="80" id="slot-${i}">`; // Temporary rolling sprite
        content += `</td>`;
    }
    content += `</tr></table>`;

    content += `<br><p><strong>Rolling...</strong></p>`;

    // Delayed reveal using Pokémon Showdown's UHTML system
    setTimeout(() => {
        let revealContent = `<div style="padding: 10px; background: black; border: 3px solid gold; border-radius: 10px; text-align: center;">`;
        revealContent += `<center>`;
        revealContent += `<h2 style="color: gold;">🎰 Pokémon Showdown Slot Machine 🎰</h2>`;
        revealContent += `<p><strong>${user.name}</strong> spins the reels...</p>`;

        revealContent += `<table style="margin: auto; border-spacing: 10px;">`;
        revealContent += `<tr>`;
        for (let i = 0; i < 3; i++) {
            revealContent += `<td style="border: 2px solid gold; padding: 5px;">`;
            revealContent += `<img src="${slotsTrozei[finalSlots[i]]}" width="80">`; // Final Pokémon
            revealContent += `</td>`;
        }
        revealContent += `</tr></table>`;

        revealContent += `<br>`;

        if (wonAmount) {
            revealContent += `<h2 style="color: green;">🎉 JACKPOT! You won <strong>${wonAmount} Pokédollars!</strong></h2>`;
        } else {
            revealContent += `<h2 style="color: red;">😔 Oh no! You lost this round.</h2>`;
        }

        if (isTest) revealContent += `<br><strong>[TEST MODE - No money was modified]</strong>`;

        revealContent += `</center></div>`;
        user.send(`|uhtmlchange|slot-${user.id}|${revealContent}`);
    }, 3000); // 3 seconds delay for rolling effect

    content += `</center></div>`;
    return `|uhtml|slot-${user.id}|${content}`; // Unique UHTML key to update the result dynamically
}
*/

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
        return this.errorReply(`You need at least ${SLOT_COST} Pokédollars to play. You are missing ${SLOT_COST - userBalance}.`);
    }

    // Generate slot results instantly
    const resultSlots = [spin(), spin(), spin()];
    const winChance = 70 + Object.keys(slotsTrozei).indexOf(resultSlots[0]) * 3;
    const won = Math.random() * 100 >= winChance ? resultSlots[0] : null;

    if (won) {
        await addMoney(user.id, 15, 'Slot Machine Win');
    } else {
        await takeMoney(user.id, SLOT_COST, 'Slot Machine Spin');
    }

    // Pokémon Game Corner Slots Backgrounds for Light & Dark Themes
    const lightBackground = "https://archives.bulbagarden.net/media/upload/8/8c/FRLG_Game_Corner.png"; 
    const darkBackground = "https://archives.bulbagarden.net/media/upload/9/9b/Gen3_Game_Corner_Night.png";

    // Inline theme-adaptive content using 'content' +
    let content = `<div style="position: relative;width: 320px; height: 240px;` +
        `background: url('${lightBackground}') no-repeat center center; background-size: cover;` +
        `border: 3px solid gold; border-radius: 10px; text-align: center;"class="light-mode"onmouseover="this.style.backgroundImage='url(${darkBackground})'"onmouseout="this.style.backgroundImage='url(${lightBackground})'">`;
    
    content += `<h2 style="color: gold;">🎰 Pokémon Showdown Slot Machine 🎰</h2>`;
    content += `<p><strong>${user.name}</strong> spins the reels...</p>`;
    content += `<div style="position: absolute; top: 70px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px;">`;
    content += `<img src="${slotsTrozei[resultSlots[0]]}" width="50"> `;
    content += `<img src="${slotsTrozei[resultSlots[1]]}" width="50"> `;
    content += `<img src="${slotsTrozei[resultSlots[2]]}" width="50">`;
    content += `</div>`;
    content += `<br><br>`;
    content += won 
        ? `<h2 style="color: green;">🎉 JACKPOT! You won <strong>15 Pokédollars!</strong></h2>` 
        : `<h2 style="color: red;">😔 Oh no! You lost this round.</h2>`;
    content += `<br>`;
    content += `<button name="send" value="/slots spin" style="background: gold; border: 2px solid black; padding: 5px 10px; border-radius: 5px; font-weight: bold;">🔄 Roll Again</button>`;
    content += `</div>`;

    // Send final results using sendReplyBox()
    this.sendReplyBox(content);
		 },

        async testspin(target, room, user) {
            if (!room || room.roomid !== SLOT_ROOM) {
                return this.errorReply(`Casino games can only be tested in the "${SLOT_ROOM}" room.`);
            }

            this.checkCan('ban');
            if (!this.runBroadcast()) return;

            const resultSlots = [spin(), spin(), spin()];
            this.sendReply(displaySlotResult(user, resultSlots, 0, true));
        },

        help(target, room, user) {
            if (!this.runBroadcast()) return;
            let content = `<div class="infobox">`;
            content += `<h2>🎰 Pokémon Showdown Slots 🎰</h2>`;
            content += `<p>Try your luck with the slot machine and win Pokédollars!</p>`;
            content += `<strong>How to Play:</strong>`;
            content += `<ul>`;
            content += `<li><strong>/slots spin</strong> - Play the game (Costs ${SLOT_COST} Pokédollars per spin)</li>`;
            content += `<li><strong>/slots testspin</strong> - Test the game (No balance required, Admins Only)</li>`;
            content += `</ul>`;
            content += `<strong>Winnings:</strong>`;
            content += `<ul>`;
            for (const [pokemon, amount] of Object.entries(slotsTrozei)) {
                content += `<li>${pokemon.charAt(0).toUpperCase() + pokemon.slice(1)}</li>`;
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
