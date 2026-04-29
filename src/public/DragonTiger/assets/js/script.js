{/* <script> */}
let resultCoin = 0;
const placeFinalBetBtn = document.getElementById('place-final-bet-button');
// let allBets = []; // This array is not strictly necessary for the core logic but can be kept for client-side history if needed

const apiUrl = 'http://localhost:3000/api/webapi/GetUserInfo';

async function fetchUserInfo() {
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      console.log('API Response:', result);

      if (result && result.data && result.data.win_wallet !== undefined) {
        document.getElementById('coins').textContent = result.data.win_wallet;
        resultCoin = result.data.win_wallet;
        console.log("coins----", resultCoin);

        initGame(resultCoin); // Initialize the game after getting coin data
      } else {
        console.warn('win_wallet not found in response');
        initGame(0); // Initialize with 0 coins if API fails or lacks data
      }
    } else {
      console.error('API Error:', response.status);
      initGame(0); // Initialize with 0 coins on API error
    }
  } catch (error) {
    console.error('Fetch Error:', error);
    initGame(0); // Initialize with 0 coins on fetch error
  }
}

window.onload = fetchUserInfo;

// Note: The standalone checkBettingStatus and event listener outside initGame are removed
// as they need access to variables defined within initGame's scope.

function initGame(startingCoins) {
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
  const socket = io("http://localhost:3000");

  // --- State Variables ---
  let bets = { Dragon: 0, Tie: 0, Tiger: 0 }; // Staging object for current round bets
  let selectedBetTarget = null;
  let betsPlacedOn = {}; // Tracks outcomes included in the staged bet { Dragon: true }
  let dragonCard = null;
  let tigerCard = null;
  let countdown = 30;
  let coins = startingCoins || 0;
  let gstatus = "0";
  let roundInProgress = false;
  // let betAmount = null; // Not actively used in this flow
  let currentRoundId = null;
  let currentMatchId = null;
  let finalBetSubmittedThisRound = false; // Flag to track if final bet is sent

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
  const gameContainer = document.querySelector(".game-card");
  const notEnoughCoinsElement = document.getElementById("not-enough-coins");
  const dragonBetAmountElement = document.getElementById("dragon-bet-amount");
  const tieBetAmountElement = document.getElementById("tie-bet-amount");
  const tigerBetAmountElement = document.getElementById("tiger-bet-amount");
  const totalPendingBetElement = document.getElementById("total-pending-bet"); // Get reference

  // --- Helper Functions --- (Keep createConfetti, getCardImagePath etc. as they are)
  function createConfetti() {
      const colors = ["#f00", "#0f0", "#00f", "#ff0", "#0ff", "#f0f", "#fff", "#f90"];
      confettiContainer.innerHTML = '';
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
      setTimeout(() => {
           if (confettiContainer.children.length > 0) {
               confettiContainer.innerHTML = '';
           }
      }, 7000);
  }

  function updateSpecificBetAmountDisplay(cardName, amount) {
      const element = document.getElementById(`${cardName.toLowerCase()}-bet-amount`);
      if (element) {
          element.textContent = amount;
      }
  }

  function updateCoinsDisplay() {
      coinsElement.textContent = coins;
      // checkBettingStatus() will be called separately when needed
  }

  function updateResultDisplay(text) {
      resultElement.textContent = text;
  }

  function updateCountdownDisplay() {
      countdownElement.textContent = countdown > 0 ? countdown : "⏱";
      const circumference = 2 * Math.PI * 15.9155;
      const offset = ((30 - Math.max(0, countdown)) / 30) * circumference;
      countdownCircle.style.strokeDashoffset = offset;

      if (gstatus === "1" && countdown <= 5) {
          countdownCircle.style.stroke = "url(#redGradient)";
      } else if (gstatus === "1") {
          countdownCircle.style.stroke = "url(#greenGradient)";
      } else {
          countdownCircle.style.stroke = "url(#greyGradient)";
      }
  }

  function getCardImagePath(card) {
      const defaultPath = "../img/cards/patti_back.png";
      if (!card || !card.suit || !card.name) return defaultPath;
      const suitMap = { clubs: "CC", diamonds: "DD", hearts: "HH", spades: "SS" };
      const cardName = card.name;
      const cardSuit = suitMap[card.suit];
      if (!cardSuit) return defaultPath;
      return `../img/cards/${cardName}${cardSuit}.png`;
  }

  function resetCardsVisual() {
      dragonCardFront.src = getCardImagePath(null);
      tigerCardFront.src = getCardImagePath(null);
      dragonCardContainer.classList.remove("flipped");
      tigerCardContainer.classList.remove("flipped");
  }

  function resetBets() {
      console.log("DEBUG: resetBets called.");
      bets = { Dragon: 0, Tie: 0, Tiger: 0 }; // Reset staging bets
      selectedBetTarget = null;
      betsPlacedOn = {}; // Reset indicators
      finalBetSubmittedThisRound = false; // Reset submission flag
      dragonBetAmountElement.textContent = '0';
      tieBetAmountElement.textContent = '0';
      tigerBetAmountElement.textContent = '0';
      if(totalPendingBetElement) totalPendingBetElement.textContent = 'Total Bet: 0'; // Reset total display
      removeBetTargetHighlight();
      updateOutcomeButtonStates();
      checkBettingStatus(); // Update button states after reset
      console.log("DEBUG: resetBets finished.");
  }

  function updateOutcomeButtonStates() {
      betButtonsContainer.querySelectorAll('.bet-button').forEach(button => {
          const betTarget = button.dataset.bet;
          if (betsPlacedOn[betTarget]) { // Check if *any* amount is staged for this target
              button.classList.add("bet-placed-indicator");
          } else {
              button.classList.remove("bet-placed-indicator");
          }
      });
  }

  // --- Reveal Logic (Keep as is) ---
  function revealCardsAndCalculateResult() {
      if (roundInProgress) {
          console.warn("DEBUG: revealCardsAndCalculateResult already in progress, skipping.");
          return;
      }
      roundInProgress = true;
      console.log("DEBUG: revealCardsAndCalculateResult started (Using FINALIZED bets).");

      // Use server cards if available, otherwise simulate
      if (!dragonCard || !tigerCard) {
          console.log("DEBUG: Simulating card draw for reveal.");
          const shuffled = [...fullDeck];
          for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          dragonCard = shuffled.pop();
          tigerCard = shuffled.pop(); // Simplified draw for example
      } else {
           console.log("DEBUG: Using cards provided by server for reveal.");
      }
      console.log("DEBUG: Cards for reveal:", dragonCard, tigerCard);

      // Reveal Animation
      setTimeout(() => { if (dragonCard) { dragonCardFront.src = getCardImagePath(dragonCard); dragonCardContainer.classList.add("flipped"); } }, 500);
      setTimeout(() => { if (tigerCard) { tigerCardFront.src = getCardImagePath(tigerCard); tigerCardContainer.classList.add("flipped"); } }, 1500);

      // Calculate Winner and Payout (based on the 'bets' object *at the time of final submission*)
      setTimeout(() => {
          console.log("DEBUG: Calculating results based on submitted bets.");
          if (!dragonCard || !tigerCard) {
              updateResultDisplay("Error revealing cards.");
              roundInProgress = false; return;
          }

          let winner = null;
          if (dragonCard.value > tigerCard.value) winner = "Dragon";
          else if (tigerCard.value > dragonCard.value) winner = "Tiger";
          else winner = "Tie";

          // IMPORTANT: The payout calculation now implicitly uses the 'bets' state
          // from when the final bet was submitted. We don't need 'allBets' array here.
          let totalWinnings = 0;
          let totalLosses = 0; // Bets already deducted optimistically
          let netGain = 0; // Only calculate the profit/loss relative to stake
          let resultText = `Result: ${winner}! `;
          let anyBetsWerePlaced = Object.values(bets).some(amount => amount > 0);

          for (const [outcome, amount] of Object.entries(bets)) {
               if (amount > 0) {
                   if (outcome === winner) {
                       const payoutMultiplier = (winner === "Tie") ? 8 : 1;
                       const profit = amount * payoutMultiplier;
                       // Winnings = Stake back + Profit
                       // Since stake was already deducted, we add (Stake + Profit) back
                       totalWinnings += amount + profit;
                       resultText += ` Won ${amount + profit} on ${outcome}.`;
                   } else {
                       // Loss already accounted for by optimistic deduction
                       totalLosses += amount; // Keep track for display text
                       resultText += ` Lost ${amount} on ${outcome}.`;
                   }
               }
           }

           // Apply the winnings back to the coin total
           if (totalWinnings > 0) {
               coins += totalWinnings;
           }

           // Update UI
           if (anyBetsWerePlaced) {
               updateCoinsDisplay(); // Update coin total AFTER applying winnings
               netGain = totalWinnings - totalLosses; // Calculate net gain/loss for this round

               if (netGain > 0) {
                   updateResultDisplay(`🎉 You Win! ${resultText}`);
                   createConfetti();
               } else if (netGain < 0) {
                   updateResultDisplay(`❌ You Lose. ${resultText}`);
                   gameContainer.classList.add("animate-shake");
                   setTimeout(() => gameContainer.classList.remove("animate-shake"), 1000);
               } else {
                   updateResultDisplay(`🏁 Break Even! ${resultText}`);
               }
           } else {
                updateResultDisplay(`Result: ${winner}. No bets placed.`);
           }

          console.log("DEBUG: Result calculation finished.");
          roundInProgress = false;
      }, 3000);
  }

  function resetRound() {
      console.log("DEBUG: resetRound called.");
      updateResultDisplay("Place Your Bet!");
      countdown = 30;
      updateCountdownDisplay();
      resetBets(); // Resets staged bets, flags, and UI
      resetCardsVisual();
      roundInProgress = false;
      // checkBettingStatus() is called within resetBets()
      console.log("DEBUG: Round reset complete.");
  }

  function selectBetTargetHandler(event) {
      if (gstatus === "0" || finalBetSubmittedThisRound) return;

      selectedBetTarget = event.currentTarget.dataset.bet;
      highlightSelectedBetTarget();
      console.log("Selected bet target:", selectedBetTarget);
      checkBettingStatus(); // Mainly to update coin button states
  }

  /**
   * Handles coin button clicks - STAGES the bet only.
   */
  function handleCoinButtonClick(event) {
    const amount = parseInt(event.currentTarget.dataset.amount);
    console.log("Staging bet:", amount, "on", selectedBetTarget);

    if (gstatus === "0") {
      console.log("Betting closed (gstatus=0).");
      return;
    }
    if (finalBetSubmittedThisRound) {
      console.log("Final bet already submitted for this round.");
      return;
    }
    if (!selectedBetTarget) {
      alert("Please select Dragon, Tie, or Tiger first!");
      return;
    }
    if (coins < amount) {
      console.log("Not enough coins for this amount:", amount);
      notEnoughCoinsElement.classList.remove("hidden");
      setTimeout(() => notEnoughCoinsElement.classList.add("hidden"), 2000);
      return;
    }
    // No ID check needed here, only when submitting final bet

    // --- Stage the Bet (Client-side) ---
    coins -= amount; // Optimistic deduction
    bets = { ...bets, [selectedBetTarget]: (bets?.[selectedBetTarget] || 0) + amount };
    betsPlacedOn = { ...betsPlacedOn, [selectedBetTarget]: true }; // Mark target as having a staged bet

    // --- Update UI ---
    updateCoinsDisplay(); // Updates coin total
    updateSpecificBetAmountDisplay(selectedBetTarget, bets?.[selectedBetTarget] || 0);
    updateOutcomeButtonStates(); // Add checkmark or other indicator
    checkBettingStatus(); // Update total display and final bet button state

    console.log(`Staged ${amount} on ${selectedBetTarget}. Total staged on target: ${bets?.[selectedBetTarget]}. Coins left: ${coins}`);

    // --- DO NOT Emit individual bet here ---
  }

  /**
   * Handles the click event for the "Place Final Bets" button.
   */
  function handlePlaceFinalBetsClick() {
    const totalStagedBet = Object.values(bets).reduce((sum, amount) => sum + amount, 0);
    console.log("Attempting to place final bets. Total Staged:", totalStagedBet);

    if (gstatus === "0") {
      console.log("Betting closed (gstatus=0).");
      alert("Betting for this round is closed.");
      return;
    }
    if (finalBetSubmittedThisRound) {
      console.log("Final bet already submitted.");
      return; // Prevent double submission
    }
    if (totalStagedBet <= 0) {
      alert("Please place some bets before finalizing.");
      return;
    }
    if (!currentMatchId || !currentRoundId) {
      console.warn("Client: Match/Round ID missing. Cannot place final bets.");
      alert("Game data is initializing, please wait a moment.");
      return;
    }

    // --- Disable Controls ---
    finalBetSubmittedThisRound = true; // Set flag
    checkBettingStatus(); // This will now disable buttons based on the flag

    // --- Prepare and Emit Data ---
    const userId = socket.id || "guest_" + Math.random().toString(16).slice(2);
    const finalBetData = {
      userId: userId,
      bets: bets, // Send the staged bets object
      matchId: currentMatchId,
      roundId: currentRoundId
    };

    console.log("--- Emitting place_final_bets ---");
    console.log(JSON.stringify(finalBetData, null, 2));
    socket.emit("place_final_bets", finalBetData);

    updateResultDisplay("Bets submitted. Waiting for round to end...");
    // Optional: Add to client-side history array if needed
    // allBets.push({ roundId: currentRoundId, submittedBets: { ...bets } });
  }

  function highlightSelectedBetTarget() {
    betButtonsContainer.querySelectorAll('.bet-button').forEach(button => {
      button.classList.toggle("selected-bet-target", button.dataset.bet === selectedBetTarget);
    });
  }

  function removeBetTargetHighlight() {
    betButtonsContainer.querySelectorAll('.bet-button').forEach(button => {
      button.classList.remove("selected-bet-target");
    });
  }

  /**
   * Checks betting status and updates UI elements accordingly.
   */
  function checkBettingStatus() {
      const bettingPhaseActive = gstatus === "1" && countdown > 0;
      const canBet = bettingPhaseActive && !finalBetSubmittedThisRound;
      const totalStagedBet = Object.values(bets).reduce((sum, amount) => sum + amount, 0);

      // Update Total Pending Bet Display
      if(totalPendingBetElement) totalPendingBetElement.textContent = `Total Bet: ${totalStagedBet}`;

      // Enable/Disable Place Final Bet Button
      placeFinalBetBtn.disabled = !(canBet && totalStagedBet > 0);

      // Enable/Disable Bet Target Buttons
      betButtonsContainer.querySelectorAll('.bet-button').forEach(button => {
          button.disabled = !canBet;
          const lock = document.getElementById(`${button.dataset.bet.toLowerCase()}-lock`);
          if (lock) {
              lock.classList.toggle('hidden', canBet);
          }
      });

      // Enable/Disable Coin Buttons
      coinButtonsContainer.querySelectorAll('.coin-button').forEach(button => {
          const amount = parseInt(button.dataset.amount);
          const canAfford = coins >= amount;
          const isDisabled = !canBet || !selectedBetTarget || !canAfford;
          button.disabled = isDisabled;
          const lock = button.nextElementSibling;
          if (lock && lock.classList.contains('lock-overlay')) {
              lock.classList.toggle('hidden', !isDisabled);
          }
      });

      // "Not Enough Coins" Message (Only show if trying to stage a bet)
      if (canBet && selectedBetTarget) {
          const minCoinButtonAmount = 10; // Or determine dynamically
          let showNotEnough = false;
          // Check if ANY coin button is unaffordable
          coinButtonsContainer.querySelectorAll('.coin-button').forEach(button => {
              if (!button.disabled && coins < parseInt(button.dataset.amount)) {
                 // If a button *would* be enabled but they can't afford it
                 // This logic is a bit tricky, maybe simplify:
                 // Show if coins < min bet amount?
              }
          });
           // Simpler approach: Show if coins < smallest coin button value they might click
          if (coins < 10) { // Assuming 10 is the smallest coin
                notEnoughCoinsElement.classList.remove("hidden");
            } else {
                notEnoughCoinsElement.classList.add("hidden");
            }
      } else {
          notEnoughCoinsElement.classList.add("hidden");
      }

      // Clear selection if betting is no longer possible
      if (!canBet && selectedBetTarget) {
          removeBetTargetHighlight();
          selectedBetTarget = null;
      }
  }

  // --- Event Listeners ---
  betButtonsContainer.querySelectorAll('.bet-button').forEach(button => {
      button.addEventListener('click', selectBetTargetHandler);
  });

  coinButtonsContainer.querySelectorAll('.coin-button').forEach(button => {
      button.addEventListener('click', handleCoinButtonClick); // Stages bet
  });

  placeFinalBetBtn.addEventListener('click', handlePlaceFinalBetsClick); // Submits staged bets

  // --- Socket Event Handlers ---
  socket.on("connect", () => {
      console.log("Connected to server", socket.id);
      updateResultDisplay("Connecting...");
      // socket.emit("request_initial_state"); // Keep if server supports this
  });

  socket.on("game_update", (data) => {
    console.log("Received game_update:", data);
    const previousStatus = gstatus;

    // Update core state
    if (data.timer !== undefined) countdown = data.timer;
    if (data.gstatus !== undefined) gstatus = data.gstatus;
    // Server might send coin updates reflecting *actual* balance after processing results/bets
    if (data.coins !== undefined && !finalBetSubmittedThisRound) {
        // Only update if final bet NOT submitted, otherwise wait for result calculation
        // This needs careful handling based on server logic
        // Let's assume server sends coins after results are processed
        // coins = data.coins;
        // coinsElement.textContent = coins;
    }
    if (data.match_id !== undefined) currentMatchId = data.match_id;
    if (data.roundId !== undefined) currentRoundId = data.roundId;

    // Get cards for reveal phase
    if (data.dragonCard) dragonCard = data.dragonCard;
    if (data.tigerCard) tigerCard = data.tigerCard;

    updateCountdownDisplay();

    // State Transitions
    if (previousStatus === "0" && gstatus === "1") { // New Round Start
      console.log("Client: Server signaled new round start (gstatus 1).");
      resetRound(); // Resets bets, flags, UI
    } else if (previousStatus === "1" && gstatus === "0") { // Betting Ends
      console.log("Client: Server signaled betting closed (gstatus 0).");
      updateResultDisplay("Bets Closed! Revealing cards...");
      removeBetTargetHighlight();
      finalBetSubmittedThisRound = true; // Ensure betting is locked
      checkBettingStatus(); // Disable all betting controls

      // Reveal cards (if bets were submitted or just show result)
      const anyBetsWereSubmitted = Object.values(bets).some(amount => amount > 0); // Check staged bets at time of closing
      if (anyBetsWereSubmitted || (dragonCard && tigerCard)) { // Reveal if bets were placed OR server sent cards anyway
          console.log("Client: Proceeding to reveal and calculate.");
          if (!roundInProgress) {
              revealCardsAndCalculateResult();
          } else {
              console.warn("Client: Reveal already in progress, skipping duplicate trigger.");
          }
      } else {
          console.log("Client: No bet submitted this round. Waiting for next round.");
          resetCardsVisual();
          updateResultDisplay("No bet placed. Waiting for next round.");
      }
    }

    // Always update button states based on current status
    checkBettingStatus();
});


  socket.on("bet_accepted", (data) => {
      // Corresponds to the server accepting the "place_final_bets" submission
      console.log("Server accepted final bets:", data);
      updateResultDisplay("Bets Accepted!"); // Or keep "Bets submitted..."
      // Client state (coins deducted, controls disabled) already reflects submission.
  });

  socket.on("bet_rejected", (data) => {
    // Corresponds to the server rejecting the "place_final_bets" submission
    console.error("Client: Final Bets REJECTED by server. Reason:", data.reason);
    alert(`Bets rejected: ${data.reason || 'Unknown error'}`);

    // --- Revert Client State ---
    // Add back the optimistically deducted coins
    const totalRejectedAmount = Object.values(bets).reduce((sum, amount) => sum + amount, 0);
    if (totalRejectedAmount > 0) {
        coins += totalRejectedAmount;
        updateCoinsDisplay(); // Update UI
        console.log(`Client: Reverted ${totalRejectedAmount} coins due to rejection.`);
    }

    // Reset the submission flag and re-enable controls
    finalBetSubmittedThisRound = false;
    checkBettingStatus(); // Re-enables buttons

    updateResultDisplay("Bets rejected. Please adjust and try again.");
});


  socket.on("disconnect", () => {
      console.log("Disconnected from server");
      updateResultDisplay("Disconnected");
      gstatus = "0";
      finalBetSubmittedThisRound = true; // Prevent actions on disconnect
      checkBettingStatus();
      roundInProgress = false;
  });

  // --- Initial Setup ---
  document.addEventListener('DOMContentLoaded', () => {
    // This event listener might run *before* initGame if window.onload takes time.
    // It's safer to do initial UI setup at the end of initGame.
  });

  // Initial UI setup at the end of initGame
  console.log("Initializing UI at end of initGame.");
  coinsElement.textContent = coins;
  updateResultDisplay("Connecting...");
  resetCardsVisual();
  updateOutcomeButtonStates();
  updateCountdownDisplay();
  checkBettingStatus(); // Set initial button states

} // --- END of initGame function ---

{/* </script> */}