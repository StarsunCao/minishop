// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

//32位随机数生成
function randomString(length, chars) {
  var result = '';
  for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}
var rString = randomString(32, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('请求中')
  console.log(cloud.getWXContext().ENV)
  let { orderId, amount, body } = event
  const wxContext = cloud.getWXContext()
  const res = await cloud.cloudPay.unifiedOrder({
    body: body,
    outTradeNo: orderId,
    spbillCreateIp: '127.0.0.1',
    subMchId: '1651395480',
    totalFee: amount,
    envId: 'cloud1-3gl11i0h2db15290',
    functionName: 'pay_cb',
    nonceStr: rString,
    tradeType:'JSAPI'
  })
  return res.payment
}
