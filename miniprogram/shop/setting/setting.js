var utils = require('../../utils/utils.js')
const db = wx.cloud.database()
Page({
  onLoad: function() {
    // 管理员认证
    getApp().auth()
    // 加载店铺设置
    getApp().loadSeller(seller => {
      this.setData({
        seller: seller
      })
    })
  },
  async updateSetting(e) {
    const seller = this.data.seller
    const form = e.detail.value
    // 格式化数据
    form.min_amount = parseFloat(form.min_amount)
    form.express_fee = parseFloat(form.express_fee)
    // 保存表单信息，除营业时间外
    const result = await db
      .collection('Seller')
      .doc(seller._id)
      .update({
        data: form
      })
    if (result) {
      wx.showToast({
        title: '修改成功'
      })
    }
  },
  async bindTimeChanged(e) {
    // 修改营业时间，起始时间共用
    var seller = this.data.seller
    // 起或始
    var field = e.currentTarget.dataset.field
    // 保存
    const data = {}
    data[field] = e.detail.value
    const result = await db
    .collection('Seller')
    .doc(seller._id)
    .update({
      data: data
    })
    console.log(result)
    debugger
    if (result.stats.updated !== 0) {
      wx.showToast({
        title: '修改成功'
      })
    } else {
      wx.showToast({
        title: '修改失败',
        icon: 'none'
      })
    }
  },
  chooseImage() {
    wx.chooseImage({
      count: 1, // 默认9
      sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: res => {
        const tempFilePaths = res.tempFilePaths
        const file = tempFilePaths[0]
        const name = utils.random_filename(file) //上传的图片的别名，建议可以用日期命名
        console.log(name)
        wx.cloud.uploadFile({
          cloudPath: name,
          filePath: file, // 文件路径
        }).then(res => {
          console.log(res)
          const fileId = res.fileID
        // 将文件id保存到数据库表中
          db.collection('Seller').doc(this.data.seller._id)
          .update({
            data: {
              logo_url: fileId
            }
          }).then(() => {
            wx.showToast({
              title: '上传成功'
            })
            // 渲染本地头像
            this.setData({
              new_logo: fileId
            })
          }, err => {
            console.log(err)
            wx.showToast({
              title: '上传失败'
            })
          })
        })
      }
    })
  }
})
