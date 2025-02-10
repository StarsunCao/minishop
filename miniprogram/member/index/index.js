const User = require('../../utils/user')

Page({
	onLoad: function () {
		this.setData({
			user: User.current()
		})
	},
	logout: function () {
		// 确认退出登录
		wx.showModal({
			title: '确定退出登录',
			success: (res) => {
				if (res.confirm) {
					// 退出操作
					wx.removeStorage({
						key: 'user',
						success: (res) => {
							console.log(res)
							this.setData({
								user: User.current()
							})
							wx.showToast({
								title: '退出成功'
							})
						}
					})
				}
			}
		});
	}
}) 