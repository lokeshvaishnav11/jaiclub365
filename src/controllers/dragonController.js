// const connection = require("../config/connectDB");

// const Dragon = async (io) => {
//   try {
//     const [poolValue] = await connection.execute('SELECT * FROM admin');
//     console.log("Admin Pool Value:", poolValue);
//   } catch (error) {
//     console.error("❌ Error fetching admin pool value:", error.message);
//   }
// };
// const userDekh = async (req,res) =>{
//     const auth = req?.cookies?.auth || null;
//     const [user] = await connection.execute('SELECT phone,money,win_wallet FROM users WHERE token = ?',[auth]);
//     const query = `
//   SELECT * 
//   FROM aviator WHERE status != 0
//   ORDER BY id DESC 
//   LIMIT 30;
// `;
// console.log("auth-------",user);


// const [result] = await connection.execute(query);
// const [betHistory] = await connection.execute(
//     `SELECT ar.*, a.*, 
//             DATE_FORMAT(ar.time, '%Y-%m-%d %H:%i:%s') AS formatted_time
//      FROM aviator_result ar
//      JOIN aviator a ON ar.period = a.id
//      WHERE ar.phone = ?
//      ORDER BY ar.period DESC`,  // Reverse order by period
//     [user[0]?.phone]
//   );
  
  
  
//     res.render('aviator.ejs', {
//         csrfToken: 'your_csrf_token',
//         user: {
//             currency: '₹',
//             id: 12345,
//         },
//         wallet: user[0]?.money+user[0]?.win_wallet,
//         settings: {
//             minBetAmount: 10,
//             maxBetAmount: 10000,
//         },
//         phone:user[0]?.phone,
//         currentGameData: JSON.stringify({ id: 1, name: 'Game Name' }),
//         result:result,
//         betHistory:betHistory
//     });
// }


// module.exports = { Dragon,userDekh };
