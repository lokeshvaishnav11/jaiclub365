const connection= require("../config/connectDB")
const jwt= require("jsonwebtoken")
const md5 = require("md5")
require("dotenv").config()

let timeNow = Date.now()


const middlewarePartnerController = async (req, res, next) => {
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
          if (rows[0].level == 3) {
            res.locals.level = 3;
             next()
          } else {
             return res.redirect("/home")
          }
       } else {
          return res.redirect("/login")
       }
    } catch (error) {
       return res.redirect("/login")
    }
 }