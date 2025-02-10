const db = wx.cloud.database()

Page({
  onLoad: function() {
    // 管理员认证
    getApp().auth()
  },
  onShow: function() {
    this.loadFood()
  },
  loadFood: function() {
    wx.cloud.callFunction({
      // 云函数名称
      name: 'food',
      success: ({result: foodObjects}) => {
        this.setData({
          foodObjects: foodObjects
        })
      },
      fail: err => {
        console.error(err)
      }
    })
  },
  add: function() {
    // 跳转添加页面
    wx.navigateTo({
      url: '../add/add'
    })
  },
  showDetail: function(e) {
    var index = e.currentTarget.dataset.index
    var objectId = this.data.foodObjects[index]._id
    wx.navigateTo({
      url: '../add/add?objectId=' + objectId
    })
    // console.log(objectId);
  }
})
