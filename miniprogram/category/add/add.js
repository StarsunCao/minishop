const db = wx.cloud.database()
const { showModal } = require('../../utils/utils')

Page({
  onLoad: function(options) {
    // 管理员认证
    getApp().auth()
    if (options.objectId) {
      // 缓存数据
      this.setData({
        isEdit: true,
        objectId: options.objectId
      })
      // 请求待编辑的分类对象
      db.collection('Category')
        .doc(options.objectId)
        .get()
        .then(res => {
          this.setData({
            category: res.data
          })
        })
    }
  },
  add: function(e) {
    var form = e.detail.value
    if (form.title == '') {
      wx.showModal({
        title: '请填写分类名称',
        showCancel: false
      })
      return
    }
    form.priority = Number.parseInt(form.priority)

    // 添加或者修改分类
    // 修改模式
    if (this.data.isEdit) {
      const category = this.data.category
      db.collection('Category')
        .doc(category._id)
        .update({
          data: form
        })
        .then(res => {
          console.log(res)
          showModal()
        })
    } else {
      db.collection('Category')
        .add({
          data: form
        })
        .then(res => {
          console.log(res)
          showModal()
        })
    }
  },
  showModal() {
    // 操作成功提示并返回上一页
    wx.showModal({
      title: this.data.isEdit ? '修改成功' : '添加成功',
      showCancel: false,
      success: () => {
        wx.navigateBack()
      }
    })
  },
  delete: function() {
    // 确认删除对话框
    wx.showModal({
      title: '确认删除',
      success: res => {
        if (res.confirm) {
          const category = this.data.category
          db.collection('Category')
            .doc(category._id)
            .remove()
            .then(res => {
              console.log(res)
              wx.showToast({
                title: '删除成功'
              })
              wx.navigateBack()
            })
        }
      }
    })
  }
})
