import { getBalance, addMoney, takeMoney } from '../../impulse/economy/economy';
import * as JSX from '../chat-jsx';

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

// 🎮 Display JSX Component
function SlotDisplay({ user, slotOne, slotTwo, slotThree, result, winnings }) {
    return <JSX.Fragment>
        <style>
            {`
            .slot-container { background: black; padding: 10px; border-radius: 8px; text-align: center; }
            .slot-image { padding: 5px; border: 2px solid gold; border-radius: 5px; width: 64px; height: 64px; }
            .result-text { color: white; font-weight: bold; }
            `}
        </style>
        <div class="slot-container">
            <h3 style="color: gold;">🎰 {user.name}'s Slot Machine 🎰</h3>
            <div>
                <img class="slot-image" src={getSprite(slotOne)} />
                <img class="slot-image" src={getSprite(slotTwo)} />
                <img class="slot-image" src={getSprite(slotThree)} />
            </div>
            <p class="result-text">
                {result ? `🎉 You won ${winnings} Pokédollars! 🎉` : "😢 Better luck next time!"}
            </p>
        </div>
    </JSX.Fragment>;
}

export const commands: ChatCommands = {
    slots: {
        async spin(target, room, user) {
            if (!room || !this.runBroadcast()) return false;
            
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

            // 📺 Display result
            return this.sendReplyBox(<SlotDisplay user={user} slotOne={slotOne} slotTwo={slotTwo} slotThree={slotThree} result={isWin} winnings={winnings} />);
        },
    },
};
          
