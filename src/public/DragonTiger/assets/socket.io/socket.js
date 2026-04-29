
const db = require('../../../../config/connectDB');


const { updateGameState, getCardResult } = require('../gameState'); 

function socketHandler(io) {
  let lastPhase = "betting"; 

  console.log("Socket handler initialized. Waiting for connections...");

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    try {
        const initialState = updateGameState();
        socket.emit('game_update', initialState);
        console.log(`Sent initial game_update to ${socket.id}`);
    } catch (error) {
        console.error("Error sending initial state:", error);
    }

    socket.on("place_bet", async (data) => {
      let { userId, card, betAmount, matchId, roundId } = data;
    
      userId = userId ?? null;
      card = card ?? null;
      betAmount = betAmount ?? null;
      matchId = matchId ?? null;
      roundId = roundId ?? null;
    
      if (!userId || !card || !betAmount || !matchId || !roundId) {
        console.warn("🚫 Invalid bet data received:", { userId, card, betAmount, matchId, roundId });
        return socket.emit("bet_rejected", { error: "Missing required fields." });
      }
    
      try {
        const query = `
          INSERT INTO dragon_tiger (userId, card, amount, matchId, roundId)
          VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [userId, card, betAmount, matchId, roundId]);
    
        console.log(`✅ Bet stored. Insert ID: ${result.insertId}`);
        socket.emit("bet_accepted", { id: result.insertId });
    
      } catch (err) {
        console.error("❌ Failed to insert bet:", err.message);
        socket.emit("bet_rejected", { error: "Database error." });
      }
    });


    socket.on("place_final_bets", async (data) => {
        const { userId, bets, matchId, roundId } = data;
      
        // Validate all required fields
        if (!userId || !bets || typeof bets !== 'object' || !matchId || !roundId) {
          console.error("❌ Missing or invalid data in 'place_final_bets':", data);
          socket.emit("bet_rejected", { error: "Incomplete or invalid bet data." });
          return;
        }
      
        try {
          const betEntries = Object.entries(bets); // e.g. { Dragon: 100, Tiger: 50 }
      
          for (const [card, amount] of betEntries) {
            // Log for debugging
            console.log("📝 Attempting to insert bet:", { userId, card, amount, matchId, roundId });
      
            if (typeof amount === 'number' && amount > 0 && card) {
              await db.execute(
                `INSERT INTO dragon_tiger (userId, card, amount, matchId, roundId)
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, card, amount, matchId, roundId]
              );
            } else {
              console.warn("⚠️ Skipping invalid bet:", { card, amount });
            }
          }
      
          console.log("✅ Final bets saved for:", userId);
          socket.emit("bet_accepted", { message: "Bets placed successfully" });
      
        } catch (err) {
          console.error("❌ Error saving final bets:", err);
          socket.emit("bet_rejected", { error: "Database error." });
        }
      });
      
    


    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });


  }); 


  setInterval(() => {
    try {
      const updatedData = updateGameState();
      io.emit('game_update', updatedData);

      if (updatedData.phase === "card_reveal" && lastPhase !== "card_reveal") {
        const result = getCardResult();
        console.log("Server emitting card_reveal:", result);
        io.emit("card_reveal", result);
      }
      lastPhase = updatedData.phase;

    } catch (error) {
      console.error("Error in server interval:", error);
    }
  }, 1000);

}

module.exports = socketHandler;