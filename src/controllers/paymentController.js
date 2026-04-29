const connection = require("../config/connectDB");
const axios = require('axios');
const moment = require("moment");
const crypto = require("crypto");
const querystring = require("querystring")
const dayjs = require("dayjs");
const qs = require("qs");

let timeNow = Date.now();

const PaymentStatusMap = {
    PENDING: 0,
    SUCCESS: 1,
    CANCELLED: 2
}

const PaymentMethodsMap = {
    UPI_GATEWAY: "upi_gateway",
    UPI_MANUAL: "upi_manual",
    USDT_MANUAL: "usdt_manual",
    WOW_PAY: "wow_pay",
    USDT: "usdt",
}

const initiateManualUPIPayment = async (req, res) => {
    const query = req.query

    const [bank_recharge_momo] = await connection.query("SELECT * FROM bank_recharge WHERE type = 'momo'");

    let bank_recharge_momo_data
    if (bank_recharge_momo.length) {
        bank_recharge_momo_data = bank_recharge_momo[0]
    }

    const momo = {
        bank_name: bank_recharge_momo_data?.name_bank || "",
        username: bank_recharge_momo_data?.name_user || "",
        upi_id: bank_recharge_momo_data?.stk || "",
        usdt_wallet_address: bank_recharge_momo_data?.qr_code_image || "",
    }

    return res.render("wallet/manual_payment.ejs", {
        Amount: query?.am,
        extra: query?.extra,
        ekyc: query?.ekyc,
        UpiId: momo.upi_id,
    });
}

const initiateManualUSDTPayment = async (req, res) => {
    const query = req.query

    const [bank_recharge_momo] = await connection.query("SELECT * FROM bank_recharge WHERE type = 'momo'");

    let bank_recharge_momo_data
    if (bank_recharge_momo.length) {
        bank_recharge_momo_data = bank_recharge_momo[0]
    }

    const momo = {
        bank_name: bank_recharge_momo_data?.name_bank || "",
        username: bank_recharge_momo_data?.name_user || "",
        upi_id: bank_recharge_momo_data?.stk || "",
        usdt_wallet_address: bank_recharge_momo_data?.qr_code_image || "",
    }

    return res.render("wallet/usdt_manual_payment.ejs", {
        Amount: query?.am,
        UsdtWalletAddress: momo.usdt_wallet_address,
    });
}


// this for automatic upi paymennts functions 
function md5_sign(data, key) {
    const sortedKeys = Object.keys(data).sort();
    const queryString = sortedKeys.map(k => `${k}=${data[k]}`).join('&');
    const stringToSign = `${queryString}&key=${key}`;
    const md5 = crypto.createHash('md5').update(stringToSign.trim(), 'utf8').digest('hex');
    return md5.toUpperCase();
}

// HTTP POST function
async function http_post(url, data = {}) {
    try {
        const response = await axios.post(url, querystring.stringify(data), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 120000
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            return `http code from server is not 200`;
        } else {
            return `HTTP POST error: ${error.message}`;
        }
    }
}
const getRechargeOrderId = () => {
    const date = new Date();
    let id_time = date.getUTCFullYear() + '' + date.getUTCMonth() + 1 + '' + date.getUTCDate();
    let id_order = Math.floor(Math.random() * (99999999999999 - 10000000000000 + 1)) + 10000000000000;

    return id_time + id_order
}

const addManualUPIPaymentRequest = async (req, res) => {
    try {
        const data = req.body
        let auth = req.cookies.auth;
        let moneyp = parseInt(data.money);
        console.log("ip", req.ip)
        // let utr = parseInt(data.utr);
        const minimumMoneyAllowed = parseInt(process.env.MINIMUM_MONEY)

        if (!moneyp || !(moneyp >= minimumMoneyAllowed)) {
            return res.status(400).json({
                message: `Money is Required and it should be ₹${minimumMoneyAllowed} or above!`,
                status: false,
                timeStamp: timeNow,
            })
        }

        // if (!utr && utr?.length != 12) {
        //     return res.status(400).json({
        //         message: `UPI Ref No. or UTR is Required And it should be 12 digit long`,
        //         status: false,
        //         timeStamp: timeNow,
        //     })
        // }

        const user = await getUserDataByAuthToken(auth)

        console.log("user", user)

        const phone = user.phone;

        // recharge table se sirf count
        const [result] = await connection.query(
            `SELECT COUNT(*) AS total
   FROM recharge
   WHERE phone = ?
     AND status = 1`,
            [phone]
        );

        const totalRechargeCount = result[0]?.total || 0;

        console.log("totalRechargeCount", totalRechargeCount)

        const pendingRechargeList = await rechargeTable.getRecordByPhoneAndStatus({ phone: user.phone, status: PaymentStatusMap.PENDING, type: PaymentMethodsMap.UPI_GATEWAY })

        if (pendingRechargeList.length !== 0) {
            const deleteRechargeQueries = pendingRechargeList.map(recharge => {
                return rechargeTable.cancelById(recharge.id)
            });

            await Promise.all(deleteRechargeQueries)
        }

        var orderId = getRechargeOrderId()


        const url = 'https://www.lg-pay.com/api/order/create';
        const key = 'VN8NHNnda0Rn72UqeIvTwhQuEV2yXVcn';
        // const key = 'O2UyHC65eofVs2xsGCjDzY2qVbybifea';

        const app_id = "YD4569"
        // 'YD4555';
        //

        const addon1 = user.username + "#" + user.phone + "#" + user.username + "@gmail.com" + "#" + totalRechargeCount;
        console.log(addon1)
        const params = {
            app_id,
            trade_type: 'INRUPI',      //INRUPI         // test channel for collection
            order_sn: orderId,  // unique order number
            money: moneyp * 100,                // order amount
            notify_url: 'https://1xbet99.vip/callback', // your callback URL
            return_url: 'https://1xbet99.vip/home', // user redirect URL
            subject: 'Test Order',
            user_id: addon1,
            ip: req.ip        // order description
        };

        const sign = md5_sign(params, key);
        const payload = { ...params, sign };

        const lgres = await http_post(url, payload);
        console.log('LG-Pay Response:', lgres);
        if (lgres.status == 1) {
            const newRecharge = {
                orderId: orderId,
                transactionId: 'NULL',
                utr: "23456",
                phone: user.phone,
                money: moneyp,
                type: PaymentMethodsMap.UPI_MANUAL,
                status: 0,
                today: rechargeTable.getCurrentTimeForTodayField(),
                url: "NULL",
                time: timeNow,
            }




            const recharge = await rechargeTable.create(newRecharge)

            return res.status(200).json({
                message: 'Payment Requested successfully Your Balance will update shortly!',
                url: lgres?.data.pay_url,
                recharge: recharge,
                status: true,
                timeStamp: timeNow,
            });

        } else {
            return res.status(200).json({
                message: 'some problem in payment Gatway , Please try Again !s',
                url: lgres?.data.pay_url,
                recharge: recharge,
                status: false,
                timeStamp: timeNow,
            });
        }




    } catch (error) {
        console.log(error)

        res.status(500).json({
            status: false,
            message: "Something went wrong!",
            timestamp: timeNow
        })
    }
}


const addManualUPIPaymentRequesttwo = async (req, res) => {
  try {
    const data = req.body;
    let auth = req.cookies.auth;
    let moneyp = parseFloat(data.money);
    const minimumMoneyAllowed = parseFloat(process.env.MINIMUM_MONEY);

    if (!moneyp || moneyp < minimumMoneyAllowed) {
      return res.status(400).json({
        message: `Money is Required and it should be ₹${minimumMoneyAllowed} or above!`,
        status: false,
      });
    }

    const user = await getUserDataByAuthToken(auth);

    // Remove old pending recharge
    const pendingRechargeList =
      await rechargeTable.getRecordByPhoneAndStatus({
        phone: user.phone,
        status: PaymentStatusMap.PENDING,
        type: PaymentMethodsMap.UPI_GATEWAY,
      });

    if (pendingRechargeList.length !== 0) {
      await Promise.all(
        pendingRechargeList.map((r) => rechargeTable.cancelById(r.id))
      );
    }

    const orderId = getRechargeOrderId();

    // ==============================
    // WATCHPAYS HARDCODE CONFIG
    // ==============================
    const merchant_id = "100555024";
    const api_key = "3fabaa49e82e82852f579f77b88c85b5";

    const amount = Number(moneyp).toFixed(2);
    const callback_url = "https://1xbet99.vip/watchpays-callback";

    // ==============================
    // SIGNATURE GENERATION
    // ==============================

    const signParams = {
      amount,
      callback_url,
      merchant_id,
      merchant_order_no: orderId,
    };

    const sortedKeys = Object.keys(signParams).sort();

    const signString =
      sortedKeys.map((key) => `${key}=${signParams[key]}`).join("&") +
      `&key=${api_key}`;

    const signature = crypto
      .createHash("md5")
      .update(signString)
      .digest("hex");

    // ==============================
    // REQUEST BODY
    // ==============================

    const payload = {
      merchant_id,
      api_key,
      amount,
      merchant_order_no: orderId,
      callback_url,
      extra: user.username,
      signature,
    };

    const response = await axios.post(
      "https://api.watchpays.com/v1/create",
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    const wpRes = response.data;

    console.log(wpRes,"wpRes")

    if (wpRes.success) {
      const newRecharge = {
                orderId: orderId,
                transactionId: 'NULL',
                utr: "23456",
                phone: user.phone,
                money: moneyp,
                type: PaymentMethodsMap.UPI_MANUAL,
                status: 0,
                today: rechargeTable.getCurrentTimeForTodayField(),
                url: "NULL",
                time: timeNow,
            }

      const recharge = await rechargeTable.create(newRecharge);

      return res.status(200).json({
        message: "Payment link generated successfully!",
        url: wpRes.payment_url,
        recharge,
        status: true,
      });
    } else {
      return res.status(400).json({
        message: wpRes.message || "Payment gateway error",
        status: false,
      });
    }
  } catch (error) {
    console.log("WatchPays Error:", error?.response?.data || error.message);

    return res.status(500).json({
      status: false,
      message: "Something went wrong!",
    });
  }
};

// BondPay Constants
const BONDPAY_URL = "https://api.bond-pays.com/v1/create";
const BONDPAY_MERCHANT_ID = "100888009";
const BONDPAY_API_KEY = "fa4d6ba9feb3d09b427d5b1063669ab9";

// Helper: Generate BondPay MD5 Signature
const generateBondPaySign = (params) => {
    // Concatenate string as per docs: merchant_id + amount + merchant_order_no + api_key + callback_url
    const signStr =
        params.merchant_id +
        params.amount +
        params.merchant_order_no +
        BONDPAY_API_KEY +
        params.callback_url;

    return crypto.createHash("md5").update(signStr).digest("hex"); // ⚠️ Lowercase MD5
};

// Controller: Create BondPay Payment
const addBondPayPaymentRequest = async (req, res) => {
    try {
        const data = req.body;
        const auth = req.cookies.auth;
        const amount = Number(data.money);

        if (!amount || amount < 100) {
            return res.status(400).json({
                status: false,
                message: "Minimum recharge ₹100"
            });
        }

        // ✅ Get user
        const user = await getUserDataByAuthToken(auth);
        if (!user) {
            return res.status(401).json({
                status: false,
                message: "Unauthorized"
            });
        }

        // Cancel old pending orders
        const pendingList = await rechargeTable.getRecordByPhoneAndStatus({
            phone: user.phone,
            status: PaymentStatusMap.PENDING,
            type: PaymentMethodsMap.UPI_GATEWAY
        });

        if (pendingList.length) {
            await Promise.all(pendingList.map(r => rechargeTable.cancelById(r.id)));
        }

        const merchantOrderNo = `ORDER_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

        // Prepare BondPay Request Body
        const requestBody = {
            merchant_id: BONDPAY_MERCHANT_ID,
            api_key: BONDPAY_API_KEY,
            amount: amount.toFixed(2),
            merchant_order_no: merchantOrderNo,
            callback_url: "https://1xbet99.vip/callback/bondpay",
            extra: 0
        };

        // Generate Signature
        requestBody.signature = generateBondPaySign(requestBody);

        // Call BondPay API
        const response = await axios.post(BONDPAY_URL, requestBody, {
            headers: { "Content-Type": "application/json" },
            timeout: 15000
        });

        console.log("BONDPAY RESPONSE =>", response.data);

        if (!response.data.success) {
            return res.status(400).json({
                status: false,
                message: response.data.message || "Gateway error",
                gateway: response.data
            });
        }

        // Save Recharge
        const recharge = await rechargeTable.create({
            orderId: merchantOrderNo,
            phone: user.phone,
            money: amount,
            type: "upi",
            status: PaymentStatusMap.PENDING,
            url: response.data.payment_url,
            today: rechargeTable.getCurrentTimeForTodayField(),
            time: Date.now(),
            utr: "23456",
        });

        return res.json({
            status: true,
            message: "BondPay payment created",
            paymentUrl: response.data.payment_url,
            recharge
        });

    } catch (err) {
        console.error("BondPay Error:", err);
        return res.status(500).json({
            status: false,
            message: "Internal server error"
        });
    }
};

// const addManualUPIPaymentRequest = async (req, res) => {
//     try {
//         const data = req.body
//         let auth = req.cookies.auth;
//         let money = parseInt(data.money);
//         let utr = parseInt(data.utr);
//         const minimumMoneyAllowed = parseInt(process.env.MINIMUM_MONEY)

//         if (!money || !(money >= minimumMoneyAllowed)) {
//             return res.status(400).json({
//                 message: `Money is Required and it should be ₹${minimumMoneyAllowed} or above!`,
//                 status: false,
//                 timeStamp: timeNow,
//             })
//         }

//         if (!utr && utr?.length != 12) {
//             return res.status(400).json({
//                 message: `UPI Ref No. or UTR is Required And it should be 12 digit long`,
//                 status: false,
//                 timeStamp: timeNow,
//             })
//         }

//         const user = await getUserDataByAuthToken(auth)

//         const pendingRechargeList = await rechargeTable.getRecordByPhoneAndStatus({ phone: user.phone, status: PaymentStatusMap.PENDING, type: PaymentMethodsMap.UPI_GATEWAY })

//         if (pendingRechargeList.length !== 0) {
//             const deleteRechargeQueries = pendingRechargeList.map(recharge => {
//                 return rechargeTable.cancelById(recharge.id)
//             });

//             await Promise.all(deleteRechargeQueries)
//         }

//         const orderId = getRechargeOrderId()

//         const newRecharge = {
//             orderId: orderId,
//             transactionId: 'NULL',
//             utr: utr,
//             phone: user.phone,
//             money: money,
//             type: PaymentMethodsMap.UPI_MANUAL,
//             status: 0,
//             today: rechargeTable.getCurrentTimeForTodayField(),
//             url: "NULL",
//             time: timeNow,
//         }

//         const recharge = await rechargeTable.create(newRecharge)

//         return res.status(200).json({
//             message: 'Payment Requested successfully Your Balance will update shortly!',
//             recharge: recharge,
//             status: true,
//             timeStamp: timeNow,
//         });
//     } catch (error) {
//         console.log(error)

//         res.status(500).json({
//             status: false,
//             message: "Something went wrong!",
//             timestamp: timeNow
//         })
//     }
// }

const addManualUSDTPaymentRequest = async (req, res) => {
    try {
        const data = req.body
        let auth = req.cookies.auth;
        let money_usdt = parseInt(data.money);
        let money = money_usdt * 82;
        let utr = parseInt(data.utr);
        const minimumMoneyAllowed = parseInt(process.env.MINIMUM_MONEY)

        if (!money || !(money >= minimumMoneyAllowed)) {
            return res.status(400).json({
                message: `Money is Required and it should be ₹${minimumMoneyAllowed} or ${(minimumMoneyAllowed / 82).toFixed(2)} or above!`,
                status: false,
                timeStamp: timeNow,
            })
        }

        if (!utr) {
            return res.status(400).json({
                message: `Ref No. or UTR is Required`,
                status: false,
                timeStamp: timeNow,
            })
        }

        const user = await getUserDataByAuthToken(auth)

        const pendingRechargeList = await rechargeTable.getRecordByPhoneAndStatus({ phone: user.phone, status: PaymentStatusMap.PENDING, type: PaymentMethodsMap.UPI_GATEWAY })

        if (pendingRechargeList.length !== 0) {
            const deleteRechargeQueries = pendingRechargeList.map(recharge => {
                return rechargeTable.cancelById(recharge.id)
            });

            await Promise.all(deleteRechargeQueries)
        }

        const orderId = getRechargeOrderId()

        const newRecharge = {
            orderId: orderId,
            transactionId: 'NULL',
            utr: utr,
            phone: user.phone,
            money: money,
            type: PaymentMethodsMap.USDT_MANUAL,
            status: 0,
            today: rechargeTable.getCurrentTimeForTodayField(),
            url: "NULL",
            time: timeNow,
        }

        const recharge = await rechargeTable.create(newRecharge)

        return res.status(200).json({
            message: 'Payment Requested successfully Your Balance will update shortly!',
            recharge: recharge,
            status: true,
            timeStamp: timeNow,
        });
    } catch (error) {
        console.log(error)

        res.status(500).json({
            status: false,
            message: "Something went wrong!",
            timestamp: timeNow
        })
    }
}

const initiateUPIPayment = async (req, res) => {
    const type = PaymentMethodsMap.UPI_GATEWAY
    let auth = req.cookies.auth;
    let money = parseInt(req.body.money);

    const minimumMoneyAllowed = parseInt(process.env.MINIMUM_MONEY)

    if (!money || !(money >= minimumMoneyAllowed)) {
        return res.status(400).json({
            message: `Money is Required and it should be ₹${minimumMoneyAllowed} or above!`,
            status: false,
            timeStamp: timeNow,
        })
    }

    try {
        const user = await getUserDataByAuthToken(auth)

        const pendingRechargeList = await rechargeTable.getRecordByPhoneAndStatus({ phone: user.phone, status: PaymentStatusMap.PENDING, type: PaymentMethodsMap.UPI_GATEWAY })

        if (pendingRechargeList.length !== 0) {
            const deleteRechargeQueries = pendingRechargeList.map(recharge => {
                return rechargeTable.cancelById(recharge.id)
            });

            await Promise.all(deleteRechargeQueries)
        }

        const orderId = getRechargeOrderId()

        const ekqrResponse = await axios.post('https://api.ekqr.in/api/create_order', {
            key: process.env.UPI_GATEWAY_PAYMENT_KEY,
            client_txn_id: orderId,
            amount: String(money),
            p_info: process.env.PAYMENT_INFO,
            customer_name: user.username,
            customer_email: process.env.PAYMENT_EMAIL,
            customer_mobile: user.phone,
            redirect_url: `${process.env.APP_BASE_URL}/wallet/verify/upi`,
            udf1: process.env.APP_NAME,
        })

        const ekqrData = ekqrResponse?.data

        if (ekqrData === undefined || ekqrData.status === false) {
            throw Error("Gateway er!#ror from ekqr!")
        }

        const newRecharge = {
            orderId: orderId,
            transactionId: 'NULL',
            utr: null,
            phone: user.phone,
            money: money,
            type: type,
            status: 0,
            today: rechargeTable.getCurrentTimeForTodayField(),
            url: ekqrData.data.payment_url,
            time: timeNow,
        }

        const recharge = await rechargeTable.create(newRecharge)

        console.log(ekqrData)

        return res.status(200).json({
            message: 'Payment Initiated successfully',
            recharge: recharge,
            urls: {
                web_url: ekqrData.data.payment_url,
                bhim_link: ekqrData.data?.upi_intent?.bhim_link || "",
                phonepe_link: ekqrData.data?.upi_intent?.phonepe_link || "",
                paytm_link: ekqrData.data?.upi_intent?.paytm_link || "",
                gpay_link: ekqrData.data?.upi_intent?.gpay_link || "",
            },
            status: true,
            timeStamp: timeNow,
        });
    } catch (error) {
        console.log(error)

        res.status(500).json({
            status: false,
            message: "Something went wrong!",
            timestamp: timeNow
        })
    }
}

const verifyUPIPayment = async (req, res) => {
    const type = PaymentMethodsMap.UPI_GATEWAY
    let auth = req.cookies.auth;
    let orderId = req.query.client_txn_id;

    if (!auth || !orderId) {
        return res.status(400).json({
            message: `orderId is Required!`,
            status: false,
            timeStamp: timeNow,
        })
    }
    try {
        const user = await getUserDataByAuthToken(auth)

        const recharge = await rechargeTable.getRechargeByOrderId({ orderId })

        if (!recharge) {
            return res.status(400).json({
                message: `Unable to find recharge with this order id!`,
                status: false,
                timeStamp: timeNow,
            })
        }

        const ekqrResponse = await axios.post('https://api.ekqr.in/api/check_order_status', {
            key: process.env.UPI_GATEWAY_PAYMENT_KEY,
            client_txn_id: orderId,
            txn_date: rechargeTable.getDMYDateOfTodayFiled(recharge.today),
        });

        const ekqrData = ekqrResponse?.data

        if (ekqrData === undefined || ekqrData.status === false) {
            throw Error("Gateway error from ekqr!")
        }

        if (ekqrData.data.status === "created") {
            return res.status(200).json({
                message: 'Your payment request is just created',
                status: false,
                timeStamp: timeNow,
            });
        }

        if (ekqrData.data.status === "scanning") {
            return res.status(200).json({
                message: 'Waiting for confirmation',
                status: false,
                timeStamp: timeNow,
            });
        }

        if (ekqrData.data.status === 'success') {

            if (recharge.status === PaymentStatusMap.PENDING || recharge.status === PaymentStatusMap.CANCELLED) {

                await rechargeTable.setStatusToSuccessByIdAndOrderId({
                    id: recharge.id,
                    orderId: recharge.orderId
                })

                await addUserAccountBalance({
                    phone: user.phone,
                    money: recharge.money,
                    code: user.code,
                    invite: user.invite,
                })
            }

            // return res.status(200).json({
            //     status: true,
            //     message: "Payment verified",
            //     timestamp: timeNow
            // })
            return res.redirect("/wallet/rechargerecord")
        }

    } catch (error) {
        console.log(error)
        res.status(500).json({
            status: false,
            message: "Something went wrong!",
            timestamp: timeNow
        })
    }
}

const initiateWowPayPayment = async (req, res) => {
    const type = PaymentMethodsMap.WOW_PAY
    let auth = req.cookies.auth;
    let money = parseInt(req.query.money);

    const minimumMoneyAllowed = parseInt(process.env.MINIMUM_MONEY)

    if (!money || !(money >= minimumMoneyAllowed)) {
        return res.status(400).json({
            message: `Money is Required and it should be ₹${minimumMoneyAllowed} or above!`,
            status: false,
            timeStamp: timeNow,
        })
    }

    try {
        const user = await getUserDataByAuthToken(auth)

        const pendingRechargeList = await rechargeTable.getRecordByPhoneAndStatus({ phone: user.phone, status: PaymentStatusMap.PENDING, type: PaymentMethodsMap.UPI_GATEWAY })

        if (pendingRechargeList.length !== 0) {
            const deleteRechargeQueries = pendingRechargeList.map(recharge => {
                return rechargeTable.cancelById(recharge.id)
            });

            await Promise.all(deleteRechargeQueries)
        }

        const orderId = getRechargeOrderId()
        const date = wowpay.getCurrentDate()

        const params = {
            version: '1.0',
            // mch_id: 222887002,
            mch_id: process.env.WOWPAY_MERCHANT_ID,
            mch_order_no: orderId,
            // pay_type: '151',
            pay_type: '151',
            trade_amount: money,
            order_date: date,
            goods_name: user.phone,
            // notify_url: `${process.env.APP_BASE_URL}/wallet/verify/wowpay`,
            notify_url: `https://999club.site/wallet/verify/wowpay`,
            mch_return_msg: user.phone,
            // payment_key: 'TZLMQ1QWJCUSFLH02LAYRZBJ1WK7IHSG',
        };

        params.page_url = 'https://999club.site/wallet/verify/wowpay';

        params.sign = wowpay.generateSign(params, process.env.WOWPAY_MERCHANT_KEY);
        // params.sign = wowpay.generateSign(params, 'TZLMQ1QWJCUSFLH02LAYRZBJ1WK7IHSG');
        // params.sign = wowpay.generateSign(params, 'MZBG89MDIBEDWJOJQYEZVSNP8EEVMSPM');
        params.sign_type = "MD5";


        console.log(params)

        const response = await axios({
            method: "post",
            url: 'https://pay6de1c7.wowpayglb.com/pay/web',
            data: querystring.stringify(params)
        })

        console.log(response.data)

        if (response.data.respCode === "SUCCESS" && response.data.payInfo) {
            return res.status(200).json({
                message: "Payment requested Successfully",
                payment_url: response.data.payInfo,
                status: true,
                timeStamp: timeNow,
            })
        }


        return res.status(400).json({
            message: "Payment request failed. Please try again Or Wrong Details.",
            status: false,
            timeStamp: timeNow,
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            status: false,
            message: "Something went wrong!",
            timestamp: timeNow
        })
    }
}


const verifyWowPayPayment = async (req, res) => {
    try {
        const type = PaymentMethodsMap.WOW_PAY
        let data = req.body;

        if (!req.body) {
            data = req.query;
        }

        console.log(data)

        let merchant_key = process.env.WOWPAY_MERCHANT_KEY;

        const params = {
            mchId: process.env.WOWPAY_MERCHANT_ID,
            amount: data.amount || '',
            mchOrderNo: data.mchOrderNo || '',
            merRetMsg: data.merRetMsg || '',
            orderDate: data.orderDate || '',
            orderNo: data.orderNo || '',
            oriAmount: data.oriAmount || '',
            tradeResult: data.tradeResult || '',
            signType: data.signType || '',
            sign: data.sign || '',
        };

        let signStr = "";
        signStr += "amount=" + params.amount + "&";
        signStr += "mchId=" + params.mchId + "&";
        signStr += "mchOrderNo=" + params.mchOrderNo + "&";
        signStr += "merRetMsg=" + params.merRetMsg + "&";
        signStr += "orderDate=" + params.orderDate + "&";
        signStr += "orderNo=" + params.orderNo + "&";
        signStr += "oriAmount=" + params.oriAmount + "&";
        signStr += "tradeResult=" + params.tradeResult;

        let flag = wowpay.validateSignByKey(signStr, merchant_key, params.sign);

        if (!flag) {
            console.log({
                status: false,
                message: "Something went wrong!",
                flag,
                timestamp: timeNow
            })
            return res.status(400).json({
                status: false,
                message: "Something went wrong!",
                flag,
                timestamp: timeNow
            })
        }

        const newRechargeParams = {
            orderId: params.mchOrderNo,
            transactionId: 'NULL',
            utr: null,
            phone: params.merRetMsg,
            money: params.amount,
            type: type,
            status: PaymentStatusMap.SUCCESS,
            today: rechargeTable.getCurrentTimeForTodayField(),
            url: 'NULL',
            time: timeNow,
        }


        const recharge = await rechargeTable.getRechargeByOrderId({ orderId: newRechargeParams.orderId })

        if (!!recharge) {
            console.log({
                message: `Recharge already verified!`,
                status: true,
                timeStamp: timeNow,
            })
            return res.status(400).json({
                message: `Recharge already verified!`,
                status: true,
                timeStamp: timeNow,
            })
        }

        await rechargeTable.create(newRechargeParams)

        await addUserAccountBalance({
            phone: user.phone,
            money: recharge.money,
            code: user.code,
            invite: user.invite,
        })

        return res.redirect("/wallet/rechargerecord")
    } catch (error) {
        console.log({
            status: false,
            message: "Something went wrong!",
            timestamp: timeNow
        })
        return res.status(500).json({
            status: false,
            message: "Something went wrong!",
            timestamp: timeNow
        })
    }
}


// helpers ---------------
const getUserDataByAuthToken = async (authToken) => {
    let [users] = await connection.query('SELECT `phone`, `code`,`name_user`,`invite` FROM users WHERE `token` = ? ', [authToken]);
    const user = users?.[0]


    if (user === undefined || user === null) {
        throw Error("Unable to get user data!")
    }

    return {
        phone: user.phone,
        code: user.code,
        username: user.name_user,
        invite: user.invite,
    }
}


const addUserAccountBalance = async ({ money, phone, invite }) => {
    const user_money = money + (money / 100) * 5
    const inviter_money = money + (money / 100) * 3

    await connection.query('UPDATE users SET money = money + ?, total_money = total_money + ? WHERE `phone` = ?', [user_money, user_money, phone]);

    const [inviter] = await connection.query('SELECT phone FROM users WHERE `code` = ?', [invite]);

    if (inviter.length) {
        console.log(inviter)
        console.log(inviter_money, inviter_money, invite, inviter?.[0].phone)
        await connection.query('UPDATE users SET money = money + ?, total_money = total_money + ? WHERE `code` = ? AND `phone` = ?', [inviter_money, inviter_money, invite, inviter?.[0].phone]);
        console.log("SUCCESSFULLY ADD MONEY TO inviter")
    }
}




const rechargeTable = {
    getRecordByPhoneAndStatus: async ({ phone, status, type }) => {
        if (![PaymentStatusMap.SUCCESS, PaymentStatusMap.CANCELLED, PaymentStatusMap.PENDING].includes(status)) {
            throw Error("Invalid Payment Status!")
        }

        let recharge

        if (type) {
            [recharge] = await connection.query('SELECT * FROM recharge WHERE phone = ? AND status = ? AND type = ?', [phone, status, type]);
        } else {
            [recharge] = await connection.query('SELECT * FROM recharge WHERE phone = ? AND status = ?', [phone, status]);
        }

        return recharge.map((item) => ({
            id: item.id,
            orderId: item.id_order,
            transactionId: item.transaction_id,
            utr: item.utr,
            phone: item.phone,
            money: item.money,
            type: item.type,
            status: item.status,
            today: item.today,
            url: item.url,
            time: item.time,
        }))
    },
    getRechargeByOrderId: async ({ orderId }) => {
        const [recharge] = await connection.query('SELECT * FROM recharge WHERE id_order = ?', [orderId]);

        if (recharge.length === 0) {
            return null
        }

        return recharge.map((item) => ({
            id: item.id,
            orderId: item.id_order,
            transactionId: item.transaction_id,
            utr: item.utr,
            phone: item.phone,
            money: item.money,
            type: item.type,
            status: item.status,
            today: item.today,
            url: item.url,
            time: item.time,
        }))?.[0]
    },
    cancelById: async (id) => {
        if (typeof id !== "number") {
            throw Error("Invalid Recharge 'id' expected a number!")
        }


        await connection.query('UPDATE recharge SET status = 2 WHERE id = ?', [id]);
    },
    setStatusToSuccessByIdAndOrderId: async ({ id, orderId }) => {
        if (typeof id !== "number") {
            throw Error("Invalid Recharge 'id' expected a number!")
        }


        console.log(id, orderId)

        const [re] = await connection.query('UPDATE recharge SET status = 1 WHERE id = ? AND id_order = ?', [id, orderId]);
        console.log(re)
    },
    getCurrentTimeForTodayField: () => {
        return moment().format("YYYY-DD-MM h:mm:ss A")
    },
    getDMYDateOfTodayFiled: (today) => {
        return moment(today, "YYYY-DD-MM h:mm:ss A").format("DD-MM-YYYY")
    },
    create: async (newRecharge) => {

        if (newRecharge.url === undefined || newRecharge.url === null) {
            newRecharge.url = "0"
        }

        await connection.query(
            `INSERT INTO recharge SET id_order = ?, transaction_id = ?, phone = ?, money = ?, type = ?, status = ?, today = ?, url = ?, time = ?, utr = ?`,
            [newRecharge.orderId, newRecharge.transactionId, newRecharge.phone, newRecharge.money, newRecharge.type, newRecharge.status, newRecharge.today, newRecharge.url, newRecharge.time, newRecharge?.utr || "NULL"]
        );

        const [recharge] = await connection.query('SELECT * FROM recharge WHERE id_order = ?', [newRecharge.orderId]);

        if (recharge.length === 0) {
            throw Error("Unable to create recharge!")
        }

        return recharge[0]
    }
}


const wowpay = {
    generateSign: (params, secretKey) => {
        let keys = Object.keys(params).sort();
        let string = [];
        for (let key of keys) {
            if (key === 'sign') continue;
            string.push(key + '=' + params[key]);
        }
        let signStr = string.join('&') + '&key=' + secretKey;

        return crypto.createHash('md5').update(signStr).digest('hex');
    },
    validateSignByKey(signSource, key, retSign) {
        if (key) {
            signSource = signSource + "&key=" + key;
        }

        const signKey = crypto.createHash("md5").update(signSource).digest("hex");
        return signKey === retSign;
    },
    getCurrentDate: () => {
        return moment().format("YYYY-MM-DD H:mm:ss")
    }
}


const callbackfromgateway = async (req, res) => {

    try {
        const {
            order_sn,
            money,
            status,
            pay_time,
            msg,
            remark,
            sign
        } = req.body;

        const key = 'VN8NHNnda0Rn72UqeIvTwhQuEV2yXVcn'; // your secret key
        // const key = 'O2UyHC65eofVs2xsGCjDzY2qVbybifea';


        // 1. Verify the sign
        const params = {
            money,
            msg,
            order_sn,
            pay_time,
            remark,
            status
        };

        // const calculatedSign = md5_sign(params, key); // same method used during order creation

        // if (sign !== calculatedSign) {
        //     console.warn('Invalid sign. Possible spoofed callback.');
        //     return res.status(400).send('Invalid signature');
        // }

        // 2. Mark payment as successful
        console.log('LG-Pay callback verified:', order_sn);

        const [rows] = await connection.execute(
            'SELECT id FROM recharge WHERE id_order = ?',
            [order_sn]
        );

        if (rows.length === 0) {
            console.log('No record found');
        } else {
            console.log('Recharge ID:', rows[0].id);
        }



        // TODO: Update payment status in DB based on order_sn
        // await rechargeTable.markAsPaid(order_sn, {
        //     money: parseFloat(money) / 100, // convert back from cents
        //     pay_time,
        //     msg
        // });

        const resdata = await axios.post("https://1xbet99.vip/api/webapi/admin/rechargeDuyet", {
            id: rows[0]?.id,
            type: "confirm"
        })

        console.log(resdata, "resdata");
        if (resdata.data.status == true) {
            return res.send('ok');
        }
        else {
            return res.send('fail')
        }

        // 3. Respond with "ok"

    } catch (err) {
        console.error('LG-Pay callback error:', err);
        return res.status(500).send('fail');
    }
}

const bondPayCallback = async (req, res) => {
  try {
    const {
      orderNo,
      merchantOrder,
      status,
      amount,
      createtime,
      updatetime
    } = req.body;

    console.log("BondPay Callback Received:", req.body);

    // 1. Check if order exists
    const [rows] = await connection.execute(
      "SELECT id, status FROM recharge WHERE id_order = ?",
      [merchantOrder]
    );

    if (!rows.length) {
      console.log("No recharge record found for merchantOrder:", merchantOrder);
      return res.status(200).json({ status: "ok", message: "No record found, callback ignored" });
    }

    const recharge = rows[0];

    // 2. Idempotency: ignore if already processed
    if (recharge.status === "success") {
      console.log("Callback already processed for merchantOrder:", merchantOrder);
      return res.status(200).json({ status: "ok", message: "Callback already processed" });
    }

    // 3. Update DB based on status success
    let newStatus = "";
    if (status === "success") {
      newStatus = "success";
    } else if (status === "pending") {
      newStatus = "pending";
    } else if (status === "failed") {
      newStatus = "failed";
    }

    // await connection.execute(
    //   "UPDATE recharge SET status = ?, amount = ?, pay_time = ?, updated_at = NOW() WHERE id = ?",
    //   [newStatus, amount, updatetime, recharge.id]
    // );

    console.log(`Recharge ID ${recharge.id} updated to status: ${newStatus}`);

    // 4. Optional: Call internal endpoint after success
    if (newStatus === "success") {
      try {
        const resdata = await axios.post("https://1xbet99.vip/api/webapi/admin/rechargeDuyet", {
          id: recharge.id,
          type: "confirm"
        });
        console.log("Internal API response:", resdata.data);
      } catch (err) {
        console.error("Internal API error:", err.message);
      }
    }

    // 5. Respond to BondPay
    return res.status(200).json({
      status: "ok",
      message: "Callback received successfully"
    });

  } catch (err) {
    console.error("BondPay callback error:", err);
    return res.status(500).json({
      status: "fail",
      message: "Internal server error"
    });
  }
};


const watchPaysCallback = async (req, res) => {
  try {
    const { orderNo, merchantOrder, status, amount } = req.body;

    console.log("WatchPays Callback Received:", req.body);

    // 1. Validate required fields
    if (!orderNo || !merchantOrder || !status || !amount) {
      return res.status(400).send("invalid_request");
    }

    // 2. Fetch the recharge order from DB
    const [rows] = await connection.execute(
      "SELECT * FROM recharge WHERE id_order = ?",
      [merchantOrder]
    );

    if (rows.length === 0) {
      console.log("No recharge order found for merchantOrder:", merchantOrder);
      return res.status(404).send("order_not_found");
    }

    const recharge = rows[0];

    console.log(recharge,"recharge is here")

    // 3. Avoid duplicate processing
    // if (recharge.status === 1) {
    //   console.log("Recharge already marked successful:", merchantOrder);
    //   return res.send("success"); // idempotent response
    // }

    // 4. Match amount exactly
    // if (parseFloat(recharge.money).toFixed(2) !== parseFloat(amount).toFixed(2)) {
    //   console.log(
    //     "Amount mismatch:",
    //     "DB:", recharge.money,
    //     "Callback:", amount
    //   );
    //   return res.status(400).send("amount_mismatch");
    // }

    // 5. Update recharge record as successful
    // await connection.execute(
    //   "UPDATE recharge SET status = 1, transactionId = ?, updatedAt = NOW() WHERE orderId = ?",
    //   [orderNo, merchantOrder]
    // );

    // 6. Credit wallet (optional: your internal API)
     try {
        const resdata = await axios.post("https://1xbet99.vip/api/webapi/admin/rechargeDuyet", {
          id: recharge.id,
          type: "confirm"
        });
        console.log("Internal API response:", resdata.data);
      } catch (err) {
        console.error("Internal API error:", err.message);
      }

    console.log("Recharge updated successfully:", merchantOrder);
    return res.send("success");

  } catch (err) {
    console.error("WatchPays Callback Error:", err);
    return res.status(500).send("fail");
  }
};


module.exports = {
    initiateUPIPayment,
    verifyUPIPayment,
    initiateWowPayPayment,
    verifyWowPayPayment,
    initiateManualUPIPayment,
    addManualUPIPaymentRequest,
    addManualUSDTPaymentRequest,
    initiateManualUSDTPayment,
    callbackfromgateway,
    addBondPayPaymentRequest,
    bondPayCallback,
    addManualUPIPaymentRequesttwo,
    watchPaysCallback 

}
