/*import { giveMoney, takeMoney, saveEconomy, transferMoney } from '../../chat-plugins';

// Define the possible prizes on the roulette wheel
const roulettePrizes = [
    { type: 'money', amount: 50, icon: '💰' },
    { type: 'money', amount: 100, icon: '💰' },
    { type: 'money', amount: 200, icon: '💰' },
    { type: 'item', name: 'Rare Candy', icon: '🍬' },
    { type: 'pokemon', name: 'Pikachu', icon: 'pikachu', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png' },
    { type: 'pokemon', name: 'Bulbasaur', icon: 'bulbasaur', sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png' },
    { type: 'nothing', icon: '❌' },
];

// Function to simulate the roulette spin
function spinRoulette(betAmount: number, userID: string): string {
    const balance = getBalance(userID); // Check current balance

    if (balance < betAmount) {
        return `You don't have enough money to play. Your current balance is **${balance} coins**.`;
    }

    // Deduct the bet from the player's balance
    giveMoney(userID, -betAmount);

    // Spin the wheel (random selection from prizes)
    const prizeIndex = Math.floor(Math.random() * roulettePrizes.length);
    const prize = roulettePrizes[prizeIndex];

    let resultMessage = `🎉 **You spun the roulette and...** 🎉\n`;

    // Determine the outcome based on the prize
    if (prize.type === 'money') {
        giveMoney(userID, prize.amount); // Award the money
        resultMessage += `**Congratulations!** You won **${prize.amount} coins** ${prize.icon}!`;
    } else if (prize.type === 'item') {
        resultMessage += `You won a **${prize.name}** ${prize.icon}! 🎁`;
        // Add item handling (could be a separate function to manage inventory)
    } else if (prize.type === 'pokemon') {
        resultMessage += `You caught a **${prize.name}**! 🐾\n`;
        resultMessage += `![${prize.name}]( ${prize.sprite} )`; // Display the Pokémon sprite image
    } else {
        resultMessage += `Unfortunately, you won **nothing**. Try again next time! ${prize.icon}`;
    }

    // Save updated economy data
    saveEconomy();

    return resultMessage;
}

// Define the chat plugin command
export const commands = {
    roulette: {
        // This command will execute when the user types `!roulette <bet_amount>`
        async execute(target: string, room: Room, user: User) {
            const betAmount = parseInt(target.trim()); // Parse bet amount from the user's input

            if (isNaN(betAmount) || betAmount <= 0) {
                return room.send(`Please specify a valid bet amount (positive number).`);
            }

            const result = spinRoulette(betAmount, user.id); // Spin the roulette with the user's bet
            room.send(result); // Send the result to the room (chat)
        },
    },
};
