let currentSecond = 30;
let inRevealPhase = false;

function generate10DigitId() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

let gameData = {
  gstatus: "1", // "1" = betting, "0" = paused (card reveal)
  timer: 30,
  match_id: "D/TId",
  roundId: generate10DigitId(),
  title: "20-20 Dragon Tiger 2",
  market: [
    {
      MarketName: "Dragon",
      Runners: [{ rate: "2.00", runnerName: "Dragon" }]
    },
    {
      MarketName: "Tie",
      Runners: [{ rate: "50.00", runnerName: "Tie" }]
    },
    {
      MarketName: "Tiger",
      Runners: [{ rate: "2.00", runnerName: "Tiger" }]
    }
  ]
};

function resetGameState() {
  currentSecond = 30;
  inRevealPhase = false;
  gameData = {
    ...gameData, // reuse existing structure
    gstatus: "1",
    timer: 30,
    roundId: generate10DigitId() // regenerate properly
  };
}

function updateGameState() {
  if (inRevealPhase) {
    gameData.gstatus = "0";
    gameData.timer = currentSecond;
    currentSecond--;

    if (currentSecond < 0) {
      resetGameState();
    }

    return { ...gameData, phase: "card_reveal" };
  } else {
    gameData.gstatus = currentSecond > 5 ? "1" : "0";
    gameData.timer = currentSecond;
    currentSecond--;

    if (currentSecond < 0) {
      inRevealPhase = true;
      currentSecond = 5;
    }

    return { ...gameData, phase: "betting" };
  }
}

// Simulated card flip
function getCardResult() {
  const dragon = Math.floor(Math.random() * 13) + 1;
  const tiger = Math.floor(Math.random() * 13) + 1;
  let winner = "Tie";
  if (dragon > tiger) winner = "Dragon";
  else if (tiger > dragon) winner = "Tiger";
  return { dragon, tiger, winner };
}

module.exports = { updateGameState, getCardResult };
