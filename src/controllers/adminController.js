const connection= require("../config/connectDB")
const jwt= require("jsonwebtoken")
const md5= require("md5")
require("dotenv").config()

let timeNow = Date.now()

const adminPage = async (req, res) => {
   return res.render("manage/index.ejs")
}

const adminPage3 = async (req, res) => {
   return res.render("manage/a-index-bet/index3.ejs")
}

const adminPage5 = async (req, res) => {
   return res.render("manage/a-index-bet/index5.ejs")
}

const adminPage10 = async (req, res) => {
   return res.render("manage/a-index-bet/index10.ejs")
}

const adminPage5d = async (req, res) => {
   return res.render("manage/5d.ejs")
}

const adminPageK3 = async (req, res) => {
   return res.render("manage/k3.ejs")
}

const ctvProfilePage = async (req, res) => {
   var phone = req.params.phone
   return res.render("manage/profileCTV.ejs", { phone })
}

const giftPage = async (req, res) => {
   return res.render("manage/giftPage.ejs")
}

const membersPage = async (req, res) => {
   return res.render("manage/members.ejs")
}

const ctvPage = async (req, res) => {
   return res.render("manage/ctv.ejs")
}

const infoMember = async (req, res) => {
   let phone = req.params.id
   return res.render("manage/profileMember.ejs", { phone })
}

const statistical = async (req, res) => {
   return res.render("manage/statistical.ejs")
}

const rechargePage = async (req, res) => {
   return res.render("manage/recharge.ejs")
}

const rechargeRecord = async (req, res) => {
   return res.render("manage/rechargeRecord.ejs")
}

const withdraw = async (req, res) => {
   return res.render("manage/withdraw.ejs")
}

const levelSetting = async (req, res) => {
   return res.render("manage/levelSetting.ejs")
}

const CreatedSalaryRecord = async (req, res) => {
   return res.render("manage/CreatedSalaryRecord.ejs")
}

const withdrawRecord = async (req, res) => {
   return res.render("manage/withdrawRecord.ejs")
}
const settings = async (req, res) => {
   return res.render("manage/settings.ejs")
}

const partner = ['/admin/manager/index','/admin/manager/index/3','/admin/manager/index/5','/admin/manager/index/10','/admin/manager/5d','/admin/manager/k3','/admin/manager/aviator','/api/webapi/admin/wingo/money_stats','/api/webapi/admin/totalJoin','/api/webapi/admin/change','/api/webapi/admin/5d/listOrders','/api/webapi/admin/5d/editResult','/api/webapi/admin/k3/editResult','/api/webapi/admin/k3/listOrders','/admin/aviatorResult'];
// xác nhận admin
const middlewareAdminController = async (req, res, next) => {
   // xác nhận token
   const auth = req.cookies.auth
   if (!auth) {
      return res.redirect("/login")
   }
   const [rows] = await connection.execute("SELECT `token`,`level`, `status` FROM `users` WHERE `token` = ? AND veri = 1", [auth])
   if (!rows) {
      return res.redirect("/login")
   }
   try {
      if (auth == rows[0].token && rows[0].status == 1) {
         if (rows[0].level == 1) {
            res.locals.level = 1;
            next()
         } 
         else if(rows[0].level == 3){
            if (partner.includes(req.path)) {
               res.locals.level = 3;
               next();  // User has permission to access the route
             } else {
               return res.redirect("/home")
             }
         }
         else {
            return res.redirect("/home")
         }
      } else {
         return res.redirect("/login")
      }
   } catch (error) {
      return res.redirect("/login")
   }
}

const totalJoin = async (req, res) => {
   let auth = req.cookies.auth
   let typeid = req.body.typeid
   if (!typeid) {
      return res.status(200).json({
         message: "Failed",
         status: false,
         timeStamp: timeNow,
      })
   }
   let game = ""
   if (typeid == "1") game = "wingo"
   if (typeid == "2") game = "wingo3"
   if (typeid == "3") game = "wingo5"
   if (typeid == "4") game = "wingo10"

   const [rows] = await connection.query("SELECT * FROM users WHERE `token` = ? ", [auth])

   if (rows.length > 0) {
      const [wingoall] = await connection.query(`SELECT * FROM minutes_1 WHERE game = "${game}" AND status = 0 AND level = 0 ORDER BY id ASC `, [auth])
      const [winGo1] = await connection.execute(`SELECT * FROM wingo WHERE status = 0 AND game = '${game}' ORDER BY id DESC LIMIT 1 `, [])
      const [winGo10] = await connection.execute(`SELECT * FROM wingo WHERE status != 0 AND game = '${game}' ORDER BY id DESC LIMIT 10 `, [])
      const [setting] = await connection.execute(`SELECT * FROM admin `, [])

      return res.status(200).json({
         message: "Success",
         status: true,
         datas: wingoall,
         lotterys: winGo1,
         list_orders: winGo10,
         setting: setting,
         timeStamp: timeNow,
      })
   } else {
      return res.status(200).json({
         message: "Failed",
         status: false,
         timeStamp: timeNow,
      })
   }
}

const listMember = async (req, res) => {
   let { pageno, limit } = req.body

   if (!pageno || !limit) {
      return res.status(200).json({
         code: 0,
         msg: "No more data",
         data: {
            gameslist: [],
         },
         status: false,
      })
   }

   if (pageno < 0 || limit < 0) {
      return res.status(200).json({
         code: 0,
         msg: "No more data",
         data: {
            gameslist: [],
         },
         status: false,
      })
   }
   const [users] = await connection.query(`SELECT * FROM users WHERE veri = 1 AND level != 2 ORDER BY id DESC LIMIT ${pageno}, ${limit} `)
   const [total_users] = await connection.query(`SELECT * FROM users WHERE veri = 1 AND level != 2`)
   return res.status(200).json({
      message: "Success",
      status: true,
      datas: users,
      page_total: Math.ceil(total_users.length / limit),
   })
}

const listCTV = async (req, res) => {
   let { pageno, pageto } = req.body

   if (!pageno || !pageto) {
      return res.status(200).json({
         code: 0,
         msg: "No more data",
         data: {
            gameslist: [],
         },
         status: false,
      })
   }

   if (pageno < 0 || pageto < 0) {
      return res.status(200).json({
         code: 0,
         msg: "No more data",
         data: {
            gameslist: [],
         },
         status: false,
      })
   }
   const [wingo] = await connection.query(`SELECT * FROM users WHERE veri = 1 AND level = 2 ORDER BY id DESC LIMIT ${pageno}, ${pageto} `)
   return res.status(200).json({
      message: "Success",
      status: true,
      datas: wingo,
   })
}

function formateT2(params) {
   let result = params < 10 ? "0" + params : params
   return result
}

function timerJoin2(params = "", addHours = 0) {
   let date = ""
   if (params) {
      date = new Date(Number(params))
   } else {
      date = new Date()
   }

   date.setHours(date.getHours() + addHours)

   let years = formateT(date.getFullYear())
   let months = formateT(date.getMonth() + 1)
   let days = formateT(date.getDate())

   let hours = date.getHours() % 12
   hours = hours === 0 ? 12 : hours
   let ampm = date.getHours() < 12 ? "AM" : "PM"

   let minutes = formateT(date.getMinutes())
   let seconds = formateT(date.getSeconds())

   return years + "-" + months + "-" + days + " " + hours + ":" + minutes + ":" + seconds + " " + ampm
}

const statistical2 = async (req, res) => {
   const [wingo] = await connection.query(`SELECT SUM(money) as total FROM minutes_1 WHERE status = 1 `)
   const [wingo2] = await connection.query(`SELECT SUM(money) as total FROM minutes_1 WHERE status = 2 `)
   const [users] = await connection.query(`SELECT COUNT(id) as total FROM users WHERE status = 1 `)
   const [users2] = await connection.query(`SELECT COUNT(id) as total FROM users WHERE status = 0 `)
   const [recharge] = await connection.query(`SELECT SUM(money) as total FROM recharge WHERE status = 1 `)
   const [withdraw] = await connection.query(`SELECT SUM(money) as total FROM withdraw WHERE status = 1 `)

   const [recharge_today] = await connection.query(`SELECT SUM(money) as total FROM recharge WHERE status = 1 AND today = ?`, [timerJoin2()])
   const [withdraw_today] = await connection.query(`SELECT SUM(money) as total FROM withdraw WHERE status = 1 AND today = ?`, [timerJoin2()])

   let win = wingo[0].total
   let loss = wingo2[0].total
   let usersOnline = users[0].total
   let usersOffline = users2[0].total
   let recharges = recharge[0].total
   let withdraws = withdraw[0].total
   return res.status(200).json({
      message: "Success",
      status: true,
      win: win,
      loss: loss,
      usersOnline: usersOnline,
      usersOffline: usersOffline,
      recharges: recharges,
      withdraws: withdraws,
      rechargeToday: recharge_today[0].total,
      withdrawToday: withdraw_today[0].total,
   })
}

const changeAdmin = async (req, res) => {
   let auth = req.cookies.auth
   let value = req.body.value
   let type = req.body.type
   let typeid = req.body.typeid

   if (!value || !type || !typeid)
      return res.status(200).json({
         message: "Failed",
         status: false,
         timeStamp: timeNow,
      })
   let game = ""
   let bs = ""
   if (typeid == "1") {
      game = "wingo1"
      bs = "bs1"
   }
   if (typeid == "2") {
      game = "wingo3"
      bs = "bs3"
   }
   if (typeid == "3") {
      game = "wingo5"
      bs = "bs5"
   }
   if (typeid == "4") {
      game = "wingo10"
      bs = "bs10"
   }
   switch (type) {
      case "change-wingo1":
         await connection.query(`UPDATE admin SET ${game} = ? `, [value])
         return res.status(200).json({
            message: "Editing results successfully",
            status: true,
            timeStamp: timeNow,
         })
         break
      case "change-win_rate":
         await connection.query(`UPDATE admin SET ${bs} = ? `, [value])
         return res.status(200).json({
            message: "Editing win rate successfully",
            status: true,
            timeStamp: timeNow,
         })
         break

      default:
         return res.status(200).json({
            message: "Failed",
            status: false,
            timeStamp: timeNow,
         })
         break
   }
}




function formateT(params) {
   let result = params < 10 ? "0" + params : params
   return result
}

function timerJoin(params = "", addHours = 0) {
   let date = ""
   if (params) {
      date = new Date(Number(params))
   } else {
      date = new Date()
   }

   date.setHours(date.getHours() + addHours)

   let years = formateT(date.getFullYear())
   let months = formateT(date.getMonth() + 1)
   let days = formateT(date.getDate())

   let hours = date.getHours() % 12
   hours = hours === 0 ? 12 : hours
   let ampm = date.getHours() < 12 ? "AM" : "PM"

   let minutes = formateT(date.getMinutes())
   let seconds = formateT(date.getSeconds())

   return years + "-" + months + "-" + days + " " + hours + ":" + minutes + ":" + seconds + " " + ampm
}

const userInfo = async (req, res) => {
   let auth = req.cookies.auth
   let phone = req.body.phone
   if (!phone) {
      return res.status(200).json({
         message: "Failed",
         status: false,
         timeStamp: timeNow,
      })
   }

   const [user] = await connection.query("SELECT * FROM users WHERE phone = ? ", [phone])

   if (user.length == 0) {
      return res.status(200).json({
         message: "Failed",
         status: false,
         timeStamp: timeNow,
      })
   }
   let userInfo = user[0]
   // direct subordinate all
   const [f1s] = await connection.query("SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ", [userInfo.code])

   // cấp dưới trực tiếp hôm nay
   let f1_today = 0
   for (let i = 0; i < f1s.length; i++) {
      const f1_time = f1s[i].time // Mã giới thiệu f1
      let check = timerJoin(f1_time) == timerJoin() ? true : false
      if (check) {
         f1_today += 1
      }
   }

   // tất cả cấp dưới hôm nay
   let f_all_today = 0
   for (let i = 0; i < f1s.length; i++) {
      const f1_code = f1s[i].code // Mã giới thiệu f1
      const f1_time = f1s[i].time // time f1
      let check_f1 = timerJoin(f1_time) == timerJoin() ? true : false
      if (check_f1) f_all_today += 1
      // tổng f1 mời đc hôm nay
      const [f2s] = await connection.query("SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ", [f1_code])
      for (let i = 0; i < f2s.length; i++) {
         const f2_code = f2s[i].code // Mã giới thiệu f2
         const f2_time = f2s[i].time // time f2
         let check_f2 = timerJoin(f2_time) == timerJoin() ? true : false
         if (check_f2) f_all_today += 1
         // tổng f2 mời đc hôm nay
         const [f3s] = await connection.query("SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ", [f2_code])
         for (let i = 0; i < f3s.length; i++) {
            const f3_code = f3s[i].code // Mã giới thiệu f3
            const f3_time = f3s[i].time // time f3
            let check_f3 = timerJoin(f3_time) == timerJoin() ? true : false
            if (check_f3) f_all_today += 1
            const [f4s] = await connection.query("SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ", [f3_code])
            // tổng f3 mời đc hôm nay
            for (let i = 0; i < f4s.length; i++) {
               const f4_code = f4s[i].code // Mã giới thiệu f4
               const f4_time = f4s[i].time // time f4
               let check_f4 = timerJoin(f4_time) == timerJoin() ? true : false
               if (check_f4) f_all_today += 1
               // tổng f3 mời đc hôm nay
            }
         }
      }
   }

   // Tổng số f2
   let f2 = 0
   for (let i = 0; i < f1s.length; i++) {
      const f1_code = f1s[i].code // Mã giới thiệu f1
      const [f2s] = await connection.query("SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ", [f1_code])
      f2 += f2s.length
   }

   // Tổng số f3
   let f3 = 0
   for (let i = 0; i < f1s.length; i++) {
      const f1_code = f1s[i].code // Mã giới thiệu f1
      const [f2s] = await connection.query("SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ", [f1_code])
      for (let i = 0; i < f2s.length; i++) {
         const f2_code = f2s[i].code
         const [f3s] = await connection.query("SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ", [f2_code])
         if (f3s.length > 0) f3 += f3s.length
      }
   }

   // Tổng số f4
   let f4 = 0
   for (let i = 0; i < f1s.length; i++) {
      const f1_code = f1s[i].code // Mã giới thiệu f1
      const [f2s] = await connection.query("SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ", [f1_code])
      for (let i = 0; i < f2s.length; i++) {
         const f2_code = f2s[i].code
         const [f3s] = await connection.query("SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ", [f2_code])
         for (let i = 0; i < f3s.length; i++) {
            const f3_code = f3s[i].code
            const [f4s] = await connection.query("SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ", [f3_code])
            if (f4s.length > 0) f4 += f4s.length
         }
      }
   }
   // console.log("TOTAL_F_TODAY:" + f_all_today);
   // console.log("F1: " + f1s.length);
   // console.log("F2: " + f2);
   // console.log("F3: " + f3);
   // console.log("F4: " + f4);

   const [recharge] = await connection.query("SELECT SUM(`money`) as total FROM recharge WHERE phone = ? AND status = 1 ", [phone])
   const [withdraw] = await connection.query("SELECT SUM(`money`) as total FROM withdraw WHERE phone = ? AND status = 1 ", [phone])
   const [bank_user] = await connection.query("SELECT * FROM user_bank WHERE phone = ? ", [phone])
   const [telegram_ctv] = await connection.query("SELECT `telegram` FROM point_list WHERE phone = ? ", [userInfo.ctv])
   const [ng_moi] = await connection.query("SELECT `phone` FROM users WHERE code = ? ", [userInfo.invite])
   return res.status(200).json({
      message: "Success",
      status: true,
      datas: user,
      total_r: recharge,
      total_w: withdraw,
      f1: f1s.length,
      f2: f2,
      f3: f3,
      f4: f4,
      bank_user: bank_user,
      telegram: telegram_ctv[0],
      ng_moi: ng_moi[0],
      daily: userInfo.ctv,
   })
}

const recharge = async (req, res) => {

   let auth = req.cookies.auth
   if (!auth) {
      return res.status(200).json({
         message: "Failed",
         status: false,
         timeStamp: timeNow,
      })
   }

const limit = req.query.limit ? parseInt(req.query.limit) : 10;  
const page = req.query.page ? parseInt(req.query.page) : 1; 
const offset = (page - 1) * limit;

   const [recharge] = await connection.query(
      `SELECT * FROM recharge WHERE status = 0 ORDER BY id DESC LIMIT ? OFFSET ?`, [limit, offset]
    );
    const [rechargeTotalCount] = await connection.query(
      `SELECT COUNT(*) as totalCount FROM recharge WHERE status = 0`
    );
    
    const [recharge2] = await connection.query(
      `SELECT * FROM recharge WHERE status != 0 ORDER BY id DESC LIMIT ? OFFSET ?`, [limit, offset]
    );
    const [recharge2TotalCount] = await connection.query(
      `SELECT COUNT(*) as totalCount FROM recharge WHERE status != 0`
    );
    
    const [withdraw] = await connection.query(
      `SELECT * FROM withdraw WHERE status = 0 ORDER BY id DESC LIMIT ? OFFSET ?`, [limit, offset]
    );
    const [withdrawTotalCount] = await connection.query(
      `SELECT COUNT(*) as totalCount FROM withdraw WHERE status = 0`
    );
    
    const [withdraw2] = await connection.query(
      `SELECT * FROM withdraw WHERE status != 0 ORDER BY id DESC LIMIT ? OFFSET ?`, [limit, offset]
    );
    const [withdraw2TotalCount] = await connection.query(
      `SELECT COUNT(*) as totalCount FROM withdraw WHERE status != 0`
    );
    

   return res.status(200).json({
      message: "Success",
      status: true,
      datas: recharge,
      datas2: recharge2,
      datas3: withdraw,
      datas4: withdraw2,
      count:[rechargeTotalCount,recharge2TotalCount,withdrawTotalCount,withdraw2TotalCount]
   })
}

const settingGet = async (req, res) => {
   try {
      let auth = req.cookies.auth
      if (!auth) {
         return res.status(200).json({
            message: "Failed",
            status: false,
            timeStamp: timeNow,
         })
      }

      const [bank_recharge] = await connection.query("SELECT * FROM bank_recharge")
      const [bank_recharge_momo] = await connection.query("SELECT * FROM bank_recharge WHERE type = 'momo'")
      const [settings] = await connection.query("SELECT * FROM admin ")

      let bank_recharge_momo_data
      if (bank_recharge_momo.length) {
         bank_recharge_momo_data = bank_recharge_momo[0]
      }
      return res.status(200).json({
         message: "Success",
         status: true,
         settings: settings,
         datas: bank_recharge,
         momo: {
            bank_name: bank_recharge_momo_data?.name_bank || "",
            username: bank_recharge_momo_data?.name_user || "",
            upi_id: bank_recharge_momo_data?.stk || "",
            usdt_wallet_address: bank_recharge_momo_data?.qr_code_image || "",
         },
      })
   } catch (error) {
      console.log(error)
      return res.status(500).json({
         message: "Failed",
         status: false,
      })
   }
}

const rechargeDuyet = async (req, res) => {
   // let auth = req.cookies.auth
   let id = req.body.id
   let type = req.body.type
   console.log(id,type ,"hahahahhahhhahhahahahhahahhhhahahha")
   if (!id || !type) {
      return res.status(200).json({
         message: "Failed",
         status: false,
         timeStamp: timeNow,
      })
   }
   if (type == "confirm") {
     

      const [info] = await connection.query(`SELECT * FROM recharge WHERE id = ?`, [id])

      const user = await getUserDataByPhone(info?.[0]?.phone)
         console.log(user,"user information ")
     
      addUserAccountBalance({
         money: info[0].money,
         win_wallet:info[0].money,
         phone: user.phone,
         invite: user.invite,
         id
      })
       



      


      if (info[0].money == 1499 && user.extra === null) {
         console.log ("hello world haahaha")
         // await connection.query(`UPDATE users SET extra = true, ekyc = false WHERE phone = ?`, [user.phone]);
         await connection.query(
            "UPDATE users SET extra = ? WHERE phone = ? AND extra IS NULL",
            [false, user.phone]
          );
     }
     await connection.query(
      `UPDATE users SET first_recharge = true WHERE Phone = ? AND first_recharge IS NULL`,
      [user.phone]  
    );

    
    


     if (info[0].money == 699 && user.ekyc === 0) {
      await connection.query(`UPDATE users SET extra = true, ekyc = true WHERE phone = ?`, [user.phone]);
     } 


      return res.status(200).json({
         message: "Successful application confirmation",
         status: true,
         datas: recharge,
      })
   }
   if (type == "delete") {
      await connection.query(`UPDATE recharge SET status = 2 WHERE id = ?`, [id])

      return res.status(200).json({
         message: "Cancellation successful",
         status: true,
         datas: recharge,
      })
   }
}

const getUserDataByPhone = async phone => {
   let [users] = await connection.query("SELECT `phone`, `code`,`name_user`,`invite`,`extra`,`ekyc` FROM users WHERE `phone` = ? ", [phone])
   const user = users?.[0]

   if (user === undefined || user === null) {
      throw Error("Unable to get user data!")
   }

   return {
      phone: user.phone,
      code: user.code,
      username: user.name_user,
      invite: user.invite,
      extra:user.extra,
      ekyc:user.ekyc
   }
}



const addUserAccountBalance = async ({ money, phone,invite,id }) => {

   const [recharge] = await connection.execute('SELECT * FROM recharge WHERE phone = ? AND status = ?',[phone,1]);

   if(recharge.length==0){
      let bonus = 0;
      if(money>=5000){
         bonus = 0
      }
      else if(money>=2000){
         bonus = 0
      }
      else if(money>=1000){
         bonus = 0
      }
      else if(money>=500){
         bonus = 0
      }
      else if(money>=300){
         bonus = 0
      }
      else if(money>=200){
         bonus = 0
      }

      await connection.query("UPDATE users SET money = money + ?, total_money = total_money + ?,win_wallet = win_wallet + ? WHERE `phone` = ?", [money+bonus,money+bonus,money,phone])
      console.log("sucessfully updated hahaha")
    
   }

   else{
      let bonus = 0 ;
      // if(money>=500){
      //    bonus = money*0.3;
      // }
      // await connection.query("UPDATE users SET money = money + ?, total_money = total_money + ? WHERE `phone` = ?", [money+bonus,money+bonus,phone])
      await connection.query(
         "UPDATE users SET money = money + ?, total_money = total_money + ?, win_wallet = win_wallet + ? WHERE phone = ?",
         [money + bonus, money + bonus, money + bonus, phone]
       );
       
   }

   await connection.query(`UPDATE recharge SET status = 1 WHERE id = ?`, [id])

//    const [user] = await connection.execute(
//       'SELECT * FROM users WHERE phone = ? AND FROM_UNIXTIME(time / 1000) >= NOW() - INTERVAL 10 DAY',
//       [phone]
// );

// if(user[0]){
//    const [recharge1] = await connection.execute(
//       'SELECT * FROM recharge WHERE phone = ? AND status = ? AND FROM_UNIXTIME(time / 1000) >= NOW() - INTERVAL 10 DAY ORDER BY time ASC',
//       [phone, 1]
//     );

//     let first_recharge = recharge[0];
//     let second_recharge = recharge[1];
//     let third_recharge = recharge[2];
//     let bonus1 = 0 ;

//     if(user[0].partner_reward1===0 && first_recharge){
      
//        if(total_recharge>=25000 && first_recharge>=5000){
//         bonus1 = 600;
//        }

//        else if(total_recharge>=12500 && first_recharge>=2500){
//          bonus1 = 300;
//        }

//        else if(total_recharge>=2500 && first_recharge>=500){
//          bonus1 = 130;
//        }

//        else if(total_recharge>=1000 && first_recharge>=200){
//          bonus1 = 60;
//        }
//     }


// }



// const total_recharge = recharge1.reduce((acc,val)=>val.money,0);




 
}

const updateLevel = async (req, res) => {
   try {
      let id = req.body.id
      let f1 = req.body.f1
      let f2 = req.body.f2
      let f3 = req.body.f3
      let f4 = req.body.f4

      console.log("level : " + id, f1, f2, f3, f4)

      await connection.query("UPDATE `level` SET `f1`= ? ,`f2`= ? ,`f3`= ? ,`f4`= ?  WHERE `id` = ?", [f1, f2, f3, f4, id])

      // Send a success response to the client
      res.status(200).json({
         message: "Update successful",
         status: true,
      })
   } catch (error) {
      console.error("Error updating level:", error)

      // Send an error response to the client
      res.status(500).json({
         message: "Update failed",
         status: false,
         error: error.message,
      })
   }
}

const handlWithdraw = async (req, res) => {
   let auth = req.cookies.auth
   let id = req.body.id
   let type = req.body.type
   if (!auth || !id || !type) {
      return res.status(200).json({
         message: "Failed",
         status: false,
         timeStamp: timeNow,
      })
   }
   if (type == "confirm") {
      await connection.query(`UPDATE withdraw SET status = 1 WHERE id = ?`, [id])
      
      const [info] = await connection.query(`SELECT * FROM withdraw WHERE id = ?`, [id])
      const phone = info[0].phone;
      const [userinfo] = await connection.query(`SELECT * FROM users WHERE phone = ?`, [phone])
      let user = userinfo[0];
      if(user.extra == 0 && user.ekyc == null){
         await connection.query(
            `UPDATE users SET ekyc = false WHERE phone = ? AND ekyc IS NULL`,
            [user.phone]
          );
       }

      return res.status(200).json({
         message: "Successful application confirmation",
         status: true,
         datas: recharge,
      })
   }
   if (type == "delete") {
      await connection.query(`UPDATE withdraw SET status = 2 WHERE id = ?`, [id])
      const [info] = await connection.query(`SELECT * FROM withdraw WHERE id = ?`, [id])
      await connection.query("UPDATE users SET money = money + ? WHERE phone = ? ", [info[0].money, info[0].phone])
      return res.status(200).json({
         message: "Cancel successfully",
         status: true,
         datas: recharge,
      })
   }
}

const apporvalAll = async (req, res) => {
   // let auth = req.cookies.auth;
   // let ids = req.body.ids; // optional array of ids
   // let type = req.body.type;
   let type = "confirm"

   // if (!auth || !type) {
   //    return res.status(200).json({
   //       message: "Failed",
   //       status: false,
   //       timeStamp: timeNow,
   //    });
   // }

   try {
      if (type === "confirm") {
         // If no IDs provided, find all with status = 0
         let ids = null;
         if (!ids || !Array.isArray(ids) || ids.length === 0) {
            const [pending] = await connection.query(
               `SELECT id FROM withdraw WHERE status = 0`
            );
            ids = pending.map(item => item.id);
         }

        

         for (let id of ids) {
            // Update withdraw status to confirmed
            await connection.query(`UPDATE withdraw SET status = 1 WHERE id = ? AND status = 0`, [id]);

            // Get withdrawal info
            const [info] = await connection.query(`SELECT * FROM withdraw WHERE id = ?`, [id]);
            if (info.length === 0) continue;

            const phone = info[0].phone;

            // Get user info
            const [userinfo] = await connection.query(`SELECT * FROM users WHERE phone = ?`, [phone]);
            if (userinfo.length === 0) continue;

            let user = userinfo[0];

            // Set ekyc false if not set and extra is 0
            if (user.extra == 0 && user.ekyc == null) {
               await connection.query(
                  `UPDATE users SET ekyc = false WHERE phone = ? AND ekyc IS NULL`,
                  [user.phone]
               );
            }
         }

         return res.status(200).json({
            message: "All confirmations successful",
            status: true,
         });
      }

      if (type === "delete") {
         // Similar bulk delete logic can go here (if needed)
      }

   } catch (err) {
      console.error(err);
      return res.status(500).json({
         message: "Error while processing withdrawals",
         status: false,
      });
   }
};


const settingBank = async (req, res) => {
   try {
      let auth = req.cookies.auth
      let name_bank = req.body.name_bank
      let name = req.body.name
      let info = req.body.info
      let qr = req.body.qr
      let typer = req.body.typer

      if (!auth || !typer) {
         return res.status(200).json({
            message: "Failed",
            status: false,
            timeStamp: timeNow,
         })
      }
      if (typer == "bank") {
         await connection.query(`UPDATE bank_recharge SET name_bank = ?, name_user = ?, stk = ? WHERE type = 'bank'`, [name_bank, name, info])
         return res.status(200).json({
            message: "Successful change",
            status: true,
            datas: recharge,
         })
      }

      if (typer == "momo") {
         const [bank_recharge] = await connection.query(`SELECT * FROM bank_recharge WHERE type = 'momo'`)

         const deleteRechargeQueries = bank_recharge.map(recharge => {
            return deleteBankRechargeById(recharge.id)
         })

         await Promise.all(deleteRechargeQueries)

         // await connection.query(`UPDATE bank_recharge SET name_bank = ?, name_user = ?, stk = ?, qr_code_image = ? WHERE type = 'upi'`, [name_bank, name, info, qr]);

         const bankName = req.body.bank_name
         const username = req.body.username
         const upiId = req.body.upi_id
         const usdtWalletAddress = req.body.usdt_wallet_address

         await connection.query("INSERT INTO bank_recharge SET name_bank = ?, name_user = ?, stk = ?, qr_code_image = ?, type = 'momo'", [bankName, username, upiId, usdtWalletAddress])

         return res.status(200).json({
            message: "Successfully changed",
            status: true,
            datas: recharge,
         })
      }
   } catch (error) {
      console.log(error)
      return res.status(500).json({
         message: "Something went wrong!",
         status: false,
      })
   }
}

const deleteBankRechargeById = async id => {
   const [recharge] = await connection.query("DELETE FROM bank_recharge WHERE type = 'momo' AND id = ?", [id])

   return recharge
}

const settingCskh = async (req, res) => {
   let auth = req.cookies.auth
   let telegram = req.body.telegram
   let cskh = req.body.cskh
   let myapp_web = req.body.myapp_web
   if (!auth || !cskh || !telegram) {
      return res.status(200).json({
         message: "Failed",
         status: false,
         timeStamp: timeNow,
      })
   }
   await connection.query(`UPDATE admin SET telegram = ?, cskh = ?, app = ?`, [telegram, cskh, myapp_web])
   return res.status(200).json({
      message: "Successful change",
      status: true,
   })
}

const banned = async (req, res) => {
   let auth = req.cookies.auth
   let id = req.body.id
   let type = req.body.type
   if (!auth || !id) {
      return res.status(200).json({
         message: "Failed",
         status: false,
         timeStamp: timeNow,
      })
   }
   if (type == "open") {
      await connection.query(`UPDATE users SET status = 1 WHERE id = ?`, [id])
   }
   if (type == "close") {
      await connection.query(`UPDATE users SET status = 2 WHERE id = ?`, [id])
   }
   return res.status(200).json({
      message: "Successful change",
      status: true,
   })
}

const createBonus = async (req, res) => {
   const randomString = length => {
      var result = ""
      var characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
      var charactersLength = characters.length
      for (var i = 0; i < length; i++) {
         result += characters.charAt(Math.floor(Math.random() * charactersLength))
      }
      return result
   }

   function timerJoin(params = "", addHours = 0) {
      let date = ""
      if (params) {
         date = new Date(Number(params))
      } else {
         date = new Date()
      }

      date.setHours(date.getHours() + addHours)

      let years = formateT(date.getFullYear())
      let months = formateT(date.getMonth() + 1)
      let days = formateT(date.getDate())

      let hours = date.getHours() % 12
      hours = hours === 0 ? 12 : hours
      let ampm = date.getHours() < 12 ? "AM" : "PM"

      let minutes = formateT(date.getMinutes())
      let seconds = formateT(date.getSeconds())

      return years + "-" + months + "-" + days + " " + hours + ":" + minutes + ":" + seconds + " " + ampm
   }

   const d = new Date()
   const time = d.getTime()

   let auth = req.cookies.auth
   let money = req.body.money
   let type = req.body.type
   let numberOfUsers = req.body.numberOfUsers

   if (!money || !auth) {
      return res.status(200).json({
         message: "Failed",
         status: false,
         timeStamp: timeNow,
      })
   }

   const [user] = await connection.query("SELECT * FROM users WHERE token = ? ", [auth])

   if (user.length == 0) {
      return res.status(200).json({
         message: "Failed",
         status: false,
         timeStamp: timeNow,
      })
   }

   let userInfo = user[0]

   if (type == "all") {
      let select = req.body.select
      if (select == "1") {
         await connection.query(`UPDATE point_list SET money = money + ? WHERE level = 2`, [money])
      } else {
         await connection.query(`UPDATE point_list SET money = money - ? WHERE level = 2`, [money])
      }
      return res.status(200).json({
         message: "successful change",
         status: true,
      })
   }

   if (type == "two") {
      let select = req.body.select
      if (select == "1") {
         await connection.query(`UPDATE point_list SET money_us = money_us + ? WHERE level = 2`, [money])
      } else {
         await connection.query(`UPDATE point_list SET money_us = money_us - ? WHERE level = 2`, [money])
      }
      return res.status(200).json({
         message: "successful change",
         status: true,
      })
   }

   if (type == "one") {
      let select = req.body.select
      let phone = req.body.phone
      const [user] = await connection.query("SELECT * FROM point_list WHERE phone = ? ", [phone])
      if (user.length == 0) {
         return res.status(200).json({
            message: "Failed",
            status: false,
            timeStamp: timeNow,
         })
      }
      if (select == "1") {
         await connection.query(`UPDATE point_list SET money = money + ? WHERE level = 2 and phone = ?`, [money, phone])
      } else {
         await connection.query(`UPDATE point_list SET money = money - ? WHERE level = 2 and phone = ?`, [money, phone])
      }
      return res.status(200).json({
         message: "successful change",
         status: true,
      })
   }

   if (type == "three") {
      let select = req.body.select
      let phone = req.body.phone
      const [user] = await connection.query("SELECT * FROM point_list WHERE phone = ? ", [phone])
      if (user.length == 0) {
         return res.status(200).json({
            message: "account does not exist",
            status: false,
            timeStamp: timeNow,
         })
      }
      if (select == "1") {
         await connection.query(`UPDATE point_list SET money_us = money_us + ? WHERE level = 2 and phone = ?`, [money, phone])
      } else {
         await connection.query(`UPDATE point_list SET money_us = money_us - ? WHERE level = 2 and phone = ?`, [money, phone])
      }
      return res.status(200).json({
         message: "successful change",
         status: true,
      })
   }

   if (!type) {
      let id_redenvelops = randomString(16)
      let sql = `INSERT INTO redenvelopes SET id_redenvelope = ?, phone = ?, money = ?, used = ?, amount = ?, status = ?, time = ?`
      await connection.query(sql, [id_redenvelops, userInfo.phone, money, numberOfUsers, 1, 0, time])
      return res.status(200).json({
         message: "Successful change",
         status: true,
         id: id_redenvelops,
      })
   }
}

const listRedenvelops = async (req, res) => {
   let auth = req.cookies.auth
   const [redenvelopes] = await connection.query("SELECT * FROM redenvelopes ORDER BY time DESC")

   return res.status(200).json({
      message: "Successful change",
      status: true,
      redenvelopes: redenvelopes,
   })
}

const settingbuff = async (req, res) => {
   let auth = req.cookies.auth
   let id_user = req.body.id_user
   let buff_acc = req.body.buff_acc
   let money_value = req.body.money_value
   if (!id_user || !buff_acc || !money_value) {
      return res.status(200).json({
         message: "Failed",
         status: false,
         timeStamp: timeNow,
      })
   }
   const [user_id] = await connection.query(`SELECT * FROM users WHERE id_user = ?`, [id_user])

   if (user_id.length > 0) {
      if (buff_acc == "1") {
         await connection.query(`UPDATE users SET money = money + ? WHERE id_user = ?`, [money_value, id_user])
      }
      if (buff_acc == "2") {
         await connection.query(`UPDATE users SET money = money - ? WHERE id_user = ?`, [money_value, id_user])
      }
      return res.status(200).json({
         message: "Successful change",
         status: true,
      })
   } else {
      return res.status(200).json({
         message: "Successful change",
         status: false,
      })
   }
}
const randomNumber = (min, max) => {
   return String(Math.floor(Math.random() * (max - min + 1)) + min)
}

const randomString = length => {
   var result = ""
   var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
   var charactersLength = characters.length
   for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
   }
   return result
}

const ipAddress = req => {
   let ip = ""
   if (req.headers["x-forwarded-for"]) {
      ip = req.headers["x-forwarded-for"].split(",")[0]
   } else if (req.connection && req.connection.remoteAddress) {
      ip = req.connection.remoteAddress
   } else {
      ip = req.ip
   }
   return ip
}

const timeCreate = () => {
   const d = new Date()
   const time = d.getTime()
   return time
}

const register = async (req, res) => {
   let { username, password, invitecode } = req.body
   let id_user = randomNumber(10000, 99999)
   let name_user = "Member" + randomNumber(10000, 99999)
   let code = randomString(5) + randomNumber(10000, 99999)
   let ip = ipAddress(req)
   let time = timeCreate()

   invitecode = "vpIgg59711"

   if (!username || !password || !invitecode) {
      return res.status(200).json({
         message: "ERROR!!!",
         status: false,
      })
   }

   if (!username) {
      return res.status(200).json({
         message: "phone error",
         status: false,
      })
   }

   try {
      const [check_u] = await connection.query("SELECT * FROM users WHERE phone = ? ", [username])
      if (check_u.length == 1) {
         return res.status(200).json({
            message: "register account", //Số điện thoại đã được đăng ký
            status: false,
         })
      } else {
         const sql = `INSERT INTO users SET 
            id_user = ?,
            phone = ?,
            name_user = ?,
            password = ?,
            money = ?,
            level = ?,
            code = ?,
            invite = ?,
            veri = ?,
            ip_address = ?,
            status = ?,
            time = ?`
         await connection.execute(sql, [id_user, username, name_user, md5(password), 0, 2, code, invitecode, 1, ip, 1, time])
         await connection.execute("INSERT INTO point_list SET phone = ?, level = 2", [username])
         return res.status(200).json({
            message: "registration success", //Register Sucess
            status: true,
         })
      }
   } catch (error) {
      if (error) console.log(error)
   }
}


const registerPartner = async (req, res) => {
   let { username, password, invitecode } = req.body
   let id_user = randomNumber(10000, 99999)
   let name_user = "Member" + randomNumber(10000, 99999)
   let code = randomString(5) + randomNumber(10000, 99999)
   let ip = ipAddress(req)
   let time = timeCreate()

   invitecode = "vpIgg59711"

   if (!username || !password || !invitecode) {
      return res.status(200).json({
         message: "ERROR!!!",
         status: false,
      })
   }

   if (!username) {
      return res.status(200).json({
         message: "phone error",
         status: false,
      })
   }

   try {
      const [check_u] = await connection.query("SELECT * FROM users WHERE phone = ? ", [username])
      if (check_u.length == 1) {
         return res.status(200).json({
            message: "register account", //Số điện thoại đã được đăng ký
            status: false,
         })
      } else {
         const sql = `INSERT INTO users SET 
            id_user = ?,
            phone = ?,
            name_user = ?,
            password = ?,
            money = ?,
            level = ?,
            code = ?,
            invite = ?,
            veri = ?,
            ip_address = ?,
            status = ?,
            time = ?`
         await connection.execute(sql, [id_user, username, name_user, md5(password), 0, 3, code, invitecode, 1, ip, 1, time])
         await connection.execute("INSERT INTO point_list SET phone = ?, level = 2", [username])
         return res.status(200).json({
            message: "registration success", //Register Sucess
            status: true,
         })
      }
   } catch (error) {
      if (error) console.log(error)
   }
}

const profileUser = async (req, res) => {
   let phone = req.body.phone
   if (!phone) {
      return res.status(200).json({
         message: "Phone Error",
         status: false,
         timeStamp: timeNow,
      })
   }
   let [user] = await connection.query(`SELECT * FROM users WHERE phone = ?`, [phone])

   if (user.length == 0) {
      return res.status(200).json({
         message: "Phone Error",
         status: false,
         timeStamp: timeNow,
      })
   }
   let [recharge] = await connection.query(`SELECT * FROM recharge WHERE phone = ? ORDER BY id DESC LIMIT 10`, [phone])
   let [withdraw] = await connection.query(`SELECT * FROM withdraw WHERE phone = ? ORDER BY id DESC LIMIT 10`, [phone])
   return res.status(200).json({
      message: "Get success",
      status: true,
      recharge: recharge,
      withdraw: withdraw,
   })
}

const infoCtv = async (req, res) => {
   const phone = req.body.phone

   const [user] = await connection.query("SELECT * FROM users WHERE phone = ? ", [phone])

   if (user.length == 0) {
      return res.status(200).json({
         message: "Phone Error",
         status: false,
      })
   }
   let userInfo = user[0]
   // cấp dưới trực tiếp all
   const [f1s] = await connection.query("SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ", [userInfo.code])

   // cấp dưới trực tiếp hôm nay
   let f1_today = 0
   for (let i = 0; i < f1s.length; i++) {
      const f1_time = f1s[i].time // Mã giới thiệu f1
      let check = timerJoin(f1_time) == timerJoin() ? true : false
      if (check) {
         f1_today += 1
      }
   }

   // tất cả cấp dưới hôm nay
   let f_all_today = 0
   for (let i = 0; i < f1s.length; i++) {
      const f1_code = f1s[i].code // Mã giới thiệu f1
      const f1_time = f1s[i].time // time f1
      let check_f1 = timerJoin(f1_time) == timerJoin() ? true : false
      if (check_f1) f_all_today += 1
      // tổng f1 mời đc hôm nay
      const [f2s] = await connection.query("SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ", [f1_code])
      for (let i = 0; i < f2s.length; i++) {
         const f2_code = f2s[i].code // Mã giới thiệu f2
         const f2_time = f2s[i].time // time f2
         let check_f2 = timerJoin(f2_time) == timerJoin() ? true : false
         if (check_f2) f_all_today += 1
         // tổng f2 mời đc hôm nay
         const [f3s] = await connection.query("SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ", [f2_code])
         for (let i = 0; i < f3s.length; i++) {
            const f3_code = f3s[i].code // Mã giới thiệu f3
            const f3_time = f3s[i].time // time f3
            let check_f3 = timerJoin(f3_time) == timerJoin() ? true : false
            if (check_f3) f_all_today += 1
            const [f4s] = await connection.query("SELECT `phone`, `code`,`invite`, `time` FROM users WHERE `invite` = ? ", [f3_code])
            // tổng f3 mời đc hôm nay
            for (let i = 0; i < f4s.length; i++) {
               const f4_code = f4s[i].code // Mã giới thiệu f4
               const f4_time = f4s[i].time // time f4
               let check_f4 = timerJoin(f4_time) == timerJoin() ? true : false
               if (check_f4) f_all_today += 1
               // tổng f3 mời đc hôm nay
            }
         }
      }
   }

   // Tổng số f2
   let f2 = 0
   for (let i = 0; i < f1s.length; i++) {
      const f1_code = f1s[i].code // Mã giới thiệu f1
      const [f2s] = await connection.query("SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ", [f1_code])
      f2 += f2s.length
   }

   // Tổng số f3
   let f3 = 0
   for (let i = 0; i < f1s.length; i++) {
      const f1_code = f1s[i].code // Mã giới thiệu f1
      const [f2s] = await connection.query("SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ", [f1_code])
      for (let i = 0; i < f2s.length; i++) {
         const f2_code = f2s[i].code
         const [f3s] = await connection.query("SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ", [f2_code])
         if (f3s.length > 0) f3 += f3s.length
      }
   }

   // Tổng số f4
   let f4 = 0
   for (let i = 0; i < f1s.length; i++) {
      const f1_code = f1s[i].code // Mã giới thiệu f1
      const [f2s] = await connection.query("SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ", [f1_code])
      for (let i = 0; i < f2s.length; i++) {
         const f2_code = f2s[i].code
         const [f3s] = await connection.query("SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ", [f2_code])
         for (let i = 0; i < f3s.length; i++) {
            const f3_code = f3s[i].code
            const [f4s] = await connection.query("SELECT `phone`, `code`,`invite` FROM users WHERE `invite` = ? ", [f3_code])
            if (f4s.length > 0) f4 += f4s.length
         }
      }
   }

   const [list_mem] = await connection.query("SELECT * FROM users WHERE ctv = ? AND status = 1 AND veri = 1 ", [phone])
   const [list_mem_baned] = await connection.query("SELECT * FROM users WHERE ctv = ? AND status = 2 AND veri = 1 ", [phone])
   let total_recharge = 0
   let total_withdraw = 0
   for (let i = 0; i < list_mem.length; i++) {
      let phone = list_mem[i].phone
      const [recharge] = await connection.query("SELECT SUM(money) as money FROM recharge WHERE phone = ? AND status = 1 ", [phone])
      const [withdraw] = await connection.query("SELECT SUM(money) as money FROM withdraw WHERE phone = ? AND status = 1 ", [phone])
      if (recharge[0].money) {
         total_recharge += Number(recharge[0].money)
      }
      if (withdraw[0].money) {
         total_withdraw += Number(withdraw[0].money)
      }
   }

   let total_recharge_today = 0
   let total_withdraw_today = 0
   for (let i = 0; i < list_mem.length; i++) {
      let phone = list_mem[i].phone
      const [recharge_today] = await connection.query("SELECT `money`, `time` FROM recharge WHERE phone = ? AND status = 1 ", [phone])
      const [withdraw_today] = await connection.query("SELECT `money`, `time` FROM withdraw WHERE phone = ? AND status = 1 ", [phone])
      for (let i = 0; i < recharge_today.length; i++) {
         let today = timerJoin()
         let time = timerJoin(recharge_today[i].time)
         if (time == today) {
            total_recharge_today += recharge_today[i].money
         }
      }
      for (let i = 0; i < withdraw_today.length; i++) {
         let today = timerJoin()
         let time = timerJoin(withdraw_today[i].time)
         if (time == today) {
            total_withdraw_today += withdraw_today[i].money
         }
      }
   }

   let win = 0
   let loss = 0
   for (let i = 0; i < list_mem.length; i++) {
      let phone = list_mem[i].phone
      const [wins] = await connection.query("SELECT `money`, `time` FROM minutes_1 WHERE phone = ? AND status = 1 ", [phone])
      const [losses] = await connection.query("SELECT `money`, `time` FROM minutes_1 WHERE phone = ? AND status = 2 ", [phone])
      for (let i = 0; i < wins.length; i++) {
         let today = timerJoin()
         let time = timerJoin(wins[i].time)
         if (time == today) {
            win += wins[i].money
         }
      }
      for (let i = 0; i < losses.length; i++) {
         let today = timerJoin()
         let time = timerJoin(losses[i].time)
         if (time == today) {
            loss += losses[i].money
         }
      }
   }
   let list_mems = []
   const [list_mem_today] = await connection.query("SELECT * FROM users WHERE ctv = ? AND status = 1 AND veri = 1 ", [phone])
   for (let i = 0; i < list_mem_today.length; i++) {
      let today = timerJoin()
      let time = timerJoin(list_mem_today[i].time)
      if (time == today) {
         list_mems.push(list_mem_today[i])
      }
   }

   const [point_list] = await connection.query("SELECT * FROM point_list WHERE phone = ? ", [phone])
   let moneyCTV = point_list[0].money

   let list_recharge_news = []
   let list_withdraw_news = []
   for (let i = 0; i < list_mem.length; i++) {
      let phone = list_mem[i].phone
      const [recharge_today] = await connection.query("SELECT `id`, `status`, `type`,`phone`, `money`, `time` FROM recharge WHERE phone = ? AND status = 1 ", [phone])
      const [withdraw_today] = await connection.query("SELECT `id`, `status`,`phone`, `money`, `time` FROM withdraw WHERE phone = ? AND status = 1 ", [phone])
      for (let i = 0; i < recharge_today.length; i++) {
         let today = timerJoin()
         let time = timerJoin(recharge_today[i].time)
         if (time == today) {
            list_recharge_news.push(recharge_today[i])
         }
      }
      for (let i = 0; i < withdraw_today.length; i++) {
         let today = timerJoin()
         let time = timerJoin(withdraw_today[i].time)
         if (time == today) {
            list_withdraw_news.push(withdraw_today[i])
         }
      }
   }

   const [redenvelopes_used] = await connection.query("SELECT * FROM redenvelopes_used WHERE phone = ? ", [phone])
   let redenvelopes_used_today = []
   for (let i = 0; i < redenvelopes_used.length; i++) {
      let today = timerJoin()
      let time = timerJoin(redenvelopes_used[i].time)
      if (time == today) {
         redenvelopes_used_today.push(redenvelopes_used[i])
      }
   }

   const [financial_details] = await connection.query("SELECT * FROM financial_details WHERE phone = ? ", [phone])
   let financial_details_today = []
   for (let i = 0; i < financial_details.length; i++) {
      let today = timerJoin()
      let time = timerJoin(financial_details[i].time)
      if (time == today) {
         financial_details_today.push(financial_details[i])
      }
   }

   return res.status(200).json({
      message: "Success",
      status: true,
      datas: user,
      f1: f1s.length,
      f2: f2,
      f3: f3,
      f4: f4,
      list_mems: list_mems,
      total_recharge: total_recharge,
      total_withdraw: total_withdraw,
      total_recharge_today: total_recharge_today,
      total_withdraw_today: total_withdraw_today,
      list_mem_baned: list_mem_baned.length,
      win: win,
      loss: loss,
      list_recharge_news: list_recharge_news,
      list_withdraw_news: list_withdraw_news,
      moneyCTV: moneyCTV,
      redenvelopes_used: redenvelopes_used_today,
      financial_details_today: financial_details_today,
   })
}

const infoCtv2 = async (req, res) => {
   const phone = req.body.phone
   const timeDate = req.body.timeDate

   function timerJoin(params = "", addHours = 0) {
      let date = ""
      if (params) {
         date = new Date(Number(params))
      } else {
         date = new Date()
      }

      date.setHours(date.getHours() + addHours)

      let years = formateT(date.getFullYear())
      let months = formateT(date.getMonth() + 1)
      let days = formateT(date.getDate())

      let hours = date.getHours() % 12
      hours = hours === 0 ? 12 : hours
      let ampm = date.getHours() < 12 ? "AM" : "PM"

      let minutes = formateT(date.getMinutes())
      let seconds = formateT(date.getSeconds())

      return years + "-" + months + "-" + days + " " + hours + ":" + minutes + ":" + seconds + " " + ampm
   }

   const [user] = await connection.query("SELECT * FROM users WHERE phone = ? ", [phone])

   if (user.length == 0) {
      return res.status(200).json({
         message: "Phone Error",
         status: false,
      })
   }
   let userInfo = user[0]
   const [list_mem] = await connection.query("SELECT * FROM users WHERE ctv = ? AND status = 1 AND veri = 1 ", [phone])

   let list_mems = []
   const [list_mem_today] = await connection.query("SELECT * FROM users WHERE ctv = ? AND status = 1 AND veri = 1 ", [phone])
   for (let i = 0; i < list_mem_today.length; i++) {
      let today = timeDate
      let time = timerJoin(list_mem_today[i].time)
      if (time == today) {
         list_mems.push(list_mem_today[i])
      }
   }

   let list_recharge_news = []
   let list_withdraw_news = []
   for (let i = 0; i < list_mem.length; i++) {
      let phone = list_mem[i].phone
      const [recharge_today] = await connection.query("SELECT `id`, `status`, `type`,`phone`, `money`, `time` FROM recharge WHERE phone = ? AND status = 1 ", [phone])
      const [withdraw_today] = await connection.query("SELECT `id`, `status`,`phone`, `money`, `time` FROM withdraw WHERE phone = ? AND status = 1 ", [phone])
      for (let i = 0; i < recharge_today.length; i++) {
         let today = timeDate
         let time = timerJoin(recharge_today[i].time)
         if (time == today) {
            list_recharge_news.push(recharge_today[i])
         }
      }
      for (let i = 0; i < withdraw_today.length; i++) {
         let today = timeDate
         let time = timerJoin(withdraw_today[i].time)
         if (time == today) {
            list_withdraw_news.push(withdraw_today[i])
         }
      }
   }

   const [redenvelopes_used] = await connection.query("SELECT * FROM redenvelopes_used WHERE phone = ? ", [phone])
   let redenvelopes_used_today = []
   for (let i = 0; i < redenvelopes_used.length; i++) {
      let today = timeDate
      let time = timerJoin(redenvelopes_used[i].time)
      if (time == today) {
         redenvelopes_used_today.push(redenvelopes_used[i])
      }
   }

   const [financial_details] = await connection.query("SELECT * FROM financial_details WHERE phone = ? ", [phone])
   let financial_details_today = []
   for (let i = 0; i < financial_details.length; i++) {
      let today = timeDate
      let time = timerJoin(financial_details[i].time)
      if (time == today) {
         financial_details_today.push(financial_details[i])
      }
   }

   return res.status(200).json({
      message: "Success",
      status: true,
      datas: user,
      list_mems: list_mems,
      list_recharge_news: list_recharge_news,
      list_withdraw_news: list_withdraw_news,
      redenvelopes_used: redenvelopes_used_today,
      financial_details_today: financial_details_today,
   })
}

const listRechargeMem = async (req, res) => {
   let auth = req.cookies.auth
   let phone = req.params.phone
   let { pageno, limit } = req.body

   if (!pageno || !limit) {
      return res.status(200).json({
         code: 0,
         msg: "No more data",
         data: {
            gameslist: [],
         },
         status: false,
      })
   }

   if (pageno < 0 || limit < 0) {
      return res.status(200).json({
         code: 0,
         msg: "No more data",
         data: {
            gameslist: [],
         },
         status: false,
      })
   }

   if (!phone) {
      return res.status(200).json({
         message: "Failed",
         status: false,
         timeStamp: timeNow,
      })
   }

   const [user] = await connection.query("SELECT * FROM users WHERE phone = ? ", [phone])
   const [auths] = await connection.query("SELECT * FROM users WHERE token = ? ", [auth])

   if (user.length == 0 || auths.length == 0) {
      return res.status(200).json({
         message: "Failed",
         status: false,
         timeStamp: timeNow,
      })
   }
   let { token, password, otp, level, ...userInfo } = user[0]

   const [recharge] = await connection.query(`SELECT * FROM recharge WHERE phone = ? ORDER BY id DESC LIMIT ${pageno}, ${limit} `, [phone])
   const [total_users] = await connection.query(`SELECT * FROM recharge WHERE phone = ?`, [phone])
   return res.status(200).json({
      message: "Success",
      status: true,
      datas: recharge,
      page_total: Math.ceil(total_users.length / limit),
   })
}

const listWithdrawMem = async (req, res) => {
   let auth = req.cookies.auth
   let phone = req.params.phone
   let { pageno, limit } = req.body

   if (!pageno || !limit) {
      return res.status(200).json({
         code: 0,
         msg: "No more data",
         data: {
            gameslist: [],
         },
         status: false,
      })
   }

   if (pageno < 0 || limit < 0) {
      return res.status(200).json({
         code: 0,
         msg: "No more data",
         data: {
            gameslist: [],
         },
         status: false,
      })
   }

   if (!phone) {
      return res.status(200).json({
         message: "Failed",
         status: false,
         timeStamp: timeNow,
      })
   }

   const [user] = await connection.query("SELECT * FROM users WHERE phone = ? ", [phone])
   const [auths] = await connection.query("SELECT * FROM users WHERE token = ? ", [auth])

   if (user.length == 0 || auths.length == 0) {
      return res.status(200).json({
         message: "Failed",
         status: false,
         timeStamp: timeNow,
      })
   }
   let { token, password, otp, level, ...userInfo } = user[0]

   const [withdraw] = await connection.query(`SELECT * FROM withdraw WHERE phone = ? ORDER BY id DESC LIMIT ${pageno}, ${limit} `, [phone])
   const [total_users] = await connection.query(`SELECT * FROM withdraw WHERE phone = ?`, [phone])
   return res.status(200).json({
      message: "Success",
      status: true,
      datas: withdraw,
      page_total: Math.ceil(total_users.length / limit),
   })
}

const listRedenvelope = async (req, res) => {
   let auth = req.cookies.auth
   let phone = req.params.phone
   let { pageno, limit } = req.body

   if (!pageno || !limit) {
      return res.status(200).json({
         code: 0,
         msg: "No more data",
         data: {
            gameslist: [],
         },
         status: false,
      })
   }

   if (pageno < 0 || limit < 0) {
      return res.status(200).json({
         code: 0,
         msg: "No more data",
         data: {
            gameslist: [],
         },
         status: false,
      })
   }

   if (!phone) {
      return res.status(200).json({
         message: "Failed",
         status: false,
         timeStamp: timeNow,
      })
   }

   const [user] = await connection.query("SELECT * FROM users WHERE phone = ? ", [phone])
   const [auths] = await connection.query("SELECT * FROM users WHERE token = ? ", [auth])

   if (user.length == 0 || auths.length == 0) {
      return res.status(200).json({
         message: "Failed",
         status: false,
         timeStamp: timeNow,
      })
   }
   let { token, password, otp, level, ...userInfo } = user[0]

   const [redenvelopes_used] = await connection.query(`SELECT * FROM redenvelopes_used WHERE phone_used = ? ORDER BY id DESC LIMIT ${pageno}, ${limit} `, [phone])
   const [total_users] = await connection.query(`SELECT * FROM redenvelopes_used WHERE phone_used = ?`, [phone])
   return res.status(200).json({
      message: "Success",
      status: true,
      datas: redenvelopes_used,
      page_total: Math.ceil(total_users.length / limit),
   })
}
// Level Setting get

const getLevelInfo = async (req, res) => {
   const [rows] = await connection.query("SELECT * FROM `level`")

   if (!rows) {
      return res.status(200).json({
         message: "Failed",
         status: false,
      })
   }
   console.log("asdasdasd : " + rows)
   return res.status(200).json({
      message: "Success",
      status: true,
      data: {},
      rows: rows,
   })

   // const [recharge] = await connection.query('SELECT * FROM recharge WHERE `phone` = ? AND status = 1', [rows[0].phone]);
   // let totalRecharge = 0;
   // recharge.forEach((data) => {
   //     totalRecharge += data.money;
   // });
   // const [withdraw] = await connection.query('SELECT * FROM withdraw WHERE `phone` = ? AND status = 1', [rows[0].phone]);
   // let totalWithdraw = 0;
   // withdraw.forEach((data) => {
   //     totalWithdraw += data.money;
   // });

   // const { id, password, ip, veri, ip_address, status, time, token, ...others } = rows[0];
   // return res.status(200).json({
   //     message: 'Success',
   //     status: true,
   //     data: {
   //         code: others.code,
   //         id_user: others.id_user,
   //         name_user: others.name_user,
   //         phone_user: others.phone,
   //         money_user: others.money,
   //     },
   //     totalRecharge: totalRecharge,
   //     totalWithdraw: totalWithdraw,
   //     timeStamp: timeNow,
   // });
}

const listBet = async (req, res) => {
   let auth = req.cookies.auth
   let phone = req.params.phone
   let { pageno, limit } = req.body

   if (!pageno || !limit) {
      return res.status(200).json({
         code: 0,
         msg: "No more data",
         data: {
            gameslist: [],
         },
         status: false,
      })
   }

   if (pageno < 0 || limit < 0) {
      return res.status(200).json({
         code: 0,
         msg: "No more data",
         data: {
            gameslist: [],
         },
         status: false,
      })
   }

   if (!phone) {
      return res.status(200).json({
         message: "Failed",
         status: false,
         timeStamp: timeNow,
      })
   }

   const [user] = await connection.query("SELECT * FROM users WHERE phone = ? ", [phone])
   const [auths] = await connection.query("SELECT * FROM users WHERE token = ? ", [auth])

   if (user.length == 0 || auths.length == 0) {
      return res.status(200).json({
         message: "Failed",
         status: false,
         timeStamp: timeNow,
      })
   }
   let { token, password, otp, level, ...userInfo } = user[0]

   const [listBet] = await connection.query(`SELECT * FROM minutes_1 WHERE phone = ? AND status != 0 ORDER BY id DESC LIMIT ${pageno}, ${limit} `, [phone])
   const [total_users] = await connection.query(`SELECT * FROM minutes_1 WHERE phone = ? AND status != 0`, [phone])
   return res.status(200).json({
      message: "Success",
      status: true,
      datas: listBet,
      page_total: Math.ceil(total_users.length / limit),
   })
}


const listBetAviator = async (req, res) => {
   let auth = req.cookies.auth
   let phone = req.params.phone
   let { pageno, limit } = req.body

   if (!pageno || !limit) {
      return res.status(200).json({
         code: 0,
         msg: "No more data",
         data: {
            gameslist: [],
         },
         status: false,
      })
   }

   if (pageno < 0 || limit < 0) {
      return res.status(200).json({
         code: 0,
         msg: "No more data",
         data: {
            gameslist: [],
         },
         status: false,
      })
   }

   if (!phone) {
      return res.status(200).json({
         message: "Failed",
         status: false,
         timeStamp: timeNow,
      })
   }

   const [user] = await connection.query("SELECT * FROM users WHERE phone = ? ", [phone])
   const [auths] = await connection.query("SELECT * FROM users WHERE token = ? ", [auth])

   if (user.length == 0 || auths.length == 0) {
      return res.status(200).json({
         message: "Failed",
         status: false,
         timeStamp: timeNow,
      })
   }
   let { token, password, otp, level, ...userInfo } = user[0]

   // const [listBet] = await connection.query(`SELECT * FROM aviator_result WHERE phone = ? AND status != 0 ORDER BY id DESC LIMIT ${pageno}, ${limit} `, [phone])
   const [listBet] = await connection.execute(
      `SELECT ar.*, 
              ar.status AS ar_status,  -- Ensure status is taken from aviator_result
              DATE_FORMAT(ar.time, '%Y-%m-%d %H:%i:%s') AS formatted_time,
              a.result
       FROM aviator_result ar
       JOIN aviator a ON ar.period = a.id
       WHERE ar.phone = ?
       ORDER BY ar.period DESC
       LIMIT ?, ?`,  // Reverse order by period
      [phone, pageno, limit]
    );
    
    
   const [total_users] = await connection.query(`SELECT * FROM aviator_result WHERE phone = ? AND status != 0`, [phone])
   return res.status(200).json({
      message: "Success",
      status: true,
      datas: listBet,
      page_total: Math.ceil(total_users.length / limit),
   })
}


const listOrderOld = async (req, res) => {
   let { gameJoin } = req.body

   let checkGame = ["1", "3", "5", "10"].includes(String(gameJoin))
   if (!checkGame) {
      return res.status(200).json({
         code: 0,
         msg: "No more data",
         data: {
            gameslist: [],
         },
         status: false,
      })
   }
   let game = Number(gameJoin)

   let join = ""
   if (game == 1) join = "k5d"
   if (game == 3) join = "k5d3"
   if (game == 5) join = "k5d5"
   if (game == 10) join = "k5d10"

   const [k5d] = await connection.query(`SELECT * FROM 5d WHERE status != 0 AND game = '${game}' ORDER BY id DESC LIMIT 10 `)
   const [period] = await connection.query(`SELECT period FROM 5d WHERE status = 0 AND game = '${game}' ORDER BY id DESC LIMIT 1 `)
   const [waiting] = await connection.query(`SELECT phone, money, price, amount, bet FROM result_5d WHERE status = 0 AND level = 0 AND game = '${game}' ORDER BY id ASC `)
   const [settings] = await connection.query(`SELECT ${join} FROM admin`)
   if (k5d.length == 0) {
      return res.status(200).json({
         code: 0,
         msg: "No more data",
         data: {
            gameslist: [],
         },
         status: false,
      })
   }
   if (!k5d[0] || !period[0]) {
      return res.status(200).json({
         message: "Error!",
         status: false,
      })
   }
   return res.status(200).json({
      code: 0,
      msg: "Get success",
      data: {
         gameslist: k5d,
      },
      bet: waiting,
      settings: settings,
      join: join,
      period: period[0].period,
      status: true,
   })
}

const listOrderOldK3 = async (req, res) => {
   let { gameJoin } = req.body

   let checkGame = ["1", "3", "5", "10"].includes(String(gameJoin))
   if (!checkGame) {
      return res.status(200).json({
         code: 0,
         msg: "No more data",
         data: {
            gameslist: [],
         },
         status: false,
      })
   }
   let game = Number(gameJoin)

   let join = ""
   if (game == 1) join = "k3d"
   if (game == 3) join = "k3d3"
   if (game == 5) join = "k3d5"
   if (game == 10) join = "k3d10"

   const [k5d] = await connection.query(`SELECT * FROM k3 WHERE status != 0 AND game = '${game}' ORDER BY id DESC LIMIT 10 `)
   const [period] = await connection.query(`SELECT period FROM k3 WHERE status = 0 AND game = '${game}' ORDER BY id DESC LIMIT 1 `)
   const [waiting] = await connection.query(`SELECT phone, money, price, typeGame, amount, bet FROM result_k3 WHERE status = 0 AND level = 0 AND game = '${game}' ORDER BY id ASC `)
   const [settings] = await connection.query(`SELECT ${join} FROM admin`)
   if (k5d.length == 0) {
      return res.status(200).json({
         code: 0,
         msg: "No more data",
         data: {
            gameslist: [],
         },
         status: false,
      })
   }
   if (!k5d[0] || !period[0]) {
      return res.status(200).json({
         message: "Error!",
         status: false,
      })
   }
   return res.status(200).json({
      code: 0,
      msg: "Get Success",
      data: {
         gameslist: k5d,
      },
      bet: waiting,
      settings: settings,
      join: join,
      period: period[0].period,
      status: true,
   })
}

const editResult = async (req, res) => {
   let { game, list } = req.body

   if (!list || !game) {
      return res.status(200).json({
         message: "ERROR!!!",
         status: false,
      })
   }

   let join = ""
   if (game == 1) join = "k5d"
   if (game == 3) join = "k5d3"
   if (game == 5) join = "k5d5"
   if (game == 10) join = "k5d10"

   const sql = `UPDATE admin SET ${join} = ?`
   await connection.execute(sql, [list])
   return res.status(200).json({
      message: "Editing is successful", //Register Sucess
      status: true,
   })
}

const editResult2 = async (req, res) => {
   let { game, list } = req.body

   if (!list || !game) {
      return res.status(200).json({
         message: "ERROR!!!",
         status: false,
      })
   }

   let join = ""
   if (game == 1) join = "k3d"
   if (game == 3) join = "k3d3"
   if (game == 5) join = "k3d5"
   if (game == 10) join = "k3d10"

   const sql = `UPDATE admin SET ${join} = ?`
   await connection.execute(sql, [list])
   return res.status(200).json({
      message: "Editing is successful", //Register Sucess
      status: true,
   })
}

const CreatedSalary = async (req, res) => {
   try {
      const phone = req.body.phone
      const amount = req.body.amount
      const type = req.body.type
      const now = new Date()
      const formattedTime = now.toLocaleString("en-US", {
         year: "numeric",
         month: "2-digit",
         day: "2-digit",
         hour: "2-digit",
         minute: "2-digit",
         second: "2-digit",
         hour12: true,
      })

      // Check if the phone number is a 10-digit number
      if (!/^\d{10}$/.test(phone)) {
         return res.status(400).json({
            message: "ERROR!!! Invalid phone number. Please provide a 10-digit phone number.",
            status: false,
         })
      }

      // Check if user with the given phone number exists
      const checkUserQuery = "SELECT * FROM `users` WHERE phone = ?"
      const [existingUser] = await connection.execute(checkUserQuery, [phone])

      if (existingUser.length === 0) {
         // If user doesn't exist, return an error
         return res.status(400).json({
            message: "ERROR!!! User with the provided phone number does not exist.",
            status: false,
         })
      }

      // If user exists, update the 'users' table
      const updateUserQuery = "UPDATE `users` SET `money` = `money` + ? WHERE phone = ?"
      await connection.execute(updateUserQuery, [amount, phone])

      // Insert record into 'salary' table
      const insertSalaryQuery = "INSERT INTO salary (phone, amount, type, time) VALUES (?, ?, ?, ?)"
      await connection.execute(insertSalaryQuery, [phone, amount, type, formattedTime])

      res.status(200).json({ message: "Salary record created successfully" })
   } catch (error) {
      console.error(error)
      res.status(500).json({ error: "Internal server error" })
   }
}

const getSalary = async (req, res) => {
   const [rows] = await connection.query(`SELECT * FROM salary ORDER BY time DESC`)

   if (!rows) {
      return res.status(200).json({
         message: "Failed",
         status: false,
      })
   }
   console.log("asdasdasd : " + rows)
   return res.status(200).json({
      message: "Success",
      status: true,
      data: {},
      rows: rows,
   })
}

const getWingoBatingAmountOfOptions = async (req, res) => {
   try {
      let gameTime = parseInt(req.query.gameTime)

      if ([1, 3, 5, 10].indexOf(gameTime) == -1) {
         return res.status(400).json({
            message: "Invalid game time",
            status: false,
         })
      }

      let gameName

      if (gameTime == 1) gameName = "wingo"
      if (gameTime == 3) gameName = "wingo3"
      if (gameTime == 5) gameName = "wingo5"
      if (gameTime == 10) gameName = "wingo10"

      const betForNumbersOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]
      const betForColorsOptions = [
         {
            label: "red",
            value: "d",
         },
         {
            label: "voilet",
            value: "t",
         },
         {
            label: "green",
            value: "x",
         },
      ]
      const betForBigSmallOptions = [
         {
            label: "big",
            value: "l",
         },
         {
            label: "small",
            value: "n",
         },
      ]

      let amountByNumberList = []
      let amountByColorsList = []
      let amountByBigSmallList = []

      for (const bet of betForNumbersOptions) {
         const [result] = await connection.query(`SELECT SUM(money) AS totalMoney FROM minutes_1 WHERE bet = '${bet}' AND game = '${gameName}' AND status = 0`)
         const totalMoney = result[0].totalMoney
         amountByNumberList.push({ bet: bet, totalMoney: totalMoney || 0 })
      }

      for (const bet of betForColorsOptions) {
         const [result] = await connection.query(`SELECT SUM(money) AS totalMoney FROM minutes_1 WHERE bet = '${bet.value}' AND game = '${gameName}' AND status = 0`)
         const totalMoney = result[0].totalMoney
         amountByColorsList.push({ bet: bet.label, totalMoney: totalMoney || 0 })
      }

      for (const bet of betForBigSmallOptions) {
         const [result] = await connection.query(`SELECT SUM(money) AS totalMoney FROM minutes_1 WHERE bet = '${bet.value}' AND game = '${gameName}' AND status = 0`)
         const totalMoney = result[0].totalMoney
         amountByBigSmallList.push({ bet: bet.label, totalMoney: totalMoney || 0 })
      }

      return res.status(200).json({
         message: "Success",
         status: true,
         data: {
            amountByNumberList: amountByNumberList,
            amountByColorsList: amountByColorsList,
            amountByBigSmallList: amountByBigSmallList,
         },
      })
   } catch (error) {
      console.log(error)
      return res.status(500).json({
         message: "Internal server error",
         status: false,
      })
   }
}

const getK3BatingAmountOfOptions = async (req, res) => {
   try {
      let gameTime = parseInt(req.query.gameTime)

      if ([1, 3, 5, 10].indexOf(gameTime) == -1) {
         return res.status(400).json({
            message: "Invalid game time",
            status: false,
         })
      }

      let gameName

      if (gameTime == 1) gameName = "1"
      if (gameTime == 3) gameName = "3"
      if (gameTime == 5) gameName = "5"
      if (gameTime == 10) gameName = "10"

      const betForNumbersOptions = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
      const betForGroupOptions = [
         {
            label: "big",
            value: "b",
         },
         {
            label: "small",
            value: "s",
         },
         {
            label: "odd",
            value: "l",
         },
         {
            label: "even",
            value: "c",
         },
      ]
      const betFor2SameOptions = [
         {
            label: "11",
            value: "11",
         },
         {
            label: "22",
            value: "22",
         },
         {
            label: "33",
            value: "33",
         },
         {
            label: "44",
            value: "44",
         },
         {
            label: "55",
            value: "55",
         },
         {
            label: "66",
            value: "66",
         },
      ]
      const betFor3SameOptions = [
         {
            label: "111",
            value: "111",
         },
         {
            label: "222",
            value: "222",
         },
         {
            label: "333",
            value: "333",
         },
         {
            label: "444",
            value: "444",
         },
         {
            label: "555",
            value: "555",
         },
         {
            label: "666",
            value: "666",
         },
      ]

      let amountByNumberTotalList = []
      let amountByGroupTotalList = []
      let amountBy2SameList = []
      let amountBy3SameList = []

      for (const bet of betForNumbersOptions) {
         const [result] = await connection.query(`SELECT SUM(money) AS totalMoney FROM result_k3 WHERE bet LIKE '%${bet}%' AND game = '${gameName}' AND status = 0 AND typeGame = 'total'`)
         const totalMoney = result[0].totalMoney
         amountByNumberTotalList.push({ bet: bet, totalMoney: totalMoney || 0 })
      }

      for (const bet of betForGroupOptions) {
         const [result] = await connection.query(`SELECT SUM(money) AS totalMoney FROM result_k3 WHERE bet LIKE '%${bet.value}%' AND game = '${gameName}' AND status = 0 AND typeGame = 'total'`)
         const totalMoney = result[0].totalMoney
         amountByGroupTotalList.push({ bet: bet.label, totalMoney: totalMoney || 0 })
      }

      for (const bet of betFor2SameOptions) {
         const [result] = await connection.query(`SELECT SUM(money) AS totalMoney FROM result_k3 WHERE bet LIKE '%${bet.value}%' AND game = '${gameName}' AND status = 0 AND typeGame = 'two-same'`)
         const totalMoney = result[0].totalMoney
         amountBy2SameList.push({ bet: bet.label, totalMoney: totalMoney || 0 })
      }

      for (const bet of betFor3SameOptions) {
         const [result] = await connection.query(`SELECT SUM(money) AS totalMoney FROM result_k3 WHERE bet LIKE '%${bet.value}%' AND game = '${gameName}' AND status = 0 AND typeGame = 'three-same'`)
         const totalMoney = result[0].totalMoney
         amountBy3SameList.push({ bet: bet.label, totalMoney: totalMoney || 0 })
      }

      return res.status(200).json({
         message: "Success",
         status: true,
         data: {
            amountByNumberTotalList: amountByNumberTotalList,
            amountByGroupTotalList: amountByGroupTotalList,
            amountBy2SameList: amountBy2SameList,
            amountBy3SameList: amountBy3SameList,
         },
      })
   } catch (error) {
      console.log(error)
      return res.status(500).json({
         message: "Internal server error",
         status: false,
      })
   }
}

const get5dBatingAmountOfOptions = async (req, res) => {
   try {
      let gameTime = parseInt(req.query.gameTime)

      if ([1, 3, 5, 10].indexOf(gameTime) == -1) {
         return res.status(400).json({
            message: "Invalid game time",
            status: false,
         })
      }

      let gameName

      if (gameTime == 1) gameName = "1"
      if (gameTime == 3) gameName = "3"
      if (gameTime == 5) gameName = "5"
      if (gameTime == 10) gameName = "10"

      const counterPositionList = ["a", "b", "c", "d", "e"]
      const posibleNumberList = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
      const posibleNumberTypeList = [
         {
            label: "big",
            value: "b",
         },
         {
            label: "small",
            value: "s",
         },
         {
            label: "odd",
            value: "l",
         },
         {
            label: "even",
            value: "c",
         },
      ]

      let data = []

      for (const position of counterPositionList) {
         for (const posibleNumber of posibleNumberList) {
            const [result] = await connection.query(`SELECT SUM(money) AS totalMoney FROM result_5d WHERE bet LIKE '%${posibleNumber}%' AND game = '${gameName}' AND status = 0 AND join_bet = '${position}'`)
            const totalMoney = result[0].totalMoney
            data.push({ position: position, bet: posibleNumber, totalMoney: totalMoney || 0 })
         }
         for (const posibleNumberType of posibleNumberTypeList) {
            const [result] = await connection.query(`SELECT SUM(money) AS totalMoney FROM result_5d WHERE bet = '${posibleNumberType.value}' AND game = '${gameName}' AND status = 0 AND join_bet = '${position}'`)
            const totalMoney = result[0].totalMoney
            data.push({ position: position, bet: posibleNumberType.label, totalMoney: totalMoney || 0 })
         }
      }

      for (const posibleNumberType of posibleNumberTypeList) {
         const [result] = await connection.query(`SELECT SUM(money) AS totalMoney FROM result_5d WHERE bet = '${posibleNumberType.value}' AND game = '${gameName}' AND status = 0 AND join_bet = 'total'`)
         const totalMoney = result[0].totalMoney
         data.push({ position: "total", bet: posibleNumberType.label, totalMoney: totalMoney || 0 })
      }

      return res.status(200).json({
         message: "Success",
         status: true,
         data: data,
      })
   } catch (error) {
      console.log(error)
      return res.status(500).json({
         message: "Internal server error",
         status: false,
      })
   }
}

const addNotification = async (req,res)=>{
   const {title,message} = req.body;

   if(!title || !message){
      return res.status(200).json({
         message: "Please Enter Valid Data",
         status: false,
      }) 
   }

   try {
      await connection.execute('INSERT INTO notification SET title = ?,message = ?',[title,message]);
      return res.status(200).json({
         message: "Success",
         status: true,
      }) 
   } catch (error) {
      return res.status(200).json({
         message: "Error!",
         status: false,
      }) 
   }
}

const getPool = async (req,res)=>{
   const [pool] = await connection.execute('select total_pool from admin');
   return res.status(200).json({
      message: "Success",
      status: true,
      data:pool[0].total_pool
   }) 

}

const updatePool = async (req,res)=>{
   const {amount} = req.body;
   if(!amount){
      return res.status(200).json({
         message: "Error!",
         status: false,
      }) 
   }

   try {
      await connection.execute('update admin set total_pool = ?',[parseFloat(amount)]);
      const [pool] = await connection.execute('select total_pool from admin');
      return res.status(200).json({
         message: "Success",
         status: true,
         data:pool[0].total_pool
      }) 

   } catch (error) {
      return res.status(200).json({
         message: "Error!",
         status: false,
      }) 
   }
  
}

const increaseWallet = async (req,res)=>{
   const {amount,phone} = req.body;

   if(!amount || !phone){
      return res.status(200).json({
         message: "Please Enter Details!",
         status: false,
      }) 
   }

   const [user] = await connection.execute('select * from users where phone = ?',[phone]);

   if(!user[0] || !user){
      return res.status(200).json({
         message: "Incorrect phone number",
         status: false,
      }) 
   }
try {
   await connection.execute('update users set money = money + ? where phone = ?',[amount,phone]);
   return res.status(200).json({
      message: "Success",
      status: true,
   }) 
} catch (error) {
   return res.status(200).json({
      message: "Incorrect phone number",
      status: false,
   }) 
}
}

const adminPageAviator = async (req,res)=>{
   return res.render('manage/aviator.ejs')
}

const aviatorResult =  async (req,res)=>{
   const {value} = req.body;
   const floatValue = parseFloat(value);

   if (isNaN(floatValue) || !isFinite(floatValue)) {
      return res.json({ error: "Invalid number value",status:false});
  }

  await connection.execute('UPDATE admin SET aviator = ?',[floatValue]);

  return res.json({status:true,message:'SUCCESS'});

}

const bulkSmsPage = async (req,res)=>{
   return res.render('manage/bulkMsg.ejs');
}

const filteredUser = async (req,res)=>{
   let {recharge,start,end} = req.body;
   console.log(recharge,start,end,'data before');

   if(!start){
      start = null;
   }
   else{
   start = new Date(start).getTime();
   }

   if(!end){
      end = null;
   }
   else{
      end = new Date(end).getTime();
   }

   recharge = recharge && !isNaN(Number(recharge)) ? Number(recharge) : null;
console.log(recharge,start,end,'data')

// Build query with parameter placeholders
let query = `SELECT * FROM users WHERE 1=1`;
let queryParams = [];

// Add the recharge filter if recharge is provided (and is a valid number)
if (recharge !== null) {
    query += ` AND total_money <= ?`;
    queryParams.push(recharge);
}

// Add the time range filters based on start and end
if (start && end) {
    query += ` AND time BETWEEN ? AND ?`;
    queryParams.push(start, end);
} else if (start) {
    query += ` AND time >= ?`;
    queryParams.push(start);
} else if (end) {
    query += ` AND time <= ?`;
    queryParams.push(end);
}

console.log(query,queryParams,'hello')

try {
   const [users] = await connection.execute(query,queryParams);
   return res.json({status:true,data:users});
} catch (error) {
   console.error(error);
   return res.json({status:false,message:'Invalid Data'});
}

}

module.exports = {
   adminPage,
   adminPage3,
   adminPage5,
   adminPage10,
   totalJoin,
   middlewareAdminController,
   changeAdmin,
   membersPage,
   listMember,
   infoMember,
   userInfo,
   statistical,
   statistical2,
   rechargePage,
   recharge,
   rechargeDuyet,
   rechargeRecord,
   withdrawRecord,
   withdraw,
   levelSetting,
   handlWithdraw,
   settings,
   editResult2,
   settingBank,
   settingGet,
   settingCskh,
   settingbuff,
   register,
   ctvPage,
   listCTV,
   profileUser,
   ctvProfilePage,
   infoCtv,
   infoCtv2,
   giftPage,
   createBonus,
   listRedenvelops,
   banned,
   listRechargeMem,
   listWithdrawMem,
   getLevelInfo,
   listRedenvelope,
   listBet,
   adminPage5d,
   listOrderOld,
   listOrderOldK3,
   editResult,
   adminPageK3,
   updateLevel,
   CreatedSalaryRecord,
   CreatedSalary,
   getSalary,
   getWingoBatingAmountOfOptions,
   getK3BatingAmountOfOptions,
   get5dBatingAmountOfOptions,
   addNotification,
   getPool,
   updatePool,
   increaseWallet,
   listBetAviator,
   adminPageAviator,
   aviatorResult,
   bulkSmsPage,
   filteredUser,
   registerPartner,
   apporvalAll
}
