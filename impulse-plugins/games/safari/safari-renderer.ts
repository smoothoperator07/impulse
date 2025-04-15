/*************************************
 * Pokemon Safari Zone Renderer      *
 * Author: @musaddiktemkar           *
 **************************************/

import { Player, GameStatus, SAFARI_CONSTANTS } from './safari-types';

/**
 * Handles all rendering and UI functionality for the Safari Zone game
 */
export class SafariRenderer {
    private game: any; // Reference to the SafariGame instance

    constructor(game: any) {
        this.game = game;
    }

    /**
     * Formats timestamp to UTC time string
     * @param timestamp Timestamp to format
     * @returns Formatted time string
     */
    formatUTCTime(timestamp: number): string {
        return new Date(timestamp)
            .toISOString()
            .replace('T', ' ')
            .substr(0, 19);
    }

    /**
     * Gets a formatted player list
     * @returns String of player names
     */
    getPlayerList(): string {
        const players = Object.values(this.game.players);
        if (players.length === 0) return 'None';
        return players.map((p: Player) => Impulse.nameColor(p.name, true, true)).join(', ');
    }

    /**
     * Main method to display the game UI
     * @param status Current game status
     * @param players Players object
     * @param turnOrder Array of player IDs in turn order
     * @param currentTurn Current turn index
     * @param turnStartTime When the current turn started
     */
    display() {
        const status = this.game.getStatus();
        
        if (status === 'waiting') {
            this.displayWaitingScreen();
            return;
        }

        this.game.room.add(`|uhtmlchange|safari-waiting|`, -1000);

        const currentPlayerId = this.game.turnOrder[this.game.currentTurn];

        if (status === 'started') {
            this.displayActiveGameForPlayers(currentPlayerId);
        } else if (status === 'ended') {
            this.clearAllPlayerDisplays();
        }

        // Update spectator view
        this.updateSpectatorsView(status);
    }

    private displayWaitingScreen() {
        const startMsg = 
            `<div class="infobox safari-zone-box">` +
            `<div style="text-align:center;">` +
            `<div class="safari-title">` +
            `<h1>SAFARI ZONE</h1>` +
            `<div class="safari-subtitle">A wild Pokémon adventure awaits!</div>` +
            `</div>` +
            `<div class="safari-info-container">` +
            `<div class="safari-info-section">` +
            `<div class="safari-section-header">SAFARI INFO</div>` +
            `<div><b>Guide:</b> ${Impulse.nameColor(this.game.getHost(), true, true)}</div>` +
            `<div><b>Time:</b> ${this.formatUTCTime(Date.now())} UTC</div>` +
            `<div><b>Safari Balls:</b> ${this.game.getBallsPerPlayer()} per explorer</div>` +
            `<div><b>Prize Pool:</b> ${this.game.getPrizePool()} coins</div>` +
            `</div>` +
            `<div class="safari-info-section">` +
            `<div class="safari-section-header">EXPLORERS</div>` +
            `<div>${this.getPlayerList()}</div>` +
            `<div class="safari-player-limits">` +
            `Min players: ${SAFARI_CONSTANTS.MIN_PLAYERS} | Max: ${SAFARI_CONSTANTS.MAX_PLAYERS}` +
            `</div>` +
            `</div>` +
            `</div>` +
            `<div class="safari-pokemon-display">` +
            `<img src="https://play.pokemonshowdown.com/sprites/ani/scyther.gif" width="80" height="80" class="safari-pokemon">` +
            `<img src="https://play.pokemonshowdown.com/sprites/ani/tauros.gif" width="80" height="80" class="safari-pokemon">` +
            `<img src="https://play.pokemonshowdown.com/sprites/ani/kangaskhan.gif" width="80" height="80" class="safari-pokemon">` +
            `</div>` +
            `<div class="safari-join-button">` +
            `<button class="button" name="send" value="/safari join">Join Safari Zone!</button>` +
            `</div>` +
            `<div class="safari-tips">` +
            `<div class="safari-tips-header">SAFARI TIPS:</div>` +
            `<div>• Move carefully to find rare Pokémon!</div>` +
            `<div>• Stronger Pokémon are worth more points</div>` +
            `<div>• Each Safari Ball is precious - use them wisely</div>` +
            `</div>` +
            `</div>` +
            `</div>` +
            `<style>` +
            `.safari-zone-box {
                background: var(--cmd-bg);
                border: 2px solid var(--border-color);
                border-radius: 8px;
                padding: 15px;
                color: var(--primary-text);
            }
            .safari-title {
                margin-bottom: 15px;
            }
            .safari-title h1 {
                color: var(--header-color);
                text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
                margin: 0;
            }
            .safari-subtitle {
                font-style: italic;
                color: var(--secondary-text);
                margin-top: 5px;
            }
            .safari-info-container {
                display: flex;
                justify-content: space-between;
                background: var(--bg-overlay);
                border-radius: 8px;
                padding: 15px;
                margin: 15px 0;
            }
            .safari-info-section {
                flex: 1;
                padding: 0 15px;
            }
            .safari-section-header {
                font-weight: bold;
                color: var(--header-color);
                border-bottom: 1px solid var(--border-color);
                padding-bottom: 5px;
                margin-bottom: 8px;
            }
            .safari-player-limits {
                margin-top: 10px;
                font-size: 12px;
                color: var(--secondary-text);
            }
            .safari-pokemon-display {
                position: relative;
                margin: 20px 0;
                height: 90px;
            }
            .safari-pokemon {
                margin: 0 10px;
            }
            .safari-join-button {
                margin: 15px 0;
            }
            .safari-join-button button {
                background: var(--button-bg);
                color: var(--button-text);
                padding: 12px 30px;
                font-size: 16px;
                font-weight: bold;
                border: none;
                border-radius: 30px;
                cursor: pointer;
                transition: opacity 0.2s;
            }
            .safari-join-button button:hover {
                opacity: 0.9;
            }
            .safari-tips {
                background: var(--bg-overlay);
                border-radius: 8px;
                padding: 10px;
                margin-top: 15px;
            }
            .safari-tips-header {
                font-weight: bold;
                color: var(--header-color);
                margin-bottom: 5px;
            }
            </style>`;
        
        this.game.room.add(`|uhtml|safari-waiting|${startMsg}`).update();
    }

    private displayActiveGameForPlayers(currentPlayerId: string) {
        const now = Date.now();
        const timeLeft = Math.max(0, Math.ceil((SAFARI_CONSTANTS.TURN_TIME - (now - this.game.turnStartTime)) / 1000));

        for (const userid in this.game.players) {
            const player = this.game.players[userid];
            let buf = `<div class="infobox safari-game-box">`;
            buf += `<div style="text-align:center">`;
            buf += `<h2 class="safari-game-title">Safari Zone Game</h2>`;
            
            buf += `<div class="safari-game-info">`;
            buf += `<small>Game Time: ${this.formatUTCTime(now)} UTC</small><br />`;
            buf += `<small>Game Duration: ${Math.floor((now - this.game.getGameStartTime()) / 1000)}s</small>`;
            buf += `</div>`;
            
            buf += `<div class="safari-game-stats">`;
            buf += `<b>Host:</b> ${Impulse.nameColor(this.game.getHost(), true, true)}<br />`;
            buf += `<b>Status:</b> ${this.game.getStatus()}<br />`;
            buf += `<b>Prize Pool:</b> ${this.game.getPrizePool()} coins<br />`;
            buf += `</div>`;

            buf += `<div class="safari-turn-info">`;
            buf += `<b>Current Turn:</b> ${Impulse.nameColor(this.game.players[currentPlayerId].name, true, true)}`;
            buf += ` <b class="safari-timer ${timeLeft <= 10 ? 'warning' : ''}">(${timeLeft}s left)</b>`;
            buf += `</div>`;

            if (Object.keys(this.game.players).length) {
                buf += this.renderPlayerTable(currentPlayerId, userid);
            }

            if (this.game.getLastCatchMessage()) {
                buf += `<div class="safari-catch-message ${this.game.getLastWasCatch() ? 'success' : 'failure'}">${this.game.getLastCatchMessage()}</div>`;
            }

            if (userid === currentPlayerId) {
                buf += this.renderPlayerControls(userid, player, timeLeft);
            } else {
                const currentPlayer = this.game.players[currentPlayerId];
                buf += `<div class="safari-waiting-message">Waiting for ${currentPlayer.name}'s turn... (${timeLeft}s left)</div>`;
            }

            buf += `</div></div>`;
            
            buf += `<style>
            .safari-game-box {
                background: var(--cmd-bg);
                border: 2px solid var(--border-color);
                border-radius: 8px;
                padding: 15px;
                color: var(--primary-text);
            }
            .safari-game-title {
                color: var(--header-color);
                margin-bottom: 15px;
            }
            .safari-game-info {
                color: var(--secondary-text);
                margin-bottom: 10px;
            }
            .safari-game-stats {
                margin: 10px 0;
            }
            .safari-turn-info {
                margin: 10px 0;
            }
            .safari-timer {
                color: var(--button-bg);
            }
            .safari-timer.warning {
                color: var(--error-color);
            }
            .safari-catch-message {
                margin: 10px 0;
                padding: 5px;
                border-radius: 4px;
            }
            .safari-catch-message.success {
                color: var(--success-color);
            }
            .safari-catch-message.failure {
                color: var(--error-color);
            }
            .safari-waiting-message {
                color: var(--secondary-text);
                margin: 10px 0;
            }
            .safari-controls {
                margin: 15px 0;
            }
            .safari-controls button {
                background: var(--button-bg);
                color: var(--button-text);
                margin: 5px;
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            .safari-controls button:hover {
                opacity: 0.9;
            }
            </style>`;
            
            const roomUser = Users.get(userid);
            if (roomUser?.connected) {
                roomUser.sendTo(this.game.room, `|uhtml|safari-player-${userid}|${buf}`);
            }
        }
    }

    private renderPlayerTable(currentPlayerId: string, currentUserid: string): string {
        let buf = `<table class="safari-player-table" border="1" cellspacing="0" cellpadding="3">`;
        buf += `<tr><th>Player</th><th>Points</th><th>Balls Left</th><th>Catches</th></tr>`;
        const sortedPlayers = Object.values(this.game.players).sort((a: Player, b: Player) => b.points - a.points);
        
        for (const p of sortedPlayers) {
            const isCurrentTurn = p.id === currentPlayerId;
            buf += `<tr class="${isCurrentTurn ? 'current-turn' : ''}">`;
            buf += `<td>${Impulse.nameColor(p.name, true, true)}${p.id === currentUserid ? ' (You)' : ''}${isCurrentTurn ? ' ⭐' : ''}</td>`;
            buf += `<td>${p.points}</td>`;
            buf += `<td>${p.ballsLeft}</td>`;
            buf += `<td>${p.catches.map(pk => `<img src="${pk.sprite}" width="40" height="30" title="${pk.name}">`).join('')}</td>`;
            buf += `</tr>`;
        }
        
        buf += `</table>`;
        buf += `<style>
        .safari-player-table {
            margin: auto;
            margin-top: 10px;
            border-color: var(--border-color);
            background: var(--bg-overlay);
        }
        .safari-player-table th {
            background: var(--button-bg);
            color: var(--button-text);
        }
        .safari-player-table tr.current-turn {
            background: var(--bg-overlay-hover);
        }
        .safari-player-table td {
            padding: 5px;
        }
        </style>`;
        return buf;
    }

    private renderPlayerControls(userid: string, player: Player, timeLeft: number): string {
        let buf = `<div class="safari-controls">`;
        
        if (player.ballsLeft > 0) {
            const state = this.game.getMovementState(userid);
            
            if (!state || state.canMove) {
                buf += `<div class="movement-controls">`;
                buf += `<button name="send" value="/safari move up">↑</button><br />`;
                buf += `<button name="send" value="/safari move left">←</button>`;
                buf += `<button name="send" value="/safari move right">→</button><br />`;
                buf += `<button name="send" value="/safari move down">↓</button>`;
                buf += `</div>`;
                buf += `<div class="movement-prompt"><b>Choose a direction to move!</b></div>`;
            } else if (state.pokemonDisplayed && state.currentPokemon) {
                buf += `<div class="pokemon-encounter">`;
                buf += `<img src="${state.currentPokemon.sprite}" width="80" height="80">`;
                buf += `<div class="encounter-text"><b>A wild ${state.currentPokemon.name} appeared!</b></div>`;
                buf += `<button class="throw-ball" name="send" value="/safari throw">Throw Safari Ball</button>`;
                buf += `</div>`;
            }

            if (timeLeft <= 10) {
                buf += `<div class="warning-text">Warning: You'll lose a ball if you don't act!</div>`;
            }
        } else {
            buf += `<div class="no-balls-message">You have no Safari Balls left!</div>`;
        }
        
        buf += `</div>`;
        buf += `<style>
        .movement-controls {
            margin: 10px 0;
        }
        .movement-prompt {
            margin: 10px 0;
            color: var(--header-color);
        }
        .pokemon-encounter {
            margin: 10px 0;
            text-align: center;
        }
        .encounter-text {
            margin: 10px 0;
            color: var(--header-color);
        }
        .throw-ball {
            background: var(--button-bg);
            color: var(--button-text);
            font-size: 12pt;
            padding: 8px 16px;
            margin-top: 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .warning-text {
            color: var(--error-color);
            font-size: 12px;
            margin-top: 10px;
        }
        .no-balls-message {
            color: var(--error-color);
            margin: 10px 0;
        }
        </style>`;
        return buf;
    }

    private clearAllPlayerDisplays() {
        for (const userid in this.game.players) {
            const roomUser = Users.get(userid);
            if (roomUser?.connected) {
                roomUser.sendTo(this.game.room, `|uhtmlchange|safari-player-${userid}|`);
            }
        }
    }

    private updateSpectatorsView(status: GameStatus) {
        for (const spectatorId of this.game.getSpectators()) {
            if (status === 'ended') {
                const roomUser = Users.get(spectatorId);
                if (roomUser?.connected) {
                    roomUser.sendTo(this.game.room, `|uhtmlchange|safari-spectator-${spectatorId}|`);
                }
            } else {
                this.displayToSpectator(spectatorId);
            }
        }
    }

    displayToSpectator(userid: string): void {
        if (!this.game.getSpectators().has(userid)) return;
        
        const now = Date.now();
        const currentPlayerId = this.game.turnOrder[this.game.currentTurn];
        const timeLeft = Math.max(0, Math.ceil((SAFARI_CONSTANTS.TURN_TIME - (now - this.game.turnStartTime)) / 1000));
        
        let buf = `<div class="infobox safari-spectator-box">`;
        buf += `<div style="text-align:center">`;
        buf += `<h2 class="safari-game-title">Safari Zone Game${this.game.getStatus() === 'ended' ? ' (Ended)' : ''}</h2>`;
        
        buf += `<div class="safari-game-info">`;
        buf += `<small>Game Time: ${this.formatUTCTime(now)} UTC</small><br />`;
        buf += `<small>Game Duration: ${Math.floor((now - this.game.getGameStartTime()) / 1000)}s</small>`;
        buf += `</div>`;
        
        buf += `<div class="safari-game-stats">`;
        buf += `<b>Host:</b> ${Impulse.nameColor(this.game.getHost(), true, true)}<br />`;
        buf += `<b>Status:</b> ${this.game.getStatus()}<br />`;
        buf += `<b>Prize Pool:</b> ${this.game.getPrizePool()} coins<br />`;
        buf += `</div>`;

        if (this.game.getStatus() === 'started' && currentPlayerId) {
            buf += `<div class="safari-turn-info">`;
            buf += `<b>Current Turn:</b> ${Impulse.nameColor(this.game.players[currentPlayerId].name, true, true)}`;
            buf += ` <b class="safari-timer ${timeLeft <= 10 ? 'warning' : ''}">(${timeLeft}s left)</b>`;
            buf += `</div>`;
        }

        if (Object.keys(this.game.players).length) {
            buf += this.renderPlayerTable(currentPlayerId, userid);
        }

        if (this.game.getStatus() === 'started' && this.game.getLastCatchMessage()) {
            buf += `<div class="safari-catch-message ${this.game.getLastWasCatch() ? 'success' : 'failure'}">${this.game.getLastCatchMessage()}</div>`;
        }

        buf += `<div class="spectator-notice">You are spectating this game</div>`;
        buf += `</div></div>`;

        buf += `<style>
        .safari-spectator-box {
            background: var(--cmd-bg);
            border: 2px solid var(--border-color);
            border-radius: 8px;
            padding: 15px;
            color: var(--primary-text);
        }
        .spectator-notice {
            color: var(--secondary-text);
            font-size: 12px;
            margin-top: 15px;
        }
        </style>`;

        const roomUser = Users.get(userid);
        if (roomUser?.connected) {
            roomUser.sendTo(this.game.room, `|uhtml|safari-spectator-${userid}|${buf}`);
        }
    }

    displayEndResults(): void {
        const now = Date.now();
        const sortedPlayers = Object.values(this.game.players).sort((a: Player, b: Player) => b.points - a.points);
        
        let endMsg = `<div class="infobox safari-results-box">`;
        endMsg += `<div style="text-align:center">`;
        endMsg += `<h2 class="safari-results-title">Safari Zone Results</h2>`;
        
        endMsg += `<div class="safari-results-info">`;
        endMsg += `<small>Game Ended: ${this.formatUTCTime(now)} UTC</small><br />`;
        endMsg += `<small>Duration: ${Math.floor((now - this.game.getGameStartTime()) / 1000)} seconds</small>`;
        endMsg += `</div>`;
        
        if (sortedPlayers.length > 0) {
            const prizes = [0.6, 0.3, 0.1];
            const top3Players = sortedPlayers.slice(0, 3);
            
            endMsg += `<table class="safari-results-table">`;
            endMsg += `<tr><th>Place</th><th>Player</th><th>Points</th><th>Prize</th><th>Catches</th></tr>`;
            
            top3Players.forEach((player: Player, index: number) => {
                const prize = Math.floor(this.game.getPrizePool() * prizes[index]);
                const place = index + 1;
                const suffix = ['st', 'nd', 'rd'][index];
                
                endMsg += `<tr class="place-${place}">`;
                endMsg += `<td>${place}${suffix}</td>`;
                endMsg += `<td>${Impulse.nameColor(player.name, true, true)}</td>`;
                endMsg += `<td>${player.points}</td>`;
                endMsg += `<td>${prize} coins</td>`;
                endMsg += `<td>${player.catches.map(pk => 
                    `<img src="${pk.sprite}" width="40" height="30" title="${pk.name}">`
                ).join('')}</td>`;
                endMsg += `</tr>`;
                
                if (prize > 0) {
                    Economy.addMoney(player.id, prize, `Safari Zone ${place}${suffix} place`);
                }
            });
            endMsg += `</table>`;
        } else {
            endMsg += `<div class="no-winners">No winners in this game.</div>`;
        }
        endMsg += `</div></div>`;

        endMsg += `<style>
        .safari-results-box {
            background: var(--cmd-bg);
            border: 2px solid var(--border-color);
            border-radius: 8px;
            padding: 15px;
            color: var(--primary-text);
        }
        .safari-results-title {
            color: var(--header-color);
            margin-bottom: 15px;
        }
        .safari-results-info {
            color: var(--secondary-text);
            margin-bottom: 20px;
        }
        .safari-results-table {
            margin: auto;
            border-color: var(--border-color);
            background: var(--bg-overlay);
        }
        .safari-results-table th {
            background: var(--button-bg);
            color: var(--button-text);
            padding: 8px;
        }
        .safari-results-table td {
            padding: 8px;
        }
        .place-1 {
            background: rgba(255, 215, 0, 0.1);
        }
        .place-2 {
            background: rgba(192, 192, 192, 0.1);
        }
        .place-3 {
            background: rgba(205, 127, 50, 0.1);
        }
        .no-winners {
            color: var(--secondary-text);
            margin: 20px 0;
        }
        </style>`;

        // Clear all player displays
        this.clearAllPlayerDisplays();

        // Clear all spectator displays
        for (const spectatorId of this.game.getSpectators()) {
            const roomUser = Users.get(spectatorId);
            if (roomUser?.connected) {
                roomUser.sendTo(this.game.room, `|uhtmlchange|safari-spectator-${spectatorId}|`);
            }
        }

        // Display the final results
        this.game.room.add(`|uhtml|safari-end|${endMsg}`).update();
    }
}