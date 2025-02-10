// 初始化AV
const User = require('./utils/user')
wx.cloud.init({
  traceUser: true
})
const db = wx.cloud.database()

App({
  login() {
    wx.cloud.callFunction({
      // 云函数名称
      name: 'login',
      success: res => {
        // console.log(res)
        const { result: user } = res
        wx.setStorage({
          key: 'user',
          data: user
        })
      },
      fail: err => {
        console.error(err)
      }
    })
  },
  onLaunch: function() {
    this.login()
    // 设备信息
    wx.getSystemInfo({
      success: res => {
        this.screenWidth = res.windowWidth
        this.screenHeight = res.windowHeight
        this.pixelRatio = res.pixelRatio
      }
    })
  },
  auth: function() {
    // 管理员认证
    if (!(User.current() && User.current().isAdmin)) {
      wx.switchTab({
        url: '../../shop/index/index'
      })
    }
  },
  async loadSeller(cb) {
    const sellers = await db.collection('Seller').get()
    if (sellers.data.length <= 0) {
      // 没有店铺那就创建一个
      await db.collection('Seller').add({
        data: {
          logo:
            'logo.jpg',
          address: '地址：xxx',
          express_fee: 0,
          min_amount: 1.0,
          name: '零乐 零食铺',
          notice: '网红优选 平价特惠',
          telephone: '88888888',
          business_start: '9:00',
          logo_url:
            'cloud://cloud1-3gl11i0h2db15290.636c-cloud1-3gl11i0h2db15290-1320388990/logo.jpg',
          business_end: '18:00'
        }
      })
      const sellers = await db.collection('Seller').get()
      const seller = sellers.data[0]
      cb(seller)
      
    } else {
      const seller = sellers.data[0]
      cb(seller)
    }
  },
  payment: function(obj) {
    console.log(obj);
    console.log(obj._id);
    db.collection('Order')
      .doc(obj._id)
      .get()
      .then(({ data: order }) => {
        console.log(order.total);
        // debugger
        // 发起支付
        wx.cloud.callFunction({
          data: {
            orderId: order._id,
            amount: order.total * 100,
            body: order.title
          },
          name: 'unified',
          success: res => {
            const { result: payData } = res
            wx.requestPayment({
              timeStamp: payData.timeStamp,
              nonceStr: payData.nonceStr,
              package: payData.package,
              signType: 'MD5',
              paySign: payData.paySign,
              success: res => {
                console.log('支付成功', res)
                wx.showModal({
                  title: '支付成功',
                  showCancel: false,
                  success: () => {
                    // 跳转订单详情页
                    wx.navigateTo({
                      url: '/order/detail/detail?objectId=' + order._id
                    })
                  }
                })
              },
              fail: res => {
                console.log('支付失败', res)
                wx.showModal({
                  showCancel: false,
                  title: '支付失败',
                  success: res => {
                    wx.navigateTo({
                      url: '/order/detail/detail?objectId=' + order._id
                    })
                  }
                })
              },
              complete(res) {
                // console.log('支付完成', res)
              }
            })
          },
          fail: err => {
            console.error(err)
          }
        })
      })
  }
})
