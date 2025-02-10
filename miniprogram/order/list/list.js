const moment = require('../../utils/moment')
const db = wx.cloud.database()
const User = require('../../utils/user')

Page({
  data: {
    page_index: 0,
    orderList: [],
    loadingTip: '',
    isAdmin: User.current() && User.current().isAdmin,
    visual: 'hidden'
  },
  onLoad: function() {
    getApp().loadSeller(seller => {
      this.setData({
        seller: seller
      })
    })
  },
  showDetail: function(e) {
    var index = e.currentTarget.dataset.index
    // 传递订单objectId
    wx.navigateTo({
      url: '../detail/detail?objectId=' + this.data.orderList[index]._id
    })
  },
  onShow: function() {
    this.loadOrder()
  },
  onTabItemTap() {
    this.loadOrder()
  },
  loadOrder: function() {
    const page_size = 20

    let condition = {}
    if (!User.current().isAdmin) {
      // 如果是管理员，那么这个订单列表也就是它的管理列表，可以进行派送操作，详情wxml文件中的判断显示
      condition = {
        user: User.current()._id
      }
    }
    db.collection('Order')
      .where(condition)
      .skip(this.data.page_index * page_size)
      .limit(page_size)
      .orderBy('createdAt', 'desc')
      .get()
      .then(({ data: results }) => {
        results = results.map(item => {
          item.createdAt = moment(item.createdAt).format('MM-DD HH:mm')
          return item
        })
        // 请求成功将数据存入orderList
        this.setData({
          orderList:
            this.data.page_index == 0
              ? results
              : this.data.orderList.concat(results)
        })
        // 判断上拉加载状态
        if (results.length < page_size && this.data.page_index != 0) {
          this.setData({
            loadingTip: '没有更多内容'
          })
        }
        // holder
        this.setData({
          visual:
            results.length == 0 && this.data.page_index == 0 ? 'show' : 'hidden'
        })
      })
  },
  onReachBottom: function() {
    this.setData({
      page_index: ++this.data.page_index
    })
    this.loadOrder()
  },
  payment: function(e) {
    var index = e.currentTarget.dataset.index
    var order = this.data.orderList[index]
    getApp().payment(order)
  }
})
