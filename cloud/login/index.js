// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID: openId } = wxContext
  // 连接数据库

  const db = cloud.database()
  let user = null
  // 先查询一次是不是包含该用户
  const {total: count} = await db
    .collection('User')
    .where({
      openId: openId
    })
    .count()
  // console.log(`查询到用户数: ${count}`)
  if (count > 0) {
    // 老用户，更新最后登录时间
    const users = await db.collection('User').get()
    // debugger
    user = users.data[0]
    user.loginAt = new Date()
    const updated = await db
      .collection('User')
      .doc(user._id)
      .update({
        data: {
          loginAt: user.loginAt
        }
      })
  } else {
    user = {
      openId: openId,
      isAdmin: false,
      loginAt: new Date()
    }
    // 判断是不是只有一个用户
    const {total: count} = await db
      .collection('User').count()
    if (count === 0) {
      user.isAdmin = true
    }
    //  新用户，注册用户到User表
    const create = await db.collection('User').add({
      data: user
    })

  }

  return user
}
