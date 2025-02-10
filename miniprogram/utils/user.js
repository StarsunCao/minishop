
let current = () => {
	const user = wx.getStorageSync('user')
  return user
}

// 导出模块
module.exports = {
  current: current
}
