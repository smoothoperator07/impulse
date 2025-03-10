import { getBalance, addMoney, takeMoney } from '../../impulse/economy/economy';

// 🎰 Slot Machine Symbols & Payouts
const slots = {
    bulbasaur: 3, squirtle: 6, charmander: 9, pikachu: 12, 
    eevee: 15, snorlax: 17, dragonite: 21, mew: 24, mewtwo: 27,
};

// 🎨 Gen 3 Pokémon Sprites
const getSprite = (pokemon: string) => `https://play.pokemonshowdown.com/sprites/ani/${pokemon}.gif`;

// 🎰 Spins the slot machine
function spin() {
    const availableSlots = Object.keys(slots);
    return availableSlots[Math.floor(Math.random() * availableSlots.length)];
}

export const pages: PageTable = {
    slots(query, user, connection) {
        const balance = getBalance(user.id); // 💰 Get user's balance
        const betAmount = 3;

        if (balance < betAmount) {
            return `<h2 style="color:red;text-align:center;">❌ You need at least ${betAmount} Pokédollars to play! ❌</h2>`;
        }

        // 💸 Deduct balance before spinning
        takeMoney(user.id, betAmount, "Slots bet");

        // 🎰 Perform slot spin
        const slotOne = spin(), slotTwo = spin(), slotThree = spin();
        const isWin = slotOne === slotTwo && slotTwo === slotThree;
        const winnings = isWin ? slots[slotOne] : 0;

        if (isWin) addMoney(user.id, winnings, "Slots winnings"); // 💰 Add winnings if won

        return `
            <style>
                body { background:black; color:white; text-align:center; font-family:Arial; }
                .slot-image { padding:5px; margin:5px; border:2px solid gold; border-radius:5px; width:64px; height:64px; }
                .spin-btn { background:gold; padding:10px; border-radius:5px; cursor:pointer; font-weight:bold; }
            </style>
            <h2>🎰 ${user.name}'s Slot Machine 🎰</h2>
            <h3>💰 Balance: <span id="balance">${balance - betAmount + winnings}</span> Pokédollars</h3>
            <div id="slot-results">
                <img class="slot-image" src="${getSprite(slotOne)}" />
                <img class="slot-image" src="${getSprite(slotTwo)}" />
                <img class="slot-image" src="${getSprite(slotThree)}" />
            </div>
            <p>${isWin ? `🎉 You won ${winnings} Pokédollars! 🎉` : "😢 Better luck next time!"}</p>
            <button class="spin-btn" onclick="window.location.reload()">🔄 Spin Again</button>
        `;
    },
};

export const commands: ChatCommands = {
    slots(target, room, user) {
        this.parse(`/j view-slots`); // ✅ Opens slots page in Pokémon Showdown
    },
};
