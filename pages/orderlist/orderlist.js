import {
  postAjax
} from '../../utils/ajax.js';
const utils = require('../../utils/util.js');
var app = getApp();
var runTime = Date.now(); //启动时间
const aldstat = require('../../utils/sdk/ald-stat.js');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // navTab: ["全部订单", "待付款", "待发货", "待收货", "订单完成"],
    navTab: [{
        tabName: "全部",
        state: 0,
        poststate: 0
      },
      {
        tabName: "待付款",
        state: 1,
        poststate: 1
      },
      {
        tabName: "待发货",
        state: 2,
        poststate: 2
      },
      {
        tabName: "已发货",
        state: 3,
        poststate: 4
      },
      {
        tabName: "已完成",
        state: 4,
        poststate: 5
      }
    ],
    currentNavtab: 0,
    page: 1,
    size: 10,
    hasMoreData: true,
    sliderOffset: 0,
    sliderLeft: 0,
    orderInfos: [],
    scrollTop: 0,
    scrollHeight: 100,
    state: 0,
    isShow: true, //没有更多数据标识
    currentbottomBar: 1,
    navHeight: app.globalData.navHeight
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    let that = this;
    let sliderWidth = 60;
    this.setData({
      currentNavtab: options.state || 0,
      state: options.postState || 0
    })
    let sysres = wx.getSystemInfoSync()
    that.setData({
      sliderLeft: (sysres.windowWidth / that.data.navTab.length - sliderWidth) / 2,
      sliderOffset: sysres.windowWidth / that.data.navTab.length * that.data.currentNavtab,
      scrollHeight: sysres.windowHeight
    });

    that.setData({ //由于getBookList方法中的数据是concat多个，故先清除
      orderInfos: [],
      page: 1
    })

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },
  onUnload() {
    app.globalData.openOnShowOrderlist = false
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    app.aldstat.sendEvent('我的书屋加载时间', {
      time: Date.now() - runTime
    })
    let that = this
    app.loginGetUserInfo(function(uinfo) {
      that.setData({
        userInfo: uinfo,
        authLevel: wx.getStorageSync('authLevel')
      });
      app.getShareData(4)
      that.setData({
        freeSec: app.globalData.freeSec,
        freeMin: app.globalData.freeMin
      })
      if (wx.getStorageSync('authLevel') == 2) {
        if (!app.globalData.openOnShowOrderlist) {
          that.getBookList();
          app.globalData.openOnShowOrderlist = true
        }
        // that.setData({
        //   page: 1,
        //   hasMoreData: true
        // })
        // that.getBookList();
        that.getFreeTime().then()
      }
    });
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function(res) {
    var that = this;
    var {
      unionId,
      channelId
    } = app.globalData;

    const {
      userId
    } = wx.getStorageSync('userInfo');
    if (res.from == "button") {
      console.log(res)
      let {
        pid
      } = res.target.dataset;
      app.userShareRecord(0)
      setTimeout(that.getFreeTime, 1000)
      // let target_id = res.target.id;
      return {
        title: that.data.shareData[0][1],
        path: `${that.data.shareData[0][4] || "/pages/index/index"}?cid=${channelId}&unionId=${unionId}&inviterUserId=${userId}`,
        imageUrl: that.data.shareData[0][3],
        complete: res => {
          console.log(res)
          if (res.errMsg == 'shareAppMessage:ok') {}
        }
      }
    }

    app.userShareRecord(0)
    setTimeout(that.getFreeTime, 1000)

    return {
      title: that.data.shareData[0][1],
      path: `${that.data.shareData[0][4] || "/pages/index/index"}?cid=${channelId}&unionId=${unionId}&inviterType=0`,
      imageUrl: that.data.shareData[0][3],
    }
  },
  //切换tab刷新数据
  switchTab: function(e) {
    var that = this;
    var state = e.currentTarget.dataset.state;
    var poststate = e.currentTarget.dataset.poststate;
    if (state !== that.data.currentNavtab) {
      that.setData({
        currentNavtab: state,
        state: poststate,
        orderInfos: [], //数据源清空
        page: 1,
        sliderOffset: e.currentTarget.offsetLeft
      })
      wx.showLoading({ //期间为了显示效果可以添加一个过度的弹出框提示“加载中”  
        title: '加载中',
        icon: 'loading',
      });
      //刷新数据
      that.getBookList();
    }
  },
  //获取列表数据渲染
  getOrderList: function() {
    let that = this;

    postAjax({
      url: "interfaceAction",
      // method: 'POST',
      data: {
        interId: '20321',
        version: 1,
        authKey: wx.getStorageSync('authKey'),
        method: 'order-list',
        params: {
          channelId: app.globalData.channelId,
          state: that.data.state,
          page: that.data.page,
          size: that.data.size
        }
      }
    }).then((res) => {
      console.log("订单列表:", res)
      if (res.data.status == "00") {
        let [...orderInfo] = res.data.infos.map((element, index, Array) => {
          let overTime = utils.judgeTime(element[14])
          element[15] = overTime;
          return element;
        })
        that.setData({
          orderInfos: orderInfo
        })
        wx.hideLoading();
      } else {
        utils.alert(res.data.resultMsg)
      }
    })
  },
  getBookList() {
    let that = this
    postAjax({
      url: "interfaceAction",
      // method: 'POST',
      data: {
        interId: '20111',
        version: 1,
        authKey: wx.getStorageSync('authKey'),
        method: 'p-history-list',
        params: {
          // channelId: app.globalData.channelId,
          // state: that.data.state,
          page: that.data.page,
          size: that.data.size
        }
      }
    }).then((res) => {
      // console.log("书屋列表:", res)
      if (res.data.status == "00") {
        let {
          products
        } = res.data
        if (products.length < that.data.size) {
          that.setData({
            hasMoreData: false
          })
        }
        that.setData({
          orderInfos: products
        })
      } else {
        utils.alert(res.data.resultMsg)
      }
    })
  },
  //滚动触发
  scroll: function() {
    var that = this;
    // console.log("下滑加载更多")
    // that.setData({ page: that.data.page + 1 })
    // that.getOrderList();
  },
  //  onReachBottom || loadMoreData
  onReachBottom() {
    var that = this;
    console.log("下滑加载更多111");
    if (this.data.hasMoreData) {
      that.data.page++
        postAjax({
          url: "interfaceAction",
          data: {
            interId: '20111',
            version: 1,
            authKey: wx.getStorageSync('authKey'),
            method: 'p-history-list',
            params: {
              page: that.data.page,
              size: that.data.size
            }
          }
        }).then((res) => {
          console.log("订单列表:", res)
          if (res.data.status == "00") {
            let [...orderInfo] = res.data.products
            if (res.data.products < that.data.size) {
              setTimeout(() => {
                that.setData({
                  orderInfos: that.data.orderInfos.concat(orderInfo),
                  hasMoreData: false
                })
                wx.hideLoading();
              }, 500)
            } else {
              setTimeout(() => {
                that.setData({
                  orderInfos: that.data.orderInfos.concat(orderInfo),
                  hasMoreData: true,
                  page: that.data.page
                })
                wx.hideLoading();
              }, 500)
            }
          } else {
            utils.alert(res.data.resultMsg)
          }
        })
    } else {
      wx.showToast({
        title: '没有更多了',
        icon: "none"
      })
    }
  },
  //取消订单
  toCancel: function(e) {
    var that = this
    var orderCode = e.currentTarget.dataset.orderid
    var index = e.currentTarget.dataset.index

    wx.showModal({
      title: '',
      content: '大米正在努力生成\r\n确定取消订单？',
      cancelColor: "#333333",
      confirmColor: "#4AC995",
      success: function(res) {
        if (res.confirm) {
          console.log('用户点击确定')
          //发送到后台同步订单取消状态
          postAjax({
            url: 'interfaceAction',
            data: {
              interId: '20320',
              version: 1,
              authKey: wx.getStorageSync('authKey'),
              method: 'order-cancel',
              strParam: orderCode
            },
            success: (res) => {
              console.log(res)
              // const { infos } = res
              if (res.status === '00') {
                if (res.res == 1) {
                  wx.showToast({
                    title: '订单已取消',
                    icon: 'success',
                    duration: 1000,
                    success: (res) => {
                      // that.setData({
                      //   orderInfos: [], //数据源清空
                      //   page: 1
                      // })
                      // that.getOrderList()
                      var orderInfos = that.data.orderInfos
                      orderInfos.splice(index, 1);
                      that.setData({
                        orderInfos: orderInfos
                      })
                    }
                  })
                }
              } else {
                utils.alert(res.resultMsg)
              }
            }
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },
  //支付
  toPay: function(e) {
    var that = this;
    var orderId = e.currentTarget.dataset.orderid;

    postAjax({
      url: "interfaceAction",
      // method: 'POST',
      data: {
        interId: '20322',
        version: 1,
        authKey: wx.getStorageSync('authKey'),
        params: {
          orderId: orderId
        }
      },
    }).then((res) => {
      if (res.data.status == '00') {
        var weVal = res.data.pay;
        if (weVal) {
          wx.requestPayment({
            timeStamp: weVal.timeStamp,
            nonceStr: weVal.nonceStr,
            package: weVal.package,
            signType: 'MD5',
            signType: weVal.signType,
            paySign: weVal.paySign,
            success: function(info) {
              console.log("pay success")
              console.log(info)
              that.syncPay(res.data.orderId, 1)
              that.setData({
                orderInfos: [], //数据源清空
                page: 1
              })
              that.getBookList();
            },
            fail: function(fail) {
              console.log(fail)
              if (fail.errMsg == "requestPayment:fail cancel") {
                console.log("取消")
              } else {
                console.log("失败")
                // that.syncPay(res.data.orderId, 0)
              }
            },
            complete: function(complete) {
              console.log('complete')

            }
          })
        }
      } else {
        utils.alert(res.data.resultMsg)
      }
    })
  },
  // 同步前端支付
  syncPay: function(orderId, payStatus) {
    postAjax({
      url: "interfaceAction",
      method: 'POST',
      data: {
        interId: '20323',
        version: 1,
        authKey: wx.getStorageSync('authKey'),
        params: {
          orderId: orderId,
          payStatus: payStatus
        }
      },
    }).then((res) => {
      console.info(res.data)
      if (res.data.status == '00') {

      } else {
        utils.alert(res.data.resultMsg)
      }
    })
  },
  //再次购买
  buyAgain: function(e) {
    // 跳转至福利详情
    let inviterObjId = e.currentTarget.dataset.goodsid;

    wx.navigateTo({
      url: `/pages/detail/detail?inviterObjId=${inviterObjId}`
    })

  },
  //提醒发货
  remindShipments: function(e) {
    wx.showToast({
      title: '已提示卖家发货',
      duration: 1000
    })
  },
  //确认收货
  confirmReceive: function(e) {
    var that = this
    console.log(e)
    var orderCode = e.currentTarget.dataset.orderid
    wx.showModal({
      title: '',
      content: '请确认是否收到货物',
      success: function(res) {
        if (res.confirm) {
          console.log('用户点击确定')
          //确认收货接口
          postAjax({
            url: "interfaceAction",
            // method: 'POST',
            data: {
              interId: '20321',
              version: 1,
              authKey: wx.getStorageSync('authKey'),
              method: 'order-delivery',
              params: {
                channelId: app.globalData.channelId,
                orderNo: orderCode
              }
            },
          }).then((res) => {
            console.log("收货成功:", res)

            if (res.data.status == "00") {
              if (res.data.success) {
                wx.showToast({
                  title: '已收货',
                  icon: "none"
                })
                that.setData({
                  orderInfos: [], //数据源清空
                  page: 1
                })
                //刷新数据
                that.getBookList();
              }
            } else {
              utils.alert(res.data.resultMsg)
            }
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },
  // 查看物流按钮
  viewShipping(e) {
    var orderid = e.currentTarget.dataset.orderid;
    wx.navigateTo({
      url: `/pages/my/order_detail/order_detail?orderid=${orderid}&shipping=true`
    })
  },
  //进入详情订单
  detailOrder: function(e) {

    let {
      pid,
      bookid
    } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/audio_detail/audio_detail?pid=${pid}&bookid=${bookid}`
    })
  },
  toCutDown(e) {
    let orderid = e.currentTarget.dataset.orderid;
    wx.navigateTo({
      url: '/pages/cut_down/cut_down?orderid=' + orderid
    })
  },
  // 底部导航
  toTabMy() {
    wx.switchTab({
      url: '/pages/my/my'
    })
  },
  toTabBookShelf() {
    wx.switchTab({
      url: '/pages/orderlist/orderlist'
    })
  },
  toTabShopMall() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },
  toTabReading() {
    wx.switchTab({
      url: '/pages/reading/reading'
    })
  },
  onChangeTab() {

  },
  // 开通会员卡提示
  openMenCard() {
    this.setData({
      isMenCard: true
    })
  },
  // 展示剩余免费时长
  showFreeTimeModal() {
    this.setData({
      firstfreeTimeModal: true
    })
  },
  // 剩余免费听书时间
  getFreeTime() {
    let that = this
    return new Promise((resolve, reject) => {
      postAjax({
        url: "interSyncAction",
        method: 'POST',
        data: {
          interId: '20400',
          version: 1,
          authKey: wx.getStorageSync('authKey'),
          method: 'book-surplus',
          params: {

          }
        },
      }).then((res) => {
        if (res.data.status == "00") {
          let s = res.data.second > 0 ? res.data.second : 0
          let min = Number(Math.floor(s / 60)) + Number((s % 60 / 60).toFixed(2))
          console.log(min)
          that.setData({
            freeSec: s,
            freeMin: min
          })
          app.globalData.freeSec = s
          app.globalData.freeMin = min
          resolve(res.data);
        } else {
          reject(res.data.resultMsg)
        }
      })
    })
  }
})