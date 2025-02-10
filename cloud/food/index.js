// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const MAX_LIMIT = 20
  // 先取出集合记录总数
  const countResult = await db.collection('Food').count()
  const total = countResult.total
  // 计算需分几次取
  const batchTimes = Math.ceil(total / MAX_LIMIT)
  // 承载所有读操作的 promise 的数组
  let tasks = []
  for (let i = 0; i < batchTimes; i++) {
    const promise = db.collection('Food').skip(i * MAX_LIMIT).limit(MAX_LIMIT)
      .get()
    tasks.push(promise)
  }
  
  // 等待所有
  let foods = (await Promise.all(tasks)).reduce((acc, cur) => {
    return {
      data: acc.data.concat(cur.data),
      errMsg: acc.errMsg,
    }
  })
  
  tasks = []
  for (let i = 0; i < foods.data.length; i++) {
    const promise = db.collection('Category').where({
      _id: foods.data[i].category
    }).get()
    tasks.push(promise)
  }
  
  let categories = await Promise.all(tasks)
  
  let result = foods.data.map((food, index) => {
    return {
      ...food,
      categories: categories[index].data
    }
  })
  
  console.log(result)
  return result
}
