// --- Constants ---
const suits = ["hearts", "spades", "clubs", "diamonds"];
const values = [
    { name: "2", value: 2 }, { name: "3", value: 3 }, { name: "4", value: 4 },
    { name: "5", value: 5 }, { name: "6", value: 6 }, { name: "7", value: 7 },
    { name: "8", value: 8 }, { name: "9", value: 9 }, { name: "10", value: 10 },
    { name: "J", value: 11 }, { name: "Q", value: 12 }, { name: "K", value: 13 },
    { name: "A", value: 14 },
];

const fullDeck = [];
suits.forEach((suit) => {
    values.forEach((val) => {
        fullDeck.push({ ...val, suit });
    });
});

// --- Socket Connection ---
// Assumes the server is serving the page, otherwise use full URL
const socket = io("http://localhost:3000");

// --- State Variables ---
let bets = { Dragon: 0, Tie: 0, Tiger: 0 }; // Current round bet amounts
let selectedBetTarget = null; // 'Dragon', 'Tie', or 'Tiger' - currently selected for betting
let betsPlacedOn = { Dragon: false, Tie: false, Tiger: false }; // Tracks if bet made on each outcome THIS round
let dragonCard = null; // Card drawn for Dragon
let tigerCard = null; // Card drawn for Tiger
let countdown = 30; // Countdown timer value
let coins = 1000; // Player's coin balance
let gstatus = "0"; // Game status: "1" = betting open, "0" = betting closed/reveal. Start closed.
let roundInProgress = false; // Flag to prevent overlapping reveals/calculations
let betAmount = null;       // The amount placed on the selected outcome
let currentMatchId = null;  // <--- ADDED
let currentRoundId = null;
// let result = ""; // Not explicitly used for display text? resultElement is used instead.


let showConfetti = false;   // Not directly used in provided logic, handled by createConfetti
let shake = false;          // Not directly used, animation triggered directly
let revealDragon = false;
let revealTiger = false;


// --- DOM Elements ---
const coinsElement = document.getElementById("coins");
const resultElement = document.getElementById("result");
const countdownElement = document.getElementById("countdown");
const countdownCircle = document.getElementById("countdown-circle");
const dragonCardContainer = document.getElementById("dragon-card-container");
const tigerCardContainer = document.getElementById("tiger-card-container");
const dragonCardFront = document.getElementById("dragon-card-front");
const tigerCardFront = document.getElementById("tiger-card-front");
const betButtonsContainer = document.getElementById("bet-buttons-container");
const coinButtonsContainer = document.getElementById("coin-buttons-container");
const confettiContainer = document.getElementById("confetti-container");
const gameContainer = document.querySelector(".game-card"); // Target for shake effect
const notEnoughCoinsElement = document.getElementById("not-enough-coins");
const dragonBetAmountElement = document.getElementById("dragon-bet-amount");
const tieBetAmountElement = document.getElementById("tie-bet-amount");
const tigerBetAmountElement = document.getElementById("tiger-bet-amount");

// --- Helper Functions ---

/**
 * Creates and displays confetti animation.
 */
function createConfetti() {
    const colors = ["#f00", "#0f0", "#00f", "#ff0", "#0ff", "#f0f", "#fff", "#f90"];
    confettiContainer.innerHTML = ''; // Clear previous confetti
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement("div");
        confetti.classList.add("confetti");
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.top = `${-10 - Math.random() * 20}px`;
        confetti.style.animationDelay = `${Math.random() * 0.5}s`;
        confetti.style.animationDuration = `${Math.random() * 3 + 3}s`;
        confettiContainer.appendChild(confetti);
    }
    // Clear container after longest animation finishes + buffer
    setTimeout(() => {
         if (confettiContainer.children.length > 0) {
             confettiContainer.innerHTML = '';
         }
    }, 7000);
}

/**
 * Updates the displayed bet amount for a specific outcome (Dragon, Tie, Tiger).
 * @param {string} cardName - 'Dragon', 'Tie', or 'Tiger'.
 * @param {number} amount - The amount to display.
 */
function updateSpecificBetAmountDisplay(cardName, amount) {
    const element = document.getElementById(`${cardName.toLowerCase()}-bet-amount`);
    if (element) {
        element.textContent = amount;
    }
}

/**
 * Updates the player's total coin display and triggers UI status check.
 */
function updateCoinsDisplay() {
    coinsElement.textContent = coins;
    checkBettingStatus(); // Update button states based on new coin amount
}

/**
 * Updates the main result text display area.
 * @param {string} text - The message to display.
 */
function updateResultDisplay(text) {
    resultElement.textContent = text;
}

/**
 * Updates the countdown timer display and the circular progress bar.
 */
function updateCountdownDisplay() {
    countdownElement.textContent = countdown > 0 ? countdown : "⏱";
    const circumference = 2 * Math.PI * 15.9155; // From SVG path data
    const offset = ((30 - Math.max(0, countdown)) / 30) * circumference;
    countdownCircle.style.strokeDashoffset = offset;

    // Set circle color based on game state and time
    if (gstatus === "1" && countdown <= 5) {
        countdownCircle.style.stroke = "url(#redGradient)";
    } else if (gstatus === "1") {
        countdownCircle.style.stroke = "url(#greenGradient)";
    } else { // gstatus === "0" (reveal phase)
        countdownCircle.style.stroke = "url(#greyGradient)";
    }
}

/**
 * Returns the relative image path for a given card object.
 * @param {object | null} card - Card object { name, value, suit } or null.
 * @returns {string} Image path (e.g., './img/cards/AHH.png') or default back image path.
 */
function getCardImagePath(card) {
    const defaultPath = "../img/cards/patti_back.png";
    if (!card || !card.suit || !card.name) return defaultPath;

    const suitMap = { clubs: "CC", diamonds: "DD", hearts: "HH", spades: "SS" };
    const cardName = card.name;
    const cardSuit = suitMap[card.suit];

    if (!cardSuit) return defaultPath; // Invalid suit

    return `./img/cards/${cardName}${cardSuit}.png`; // Assumes format like 'AC.png', '10H.png' - ADJUST IF NEEDED
}

/**
 * Resets the Dragon and Tiger card visuals to their facedown state.
 */
function resetCardsVisual() {
    dragonCardFront.src = getCardImagePath(null); // Use default back image
    tigerCardFront.src = getCardImagePath(null);
    dragonCardContainer.classList.remove("flipped");
    tigerCardContainer.classList.remove("flipped");
    // Reset internal flags (though not strictly necessary if reveal logic checks cards)
    // revealDragon = false;
    // revealTiger = false;
}

/**
 * Resets all bet-related state variables and UI elements for a new round.
 */
function resetBets() {
    console.log("DEBUG: resetBets called.");
    bets = { Dragon: 0, Tie: 0, Tiger: 0 };
    selectedBetTarget = null;
    betsPlacedOn = { Dragon: false, Tie: false, Tiger: false }; // Reset placed bet tracker
    dragonBetAmountElement.textContent = '0';
    tieBetAmountElement.textContent = '0';
    tigerBetAmountElement.textContent = '0';
    removeBetTargetHighlight();
    updateOutcomeButtonStates(); // Clear visual indicators (e.g., checkmarks)
    console.log("DEBUG: resetBets finished.");
}

/**
 * Updates the visual state of Dragon/Tie/Tiger buttons (e.g., adds checkmark if bet placed).
 */
function updateOutcomeButtonStates() {
    betButtonsContainer.querySelectorAll('.bet-button').forEach(button => {
        const betTarget = button.dataset.bet;
        if (betsPlacedOn[betTarget]) {
            button.classList.add("bet-placed-indicator");
        } else {
            button.classList.remove("bet-placed-indicator");
        }
        // Enabling/disabling is handled primarily by checkBettingStatus based on game phase
    });
}

/**
 * Simulates card drawing (if server doesn't provide them), reveals cards with animation,
 * calculates the winner, updates coins based on bets, and displays the result.
 */
function revealCardsAndCalculateResult() {
    if (roundInProgress) {
        console.warn("DEBUG: revealCardsAndCalculateResult already in progress, skipping.");
        return;
    }
    roundInProgress = true;
    console.log("DEBUG: revealCardsAndCalculateResult started.");

    // --- Card Drawing (Client Simulation - REPLACE with server data if possible) ---
    // If dragonCard and tigerCard are already populated by a server message, skip this block.
    if (!dragonCard || !tigerCard) {
        console.log("DEBUG: Drawing cards client-side (simulation).");
        const shuffled = [...fullDeck];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        dragonCard = shuffled.pop();
        let potentialTigerCard = shuffled.pop();
        while (potentialTigerCard && dragonCard && potentialTigerCard.value === dragonCard.value && potentialTigerCard.suit === dragonCard.suit) {
             console.warn("WARN: Drew identical card, redrawing Tiger card.");
            potentialTigerCard = shuffled.pop();
            if (!potentialTigerCard) break;
        }
        tigerCard = potentialTigerCard;
    } else {
         console.log("DEBUG: Using cards provided by server.");
    }
    console.log("DEBUG: Cards for reveal:", dragonCard, tigerCard);


    // --- Reveal Animation ---
    setTimeout(() => {
        if (dragonCard) {
            dragonCardFront.src = getCardImagePath(dragonCard);
            dragonCardContainer.classList.add("flipped");
        } else { console.error("Dragon card missing!"); updateResultDisplay("Card Error!"); }
    }, 500); // Dragon reveals after 0.5s

    setTimeout(() => {
         if (tigerCard) {
            tigerCardFront.src = getCardImagePath(tigerCard);
            tigerCardContainer.classList.add("flipped");
         } else { console.error("Tiger card missing!"); updateResultDisplay("Card Error!"); }
    }, 1500); // Tiger reveals after 1.5s
    // --- End Reveal Animation ---

    // --- Calculate Winner and Payout (after animations) ---
    setTimeout(() => {
        console.log("DEBUG: Calculating results.");
        if (!dragonCard || !tigerCard) {
            updateResultDisplay("Error revealing cards.");
            console.error("DEBUG: Missing card during result calculation!");
            roundInProgress = false; // Reset flag even on error
            return; // Wait for server 'new_round'
        }

        // Determine Winner
        let winner = null;
        if (dragonCard.value > tigerCard.value) winner = "Dragon";
        else if (tigerCard.value > dragonCard.value) winner = "Tiger";
        else winner = "Tie";

        // Calculate Payouts
        let totalWinnings = 0; // Includes stake back for wins
        let totalLosses = 0;
        let resultText = `Result: ${winner}! `;
        let anyBetsPlaced = Object.values(betsPlacedOn).some(placed => placed);

        for (const [outcome, amount] of Object.entries(bets)) {
             if (amount > 0) { // Check if a bet was actually placed on this outcome
                 if (outcome === winner) {
                     // Payout Ratio: Tie typically 8:1, Dragon/Tiger 1:1
                     const payoutMultiplier = (winner === "Tie") ? 8 : 1;
                     const profit = amount * payoutMultiplier;
                     totalWinnings += amount + profit; // Return stake + profit
                     resultText += ` Won ${amount + profit} on ${outcome}.`;
                 } else {
                     totalLosses += amount; // Bet amount is lost
                     resultText += ` Lost ${amount} on ${outcome}.`;
                 }
             }
         }

         const netChange = totalWinnings - totalLosses;

         // Update Coins and Display Result Text
         if (anyBetsPlaced) {
             coins += netChange; // Apply the net change (Winnings including stake back - Losses)
             updateCoinsDisplay(); // Update display after adjusting coins

             if (netChange > 0) {
                 updateResultDisplay(`🎉 You Win! ${resultText}`);
                 createConfetti();
             } else if (netChange < 0) {
                 updateResultDisplay(`❌ You Lose. ${resultText}`);
                 gameContainer.classList.add("animate-shake");
                 setTimeout(() => gameContainer.classList.remove("animate-shake"), 1000);
             } else { // Broke even (e.g., lost exactly what was won on other bets, or no net change)
                  // Check if they actually bet on the winning outcome
                  if (bets[winner] > 0) {
                       updateResultDisplay(`🏁 Break Even! ${resultText}`);
                  } else { // Bet placed, but not on the winner, and somehow broke even? Default to loss display.
                      updateResultDisplay(`❌ You Lose. ${resultText}`);
                      gameContainer.classList.add("animate-shake");
                      setTimeout(() => gameContainer.classList.remove("animate-shake"), 1000);
                  }
             }
         } else { // No bets were placed this round
              updateResultDisplay(`Result: ${winner}. No bets placed.`);
         }

        console.log("DEBUG: Result calculation finished.");
        // Server is expected to signal the start of the next round
        roundInProgress = false; // Reset flag

    }, 3000); // Delay calculation until reveal animations have likely finished
}

/**
 * Resets the game state for a new round. Triggered by server message.
 */
function resetRound() {
    console.log("DEBUG: resetRound called.");
    updateResultDisplay("Place Your Bet!");
    countdown = 30; // Reset timer (server should confirm)
    // gstatus is updated by the server message that triggers this flow
    updateCountdownDisplay();
    resetBets(); // Clears bets object, placed tracker, and UI amounts/indicators
    resetCardsVisual(); // Flip cards back
    roundInProgress = false; // Ensure reveal flag is reset
    checkBettingStatus(); // Enable controls based on the new state (should be gstatus: 1)
    console.log("DEBUG: Round reset complete.");
}

/**
 * Handles click events on the Dragon, Tie, and Tiger bet selection buttons.
 * @param {Event} event - The click event.
 */
function selectBetTargetHandler(event) {
    if (gstatus === "0") return; // Ignore clicks if betting is closed

    selectedBetTarget = event.currentTarget.dataset.bet;
    highlightSelectedBetTarget();
    console.log("Selected bet target:", selectedBetTarget);
    checkBettingStatus(); // Update coin button states based on new selection
}

/**
 * Handles click events on the coin buttons to place a bet.
 * @param {Event} event - The click event.
 */
function handleCoinButtonClick(event) {
    const amount = parseInt(event.currentTarget.dataset.amount);

    // --- Validation Checks ---
    if (gstatus === "0") {
        console.log("Betting closed (gstatus=0).");
        return;
    }
    if (!selectedBetTarget) {
        alert("Please select Dragon, Tie, or Tiger first!");
        return;
    }
    // *** Check if bet already placed on THIS specific target ***
    // if (betsPlacedOn[selectedBetTarget]) {
    //     console.log(`Bet already placed on ${selectedBetTarget} this round.`);
    //     alert(`You have already placed your bet on ${selectedBetTarget} for this round.`);
    //     return;
    // }
    if (coins < amount) {
        console.log("Not enough coins for this amount:", amount);
        notEnoughCoinsElement.classList.remove("hidden");
        setTimeout(() => notEnoughCoinsElement.classList.add("hidden"), 2000); // Show briefly
        return;
    }
    if (!currentMatchId || !currentRoundId) {
        console.warn("Client: Match ID or Round ID not yet received from server.");
        alert("Game data is initializing, please wait a moment.");
        return;
    }
    // --- End Validation Checks ---

    // --- Place the Bet (Client-side) ---
    coins -= amount;
    bets[selectedBetTarget] += amount; // Increment bet amount for the target
    betsPlacedOn[selectedBetTarget] = true; // Mark this target as bet on for the round

    // --- Update UI ---
    updateCoinsDisplay(); // Updates coin total and calls checkBettingStatus
    updateSpecificBetAmountDisplay(selectedBetTarget, bets[selectedBetTarget]);
    updateOutcomeButtonStates(); // Add checkmark or other indicator

    console.log(`Bet ${amount} on ${selectedBetTarget}. Cannot place another bet on ${selectedBetTarget} this round.`);
    console.log(`Client: Placed bet: ${amount} on ${selectedBetTarget}. Total on target: ${bets[selectedBetTarget]}. Coins left: ${coins}`);
    // --- Emit bet to backend for validation and recording ---
    // const userId = socket.id || "guest_" + Math.random().toString(16).slice(2); // Use socket ID or generate temporary
    // // Server should ideally provide match/round IDs
    // const matchId = "match_current";
    // const roundId = "round_current";
    // const betData={
    //     userId: userId,
    //     card: selectedBetTarget,
    //     betAmount: amount,
    //     matchId: matchId,
    //     roundId: roundId

    // }
    // console.log("betdata----",betData);
    

    // socket.emit("place_bet",betData);
    const userId = socket.id || "guest_" + Math.random().toString(16).slice(2); // Use socket ID or temporary



    const betData = {
        userId: userId,
        card: selectedBetTarget,     // Use the selected target
        betAmount: amount,           // Use the amount of THIS click
        matchId: currentMatchId,     // Use stored ID from server
        roundId: currentRoundId      // Use stored ID from server
    };

    console.log("--- Emitting place_bet ---");
    console.log(JSON.stringify(betData, null, 2));
    socket.emit("place_bet", betData);



    // Disable further coin clicks this round as per the simple model


}

/**
 * Adds a visual highlight (e.g., border) to the currently selected bet target button.
 */
function highlightSelectedBetTarget() {
    betButtonsContainer.querySelectorAll('.bet-button').forEach(button => {
        if (button.dataset.bet === selectedBetTarget) {
             button.classList.add("selected-bet-target");
        } else {
            button.classList.remove("selected-bet-target");
        }
    });
}

/**
 * Removes the visual highlight from all bet target buttons.
 */
function removeBetTargetHighlight() {
     betButtonsContainer.querySelectorAll('.bet-button').forEach(button => {
        button.classList.remove("selected-bet-target");
    });
}

/**
 * Checks the current game state (gstatus, countdown, betsPlacedOn, coins)
 * and enables/disables bet selection buttons and coin buttons accordingly.
 * Also manages lock overlays and 'not enough coins' message.
 */
function checkBettingStatus() {
    const bettingPhaseActive = gstatus === "1" && countdown > 0;
    const anyBetPlacedThisRound = Object.values(betsPlacedOn).some(placed => placed);

    // Bet selection buttons (Dragon, Tie, Tiger) - Enabled during betting phase
    betButtonsContainer.querySelectorAll('.bet-button').forEach(button => {
        button.disabled = !bettingPhaseActive || anyBetPlacedThisRound;
        const lock = document.getElementById(`${button.dataset.bet.toLowerCase()}-lock`);
        if (lock) {
            // lock.classList.toggle('hidden', bettingPhaseActive);
            lock.classList.toggle('hidden', !button.disabled);
        }
    });

    // Determine if coins can be used based on selection and if bet already placed
    let canUseCoins = false;
    if (bettingPhaseActive && selectedBetTarget && !betsPlacedOn[selectedBetTarget]) {
        canUseCoins = true; // Can bet if phase active, target selected, and not yet bet on
    }

    // Coin buttons - Enabled only if eligible to place a bet AND can afford
    coinButtonsContainer.querySelectorAll('.coin-button').forEach(button => {
        const amount = parseInt(button.dataset.amount);
        const canAfford = coins >= amount;
        let isSelectedTargetLocked = false;
        if (selectedBetTarget) {
            isSelectedTargetLocked = betsPlacedOn[selectedBetTarget]; // Check if the CURRENTLY SELECTED target is locked
        }

    const isDisabled = !bettingPhaseActive || !selectedBetTarget || isSelectedTargetLocked || !canAfford;
        button.disabled = isDisabled;

        const lock = button.nextElementSibling; // Assumes lock overlay is sibling
        if (lock && lock.classList.contains('lock-overlay')) {
            lock.classList.toggle('hidden', !isDisabled); // Show lock if coin button is disabled
        }
    });

    // "Not Enough Coins" message - Show only if trying to bet but lack funds
    if (bettingPhaseActive && selectedBetTarget && !betsPlacedOn[selectedBetTarget]) {
        const minCoinAmount = 10; // Or get minimum from buttons
        if (coins < minCoinAmount) {
            notEnoughCoinsElement.classList.remove("hidden");
        } else {
            notEnoughCoinsElement.classList.add("hidden");
        }
    } else {
        notEnoughCoinsElement.classList.add("hidden"); // Hide if not betting, no target selected, or selected target is locked
    }

    // Clear selection highlight if betting phase ends externally (Unchanged)
    if (!bettingPhaseActive && selectedBetTarget) {
        removeBetTargetHighlight();
        selectedBetTarget = null;
    }
}

// --- Event Listeners ---
betButtonsContainer.querySelectorAll('.bet-button').forEach(button => {
    button.addEventListener('click', selectBetTargetHandler);
});

coinButtonsContainer.querySelectorAll('.coin-button').forEach(button => {
    button.addEventListener('click', handleCoinButtonClick);
});

// --- Socket Event Handlers ---
socket.on("connect", () => {
    console.log("Connected to server", socket.id);
    updateResultDisplay("Connecting...");
    // Request initial game state from server upon connection/reconnection
    socket.emit("request_initial_state");
});

socket.on("game_update", (data) => {
    console.log("Received game_update:", data);
    const previousStatus = gstatus;

    // Update state variables from server data
    if (data.timer !== undefined) countdown = data.timer;
    if (data.gstatus !== undefined) gstatus = data.gstatus;
    if (data.coins !== undefined) coins = data.coins; // Allow server to sync coins
    if (data.match_id !== undefined) currentMatchId = data.match_id;
if (data.roundId !== undefined) currentRoundId = data.roundId;


    // Server might provide cards directly for the reveal phase
    if (data.dragonCard) dragonCard = data.dragonCard;
    if (data.tigerCard) tigerCard = data.tigerCard;

    updateCountdownDisplay(); // Update timer visuals

    // --- Game State Transition Logic ---
    // Check for new round signal (explicit event or gstatus change 0 -> 1)
    if (previousStatus === "0" && gstatus === "1") {
        // Transition FROM Reveal/Wait TO Betting Phase
        console.log("Client: Server signaled new round start (gstatus 1).");
        resetRound(); // Reset UI and state for betting
    } else if (previousStatus === "1" && gstatus === "0") {
        // Transition FROM Betting TO Reveal Phase
        console.log("Client: Server signaled betting closed (gstatus 0).");
        updateResultDisplay("Bets Closed! Revealing cards...");
        removeBetTargetHighlight(); // Clear selection highlight if any
    
        // *** ADDED: Check if any bet was placed before revealing ***
        const anyBetsPlaced = Object.values(betsPlacedOn).some(placed => placed);
        if (anyBetsPlaced) {
            console.log("Client: Bet was placed, proceeding to reveal and calculate.");
            if (!roundInProgress) {
                revealCardsAndCalculateResult();
            } else {
                 console.warn("Client: Reveal already in progress, skipping duplicate trigger.");
            }
        } else {
            console.log("Client: No bet placed this round. Skipping reveal/calculation.");
            resetCardsVisual(); // Ensure cards are visually reset
            updateResultDisplay("No bet placed. Waiting for next round.");
        }
        // *** END ADDED Check ***
    }
    // Removed handling for data.event === "round_result" as primary logic uses gstatus change
    
    // *** ADDED: Always update button states based on the new status ***
    checkBettingStatus();
    
    // *** ADDED: Direct coin update logic ***
    if (data.coins !== undefined && !(previousStatus === "0" && gstatus === "1")) {
        if(String(coinsElement.textContent) !== String(data.coins)) {
            coinsElement.textContent = data.coins;
         }
    }
});

socket.on("bet_accepted", (data) => {
    // Server confirms the bet was valid and recorded
    console.log("Bet accepted by server:", data);
    // Client state already reflects the bet optimistically.
    // Could add a subtle visual confirmation if desired.
});

socket.on("bet_rejected", (data) => {
    console.error("Client: Bet REJECTED by server. Reason:", data.reason);
    alert(`Bet rejected: ${data.reason}`);

    // --- Revert Client State if rejection matches a placed bet ---
    if (data.card && data.amount && betsPlacedOn[data.card]) { // Check if we thought a bet was placed
        const rejectedAmount = Number(data.amount);
        // Check if the recorded bet amount includes the rejected amount
        if (rejectedAmount > 0 && bets[data.card] >= rejectedAmount) {
            console.log(`Client: Reverting rejected bet of ${rejectedAmount} on ${data.card}`);

            coins += rejectedAmount;
            bets[data.card] -= rejectedAmount;
            // *** IMPORTANT: Since the bet that locked this card was rejected, UNLOCK it ***
            betsPlacedOn[data.card] = false; // Allow betting again on this card

            if (bets[data.card] < 0) bets[data.card] = 0;

            // Update UI
            updateCoinsDisplay();
            updateSpecificBetAmountDisplay(data.card, bets[data.card]);
            updateOutcomeButtonStates(); // This will remove the indicator

            // Optional: Clear selection if it was the rejected card
            if (selectedBetTarget === data.card) {
                selectedBetTarget = null;
                removeBetTargetHighlight();
            }
            // checkBettingStatus called by updateCoinsDisplay will re-enable buttons if appropriate
        } else {
             console.warn(`Client: Bet rejection amount mismatch/invalid. Cannot revert reliably.`, data);
        }
    } else {
        console.warn("Client: Bet rejection received, but state/data inconsistent:", data);
    }
});

socket.on("disconnect", () => {
    console.log("Disconnected from server");
    updateResultDisplay("Disconnected");
    gstatus = "0"; // Assume betting closed on disconnect
    checkBettingStatus(); // Disable controls
    roundInProgress = false; // Reset reveal flag
});

// --- Game Loop (Client-side Timer Display Only) ---
let gameLoopInterval = setInterval(() => {
    if (countdown > 0) {
        // Decrement visually; server controls actual phase transitions
        countdown--;
    }
     if (countdown < 0) countdown = 0; // Prevent visual negative countdown

    updateCountdownDisplay(); // Update visual display

}, 1000);

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Ready. Initializing UI.");
    coinsElement.textContent = coins; // Set initial coin display
    updateResultDisplay("Connecting..."); // Initial message
    resetCardsVisual(); // Ensure cards start facedown
    checkBettingStatus(); // Set initial button states (disabled as gstatus=0)
    updateOutcomeButtonStates(); // Set initial D/T/T button state (no checkmarks)
    updateCountdownDisplay(); // Set initial timer display
});

// // const suits = ["hearts", "spades", "clubs", "diamonds"];
// // const values = [
// //     { name: "2", value: 2 },
// //     { name: "3", value: 3 },
// //     { name: "4", value: 4 },
// //     { name: "5", value: 5 },
// //     { name: "6", value: 6 },
// //     { name: "7", value: 7 },
// //     { name: "8", value: 8 },
// //     { name: "9", value: 9 },
// //     { name: "10", value: 10 },
// //     { name: "J", value: 11 },
// //     { name: "Q", value: 12 },
// //     { name: "K", value: 13 },
// //     { name: "A", value: 14 },
// // ];

// // const fullDeck = [];
// // suits.forEach((suit) => {
// //     values.forEach((val) => {
// //         fullDeck.push({ ...val, suit });
// //     });
// // });

// // const socket = io("http://localhost:3000"); // Replace with your server URL

// // // --- State Variables ---
// // let bets = { Dragon: 0, Tie: 0, Tiger: 0 }; // Store bets per card
// // let selectedBetTarget = null; // Which card is currently selected for betting
// // let dragonCard = null;
// // let tigerCard = null;
// // let result = "";
// // let countdown = 30;
// // let coins = 1000;
// // let showConfetti = false;
// // let shake = false;
// // let revealDragon = false;
// // let revealTiger = false;
// // let gstatus = "1"; // Game status: "1" = betting open, "0" = betting closed

// // // --- DOM Elements ---
// // const coinsElement = document.getElementById("coins");
// // const resultElement = document.getElementById("result");
// // const countdownElement = document.getElementById("countdown");
// // const countdownCircle = document.getElementById("countdown-circle");
// // const dragonCardContainer = document.getElementById("dragon-card-container");
// // const tigerCardContainer = document.getElementById("tiger-card-container");
// // const dragonCardFront = document.getElementById("dragon-card-front");
// // const tigerCardFront = document.getElementById("tiger-card-front");
// // const betButtonsContainer = document.getElementById("bet-buttons-container");
// // const coinButtonsContainer = document.getElementById("coin-buttons-container");
// // const confettiContainer = document.getElementById("confetti-container");
// // const gameContainer = document.querySelector(".game-card");
// // const notEnoughCoinsElement = document.getElementById("not-enough-coins");
// // const dragonBetAmountElement = document.getElementById("dragon-bet-amount");
// // const tieBetAmountElement = document.getElementById("tie-bet-amount");
// // const tigerBetAmountElement = document.getElementById("tiger-bet-amount");

// // // --- Helper Functions ---

// // function createConfetti() {
// //     // ... (keep existing confetti logic)
// //     const colors = ["#f00", "#0f0", "#00f", "#ff0", "#0ff", "#f0f"];
// //     for (let i = 0; i < 100; i++) {
// //         const confetti = document.createElement("div");
// //         confetti.classList.add("confetti");
// //         confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
// //         confetti.style.left = `${Math.random() * 100}vw`;
// //         confetti.style.animationDelay = `${Math.random()}s`;
// //         confetti.style.animationDuration = `${Math.random() * 3 + 2}s`;
// //         confettiContainer.appendChild(confetti);
// //     }
// //     setTimeout(() => {
// //         confettiContainer.innerHTML = '';
// //     }, 5000);
// // }

// // // Updates the display for a specific card's bet amount
// // function updateSpecificBetAmountDisplay(cardName, amount) {
// //     const element = document.getElementById(`${cardName.toLowerCase()}-bet-amount`);
// //     if (element) {
// //         element.textContent = amount;
// //     }
// // }

// // // Updates the total coins display and checks if betting should be disabled
// // function updateCoinsDisplay() {
// //     coinsElement.textContent = coins;
// //     if (coins < 10) { // Assuming 10 is the minimum bet coin value
// //         notEnoughCoinsElement.classList.remove("hidden");
// //         // Disable coin buttons if not enough for the smallest coin
// //         coinButtonsContainer.querySelectorAll('.coin-button').forEach(button => {
// //             if (parseInt(button.dataset.amount) > coins) {
// //                 button.disabled = true;
// //                  const lock = button.nextElementSibling;
// //                  if (lock && lock.classList.contains('lock-overlay')) {
// //                      lock.classList.remove('hidden');
// //                  }
// //             }
// //         });
// //     } else {
// //         notEnoughCoinsElement.classList.add("hidden");
// //         // Re-enable coin buttons if betting is otherwise allowed
// //         if (gstatus === "1" && countdown > 5) {
// //              coinButtonsContainer.querySelectorAll('.coin-button').forEach(button => {
// //                  button.disabled = false;
// //                  const lock = button.nextElementSibling;
// //                  if (lock && lock.classList.contains('lock-overlay')) {
// //                      lock.classList.add('hidden');
// //                  }
// //              });
// //         }
// //     }
// //      // Always check general betting status
// //      checkBettingStatus();
// // }

// // function updateResultDisplay(text) {
// //     resultElement.textContent = text;
// // }

// // function updateCountdownDisplay() {
// //     countdownElement.textContent = countdown > 0 ? countdown : "⏱";
// //     const circumference = 2 * Math.PI * 15; // Radius is 15
// //     const offset = ((30 - countdown) / 30) * circumference;
// //     countdownCircle.style.strokeDashoffset = offset;
// //     countdownCircle.style.stroke = countdown <= 5 ? "url(#redGradient)" : "url(#greenGradient)";

// //     // Disable betting in the last 5 seconds
// //     if (countdown <= 5 && gstatus === "1") {
// //         disableBetting();
// //         updateResultDisplay("Bets Closed!");
// //     }
// //     if (countdown > 5 && gstatus === "1") {
// //          enableBetting(); // Re-enable if countdown goes above 5 (unlikely in normal flow, but good practice)
// //     }
// // }

// // function getCardImagePath(card) {
// //     if (!card || !card.suit) return "./img/cards/patti_back.png"; // Use relative path
// //     const suitMap = { clubs: "CC", diamonds: "DD", hearts: "HH", spades: "SS" };
// //     return `./img/cards/${card.name}${suitMap[card.suit]}.png`; // Use relative path
// // }

// // function resetCardsVisual() {
// //     dragonCardFront.src = "./img/cards/patti_back.png";
// //     tigerCardFront.src = "./img/cards/patti_back.png";
// //     dragonCardContainer.classList.remove("flipped");
// //     tigerCardContainer.classList.remove("flipped");
// //     revealDragon = false;
// //     revealTiger = false;
// // }

// // // Resets bet amounts data and display
// // function resetBets() {
// //     bets = { Dragon: 0, Tie: 0, Tiger: 0 };
// //     selectedBetTarget = null;
// //     dragonBetAmountElement.textContent = 0;
// //     tieBetAmountElement.textContent = 0;
// //     tigerBetAmountElement.textContent = 0;
// //     removeBetTargetHighlight(); // Remove visual selection highlight
// // }

// // // Main function to reveal cards and determine results
// // function revealCardsAndCalculateResult() {
// //     disableBetting(); // Ensure betting is off

// //     // --- Card Drawing (Keep existing logic) ---
// //     const shuffled = [...fullDeck];
// //     for (let i = shuffled.length - 1; i > 0; i--) {
// //         const j = Math.floor(Math.random() * (i + 1));
// //         [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
// //     }
// //     // Ensure draw avoids identical cards (value and suit)
// //     dragonCard = shuffled.pop();
// //     let potentialTigerCard = shuffled.pop();
// //     while (potentialTigerCard && dragonCard && potentialTigerCard.value === dragonCard.value && potentialTigerCard.suit === dragonCard.suit) {
// //         potentialTigerCard = shuffled.pop(); // Draw again if identical
// //     }
// //     tigerCard = potentialTigerCard;
// //     // --- End Card Drawing ---


// //     // --- Reveal Animation ---
// //     setTimeout(() => {
// //         if(dragonCard) {
// //             dragonCardFront.src = getCardImagePath(dragonCard);
// //             dragonCardContainer.classList.add("flipped");
// //             revealDragon = true;
// //         } else {
// //             console.error("Dragon card is missing!");
// //             updateResultDisplay("Card Error!");
// //         }
// //     }, 500);

// //     setTimeout(() => {
// //          if(tigerCard) {
// //             tigerCardFront.src = getCardImagePath(tigerCard);
// //             tigerCardContainer.classList.add("flipped");
// //             revealTiger = true;
// //          } else {
// //             console.error("Tiger card is missing!");
// //              updateResultDisplay("Card Error!");
// //          }
// //     }, 1500);
// //     // --- End Reveal Animation ---

// //     // --- Calculate Winner and Payout ---
// //     setTimeout(() => {
// //         if (!dragonCard || !tigerCard) {
// //              updateResultDisplay("Error revealing cards.");
// //              // Still proceed to reset the game state after a delay
// //              setTimeout(resetRound, 4000);
// //              return;
// //         }

// //         let winner = null;
// //         if (dragonCard.value > tigerCard.value) {
// //             winner = "Dragon";
// //         } else if (tigerCard.value > dragonCard.value) {
// //             winner = "Tiger";
// //         } else {
// //             winner = "Tie";
// //         }

// //         let totalWinnings = 0;
// //         let totalNetChange = 0; // Tracks net change (wins - losses)
// //         let resultText = `Result: ${winner}! `;

// //         // Calculate winnings for each bet placed
// //         for (const [card, amount] of Object.entries(bets)) {
// //             if (amount > 0) {
// //                 if (card === winner) {
// //                     // Payout: Tie typically pays 8:1, Dragon/Tiger 1:1 (meaning you get 2x back)
// //                     const payoutMultiplier = (winner === "Tie") ? 8 : 2; // 8x for Tie, 2x for D/T
// //                     const winAmount = amount * payoutMultiplier;
// //                     totalWinnings += winAmount;
// //                     totalNetChange += winAmount - amount; // Add profit
// //                      resultText += ` Won ${winAmount} on ${card}.`;
// //                 } else {
// //                     // Bet was lost (already deducted when placed)
// //                      totalNetChange -= amount; // Subtract loss
// //                      resultText += ` Lost ${amount} on ${card}.`;
// //                 }
// //             }
// //         }

// //         coins += totalWinnings; // Add back original bets + profits for winning bets
// //         updateCoinsDisplay();

// //         if (totalNetChange > 0) {
// //             updateResultDisplay(`🎉 You Win! ${resultText}`);
// //             createConfetti();
// //         } else if (totalNetChange < 0) {
// //             updateResultDisplay(`❌ You Lose. ${resultText}`);
// //             gameContainer.classList.add("animate-shake");
// //             setTimeout(() => gameContainer.classList.remove("animate-shake"), 1000);
// //         } else { // totalNetChange === 0 (no bets placed, or bet on non-winner and lost)
// //              if (Object.values(bets).some(amount => amount > 0)) { // Check if any bet was placed
// //                  updateResultDisplay(`No winning bets. ${resultText}`);
// //              } else {
// //                  updateResultDisplay(`Result: ${winner}. No bets placed.`);
// //              }
// //         }

// //         // Schedule the next round reset
// //         setTimeout(resetRound, 4000);

// //     }, 3000); // Wait for card animations + a little extra
// // }

// // // Resets the game state for a new round
// // function resetRound() {
// //     updateResultDisplay("");
// //     countdown = 30; // Reset countdown timer
// //     gstatus = "1"; // Re-open betting (server should confirm this)
// //     updateCountdownDisplay();
// //     resetBets(); // Clear stored bets and selection
// //     resetCardsVisual(); // Flip cards back
// //     enableBetting(); // Re-enable betting buttons
// //     // Server might send an explicit "new_round" event to confirm gstatus and timer
// // }

// // // Selects which card (Dragon, Tie, Tiger) to bet on next
// // function selectBetTargetHandler(event) {
// //     if (gstatus === "0" || countdown <= 5) return; // Can't select if betting is closed

// //     selectedBetTarget = event.currentTarget.dataset.bet;
// //     highlightSelectedBetTarget(); // Visually show which card is selected
// //     console.log("Selected bet target:", selectedBetTarget);

// //     // Re-enable coin buttons if they were disabled due to insufficient funds for a *previous* target
// //     updateCoinsDisplay();
// // }

// // // Adds the coin amount to the selected card's bet
// // function handleCoinButtonClick(event) {
// //     const amount = parseInt(event.currentTarget.dataset.amount);

// //     // Validation checks
// //     if (gstatus === "0" || countdown <= 5) {
// //         console.log("Betting closed.");
// //         return;
// //     }
// //     if (!selectedBetTarget) {
// //         alert("Please select Dragon, Tie, or Tiger first!");
// //         return;
// //     }
// //      if (coins < amount) {
// //         console.log("Not enough coins for this amount:", amount);
// //         alert("Not enough coins to place this bet.");
// //         return;
// //     }

// //     // Place the bet
// //     coins -= amount;
// //     bets[selectedBetTarget] += amount;

// //     updateCoinsDisplay(); // Update total coins display
// //     updateSpecificBetAmountDisplay(selectedBetTarget, bets[selectedBetTarget]); // Update display for the specific card

// //     console.log(`Bet ${amount} on ${selectedBetTarget}. Total on ${selectedBetTarget}: ${bets[selectedBetTarget]}`);

// //     // --- Emit bet to backend ---
// //     // It's often better to send the *total* bet amount for that card each time,
// //     // allowing the backend to simply store the latest value per user/card/round.
// //     const userId = "12345"; // Replace with actual user ID
// //     const matchId = "match_001"; // Replace with actual match ID
// //     const roundId = "round_001"; // Replace with actual round ID

// //     socket.emit("place_bet", {
// //         userId: userId, // Good practice to include user ID
// //         card: selectedBetTarget,
// //         betAmount: bets[selectedBetTarget], // Send the *total* bet on this card
// //         matchId: matchId,
// //         roundId: roundId
// //     });
// //     // --- End Emit ---
// // }

// // // Adds/removes visual highlight for the selected bet target
// // function highlightSelectedBetTarget() {
// //     betButtonsContainer.querySelectorAll('.bet-button').forEach(button => {
// //         if (button.dataset.bet === selectedBetTarget) {
// //             button.classList.add("selected-bet-target"); // Add a CSS class for highlighting
// //         } else {
// //             button.classList.remove("selected-bet-target");
// //         }
// //     });
// // }

// // function removeBetTargetHighlight() {
// //      betButtonsContainer.querySelectorAll('.bet-button').forEach(button => {
// //         button.classList.remove("selected-bet-target");
// //     });
// // }


// // // Checks game status and coin amount to enable/disable betting areas
// // function checkBettingStatus() {
// //     const bettingAllowed = gstatus === "1" && countdown > 5;

// //     // Bet selection buttons (Dragon, Tie, Tiger)
// //     betButtonsContainer.querySelectorAll('.bet-button').forEach(button => {
// //         button.disabled = !bettingAllowed;
// //          const lock = document.getElementById(`${button.dataset.bet.toLowerCase()}-lock`);
// //          if (lock) {
// //              lock.classList.toggle('hidden', bettingAllowed);
// //          }
// //     });

// //     // Coin buttons
// //     coinButtonsContainer.querySelectorAll('.coin-button').forEach(button => {
// //         const amount = parseInt(button.dataset.amount);
// //         const canAfford = coins >= amount;
// //         button.disabled = !bettingAllowed || !canAfford; // Disable if betting closed OR can't afford

// //         const lock = button.nextElementSibling; // Assumes lock overlay is sibling
// //         if (lock && lock.classList.contains('lock-overlay')) {
// //             lock.classList.toggle('hidden', bettingAllowed && canAfford);
// //         }
// //     });

// //      if (!bettingAllowed && selectedBetTarget) {
// //        // If betting becomes disallowed, remove selection highlight
// //        removeBetTargetHighlight();
// //        selectedBetTarget = null;
// //      }
// // }


// // function disableBetting() {
// //     console.log("Disabling betting");
// //     checkBettingStatus(); // Let checkBettingStatus handle disabling based on conditions
// // }

// // function enableBetting() {
// //      console.log("Enabling betting");
// //     checkBettingStatus(); // Let checkBettingStatus handle enabling based on conditions
// // }


// // // --- Event Listeners ---
// // betButtonsContainer.querySelectorAll('.bet-button').forEach(button => {
// //     button.addEventListener('click', selectBetTargetHandler);
// // });

// // coinButtonsContainer.querySelectorAll('.coin-button').forEach(button => {
// //     button.addEventListener('click', handleCoinButtonClick);
// // });

// // // --- Socket Events ---
// // socket.on("connect", () => {
// //     console.log("Connected to server", socket.id);
// //     // Optional: Request initial game state from server upon connection
// //     // socket.emit("request_initial_state");
// // });

// // socket.on("game_update", (data) => {
// //     console.log("Received game_update:", data);
// //     const previousStatus = gstatus; // Store previous status
// //     countdown = data.timer;
// //     gstatus = data.gstatus; // "1" for betting, "0" for closed

// //     updateCountdownDisplay(); // Update timer display first
// //     checkBettingStatus(); // Update enabled/disabled state based on new status

// //     // If status just changed to betting closed ("0"), clear selection
// //     if (previousStatus === "1" && gstatus === "0" && selectedBetTarget) {
// //        removeBetTargetHighlight();
// //        selectedBetTarget = null;
// //     }

// //     // *** START REVEAL WHEN SERVER SAYS BETTING IS CLOSED ***
// //     // Check if the status *changed* from betting open to closed
// //     if (previousStatus === "1" && gstatus === "0") {
// //         console.log("Server signaled betting closed. Starting reveal...");
// //         updateResultDisplay("Bets Closed! Revealing cards..."); // Give immediate feedback
// //         // Ensure reveal isn't accidentally triggered multiple times if server sends rapid updates
// //         // (Using previousStatus check helps prevent this)
// //         revealCardsAndCalculateResult(); // <--- TRIGGER THE REVEAL PROCESS
// //     }
// //     // *** END REVEAL TRIGGER ***


// //     // Handle other potential updates from the server (keep existing logic)
// //     // ... (e.g., round_result, new_round)
// //     if (data.event === "round_result") {
// //        // If server sends results directly, you might adjust payout logic here
// //        // but the reveal process should ideally have already started via gstatus change
// //     } else if (data.event === "new_round") {
// //        // Server explicitly tells client a new round started
// //        // Ensure resetRound is called if it wasn't already scheduled by reveal
// //        // Could add a check here: if reveal process didn't run, call resetRound directly.
// //        // However, the flow above (gstatus:0 -> reveal -> reset) is generally preferred.
// //        console.log("Server initiated new round.");
// //        // Consider if resetRound needs to be called here robustly,
// //        // in case the reveal->reset sequence failed for some reason.
// //        // For now, rely on the reveal sequence.
// //        // resetRound(); // Potentially call here as a fallback? Be careful not to double-reset.
// //     }
// // });

// // socket.on("bet_accepted", (data) => {
// //     // Optional: Server confirms a bet was accepted
// //     console.log("Bet accepted by server:", data);
// //     // You might update the display only after server confirmation for robustness
// // });

// // socket.on("bet_rejected", (data) => {
// //     // Optional: Server rejected a bet (e.g., insufficient funds server-side, betting closed)
// //     console.error("Bet rejected by server:", data.reason);
// //     alert(`Bet rejected: ${data.reason}`);
// //     // Potentially revert the coin change client-side if needed
// //     // coins += data.amount; // Add back if rejected
// //     // bets[data.card] -= data.amount; // Revert bet object
// //     // updateCoinsDisplay();
// //     // updateSpecificBetAmountDisplay(data.card, bets[data.card]);
// // });


// // socket.on("disconnect", () => {
// //     console.log("Disconnected from server");
// //     updateResultDisplay("Disconnected");
// //     disableBetting(); // Disable everything on disconnect
// // });


// // // --- Game Loop (Client-side Timer Fallback) ---
// // // This interval mainly drives the countdown *display*. The actual betting window
// // // should ideally be controlled by the server's `gstatus`.
// // let gameLoopInterval = setInterval(() => {
// //     if (gstatus === "1" && countdown > 0) {
// //         countdown--;
// //         updateCountdownDisplay(); // Updates display and handles the <= 5 seconds disable

// //         if (countdown === 0) {
// //             // Time ran out locally, betting should already be disabled by updateCountdownDisplay
// //             // The server should ideally send a "betting closed" (gstatus=0) update
// //             // and then initiate the reveal process.
// //              console.log("Client timer reached 0. Waiting for server reveal.");
// //              // Optionally trigger reveal if no server message received after a short delay
// //              // revealCardsAndCalculateResult(); // Only if server comms are unreliable
// //         }
// //     } else if (gstatus === "0" && countdown > 0) {
// //          // If server says betting is closed, but timer is still running down,
// //          // just keep updating the timer display.
// //          countdown --; // Keep counting down visually even if betting is closed early
// //          updateCountdownDisplay();
// //          if (countdown === 0) {
// //             console.log("Reveal phase timer ended.");
// //             // The reveal process should have started via server trigger or earlier timeout
// //          }
// //     }
// // }, 1000);

// // // --- Initial Setup ---
// // console.log("Initial coins:", coins);
// // updateCoinsDisplay();
// // updateCountdownDisplay();
// // checkBettingStatus(); // Set initial button states based on gstatus and coins
// // resetCardsVisual(); // Ensure cards start facedown


// // // --- Add CSS for highlighting the selected bet target ---
// // /* Add this to your CSS file */
// // /*
// // .bet-button.selected-bet-target {
// //   border: 3px solid gold;
// //   box-shadow: 0 0 10px gold;
// //   transform: scale(1.05);
// // }

// // .bet-button:disabled {
// //     cursor: not-allowed;
// //     opacity: 0.6;
// // }

// // .coin-button:disabled {
// //      cursor: not-allowed;
// //      opacity: 0.6;
// //      filter: grayscale(80%);
// // }

// // .hidden {
// //     display: none !important;
// // }

// // .lock-overlay {
// //     position: absolute;
// //     top: 0;
// //     left: 0;
// //     width: 100%;
// //     height: 100%;
// //     background-color: rgba(0, 0, 0, 0.5);
// //     display: flex;
// //     justify-content: center;
// //     align-items: center;
// //     color: white;
// //     font-size: 2em;
// //     z-index: 5; // Ensure it's above the button
// //     pointer-events: none; // Allow clicks to pass through if needed (though button is disabled)
// // }

// // .lock-overlay::after {
// //     content: '🔒'; // Lock icon
// // }

// // */



// =============================================
// CLIENT-SIDE JAVASCRIPT (with Place Final Bet Button)
// =============================================

// --- Constants --- (Keep as is)