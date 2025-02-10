const moment = require('moment')

// 导出模块
module.exports = {
	random_filename: function (tempFilePath) {
		var newDateStr = moment().format('YYYYMMDDHHmmssSSS')
		var extension = /\.([^.]*)$/.exec(tempFilePath);
		if (extension) {
			extension = extension[1].toLowerCase();
		}
		var name = newDateStr + "." + extension;//上传的图片的别名 
		return name;
	},
	showModal: (isEdit) => {
    // 操作成功提示并返回上一页
    wx.showModal({
      title: isEdit ? '修改成功' : '添加成功',
      showCancel: false,
      success: () => {
        wx.navigateBack()
      }
    })
  },
}
