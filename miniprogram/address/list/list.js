const WxNotificationCenter = require('../../utils/WxNotificationCenter');
const db = wx.cloud.database()
const User = require('../../utils/user')

Page({
  data: {
    visual: 'hidden'
  },
  onLoad: function(options) {
    if (options.isSwitchAddress) {
      this.setData({
        isSwitchAddress: true
      })
    }
  },
  onShow: function() {
    this.getAddress()
  },
  add: function() {
    wx.navigateTo({
      url: '../add/add'
    })
  },
  getAddress: function() {
    db.collection('Address').get({
      user: User.current()._id
    }).then(({data: addressList}) => {
      this.setData({
        addressList: addressList,
        visual: addressList.length ? 'hidden' : 'show'
      })
    })
  },
  edit: function(e) {
    var index = e.currentTarget.dataset.index
    var objectId = this.data.addressList[index]._id
    wx.navigateTo({
      url: '../add/add?objectId=' + objectId
    })
  },
  selectAddress: function(e) {
    if (!this.data.isSwitchAddress) {
      return
    }
    var index = e.currentTarget.dataset.index
    WxNotificationCenter.postNotificationName(
      'addressSelectedNotification',
      this.data.addressList[index]._id
    )
    wx.navigateBack()
  }
})
