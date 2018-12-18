// pages/welcome/welcome.js
import {
  postAjax
} from '../../utils/ajax.js';
const utils = require('../../utils/util.js');
const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {

    checkItems: [{
        value: 'cul',
        text: "文学",
        checked: 'true'
      },
      {
        value: 'his',
        text: "历史",
        checked: false
      },
      {
        value: 'science',
        text: "科普",
        checked: true
      },
      {
        value: 'story',
        text: "传记",
        checked: true
      },
      {
        value: 'business',
        text: "商业",
        checked: true
      },
      {
        value: 'emotions',
        text: "亲子",
        checked: true
      }
    ],
    products: [{},
      {},
      {},
      {},
      {},
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    let radioValue = []
    this.data.checkItems.map((element, index, array) => {
      if (element.checked) {
        radioValue.push(element.value)
      }
    })
    this.setData({
      radioValue
    })
    let that = this

    app.visitorLogin(function(uinfo) {
      that.setData({
        authLevel: wx.getStorageSync("authLevel"),
        userInfo: wx.getStorageSync('userInfo')
      })

      app.getUserInfo([wx.getStorageSync('authLevel'), wx.getStorageSync('userInfo')]).then(function(uinfo) {
        that.setData({
          authLevel: wx.getStorageSync("authLevel"),
          userInfo: wx.getStorageSync('userInfo')
        })

      });
    })

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  },
  preventTouchMove() {
    return false
  },
  // 复选框变化
  checkboxChange(e) {
    console.log(e)
    let value = e.detail.value
    this.setData({
      radioValue: value
    })
  },
  closeModal() {
    this.setData({
      recmenPopup: false
    })
  },
  onConfirm() {
    this.setData({
      recmenPopup: true
    })
  },
  loadMoreData() {

  },
  // 提交订单
  postOrderSubmit(pid, callback) {
    // let { pid } = e.currentTarget.dataset
    // 生成订单
    postAjax({
      url: "interfaceAction",
      method: 'POST',
      data: {
        interId: '20321',
        version: 1,
        authKey: wx.getStorageSync('authKey'),
        method: 'order-submit',
        params: {
          productId: pid,
          orderType: 0,
          channelId: app.globalData.channelId
        }
      },
    }).then((res) => {
      if (res.data.success) {
        // 判断是否需要支付，true调起支付
        if (res.data.pay) {
          that.PayFor(res.data.orderId).then(function(data) {
            wx.showToast({
              title: '兑换成功，商品即将出库',
              icon: "none",
              success: (res) => {
                wx.navigateTo({
                  url: '/pages/orderlist/orderlist',
                })
              }
            })
          })
        } else {
          callback && callback(res)
        }
      } else {
        utils.alert(res.data.msg)
      }
    })
  },
  // 下单进入音频详情页面
  freeListen(e) {
    let { id } = e.currentTarget.dataset
    // 自动下单进入音频详情页
    wx.switchTab({
      url: '/pages/index/index',
      success() {
        console.log("成功")
      }
    })

    // this.postOrderSubmit(id, function() {
    //   wx.navigateTo({
    //     url: `/pages/audio_detail/audio_detail?pid=${id}`
    //   })
    // })
  }
})