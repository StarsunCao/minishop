const db = wx.cloud.database()
const utils = require('../../utils/utils.js')
const { showModal } = require('../../utils/utils')

Page({
  data: {
    categoryIndex: 0
  },
  onLoad: function(options) {
    // 管理员认证
    getApp().auth()
    if (options.objectId) {
      // 缓存数据
      this.setData({
        isEdit: true,
        objectId: options.objectId
      })
      this.loadFood()
    } else {
      this.loadCategories()
    }
  },
  loadFood: function() {
    // 请求待编辑的分类对象
    db.collection('Food')
			.doc(this.data.objectId)
			.get()
      .then(res => {
        this.setData({
          food: res.data,
          thumb_url: res.data.thumb_url
				})
        this.loadCategories()
      })
  },
  loadCategories: function() {
    // 加载全部分类，用于picker数据源
    db.collection('Category')
      .get()
      .then(res => {
        const categories = res.data
        console.log(categories)
        this.setData({
          categories: categories
        })
        this.indexOfCategories()
      })
  },
  indexOfCategories: function() {
    // 找出当前分类下标
    // 添加时
    if (!this.data.food) {
      return
    }
    const category = this.data.food.category
		const categories = this.data.categories
    categories.forEach((item, idx) => {
      if (item._id == category) {
        console.log(idx)
        this.setData({
          categoryIndex: idx
        })
      }
    })
  },
  bindCategoryChanged: function(e) {
    // 更新选中分类项
    const index = e.detail.value
    this.setData({
      categoryIndex: index,
      category: this.data.categories[index]
    })
  },
  add: function(e) {
    // form取值
    const form = e.detail.value
    // 表单验证
    if (form.title == '') {
      wx.showModal({
        title: '请填写商品名称',
        showCancel: false
      })
      return
    }
    if (form.inventory == '') {
      wx.showModal({
        title: '请填写库存',
        showCancel: false
      })
      return
    }
    if (form.price == '') {
      wx.showModal({
        title: '请填写售价',
        showCancel: false
      })
      return
    }
    if (form.priority == '') {
      wx.showModal({
        title: '请填写排序号',
        showCancel: false
      })
      return
    }
    if (!this.data.thumb_url) {
      wx.showModal({
        title: '请上传图片',
        showCancel: false
      })
      return
    }
    form.priority = parseFloat(form.priority)
    form.price = parseFloat(form.price)
    form.o_price = parseFloat(form.o_price)
    form.inventory = parseInt(form.inventory)

		form.category = this.data.categories[this.data.categoryIndex]._id
		form.thumb_url = this.data.thumb_url
    // 添加或者修改分类
    // 修改模式
    if (this.data.isEdit) {
      const food = this.data.food
      db.collection('Food')
        .doc(food._id)
        .update({
          data: form
        })
        .then(res => {
          console.log(res)
          showModal()
        })
    } else {
      db.collection('Food')
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
          db.collection('Food')
            .doc(this.data.food._id)
						.remove()
						.then(res => {
              console.log(res)
              wx.showModal({
                title: '删除成功',
                showCancel: false,
                success: () => {
                  wx.navigateBack()
                }
              })
            })
        }
      }
    })
  },
  upload: function() {
    // 上传或更换菜品图片
    wx.chooseImage({
      count: 1, // 默认9
      sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: res => {
        const tempFilePaths = res.tempFilePaths
        const file = tempFilePaths[0]
        const name = utils.random_filename(file) //上传的图片的别名，建议可以用日期命名
        console.log(name)
        wx.cloud
          .uploadFile({
            cloudPath: name,
            filePath: file // 文件路径
          })
          .then(res => {
            console.log(res)
            const fileId = res.fileID
            this.setData({
              thumb_url: fileId
            })
          })
      }
    })
  }
})
