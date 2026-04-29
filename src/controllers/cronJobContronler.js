const connection = require("../config/connectDB");
const winGoController = require("./winGoController");
const k5Controller = require("./k5Controller");
const k3Controller = require("./k3Controller");
const cron = require('node-cron');
const async = require('async');


const cronJobGame1p = (io) => {
  cron.schedule('*/1 * * * *', async () => {
    await winGoController.addWinGo(1);
    await winGoController.handlingWinGo1P(1);
    const [winGo1] = await connection.execute('SELECT * FROM `wingo` WHERE `game` = "wingo" ORDER BY `id` DESC LIMIT 2 ', []);
    const data = winGo1; // Cầu mới chưa có kết quả
    io.emit('data-server', { data: data });

    await k5Controller.add5D(1);
    await k5Controller.handling5D(1);
    const [k5D] = await connection.execute('SELECT * FROM 5d WHERE `game` = 1 ORDER BY `id` DESC LIMIT 2 ', []);
    const data2 = k5D; // Cầu mới chưa có kết quả
    io.emit('data-server-5d', { data: data2, 'game': '1' });

    await k3Controller.addK3(1);
    await k3Controller.handlingK3(1);
    const [k3] = await connection.execute('SELECT * FROM k3 WHERE `game` = 1 ORDER BY `id` DESC LIMIT 2 ', []);
    const data3 = k3; // Cầu mới chưa có kết quả
    io.emit('data-server-k3', { data: data3, 'game': '1' });
  });

  cron.schedule('*/3 * * * *', async () => {
    await winGoController.addWinGo(3);
    await winGoController.handlingWinGo1P(3);
    const [winGo1] = await connection.execute('SELECT * FROM `wingo` WHERE `game` = "wingo3" ORDER BY `id` DESC LIMIT 2 ', []);
    const data = winGo1; // Cầu mới chưa có kết quả
    io.emit('data-server', { data: data });

    await k5Controller.add5D(3);
    await k5Controller.handling5D(3);
    const [k5D] = await connection.execute('SELECT * FROM 5d WHERE `game` = 3 ORDER BY `id` DESC LIMIT 2 ', []);
    const data2 = k5D; // Cầu mới chưa có kết quả
    io.emit('data-server-5d', { data: data2, 'game': '3' });

    await k3Controller.addK3(3);
    await k3Controller.handlingK3(3);
    const [k3] = await connection.execute('SELECT * FROM k3 WHERE `game` = 3 ORDER BY `id` DESC LIMIT 2 ', []);
    const data3 = k3; // Cầu mới chưa có kết quả
    io.emit('data-server-k3', { data: data3, 'game': '3' });
  });

  cron.schedule('*/5 * * * *', async () => {
    await winGoController.addWinGo(5);
    await winGoController.handlingWinGo1P(5);
    const [winGo1] = await connection.execute('SELECT * FROM `wingo` WHERE `game` = "wingo5" ORDER BY `id` DESC LIMIT 2 ', []);
    const data = winGo1; // Cầu mới chưa có kết quả
    io.emit('data-server', { data: data });

    await k5Controller.add5D(5);
    await k5Controller.handling5D(5);
    const [k5D] = await connection.execute('SELECT * FROM 5d WHERE `game` = 5 ORDER BY `id` DESC LIMIT 2 ', []);
    const data2 = k5D; // Cầu mới chưa có kết quả
    io.emit('data-server-5d', { data: data2, 'game': '5' });

    await k3Controller.addK3(5);
    await k3Controller.handlingK3(5);
    const [k3] = await connection.execute('SELECT * FROM k3 WHERE `game` = 5 ORDER BY `id` DESC LIMIT 2 ', []);
    const data3 = k3; // Cầu mới chưa có kết quả
    io.emit('data-server-k3', { data: data3, 'game': '5' });
  });

  cron.schedule('*/10 * * * *', async () => {
    await winGoController.addWinGo(10);
    await winGoController.handlingWinGo1P(10);
    const [winGo1] = await connection.execute('SELECT * FROM `wingo` WHERE `game` = "wingo10" ORDER BY `id` DESC LIMIT 2 ', []);
    const data = winGo1; // Cầu mới chưa có kết quả
    io.emit('data-server', { data: data });


    await k5Controller.add5D(10);
    await k5Controller.handling5D(10);
    const [k5D] = await connection.execute('SELECT * FROM 5d WHERE `game` = 10 ORDER BY `id` DESC LIMIT 2 ', []);
    const data2 = k5D; // Cầu mới chưa có kết quả
    io.emit('data-server-5d', { data: data2, 'game': '10' });

    await k3Controller.addK3(10);
    await k3Controller.handlingK3(10);
    const [k3] = await connection.execute('SELECT * FROM k3 WHERE `game` = 10 ORDER BY `id` DESC LIMIT 2 ', []);
    const data3 = k3; // Cầu mới chưa có kết quả
    io.emit('data-server-k3', { data: data3, 'game': '10' });
  });

  cron.schedule('* * 0 * * *', async () => {
    await connection.execute('UPDATE users SET roses_today = ?', [0]);
    await connection.execute('UPDATE point_list SET money = ?', [0]);
  });

  cron.schedule('1 0 * * *', async () => {
    await connection.execute(`
            UPDATE users
            SET 
                prev_daily = CASE
                    WHEN today_daily = 7 THEN 0
                    WHEN prev_daily = today_daily THEN prev_daily
                    ELSE 0
                END,
                today_daily = CASE
                    WHEN today_daily = 7 THEN 1
                    WHEN prev_daily = today_daily THEN today_daily + 1
                    ELSE 1
                END,
                claimed_today = FALSE
        `);
  });


  cron.schedule('1 0 * * *', async () => {
    await connection.execute(`
            UPDATE users
            SET 
                current_day = CASE
                    WHEN current_day = 7 THEN 1
                    ELSE current_day + 1
                END,
                weekly_claimed = CASE
                    WHEN current_day = 7 THEN '0,0,0,0,0,0,0'
                    ELSE weekly_claimed
                END
        `);
  });


  // partner reward
  cron.schedule('5 0 * * *', async () => {
    try {
      const now = new Date();
      const tenDaysAgo = new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000));
      const startOfDay = new Date(tenDaysAgo.setHours(0, 0, 0, 0)).getTime();
      const endOfDay = new Date(tenDaysAgo.setHours(23, 59, 59, 999)).getTime();

      const [users] = await connection.execute(`
            SELECT phone,invite
            FROM users 
            WHERE time BETWEEN ? AND ?
        `, [startOfDay, endOfDay]);

      if (users.length > 0) {
        for (const user of users) {

          const [recharges] = await connection.execute(`
                    SELECT time, money 
                    FROM recharge 
                    WHERE phone = ? 
                    ORDER BY time ASC
                `, [user.phone]);

          let firstRecharge = null;
          let secondRecharge = null;
          let thirdRecharge = null;
          let totalRecharge = 0;
          let bonus1 = 0;
          let bonus2 = 0;
          let bonus3 = 0;
          let invite = user.invite;

          recharges.forEach((recharge, index) => {
            totalRecharge += recharge.money;
            if (index === 0) {
              firstRecharge = recharge.money;
            } else if (index === 1) {
              secondRecharge = recharge.money;
            } else if (index === 2) {
              thirdRecharge = recharge.money;
            }
          })

          if (firstRecharge) {
            if (totalRecharge >= 25000 && firstRecharge >= 5000) {
              bonus1 = 600;
            }

            else if (totalRecharge >= 12500 && firstRecharge >= 2500) {
              bonus1 = 300;
            }

            else if (totalRecharge >= 2500 && firstRecharge >= 500) {
              bonus1 = 130;
            }

            else if (totalRecharge >= 1000 && firstRecharge >= 200) {
              bonus1 = 60;
            }
            if (bonus1 > 0) {
              await connection.execute('UPDATE users SET win_wallet = win_wallet + ? WHERE code = ?', [bonus1, invite])

              const [parent] = connection.execute('SELECT phone from users WHERE code = ?', [invite]);

              await connection.execute('INSERT INTO partner_reward SET phone = ? , member_phone = ? , type = ? , amount = ?', [parent[0].phone, user.phone, 'First Deposit', bonus1])

            }

          }

          if (secondRecharge) {
            if (totalRecharge >= 50000 && secondRecharge >= 10000) {
              bonus2 = 600;
            }

            else if (totalRecharge >= 25000 && secondRecharge >= 5000) {
              bonus2 = 300;
            }

            else if (totalRecharge >= 12500 && secondRecharge >= 2500) {
              bonus2 = 200;
            }

            else if (totalRecharge >= 5000 && secondRecharge >= 1000) {
              bonus2 = 130;
            }
            else if (totalRecharge >= 1500 && secondRecharge >= 300) {
              bonus2 = 60;
            }
            if (bonus2 > 0) {
              await connection.execute('UPDATE users SET win_wallet = win_wallet + ? WHERE code = ?', [bonus2, invite])

              const [parent] = connection.execute('SELECT phone from users WHERE code = ?', [invite]);

              await connection.execute('INSERT INTO partner_reward SET phone = ? , member_phone = ? , type = ? , amount = ?', [parent[0].phone, user.phone, 'Second Deposit', bonus2])

            }
          }

          if (thirdRecharge) {
            if (totalRecharge >= 100000 && thirdRecharge >= 20000) {
              bonus3 = 600;
            }

            else if (totalRecharge >= 50000 && thirdRecharge >= 10000) {
              bonus3 = 300;
            }

            else if (totalRecharge >= 25000 && thirdRecharge >= 5000) {
              bonus3 = 200;
            }

            else if (totalRecharge >= 12500 && thirdRecharge >= 2500) {
              bonus3 = 130;
            }
            else if (totalRecharge >= 5000 && thirdRecharge >= 1000) {
              bonus3 = 60;
            }

            if (bonus3 > 0) {
              await connection.execute('UPDATE users SET win_wallet = win_wallet + ? WHERE code = ?', [bonus3, invite])

              const [parent] = await connection.execute('SELECT phone from users WHERE code = ?', [invite]);

              await connection.execute('INSERT INTO partner_reward SET phone = ? , member_phone = ? , type = ? , amount = ?', [parent[0].phone, user.phone, 'Third Deposit', bonus3])

            }
          }

        }
      } else {
        console.log('No users found who joined exactly 10 days ago.');
      }
    } catch (error) {
      console.error('Error in cron job:', error);
    }
  });


  const comission = [
    { level1: 0.6, level2: 0.18, level3: 0.054, level4: 0.016, level5: 0.0048, level6: 0.0014 },
    { level1: 0.65, level2: 0.21, level3: 0.068, level4: 0.022, level5: 0.0072, level6: 0.0023 },
    { level1: 0.7, level2: 0.24, level3: 0.085, level4: 0.03, level5: 0.01, level6: 0.0036 },
    { level1: 0.75, level2: 0.28, level3: 0.1, level4: 0.039, level5: 0.014, level6: 0.0055 },
    { level1: 0.8, level2: 0.32, level3: 0.12, level4: 0.051, level5: 0.02, level6: 0.0081 },
    { level1: 0.9, level2: 0.4, level3: 0.18, level4: 0.082, level5: 0.036, level6: 0.016 },
    { level1: 1, level2: 0.5, level3: 0.25, level4: 0.12, level5: 0.062, level6: 0.031 },
    { level1: 1.1, level2: 0.6, level3: 0.33, level4: 0.18, level5: 0.1, level6: 0.055 },
    { level1: 1.2, level2: 0.72, level3: 0.43, level4: 0.25, level5: 0.15, level6: 0.013 },
    { level1: 1.3, level2: 0.84, level3: 0.54, level4: 0.35, level5: 0.23, level6: 0.15 },
    { level1: 1.4, level2: 0.98, level3: 0.68, level4: 0.48, level5: 0.33, level6: 0.23 }
  ];

  const todayMidnightTimestamp = new Date().setHours(0, 0, 0, 0);
  const yesterdayMidnightTimestamp = todayMidnightTimestamp - 24 * 60 * 60 * 1000;


  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  cron.schedule('30 0 * * *', async () => {
    try {
      const [users] = await connection.query('SELECT * FROM users');
      console.log(users, 'users')
      const batchSize = 100;
      const batchDelay = 1000;

      for (let i = 0; i < users.length; i += batchSize) {
        const userBatch = users.slice(i, i + batchSize);
        await async.eachLimit(userBatch, 5, async (user) => {
          await processUser(user, connection);
        });

        await delay(batchDelay);

      }
      console.log('completed')
    } catch (error) {
      console.error('Error during cron job execution:', error);
    } finally {
      connection.release();
    }
  });

  async function processUser(user, connection) {
    let totalRecharge = 0, totalBet = 0, totalTeam = 0;

    const inviteLevels = await fetchInviteHierarchy(user.code, connection);
    totalTeam = inviteLevels.length;

    let rechargeRecord = [];


    for (const inviteUser of inviteLevels) {
      const [rechargeData] = await connection.query(
        `SELECT money,phone FROM recharge WHERE phone = ? AND time >= ? AND time < ?`,
        [inviteUser.phone, yesterdayMidnightTimestamp, todayMidnightTimestamp]
      );
      rechargeData.forEach(val => {
        console.log(val, 'recharge val')
        totalRecharge = totalRecharge + val.money;
        rechargeRecord.push({ ...val, level: inviteUser.member_level });
      })

      const betQueries = [
        `SELECT money,fee FROM minutes_1 WHERE phone = ? AND time >= ? AND time < ?`,
        `SELECT money FROM result_5d WHERE phone = ? AND time >= ? AND time < ?`,
        `SELECT money FROM result_k3 WHERE phone = ? AND time >= ? AND time < ?`
      ];

      for (const query of betQueries) {
        const [betData] = await connection.query(query, [inviteUser.phone, yesterdayMidnightTimestamp, todayMidnightTimestamp]);
        console.log(betData, 'betData')
        betData.forEach(val => {
          totalBet = totalBet + val.money + (val.fee ? val.fee : 0);
        })
      }
    }
    console.log(totalTeam, totalBet, totalRecharge, 'team length')
    const level = calculateUserLevel(totalTeam, totalBet, totalRecharge);

    console.log(rechargeRecord, 'rechargeData')
    if (rechargeRecord.length > 0) {
      rechargeRecord.forEach(async (recharge) => {
        await connection.execute('INSERT INTO rebate_record SET rebate_level = ?, phone = ?, level = ?, amount = ?, reward = ?, member_phone = ?', [level, user.phone, recharge.level, recharge.money, comission[level][`level${recharge.level}`] * recharge.money * 0.01, recharge.phone]);
      });


    }

  }

  function calculateUserLevel(totalTeam, totalBet, totalRecharge) {
    if (totalTeam >= 5000 && totalBet >= 1500000000 && totalRecharge >= 500000000) return 10;
    else if (totalTeam >= 1000 && totalBet >= 150000000 && totalRecharge >= 50000000) return 9;
    else if (totalTeam >= 500 && totalBet >= 30000000 && totalRecharge >= 10000000) return 8;
    else if (totalTeam >= 100 && totalBet >= 20000000 && totalRecharge >= 4000000) return 7;
    else if (totalTeam >= 50 && totalBet >= 10000000 && totalRecharge >= 2000000) return 6;
    else if (totalTeam >= 40 && totalBet >= 5000000 && totalRecharge >= 1000000) return 5;
    else if (totalTeam >= 30 && totalBet >= 3500000 && totalRecharge >= 700000) return 4;
    else if (totalTeam >= 20 && totalBet >= 1800000 && totalRecharge >= 300000) return 3;
    else if (totalTeam >= 10 && totalBet >= 500000 && totalRecharge >= 100000) return 2;
    else if (totalTeam >= 5 && totalBet >= 100000 && totalRecharge >= 20000) return 1;
    return 0;
  }

  async function fetchInviteHierarchy(code, connection, depth = 1, maxDepth = 6) {
    const inviteLevels = [];

    async function recursiveFetch(currentCode, currentDepth) {
      if (currentDepth > maxDepth) {
        return;
      }

      const [results] = await connection.query('SELECT * FROM users WHERE invite = ?', [currentCode]);

      if (results.length > 0) {
        results.forEach(result => {
          result.member_level = currentDepth;
        });

        inviteLevels.push(...results);

        for (const result of results) {
          await recursiveFetch(result.code, currentDepth + 1);
        }
      }
    }

    await recursiveFetch(code, depth);

    return inviteLevels;
  }

  let vipRate = [
    {
      level: 0,
      exp: 0,
      bonus: 0,
      rebate: 0
    },
    {
      level: 1,
      exp: 3000,
      bonus: 20,
      rebate: 0
    },
    {
      level: 2,
      exp: 30000,
      bonus: 80,
      rebate: 0.3
    },
    {
      level: 3,
      exp: 300000,
      bonus: 290,
      rebate: 0.35
    },
    {
      level: 4,
      exp: 2000000,
      bonus: 690,
      rebate: 0.4
    },
    {
      level: 5,
      exp: 20000000,
      bonus: 2690,
      rebate: 0.45
    },
    {
      level: 6,
      exp: 60000000,
      bonus: 6900,
      rebate: 0.5
    },
    {
      level: 7,
      exp: 100000000,
      bonus: 26900,
      rebate: 0.55
    },
    {
      level: 8,
      exp: 1000000000,
      bonus: 69000,
      rebate: 0.6
    },
    {
      level: 9,
      exp: 5000000000,
      bonus: 269000,
      rebate: 0.7
    },
    {
      level: 10,
      exp: 10000000000,
      bonus: 690000,
      rebate: 0.8
    },
  ]
 
  // cron.schedule('0 1 21 * *', async () => {
  //   const [users] = await connection.execute('SELECT phone,vip_level,vip_exp FROM users');
  //   users.forEach(user=>{
  //     const query = `
  //     SELECT COUNT(*) AS row_count
  //     FROM vip_record
  //     WHERE time >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-21 01:00:00')
  //       AND time <= NOW() AND phone = ${user.phone} AND type = 'Level Up Reward';
  //   `;
    
  //   connection.execute(query, async (err, results) => {
  //     if (err) {
  //       console.error(err);
  //     } else {
  //       const count = results[0].row_count;
  //       if (count > 0) {
  //         const bonus = vipRate.filter((val)=>val.level = user.vip_level)[0].bonus;
  //         if(bonus>0){
  //           await connection.execute('UPDATE users SET win_wallet = win_wallet + ? where phone = ?',[bonus,user.phone]);
  //           await connection.execute(`INSERT INTO vip_record set type = "Monthly Reward",reward = ?,exp = ?,level = ?,phone = ?`,[closestExpObject.bonus,closestExpObject.exp,closestExpObject.level,updatedUser[0].phone])
  //         }
         
  //       } else {
    
  //       }
  //     }
  //   });
    
  //   })
  // })
}



module.exports = {
  cronJobGame1p
};