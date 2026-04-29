const connection = require("../config/connectDB");
// import jwt from "jsonwebtoken";
// import md5 from "md5";
// import e from "express";
require("dotenv").config();

const winGoPage = async (req, res) => {
  const periodId = '123'
  return res.render("bet/wingo/win.ejs", { periodId });
};

const winGoPage3 = async (req, res) => {
  return res.render("bet/wingo/win3.ejs");
};

const winGoPage5 = async (req, res) => {
  return res.render("bet/wingo/win5.ejs");
};

const winGoPage10 = async (req, res) => {
  return res.render("bet/wingo/win10.ejs");
};

const isNumber = (params) => {
  let pattern = /^[0-9]*\d$/;
  return pattern.test(params);
};

function formateT(params) {
  let result = params < 10 ? "0" + params : params;
  return result;
}

function timerJoin(params = "") {
  let date = "";
  if (params) {
    date = new Date(Number(params));
  } else {
    date = new Date();
  }
  let years = formateT(date.getFullYear());
  let months = formateT(date.getMonth() + 1);
  let days = formateT(date.getDate());

  let hours = formateT(date.getHours());
  let minutes = formateT(date.getMinutes());
  let seconds = formateT(date.getSeconds());
  return (
    years +
    "-" +
    months +
    "-" +
    days +
    " " +
    hours +
    ":" +
    minutes +
    ":" +
    seconds
  );
}

const rosesPlus = async (auth, money) => {
  const [level] = await connection.query("SELECT * FROM level ");
  let level0 = level[0];

  const [user] = await connection.query(
    "SELECT `phone`, `code`, `invite` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ",
    [auth]
  );
  let userInfo = user[0];
  const [f1] = await connection.query(
    "SELECT `phone`, `code`, `invite`, `rank` FROM users WHERE code = ? AND veri = 1  LIMIT 1 ",
    [userInfo.invite]
  );
  if (money >= 10000) {
    if (f1.length > 0) {
      let infoF1 = f1[0];
      let rosesF1 = (money / 100) * level0.f1;
      await connection.query(
        "UPDATE users SET money = money + ?, roses_f1 = roses_f1 + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ? ",
        [rosesF1, rosesF1, rosesF1, rosesF1, infoF1.phone]
      );
      const [f2] = await connection.query(
        "SELECT `phone`, `code`, `invite`, `rank` FROM users WHERE code = ? AND veri = 1  LIMIT 1 ",
        [infoF1.invite]
      );
      if (f2.length > 0) {
        let infoF2 = f2[0];
        let rosesF2 = (money / 100) * level0.f2;
        await connection.query(
          "UPDATE users SET money = money + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ? ",
          [rosesF2, rosesF2, rosesF2, infoF2.phone]
        );
        const [f3] = await connection.query(
          "SELECT `phone`, `code`, `invite`, `rank` FROM users WHERE code = ? AND veri = 1  LIMIT 1 ",
          [infoF2.invite]
        );
        if (f3.length > 0) {
          let infoF3 = f3[0];
          let rosesF3 = (money / 100) * level0.f3;
          await connection.query(
            "UPDATE users SET money = money + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ? ",
            [rosesF3, rosesF3, rosesF3, infoF3.phone]
          );
          const [f4] = await connection.query(
            "SELECT `phone`, `code`, `invite`, `rank` FROM users WHERE code = ? AND veri = 1  LIMIT 1 ",
            [infoF3.invite]
          );
          if (f4.length > 0) {
            let infoF4 = f4[0];
            let rosesF4 = (money / 100) * level0.f4;
            await connection.query(
              "UPDATE users SET money = money + ?, roses_f = roses_f + ?, roses_today = roses_today + ? WHERE phone = ? ",
              [rosesF4, rosesF4, rosesF4, infoF4.phone]
            );
          }
        }
      }
    }
  }
};

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
    bonus: 30,
    rebate: 0
  },
  {
    level: 2,
    exp: 30000,
    bonus: 150,
    rebate: 0.3
  },
  {
    level: 3,
    exp: 300000,
    bonus: 690,
    rebate: 0.35
  },
  {
    level: 4,
    exp: 2000000,
    bonus: 1290,
    rebate: 0.4
  },
  {
    level: 5,
    exp: 20000000,
    bonus: 5900,
    rebate: 0.45
  },
  {
    level: 6,
    exp: 60000000,
    bonus: 16900,
    rebate: 0.5
  },
  {
    level: 7,
    exp: 100000000,
    bonus: 69000,
    rebate: 0.55
  },
  {
    level: 8,
    exp: 1000000000,
    bonus: 169000,
    rebate: 0.6
  },
  {
    level: 9,
    exp: 5000000000,
    bonus: 690000,
    rebate: 0.7
  },
  {
    level: 10,
    exp: 10000000000,
    bonus: 1690000,
    rebate: 0.8
  },
]

const betWinGo = async (req, res) => {
  let { typeid, join, x, money } = req.body;
  let auth = req.cookies.auth;

  if (typeid != 1 && typeid != 3 && typeid != 5 && typeid != 10) {
    return res.status(200).json({
      message: "Error!",
      status: true
    });
  }

  let gameJoin = "";
  if (typeid == 1) gameJoin = "wingo";
  if (typeid == 3) gameJoin = "wingo3";
  if (typeid == 5) gameJoin = "wingo5";
  if (typeid == 10) gameJoin = "wingo10";
  const [winGoNow] = await connection.query(
    `SELECT period FROM wingo WHERE status = 0 AND game = '${gameJoin}' ORDER BY id DESC LIMIT 1`
  );
  const [user] = await connection.query(
    "SELECT `phone`, `code`, `invite`, `level`, `money`, `win_wallet` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ",
    [auth]
  );

  if (!winGoNow[0] || !user[0] || !isNumber(x) || !isNumber(money)) {
    return res.status(200).json({
      message: "Error!",
      status: true
    });
  }

  let userInfo = user[0];
  let period = winGoNow[0].period;
  let fee = x * money * 0.02;
  let totalBetAmount = x * money;
  let timeNow = Date.now();

  let remainingMoney = userInfo.money - totalBetAmount;
  let remainingWallet = userInfo.win_wallet;

  if (remainingMoney < 0) {
    remainingWallet += remainingMoney; // Deduct the negative amount from win_wallet
    remainingMoney = 0;
  }

  let date = new Date();
  let years = formateT(date.getFullYear());
  let months = formateT(date.getMonth() + 1);
  let days = formateT(date.getDate());
  let id_product =
    years + months + days + Math.floor(Math.random() * 1000000000000000);

  let formatTime = timerJoin();

  let color = "";
  if (join == "l") {
    color = "big";
  } else if (join == "n") {
    color = "small";
  } else if (join == "t") {
    color = "violet";
  } else if (join == "d") {
    color = "red";
  } else if (join == "x") {
    color = "green";
  } else if (join == "0") {
    color = "red-violet";
  } else if (join == "5") {
    color = "green-violet";
  } else if (join % 2 == 0) {
    color = "red";
  } else if (join % 2 != 0) {
    color = "green";
  }

  let checkJoin = "";

  if ((!isNumber(join) && join == "l") || join == "n") {
    checkJoin = `
        <div data-v-a9660e98="" class="van-image" style="width: 30px; height: 30px;">
            <img src="/images/${join == "n" ? "small" : "big"
      }.png" class="van-image__img">
        </div>
        `;
  } else {
    checkJoin = `
        <span data-v-a9660e98="">${isNumber(join) ? join : ""}</span>
        `;
  }

  let result = `
    <div data-v-a9660e98="" issuenumber="${period}" addtime="${formatTime}" rowid="1" class="hb">
        <div data-v-a9660e98="" class="item c-row">
            <div data-v-a9660e98="" class="result">
                <div data-v-a9660e98="" class="select select-${color}">
                    ${checkJoin}
                </div>
            </div>
            <div data-v-a9660e98="" class="c-row c-row-between info">
                <div data-v-a9660e98="">
                    <div data-v-a9660e98="" class="issueName">
                        ${period}
                    </div>
                    <div data-v-a9660e98="" class="tiem">${formatTime}</div>
                </div>
            </div>
        </div>
        <!---->
    </div>
    `;

  function timerJoin(params = "") {
    let date = "";
    if (params) {
      date = new Date(Number(params));
    } else {
      date = new Date();
    }
    let years = formateT(date.getFullYear());
    let months = formateT(date.getMonth() + 1);
    let days = formateT(date.getDate());
    return years + "-" + months + "-" + days;
  }
  let checkTime = timerJoin(date.getTime());

  if (remainingMoney > 0 || remainingWallet >= 0) {
    const sql = `INSERT INTO minutes_1 SET 
        id_product = ?,
        phone = ?,
        code = ?,
        invite = ?,
        stage = ?,
        level = ?,
        money = ?,
        amount = ?,
        fee = ?,
        \`get\`  = ?,
        game = ?,
        bet = ?,
        status = ?,
        today = ?,
        time = ?`;
    await connection.execute(sql, [
      id_product,
      userInfo.phone,
      userInfo.code,
      userInfo.invite,
      period,
      userInfo.level,
      totalBetAmount - fee,
      x,
      fee,
      0,
      gameJoin,
      join,
      0,
      checkTime,
      timeNow
    ]);
    await connection.execute(
      "UPDATE `users` SET `money` = ?, `win_wallet` = ?,vip_exp = vip_exp + ? WHERE `token` = ?",
      [remainingMoney, remainingWallet,totalBetAmount,auth]
    );
    const [updatedUser] = await connection.query(
      "SELECT `money`, `win_wallet`,vip_exp,vip_level,check_vip ,phone FROM users WHERE token = ? AND veri = 1  LIMIT 1 ",
      [auth]
    );
   
    let exp = updatedUser[0].vip_exp;
    let currentLvl = updatedUser[0].vip_level;
    const closestExpObject = vipRate
      .filter(item => item.exp <= exp)
      .sort((a, b) => b.exp - a.exp)[0];

    const [parent] = await connection.execute('SELECT phone , vip_level FROM users WHERE code = ?',[user[0].invite]);
    const ratio = vipRate.filter((data)=>data.level===parent[0].vip_level);
    await connection.execute('UPDATE users SET win_wallet = win_wallet + ? WHERE phone = ?',[Math.round(totalBetAmount*ratio[0].rebate/100),parent[0].phone]);
      if(closestExpObject.level>currentLvl){
        let arr = updatedUser[0].check_vip.split(',').map(Number);

        if(arr[closestExpObject.level-1]===0){
          arr[closestExpObject.level-1] =1;
          const str = arr.join(',');
          await connection.execute(`UPDATE users set vip_level = ? , win_wallet = win_wallet + ?,check_vip = ? where phone = ?`,[closestExpObject.level,closestExpObject.bonus,str,updatedUser[0].phone]);
          await connection.execute(`INSERT INTO vip_record set type = "Level Up Reward",reward = ?,exp = ?,level = ?,phone = ?`,[closestExpObject.bonus,closestExpObject.exp,closestExpObject.level,updatedUser[0].phone])
        }
        else{
          await connection.execute(`UPDATE users SET vip_level = ? where phone = ?`,[closestExpObject.level,updatedUser[0].phone]);
        }
       
      }
    await rosesPlus(auth, totalBetAmount);
    const [level] = await connection.query("SELECT * FROM level ");
    let level0 = level[0];
    const sql2 = `INSERT INTO roses SET 
        phone = ?,
        code = ?,
        invite = ?,
        f1 = ?,
        f2 = ?,
        f3 = ?,
        f4 = ?,
        time = ?`;
    let f1 = (totalBetAmount / 100) * level0.f1;
    let f2 = (totalBetAmount / 100) * level0.f2;
    let f3 = (totalBetAmount / 100) * level0.f3;
    let f4 = (totalBetAmount / 100) * level0.f4;
    await connection.execute(sql2, [
      userInfo.phone,
      userInfo.code,
      userInfo.invite,
      f1,
      f2,
      f3,
      f4,
      timeNow
    ]);
    return res.status(200).json({
      message: "Successful bet",
      status: true,
      data: result,
      change: updatedUser[0].level,
      money: updatedUser[0].money,
      win_wallet: updatedUser[0].win_wallet
    });
  } else {
    return res.status(200).json({
      message: "The amount is not enough",
      status: false
    });
  }
};


const listOrderOld = async (req, res) => {
  let { typeid, pageno, pageto } = req.body;

  if (typeid != 1 && typeid != 3 && typeid != 5 && typeid != 10) {
    return res.status(200).json({
      message: "Error!",
      status: true
    });
  }
  if (pageno < 0 || pageto < 0) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: []
      },
      status: false
    });
  }
  let auth = req.cookies.auth;
  const [user] = await connection.query(
    "SELECT `phone`, `code`, `invite`, `level`, `money` FROM users WHERE token = ? AND veri = 1  LIMIT 1 ",
    [auth]
  );

  let game = "";
  if (typeid == 1) game = "wingo";
  if (typeid == 3) game = "wingo3";
  if (typeid == 5) game = "wingo5";
  if (typeid == 10) game = "wingo10";


  const [wingo] = await connection.query(
    `SELECT * FROM wingo WHERE status != 0 AND game = '${game}' ORDER BY id DESC LIMIT ${pageno}, ${pageto} `
  );
  const [wingoAll] = await connection.query(
    `SELECT * FROM wingo WHERE status != 0 AND game = '${game}' `
  );
  const [period] = await connection.query(
    `SELECT period FROM wingo WHERE status = 0 AND game = '${game}' ORDER BY id DESC LIMIT 1 `
  );
  if (!wingo[0]) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: []
      },
      status: false
    });
  }
  if (!pageno || !pageto || !user[0] || !wingo[0] || !period[0]) {
    return res.status(200).json({
      message: "Error!",
      status: true
    });
  }
  let page = Math.ceil(wingoAll.length / 10);
  return res.status(200).json({
    code: 0,
    msg: "Get success",
    data: {
      gameslist: wingo
    },
    period: period[0].period,
    page: page,
    status: true
  });
};

const GetMyEmerdList = async (req, res) => {
  let { typeid, pageno, pageto } = req.body;

  if (!pageno || !pageto) {
    pageno = 0;
    pageto = 10;
  }

  if (typeid != 1 && typeid != 3 && typeid != 5 && typeid != 10) {
    return res.status(200).json({
      message: "Error!",
      status: true
    });
  }

  if (pageno < 0 || pageto < 0) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: []
      },
      status: false
    });
  }
  let auth = req.cookies.auth;

  let game = "";
  if (typeid == 1) game = "wingo";
  if (typeid == 3) game = "wingo3";
  if (typeid == 5) game = "wingo5";
  if (typeid == 10) game = "wingo10";

  const [user] = await connection.query(
    "SELECT `phone`, `code`, `invite`, `level`, `money` FROM users WHERE token = ? AND veri = 1 LIMIT 1 ",
    [auth]
  );
  const [minutes_1] = await connection.query(
    `SELECT * FROM minutes_1 WHERE phone = ? AND game = '${game}' ORDER BY id DESC LIMIT ${Number(pageno) + "," + Number(pageto)
    }`,
    [user[0].phone]
  );
  const [minutes_1All] = await connection.query(
    `SELECT * FROM minutes_1 WHERE phone = ? AND game = '${game}' ORDER BY id DESC `,
    [user[0].phone]
  );

  if (!minutes_1[0]) {
    return res.status(200).json({
      code: 0,
      msg: "No more data",
      data: {
        gameslist: []
      },
      status: false
    });
  }
  if (!pageno || !pageto || !user[0] || !minutes_1[0]) {
    return res.status(200).json({
      message: "Error!",
      status: true
    });
  }
  let page = Math.ceil(minutes_1All.length / 10);

  let datas = minutes_1.map((data) => {
    let { id, phone, code, invite, level, game, ...others } = data;
    return others;
  });

  return res.status(200).json({
    code: 0,
    msg: "Get success",
    data: {
      gameslist: datas
    },
    page: page,
    status: true
  });
};

const addWinGo = async (game) => {
  try {
    let join = "";
    if (game == 1) join = "wingo";
    if (game == 3) join = "wingo3";
    if (game == 5) join = "wingo5";
    if (game == 10) join = "wingo10";


    const [winGoNow] = await connection.query(
      `SELECT period FROM wingo WHERE status = 0 AND game = "${join}" ORDER BY id DESC LIMIT 1 `
    );

    const [currentBets] = await connection.execute(
      `SELECT * FROM minutes_1 WHERE game = ? AND status = ? AND level = ? ORDER BY id ASC`,
      [join, 0, 0]
    );

    function sumMoneyByBetType(betType) {
      let amt = currentBets
        .filter(item => item.bet === betType)
        .reduce((sum, item) => sum + item.money, 0);
      return amt;
    }

    let receivedMoney = currentBets.reduce((sum, item) => sum + item.money, 0);

    let totalReturn = new Array(10).fill(0);

    const [setting] = await connection.query("SELECT * FROM `admin` ");
    let period = winGoNow[0].period; // cầu hiện tại
    let amount = Math.floor(Math.random() * 10); // xanh đỏ tím
    let timeNow = Date.now();
    let nextResult = "";
    let newArr = "";
    if (game == 1) nextResult = setting[0].wingo1;
    if (game == 3) nextResult = setting[0].wingo3;
    if (game == 5) nextResult = setting[0].wingo5;
    if (game == 10) nextResult = setting[0].wingo10;
    if (nextResult == "-1" && !currentBets[0]) {
      await connection.execute(
        `UPDATE wingo SET amount = ?, status = ? WHERE period = ? AND game = ?`,
        [amount, 1, period, join]
      );

      // newArr = "-1";

    }
    else if (nextResult == '-1' && currentBets) {
      let result ;
      if (currentBets.length == 1) {
        const randomNumber = Math.floor(Math.random() * 1000) + 1;
    
        await connection.execute('UPDATE admin SET total_pool = total_pool + ?', [currentBets[0].money / 2]);
    
        const [count1] = await connection.execute('SELECT COUNT(*) AS count FROM minutes_1 WHERE phone = ?', [currentBets[0].phone]);
       
        const [count2] = await connection.execute('SELECT COUNT(*) AS count FROM result_5d WHERE phone = ?', [currentBets[0].phone]);
       
        const [count3] = await connection.execute('SELECT COUNT(*) AS count FROM result_k3 WHERE phone = ?', [currentBets[0].phone]);
      
        
        const total = count1[0].count + count2[0].count + count3[0].count;
    
        // Fetch the current pool value
        const [pool] = await connection.execute('SELECT total_pool FROM admin');
        let poolValue = pool[0].total_pool;
        let returnValue = 0;
        let removepool = 0;
    
        // Logic based on the bet type
        if (currentBets[0].bet === 'x') {
            returnValue = currentBets[0].money * 2;
            if (poolValue > returnValue) {
                if (total < 10) {
                    result = randomNumber > 200
                        ? [1, 3, 5, 7, 9][Math.floor(Math.random() * 5)]
                        : [0, 2, 4, 6, 8][Math.floor(Math.random() * 5)];
                        removepool = randomNumber > 300 ? currentBets[0].money * 2 : 0; 
                } else {
                    result = randomNumber < 500
                        ? [1, 3, 5, 7, 9][Math.floor(Math.random() * 5)]
                        : [0, 2, 4, 6, 8][Math.floor(Math.random() * 5)];
                        removepool = randomNumber < 500 ? currentBets[0].money * 2 : 0;
                }
            } else {
                result = [0, 2, 4, 6, 8][Math.floor(Math.random() * 5)];
            }
        } else if (currentBets[0].bet === 'd') {
            returnValue = currentBets[0].money * 2;
            if (poolValue > returnValue) {
                if (total < 10) {
                    result = randomNumber > 200
                        ? [0, 2, 4, 6, 8][Math.floor(Math.random() * 5)]
                        : [1, 3, 5, 7, 9][Math.floor(Math.random() * 5)];
                        removepool = randomNumber > 300 ? currentBets[0].money * 2 : 0;
                } else {
                    result = randomNumber < 500
                        ? [1, 3, 5, 7, 9][Math.floor(Math.random() * 5)]
                        : [0, 2, 4, 6, 8][Math.floor(Math.random() * 5)];
                        removepool = randomNumber >= 500 ? currentBets[0].money * 2 : 0;
                }
            } else {
                result = [1, 3, 5, 7, 9][Math.floor(Math.random() * 5)];
            }
        } else if (currentBets[0].bet === 'l') {
            returnValue = currentBets[0].money * 2;
            if (poolValue > returnValue) {
                if (total < 10) {
                    result = randomNumber > 200
                        ? [5, 6, 7, 8, 9][Math.floor(Math.random() * 5)]
                        : [0, 1, 2, 3, 4][Math.floor(Math.random() * 5)];
                        removepool = randomNumber > 300 ? currentBets[0].money * 2 : 0;
                } else {
                    result = randomNumber < 500
                        ? [5, 6, 7, 8, 9][Math.floor(Math.random() * 5)]
                        : [0, 1, 2, 3, 4][Math.floor(Math.random() * 5)];
                        removepool = randomNumber < 500 ? currentBets[0].money * 2 : 0;
                }
            } else {
                result = [0, 1, 2, 3, 4][Math.floor(Math.random() * 5)];
            }
        } else if (currentBets[0].bet === 'n') {
            returnValue = currentBets[0].money * 2;
            if (poolValue > returnValue) {
                if (total < 10) {
                    result = randomNumber > 200
                        ? [0, 1, 2, 3, 4][Math.floor(Math.random() * 5)]
                        : [5, 6, 7, 8, 9][Math.floor(Math.random() * 5)];
                        removepool = randomNumber > 300 ? currentBets[0].money * 2 : 0;
                } else {
                    result = randomNumber < 500
                        ? [5, 6, 7, 8, 9][Math.floor(Math.random() * 5)]
                        : [0, 1, 2, 3, 3][Math.floor(Math.random() * 5)];
                        removepool = randomNumber >= 500 ? currentBets[0].money * 2 : 0;
                }
            } else {
                result = [5, 6, 7, 8, 9][Math.floor(Math.random() * 5)];
            }
        } else if (currentBets[0].bet === 't') {
            returnValue = currentBets[0].money * 4.5;
            result = poolValue > returnValue && randomNumber > 800
                ? [0, 5][Math.floor(Math.random() * 2)]
                : [1, 2, 3, 4, 6, 7, 8, 9][Math.floor(Math.random() * 8)];
                removepool = randomNumber > 800 && poolValue > returnValue ? currentBets[0].money * 4.5 : 0;
        } else {
            returnValue = currentBets[0].money * 9;
            if(poolValue>returnValue){
              result = randomNumber < 100
              ? parseInt(currentBets[0].bet)
              : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(num => num != parseInt(currentBets[0].bet))[Math.floor(Math.random() * 9)];
              removepool = randomNumber < 100 ? currentBets[0].money * 9 : 0;
            }
          else{
            result = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(num => num != parseInt(currentBets[0].bet))[Math.floor(Math.random() * 9)];
          }
        }
    
        // Update the result in the database
         console.log(removepool,'removepool');
         console.log(result,'result');
        await connection.execute('UPDATE admin SET total_pool = total_pool - ?', [removepool]);
        await connection.execute(
            'UPDATE wingo SET amount = ?, status = ? WHERE period = ? AND game = ?',
            [result, 1, period, join]
        );
    }
    
      else {
        for (let i = 0; i < 10; i++) {
          let total = 0;
          if (i <= 4) {
            total = total + sumMoneyByBetType('n') * 2;
          }
          if (i > 4) {
            total = total + sumMoneyByBetType('l') * 2;
          }
          if (i == 1 || i == 3 || i == 7 || i == 9) {
            total = total + sumMoneyByBetType(i.toString()) * 9 + sumMoneyByBetType('x') * 2;
          }
          if (i == 2 || i == 4 || i == 6 || i == 8) {
            total = total + sumMoneyByBetType(i.toString()) * 9 + sumMoneyByBetType('d') * 2;
          }

          if (i == 0) {
            total = total + sumMoneyByBetType(i.toString()) * 9 + sumMoneyByBetType('d') * 2 + sumMoneyByBetType('t') * 4.5;
          }

          if (i == 5) {
            total = total + sumMoneyByBetType(i.toString()) * 9 + sumMoneyByBetType('x') * 2 + sumMoneyByBetType('t') * 4.5;
          }

          totalReturn[i] = total;

        }



        let smallest = Infinity;
        let indices = [];
        let zeroIndices = [];

        // Find the smallest non-zero value and collect its indices
        totalReturn.forEach((value, index) => {
          if (value > 0) {
            if (value < smallest) {
              smallest = value;
              indices = [index];  // Reset indices array with the current smallest value's index
            } else if (value === smallest) {
              indices.push(index);  // Add to indices array if it's the same as the current smallest
            }
          } else {
            zeroIndices.push(index); // Collect indices of zero values
          }
        });

      
        // Determine the index based on the receivedMoney condition
        let selectedIndex;
        if (receivedMoney > smallest + receivedMoney * 0.20) {
          // Randomly select an index if there are multiple indices with the smallest value
          selectedIndex = indices[Math.floor(Math.random() * indices.length)];
        } else {
          // Randomly select a zero value index
          selectedIndex = zeroIndices[Math.floor(Math.random() * zeroIndices.length)];
        }



        await connection.execute(
          `UPDATE wingo SET amount = ?, status = ? WHERE period = ? AND game = ?`,
          [selectedIndex, 1, period, join]
        );



      }
    }

    else {
      let result = "";
      let arr = nextResult.split("|");
      let check = arr.length;
      if (check == 1) {
        newArr = "-1";
      } else {
        for (let i = 1; i < arr.length; i++) {
          newArr += arr[i] + "|";
        }
        newArr = newArr.slice(0, -1);
      }
      result = arr[0];
      await connection.execute(
        `UPDATE wingo SET amount = ?,status = ? WHERE period = ? AND game = "${join}"`,
        [result, 1, period]
      );
    }

    const sql = `INSERT INTO wingo SET 
    period = ?,
    amount = ?,
    game = ?,
    status = ?,
    time = ?`;
    await connection.execute(sql, [Number(period) + 1, 0, join, 0, timeNow]);

    if (game == 1) join = "wingo1";
    if (game == 3) join = "wingo3";
    if (game == 5) join = "wingo5";
    if (game == 10) join = "wingo10";

    await connection.execute(`UPDATE admin SET ${join} = ?`, [-1]);

  } catch (error) {
    if (error) {
      console.log(error);
    }
  }
};

const handlingWinGo1P = async (typeid) => {
  let game = "";
  if (typeid == 1) game = "wingo";
  if (typeid == 3) game = "wingo3";
  if (typeid == 5) game = "wingo5";
  if (typeid == 10) game = "wingo10";

  const [winGoNow] = await connection.query(
    `SELECT * FROM wingo WHERE status != 0 AND game = '${game}' ORDER BY id DESC LIMIT 1 `
  );

  // update ket qua
  await connection.execute(
    `UPDATE minutes_1 SET result = ? WHERE status = 0 AND game = '${game}'`,
    [winGoNow[0].amount]
  );
  let result = Number(winGoNow[0].amount);
  switch (result) {
    case 0:
      await connection.execute(
        `UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "d" AND bet != "0" AND bet != "t" `,
        []
      );
      break;
    case 1:
      await connection.execute(
        `UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "x" AND bet != "1" `,
        []
      );
      break;
    case 2:
      await connection.execute(
        `UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "d" AND bet != "2" `,
        []
      );
      break;
    case 3:
      await connection.execute(
        `UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "x" AND bet != "3" `,
        []
      );
      break;
    case 4:
      await connection.execute(
        `UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "d" AND bet != "4" `,
        []
      );
      break;
    case 5:
      await connection.execute(
        `UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "x" AND bet != "5" AND bet != "t" `,
        []
      );
      break;
    case 6:
      await connection.execute(
        `UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "d" AND bet != "6" `,
        []
      );
      break;
    case 7:
      await connection.execute(
        `UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "x" AND bet != "7" `,
        []
      );
      break;
    case 8:
      await connection.execute(
        `UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "d" AND bet != "8" `,
        []
      );
      break;
    case 9:
      await connection.execute(
        `UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet != "l" AND bet != "n" AND bet != "x" AND bet != "9" `,
        []
      );
      break;
    default:
      break;
  }

  if (result < 5) {
    await connection.execute(
      `UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet = "l" `,
      []
    );
  } else {
    await connection.execute(
      `UPDATE minutes_1 SET status = 2 WHERE status = 0 AND game = "${game}" AND bet = "n" `,
      []
    );
  }

  // lấy ra danh sách đặt cược chưa xử lý
  const [order] = await connection.execute(
    `SELECT * FROM minutes_1 WHERE status = 0 AND game = '${game}' `
  );
  for (let i = 0; i < order.length; i++) {
    let orders = order[i];
    let result = orders.result;
    let bet = orders.bet;
    let total = orders.money;
    let id = orders.id;
    let phone = orders.phone;
    var nhan_duoc = 0;

    if (bet == "l" || bet == "n") {
      nhan_duoc = total * 2;
    } else {
      if (result == 0 || result == 5) {
        if (bet == "d" || bet == "x") {
          nhan_duoc = total * 2;
        } else if (bet == "t") {
          nhan_duoc = total * 4.5;
        } else if (bet == "0" || bet == "5") {
          nhan_duoc = total * 9;
        }
      } else {
        if (result == 1 && bet == "1") {
          nhan_duoc = total * 9;
        } else {
          if (result == 1 && bet == "x") {
            nhan_duoc = total * 2;
          }
        }
        if (result == 2 && bet == "2") {
          nhan_duoc = total * 9;
        } else {
          if (result == 2 && bet == "d") {
            nhan_duoc = total * 2;
          }
        }
        if (result == 3 && bet == "3") {
          nhan_duoc = total * 9;
        } else {
          if (result == 3 && bet == "x") {
            nhan_duoc = total * 2;
          }
        }
        if (result == 4 && bet == "4") {
          nhan_duoc = total * 9;
        } else {
          if (result == 4 && bet == "d") {
            nhan_duoc = total * 2;
          }
        }
        if (result == 6 && bet == "6") {
          nhan_duoc = total * 9;
        } else {
          if (result == 6 && bet == "d") {
            nhan_duoc = total * 2;
          }
        }
        if (result == 7 && bet == "7") {
          nhan_duoc = total * 9;
        } else {
          if (result == 7 && bet == "x") {
            nhan_duoc = total * 2;
          }
        }
        if (result == 8 && bet == "8") {
          nhan_duoc = total * 9;
        } else {
          if (result == 8 && bet == "d") {
            nhan_duoc = total * 2;
          }
        }
        if (result == 9 && bet == "9") {
          nhan_duoc = total * 9;
        } else {
          if (result == 9 && bet == "x") {
            nhan_duoc = total * 2;
          }
        }
      }
    }
    const [users] = await connection.execute(
      "SELECT `win_wallet` FROM `users` WHERE `phone` = ?",
      [phone]
    );
    let totals = users[0].win_wallet + nhan_duoc * 0.98;
    await connection.execute(
      "UPDATE `minutes_1` SET `get` = ?, `status` = 1 WHERE `id` = ? ",
      [nhan_duoc * 0.98, id]
    );
    const sql = "UPDATE `users` SET `win_wallet` = ? WHERE `phone` = ? ";
    await connection.execute(sql, [totals, phone]);
  }
};

module.exports = {
  winGoPage,
  betWinGo,
  listOrderOld,
  GetMyEmerdList,
  handlingWinGo1P,
  addWinGo,
  winGoPage3,
  winGoPage5,
  winGoPage10,
};
