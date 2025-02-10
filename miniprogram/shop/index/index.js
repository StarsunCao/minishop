const db = wx.cloud.database()
const WxNotificationCenter = require('../../utils/WxNotificationCenter.js')


// 最大行数
const max_row_height = 5
// 行高
const cart_offset = 90
// 底部栏偏移量
const food_row_height = 49
Page({
  data: {
    categoryStates: [],
    cartData: {},
    cartObjects: [],
    maskVisual: 'hidden',
    amount: 0
  },
  onLoad: function() {
    // 监听清空购物车事件
    WxNotificationCenter.addNotification(
      'clearCartNotification',
      this.clearCart,
      this
    )
    // wx.navigateTo({
    // 	url: '../../order/checkout/checkout'
    // });
    getApp().loadSeller((seller) => {
      this.setData({
        seller: seller,
        express_fee: seller.express_fee
      })
    })
    this.loadCategory()
    this.loadFood()
  },
  onUnload: function() {
    // 移除监听
    WxNotificationCenter.removeNotification('clearCartNotification', this)
  },
  // 清空购物车的函数
  clearCart: function() {
    this.setData({
      cartData: {},
      cartObjects: [],
      amount: 0,
      quantity: 0
    })
  },
  onShow: function() {
    this.loadCategory()
    this.loadFood()
  },
  onTabItemTap() {
    this.loadCategory()
    this.loadFood()
  },
  loadCategory: function() {
    db.collection('Category')
      .orderBy('priority', 'asc')
      .get()
      .then(({ data: categoryObjects }) => {
				const categoryStates = new Array(categoryObjects.length).fill(false)
        this.setData({
          categoryObjects: categoryObjects,
          categoryStates: categoryStates
        })
      })
  },
  loadFood: function(category) {
    const condition = {}
    if (category !== undefined) {
      condition.category = category._id
    }
    const MAX_LIMIT = 20
    // 先取出集合记录总数
    db.collection('Food').where(condition).count().then(countResult => {
      const total = countResult.total
      // 计算需分几次取
      const batchTimes = Math.ceil(total / MAX_LIMIT)
      // 承载所有读操作的 promise 的数组
      let tasks = []
      for (let i = 0; i < batchTimes; i++) {
        const promise = db.collection('Food')
          .orderBy('priority', 'asc')
          .where(condition)
          .skip(i * MAX_LIMIT)
          .limit(MAX_LIMIT)
          .get()
        tasks.push(promise)
      }
      // 等待所有
      Promise.all(tasks).then((results) => {
        let foodObjects = []
        for (let i = 0; i < results.length; i++) {
          foodObjects = foodObjects.concat(results[i].data)
        }
        this.setData({
          foodObjects: foodObjects
        })
      })
    })
  }, 
  switchCategory: function(e) {
    // 获取分类id并切换分类
    const index = e.currentTarget.dataset.index
    const categoryId = this.data.categoryObjects[index]._id
    console.log(this.data.categoryObjects)
		console.log(categoryId)
		db.collection('Category').doc(categoryId).get().then( ({data: category}) => {
			// debugger
			this.setData({
				category: category
			})
			this.loadFood(category)
			console.log(category)
		} )
    // 更改分类项高亮状态
    const categoryStates = this.data.categoryStates.map((item, i) => {
      if (index == i) {
        item = true
      } else {
        item = false
      }
      return item
    })
    this.setData({
      categoryStates: categoryStates
    })
  },
  checkout: function() {
    // 将对象序列化
    const cartObjects = []
    this.data.cartObjects.forEach((item, index) => {
      const cart = {
        foodId: item.food._id,
        title: item.food.title,
        price: item.food.price,
        quantity: item.quantity
      }
      cartObjects.push(cart)
      // console.log(item.food._id);
    })

    wx.navigateTo({
      url:
        '../../order/checkout/checkout?quantity=' +
        this.data.quantity +
        '&amount=' +
        this.data.amount +
        '&express_fee=' +
        this.data.express_fee +
        '&carts=' +
        JSON.stringify(cartObjects)
    })
  },
  add: function(e) {
    // 所点商品id
    const foodId = e.currentTarget.dataset.foodId
    // console.log(foodId);
    // 读取目前购物车数据
    const cartData = this.data.cartData
    // 获取当前商品数量
    let foodCount = cartData[foodId] ? cartData[foodId] : 0
    // 获取库存数量
    let foodObject = this.data.foodObjects.find(item => item._id === foodId);
    // console.log(foodObject);
    let inventory = foodObject.inventory
    // console.log(inventory);
    if (foodCount >= inventory) {
      wx.showModal({
        title: '库存不足',
        showCancel: false
      })
      return
    }
    // 自增1后存回
    cartData[foodId] = ++foodCount
    // 设值到data数据中
    this.setData({
      cartData: cartData
    })
    // 转换成购物车数据为数组
    this.cartToArray(foodId)
  },
  subtract: function(e) {
    // 所点商品id
    const foodId = e.currentTarget.dataset.foodId
    // 读取目前购物车数据
    const cartData = this.data.cartData
    // 获取当前商品数量
    let foodCount = cartData[foodId]
    // 自减1
    --foodCount
    // 减到零了就直接移除
    if (foodCount === 0) {
      delete cartData[foodId]
    } else {
      cartData[foodId] = foodCount
    }
    // 设值到data数据中
    this.setData({
      cartData: cartData
    })
    // 转换成购物车数据为数组
    this.cartToArray(foodId)
  },
  cartToArray: function(foodId) {
    // 需要判断购物车数据中是否已经包含了原商品，从而决定新添加还是仅修改它的数量
    const cartData = this.data.cartData
    const cartObjects = this.data.cartObjects
    // 查询对象
    db.collection('Food').doc(foodId).get().then(({data: food}) => {
      // food = utils.formatResults(food)
      // 从数组找到该商品，并修改它的数量
      for (let i = 0; i < cartObjects.length; i++) {
        if (cartObjects[i].food._id === foodId) {
          // 如果是undefined，那么就是通过点减号被删完了
          if (cartData[foodId] === undefined) {
            cartObjects.splice(i, 1)
          } else {
            cartObjects[i].quantity = cartData[foodId]
          }
          this.setData({
            cartObjects: cartObjects
          })
          // 成功找到直接返回，不再执行添加
          this.amount()
          return
        }
      }
      // 添加商品到数组
      const cart = {}
      cart.food = food
      cart.quantity = cartData[foodId]
      cartObjects.push(cart)
      this.setData({
        cartObjects: cartObjects
      })
      // 因为请求网络是异步的，因此汇总在此，上同
      this.amount()
    })
  },
  cascadeToggle: function() {
    //切换购物车开与关
    // console.log(this.data.maskVisual);
    if (this.data.maskVisual == 'show') {
      this.cascadeDismiss()
    } else {
      this.cascadePopup()
    }
  },
  cascadePopup: function() {
    // 购物车打开动画
    const animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease-in-out'
    })
    this.animation = animation
    // scrollHeight为商品列表本身的高度
    const scrollHeight =
      (this.data.cartObjects.length <= max_row_height
        ? this.data.cartObjects.length
        : max_row_height) * food_row_height
    // cartHeight为整个购物车的高度，也就是包含了标题栏与底部栏的高度
    const cartHeight = scrollHeight + cart_offset
    animation.translateY(-cartHeight).step()
    this.setData({
      animationData: this.animation.export(),
      maskVisual: 'show',
      scrollHeight: scrollHeight,
      cartHeight: cartHeight
    })
    // 遮罩渐变动画
    const animationMask = wx.createAnimation({
      duration: 150,
      timingFunction: 'linear'
    })
    this.animationMask = animationMask
    animationMask.opacity(0.8).step()
    this.setData({
      animationMask: this.animationMask.export()
    })
  },
  cascadeDismiss: function() {
    // 购物车关闭动画
    this.animation.translateY(this.data.cartHeight).step()
    this.setData({
      animationData: this.animation.export()
    })
    // 遮罩渐变动画
    this.animationMask.opacity(0).step()
    this.setData({
      animationMask: this.animationMask.export()
    })
    // 隐藏遮罩层
    this.setData({
      maskVisual: 'hidden'
    })
  },
  amount: function() {
    const cartObjects = this.data.cartObjects
    let amount = 0
    let quantity = 0
    // console.log(cartObjects)
    cartObjects.forEach(function(item, index) {
      console.log(item)
      amount += item.quantity * item.food.price
      quantity += item.quantity
    })
    this.setData({
      amount: amount.toFixed(2),
      quantity: quantity
    })
  },
  onShareAppMessage: function() {
    return {
      title: '商品',
      desc: '商品',
      path: '/shop/index/index'
    }
  }
})
