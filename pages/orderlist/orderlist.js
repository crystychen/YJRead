import { postAjax } from '../../utils/ajax.js';
const utils = require('../../utils/util.js');
var app = getApp();
// pages/myself/allorder/allorder.js
Page({
    /**
     * 页面的初始数据
     */
    data: {
        //navTab: ["全部订单", "待付款", "待发货", "待收货", "订单完成"],
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
        isShow: true //没有更多数据标识
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        var that = this;
        var sliderWidth = 60;
        this.setData({
            currentNavtab: options.state || 0,
            state: options.postState || 0
        })
        wx.getSystemInfo({
            success: function(res) {
                that.setData({
                    sliderLeft: (res.windowWidth / that.data.navTab.length - sliderWidth) / 2,
                    sliderOffset: res.windowWidth / that.data.navTab.length * that.data.currentNavtab,
                    scrollHeight: res.windowHeight
                });

            }
        });
        // let that = this
        that.setData({ //由于getOrderList方法中的数据是concat多个，故先清除
                orderInfos: [],
                page: 1
            })
            // wx.showLoading({ //期间为了显示效果可以添加一个过度的弹出框提示“加载中”  
            //   title: '加载中',
            //   icon: 'loading',
            // });
        app.visitorLogin(function(uinfo) {
            //刷新数据
            that.getOrderList();
        });
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
            that.getOrderList();
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
                // if (res.data.infos.length) {
                //   setTimeout(() => {
                //     that.setData({
                //       isShow: true,
                //       orderInfos: that.data.orderInfos.concat(res.data.infos)
                //     })
                //     wx.hideLoading();
                //   }, 500)
                // } else {
                //   setTimeout(() => {
                //     if (that.data.orderInfos <= 0) {
                //       that.setData({
                //         isShow: false
                //       })
                //     }
                //     wx.hideLoading();
                //   }, 500)
                // }
                // let [...arr2] = arr
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
    //滚动触发
    scroll: function() {
        var that = this;
        // console.log("下滑加载更多")
        // that.setData({ page: that.data.page + 1 })
        // that.getOrderList();
    },
    //下滑加载更多
    onReachBottom: function() {
        var that = this;
        console.log("下滑加载更多");
        if (this.data.hasMoreData) {
            that.data.page++
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
                        if (res.data.infos.length <= that.data.size) {
                            let [...orderInfo] = res.data.infos.map((element, index, Array) => {
                                let overTime = utils.judgeTime(element[14])
                                element[15] = overTime;
                                return element;
                            })
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
            })
        }
    },
    bindscrolltolower() {
        var that = this;
        that.setData({

        })
        console.log("下滑加载更多111");
        if (this.data.hasMoreData) {
            that.data.page++
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
                        if (res.data.infos.length <= that.data.size) {
                            let [...orderInfo] = res.data.infos.map((element, index, Array) => {
                                let overTime = utils.judgeTime(element[14])
                                element[15] = overTime;
                                return element;
                            })
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
                            that.getOrderList();
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
                                that.getOrderList();
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
        // let orderid = e.currentTarget.dataset.orderid;
        // wx.navigateTo({
        //     url: '/pages/order_detail/order_detail?orderid=' + orderid
        // })
        let { pid, orderid, bookid } = e.currentTarget.dataset
        wx.navigateTo({
            url: `/pages/audio_detail/audio_detail?orderid=${orderid}&pid=${pid}&bookid=${bookid}`
        })
    },
    toCutDown(e) {
        let orderid = e.currentTarget.dataset.orderid;
        wx.navigateTo({
            url: '/pages/cut_down/cut_down?orderid=' + orderid
        })
    }
})