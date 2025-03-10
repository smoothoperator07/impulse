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

// 🎮 Slot Machine Display Component
function SlotDisplay({ user, slotOne, slotTwo, slotThree, result, winnings }) {
    return `<div style="background:black;padding:10px;border-radius:8px;text-align:center;"><h3 style="color:gold;">🎰 ${user.name}'s Slot Machine 🎰</h3><div><img style="padding:5px;border:2px solid gold;border-radius:5px;width:64px;height:64px;" src="${getSprite(slotOne)}" /><img style="padding:5px;border:2px solid gold;border-radius:5px;width:64px;height:64px;" src="${getSprite(slotTwo)}" /><img style="padding:5px;border:2px solid gold;border-radius:5px;width:64px;height:64px;" src="${getSprite(slotThree)}" /></div><p style="color:white;font-weight:bold;">${result ? `🎉 You won ${winnings} Pokédollars! 🎉` : "😢 Better luck next time!"}</p></div>`;
}

export const commands: ChatCommands = {
    slots: {
        async spin(target, room, user) {
            if (!room || !this.runBroadcast()) return false; // ✅ Allow all users to broadcast
            
            // 💰 Check user's balance
            const balance = await getBalance(user.id);
            const betAmount = 3;
            if (balance < betAmount) return this.errorReply(`You need at least ${betAmount} Pokédollars to play!`);

            // 🔄 Perform slot spin
            const slotOne = spin(), slotTwo = spin(), slotThree = spin();
            const isWin = slotOne === slotTwo && slotTwo === slotThree;
            const winnings = isWin ? slots[slotOne] : 0;

            // 💸 Update balance
            await takeMoney(user.id, betAmount, "Slots bet");
            if (isWin) await addMoney(user.id, winnings, "Slots winnings");

            // 📺 Broadcast slot results using our own `this.sendStyledBroadcast()`
            this.sendStyledBroadcast(SlotDisplay({ user, slotOne, slotTwo, slotThree, result: isWin, winnings }));
        },
    },
};
