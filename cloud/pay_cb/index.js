// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('支付回调')
  console.log(event)
  console.log(cloud.getWXContext().ENV)
  const orderId = event.outTradeNo
  const resultCode = event.resultCode
  if (resultCode === 'SUCCESS') {
    const res = await db
      .collection('Order')
      .doc(orderId)
      .update({
        data: {
          status: 1
        }
      })
    console.log(res)
    return { errcode: 0 }
  }
}
