const connection = require("../config/connectDB");

// const Aviator = async (io) => {
  let current_Value = 1.00;
  let speed = 0.5;
  let isFlying = true;
  let multiplierInterval;
  let betArray = [];
  
  // let [poolValue] = await connection.execute('SELECT total_pool FROM admin');
  // let [periodData] = await connection.execute('SELECT id FROM aviator WHERE status = 0');
  // let currentPeriod = periodData[0]?.id;
  // let pool = parseFloat(poolValue[0]?.total_pool);
  // let flagPool = pool;
  let crashValue = 20;
  let amountToDistribute = 0;
  let totalAmount;
  let adminSet = 0;
  

  // calculateCrash();
  // startMultiplierCalculation();



  async function reduceWallet(amount,phone,bet){
    const [user] = await connection.execute('select money,win_wallet from users where phone = ?',[phone]);
    let wallet =0;
    let win = user[0].win_wallet;
    if(bet>wallet+win){
      return {status:false};
    }
    if(amount>wallet+win){
        return {status:false};
    }
    else{
        wallet = wallet - amount;
        if(wallet<0){
            win = win + wallet;
            wallet = 0 ;
        }
       await connection.execute('UPDATE users SET money = ? , win_wallet = ? where phone = ?',[wallet,win,phone]);
       return {status:true,wallet:win+wallet};
    }
  }

  function getRandomBetween(max) {
    let randomValue;
    do {
      randomValue = Math.random() * (max - 1) + 1;
    } while (randomValue === 1 || randomValue === max);
    return randomValue;
  }

//   function startMultiplierCalculation() {
//     const acceleration = 0.0005; 
//     // const acceleration = 0.5; 


//      multiplierInterval = setInterval(() => {
//         // Increase the multiplier based on the current speed
//         current_Value += speed;


//         // Increase the speed over time to add acceleration
//         if(current_Value<5){
//           speed += acceleration;
//         }
//         else if(current_Value<20){
//           speed += acceleration*4;
//         }

//         else if(current_Value<50){
//           speed += acceleration*20;
//         }
       
//         else if(current_Value<50){
//           speed += acceleration*50;
//         }

//         else{
//           speed += acceleration*100;
//         }

//         // Check if the current value has reached or exceeded the crash value
//         if (current_Value >= crashValue) {
//             handleCrash(crashValue);
//             clearInterval(multiplierInterval); // Stop the interval
//         }

//         // Optional: Log the current value for debugging
//         // console.log(`Current Value: ${current_Value.toFixed(2)}, Speed: ${speed.toFixed(4)}`);
//     }, 100);
// }




  // async function handleCrash() {
  //   // if(val<1.1){
  //   //   console.log(val,'crash value')
  //   // }

  //   // console.log(val,'crash value');

  //   crashValue = 5.0;
    
  //   // io.emit('crash', { crash: val,period:currentPeriod });
  //   isFlying = false;
   
  //   //  isFlying = false;
    

  //   if (betArray.length > 0) {
  //     await insertBetResults();
  //   }

  //   betArray = [];
  //   const [oldPool] = await connection.execute('select total_pool from admin');
  //   console.log(oldPool[0].total_pool,flagPool,'pool comarison')
  //   if(oldPool[0].total_pool==flagPool){
  //     await connection.execute('UPDATE admin SET total_pool = ?', [pool + amountToDistribute]);
  //   }
  //   const [updatedPool] = await connection.execute('SELECT total_pool FROM admin');
  //   pool = parseFloat(updatedPool[0].total_pool);
  //   flagPool = pool;
  //   amountToDistribute = 0;
     
  //   await connection.execute('UPDATE aviator SET status = ?, result = ? WHERE status = 0', [1, val]);
  //   await connection.execute('INSERT INTO aviator SET status = 0');
  //   const [newPeriod] = await connection.execute('SELECT id FROM aviator WHERE status = 0');
  //   currentPeriod = newPeriod[0]?.id;
   
  //   const [result] = await connection.execute('select aviator from admin');
  //   let adminValue = result[0].aviator;

  //   // await connection.execute('UPDATE admin SET aviator = ?',[0.00]);
  //   if(adminValue != 0){
  //     crashValue = parseFloat(adminValue);
  //   }
  //   io.emit("crashv",{crash:crashValue,period:currentPeriod});



  //   setTimeout(() => {
    
  //     current_Value = 1;
  //     speed = 0.01;
  //     setTimeout(()=>{
  //       isFlying = true;
  //       if(adminValue != 0){
  //         crashValue = parseFloat(adminValue);
  //       }
  //       else{
  //         calculateCrash();
  //       }
      
  //     io.emit('newbet',betArray);
  //     io.emit("crashv",{crash:crashValue,period:currentPeriod});

  //    // startMultiplierCalculation();
  //     },1000)
      
  //   }, 6000);

  // }

  async function insertBetResults() {
    const placeholders = betArray.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
    const query = `INSERT INTO aviator_result (phone, amount, type, period, crash, status) VALUES ${placeholders}`;
    const values = betArray.flatMap(bet => [
      bet.phone,
      parseInt(bet.bet_amount, 10) || 0,
      parseInt(bet.bet_type, 10) || 0,
      currentPeriod,
      parseFloat(bet.cashout) || 0.0,
      bet.status || 0
    ]);

    try {
      await connection.execute(query, values);
    } catch (error) {
      console.error("Error inserting bet data:", error);
    }
  }

  // function calculateCrash() {
  //   totalAmount = betArray.reduce((acc, bet) => acc + parseInt(bet.bet_amount), 0);

  //   console.log(totalAmount,'_',betArray,'bet array');

  //   if (betArray.length < 1) {
  //     console.log('case1')
  //     const randomNum = Math.floor(Math.random() * 10) + 1;
  //     if(randomNum==7){
  //       crashValue = 1.00;
  //     }
  //     else if(randomNum==1 || randomNum==6){
  //       crashValue = getRandomBetween(5);
  //     }
  //     else if(randomNum==2){
  //       crashValue = getRandomBetween(10);
  //     }
  //     else if(randomNum==3){
  //       crashValue = getRandomBetween(30);
  //     }
  //     else if(randomNum==4){
  //       crashValue = getRandomBetween(100);
  //     }
  //     else if(randomNum==5){
  //       crashValue = getRandomBetween(200);
  //     }
  //   else{
  //     crashValue = getRandomBetween(300);
  //   }


     
  //   // console.log('step1')
  //   // crashValue = 10.00;
  //     return;
  //   }

  //   if (betArray.length <= 5 && totalAmount<=300 || betArray.length==1) {
  //     console.log('case2')
  //     const randomNum = Math.floor(Math.random() * 10) + 1;
  //     if(randomNum<=2){
  //       console.log('step1')
  //     crashValue = 1.00;
  //       return;
  //     }

  //     console.log('step2')
  //     const maxValue = (pool*0.25) / totalAmount;
  //     crashValue = maxValue <= 1 ? 1.00 : getRandomBetween(maxValue);
  //   } else {
  //     console.log('step3')
  //     amountToDistribute = totalAmount / 2;
  //   }
  // }

 async function updateBetStatus(msg) {
    betArray = betArray.map(bet => (
      bet.phone === msg.phone && bet.section_no === msg.section_no
        ? { ...bet, status: 1,cashout:msg.crashOut}
        : bet
    ))
    await connection.execute('UPDATE users SET win_wallet = win_wallet + ? WHERE phone = ?',[parseInt(msg.bet_amount)*msg.crashOut,msg.phone]);
  }

  // io.on('connection', (socket) => {
  //   console.log('A user connected');


    // socket.on('initialValReq', () => {
    //   isFlying =true
    //   current_Value = 1,
    //   speed = 0.5
    //   socket.emit('initialVal', { isFlying , current_Value,speed});
    // });

    // socket.on("crashed",async (msg)=>{
    //   if (betArray.length > 0) {
    //     await insertBetResults();
    //   }
    //   betArray = [];

    //   const [result] = await connection.execute('select aviator from admin');
    //   let adminValue = result[0].aviator;
    //   if(adminValue != 0){
    //     crashValue = parseFloat(adminValue);
    //     socket.emit("crashv",{crash:crashValue,period:currentPeriod});

    //   }
    //   else{
    //     crashValue = parseFloat((Math.random() * 10).toFixed(2));
    //     socket.emit('crashv',{crash:crashValue,period:currentPeriod})
    //   }
    // })


    // socket.on("crashvalue",async (msg) =>{
    //   // console.log("crashvaluue fired asdghjkl;asdfghjkldfghjkl")

    //   if (betArray.length > 0) {
    //     await insertBetResults();
    //   }
    //   betArray = [];

      // const [result] = await connection.execute('select aviator from admin');
      // let adminValue = result[0].aviator;
      // if(adminValue != 0){
      //   console.log("ghjkgghjklfghjkvghjk","adminvalue  0")
      //   crashValue = parseFloat(adminValue);
      //   socket.emit("crashv",{crash:crashValue,period:currentPeriod});

      // }
      // else{
      //   crashValue = parseFloat((Math.random() * 10).toFixed(2));
      //   console.log(crashValue,"GHJIOHUIJGHJHKTYGUHIJLOTYGUHIJOXTYJGUKHILJO:")
      //   socket.emit('crashv',{crash:crashValue,period:currentPeriod})
      // }

    // })

   const bet = async (req, res) => {
      try {
          const msg = req.body; // Expecting array of bets
          console.log('bet', msg);
  
          const totalBet = parseFloat(
              msg.reduce((acc, bet) => acc + parseFloat(bet.bet_amount), 0) / 2
          );
  
          let data = [];
  
          for (const val of msg) {
              let data1 = await reduceWallet(
                  parseInt(val.bet_amount),
                  val.phone,
                  totalBet
              );
  
              if (data1.status === false) {
                  data.push(data1);
                  break;
              } else {
                  console.log('hello at bet');
                  // pool += parseFloat(val.bet_amount) / 2;
                  data.push(data1);
                  betArray.push(val); // You must declare betArray globally for this to work
              }
          }
  
          res.json(data);
      } catch (error) {
          console.error('Error in /bet:', error);
          res.status(500).json({ error: 'Internal Server Error' });
      }
  };


//   const nextCrash = async (req, res) => {
//     try {
//         const [result] = await connection.execute('SELECT aviator FROM admin');
//         let adminValue = result[0]?.aviator;

//         let crashValue;
//         if (adminValue != 0) {
//             console.log("Admin-defined crash value:", adminValue);
//             crashValue = parseFloat(adminValue);
//         } else {
//             crashValue = parseFloat((Math.random() * 20).toFixed(2));
//             console.log("Random crash value:", crashValue);
//         }

//         res.json(crashValue);
//     } catch (error) {
//         console.error("Error in nextCrash:", error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// };


// const nextCrash = async (req, res) => {
//     try {
//         const now = new Date();

//         // Current slot based on hours and minutes
//         const hours = String(now.getHours()).padStart(2, '0');
//         const minutes = String(now.getMinutes()).padStart(2, '0');
//         const seconds = String(now.getSeconds()).padStart(2, '0');

//         // Only first minute of slot is valid
//         const slotTime = `${hours}:${minutes}:00`;

//         // Check crash value for this exact minute
//         const [rows] = await connection.execute(
//             'SELECT crash_value FROM crash_predictions WHERE time_slot = ?',
//             [slotTime]
//         );

//         let crashValue;
//         if (rows.length && rows[0].crash_value != 0) {
//             crashValue = parseFloat(rows[0].crash_value);
//             console.log(`Crash value for ${slotTime}:`, crashValue);
//         } else {
//             crashValue = parseFloat((Math.random() * 20).toFixed(2));
//             console.log(`Random crash value for ${slotTime}:`, crashValue);

//             // Save to DB for only this exact minute
//             await connection.execute(
//                 'INSERT INTO crash_predictions (time_slot, crash_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE crash_value = ?',
//                 [slotTime, crashValue, crashValue]
//             );
//         }

//         res.json(crashValue);

//         // Reset previous minute's value
//         const prevDate = new Date(now.getTime() - 60000); // 1 minute ago
//         const prevSlot = `${String(prevDate.getHours()).padStart(2, '0')}:${String(prevDate.getMinutes()).padStart(2, '0')}:00`;
//         await connection.execute(
//             'UPDATE crash_predictions SET crash_value = 0 WHERE time_slot = ?',
//             [prevSlot]
//         );

//     } catch (error) {
//         console.error("Error in nextCrash:", error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// };



const nextCrash = async (req, res) => {
    try {
        const now = new Date();

        // Get current hour and minute
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const slotTime = `${hours}:${minutes}`; // Current time in HH:MM format

        console.log(slotTime,"Slot Time")

        let crashValue;

        // Fetch the crash value for the current time slot
        const [rows] = await connection.execute(
            'SELECT crash_value FROM crash_predictions WHERE time_slot = ?',
            [slotTime]
        );

        if (rows.length && rows[0].crash_value !== 0) {
            // If crash value exists for the slot and is non-zero, use it
            crashValue = parseFloat(rows[0].crash_value);
            console.log(`Using existing crash value for ${slotTime}:`, crashValue);
        } else {
            // Otherwise, generate a random crash value between 0 and 20
            crashValue = parseFloat((Math.random() * 16).toFixed(2));
            console.log(`Generated random crash value for ${slotTime}:`, crashValue);

            // Insert or update the crash value for the current time slot in DB
            // await connection.execute(
            //     `INSERT INTO crash_predictions (time_slot, crash_value) 
            //      VALUES (?, ?) 
            //      ON DUPLICATE KEY UPDATE crash_value = ?`,
            //     [slotTime, crashValue, crashValue]
            // );
        }

        res.json(crashValue); // Respond with the generated crash value

        // Reset the crash value for the previous minute's slot
        const prevDate = new Date(now.getTime() - 60000); // Subtract 1 minute
        const prevHours = String(prevDate.getHours()).padStart(2, '0');
        const prevMinutes = String(prevDate.getMinutes()).padStart(2, '0');
        const prevSlot = `${prevHours}:${prevMinutes}`; // Previous time slot in HH:MM format

        // // Update the crash value of the previous slot to 0 in the DB
        // await connection.execute(
        //     'UPDATE crash_predictions SET crash_value = 0 WHERE time_slot = ?',
        //     [prevSlot]
        // );

    } catch (error) {
        console.error("Error in nextCrash:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
};




 const cashout = async (req, res) => {
      const msg = req.body;
  
      try {
          const totalBetsValid = betArray.length <= 5 && totalAmount <= 300;
          const singleBetValid = betArray.length === 1;
          const payoutAmount = parseInt(msg.bet_amount) * msg.crashOut;
  
          // if (!(totalBetsValid || singleBetValid) && amountToDistribute < payoutAmount) {
          //     // handleCrash(current_Value);
          //     // clearInterval(multiplierInterval);
          //     return res.status(400).json({ status: false });
          // }
  
          // pool = pool - payoutAmount;
          updateBetStatus(msg); // mark the bet as cashed out
          // io.emit('cashoutNew', payoutAmount); // broadcast update to all clients
  
          return res.json({ status: true });
      } catch (error) {
          console.error('Cashout error:', error);
          return res.status(500).json({ status: false, error: 'Internal server error' });
      }
  };




module.exports = { bet, cashout,nextCrash };
