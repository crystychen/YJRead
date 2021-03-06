import { postAjax } from '../../utils/ajax.js';
const utils = require('../../utils/util.js');
var app = getApp();

Page({

    /**
     * 页面的初始数据
     */
    data: {
        orderInfo: "", // 订单信息
        hasShippingInfo: false, //是否有物流信息
        starIndex1: 0
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        console.log(options);
        var that = this
        if (!!options.shipping) {
            that.setData({
                shipping: true
            })
        }
        wx.getSystemInfo({
            success: (res) => {
                this.setData({
                    pixelRatio: res.pixelRatio,
                    windowHeight: res.windowHeight,
                    windowWidth: res.windowWidth
                })
            }
        })
        app.visitorLogin(function(uinfo) {

            // options.orderid 订单Id
            that.getOrderDetail(options.orderid)
        })

    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {

    },
    // 订单详情
    getOrderDetail(orderid) {
        let that = this

        postAjax({
            url: "interfaceAction",
            data: {
                interId: '20321',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'order-detail',
                params: {
                    orderNo: orderid
                }
            }
        }).then((res) => {
            console.log("订单详情")
            console.log(res)
            if (res.data.status === '00') {
                that.setData({
                    orderInfo: res.data.detail
                })
            } else {
                console.log('------')
                console.log(res.data.resultMsg)
            }
        })
    },
    //提醒发货
    remindOf: function() {
        wx.showToast({
            title: '已提示卖家发货',
            duration: 1000
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
            }
        }).then((res) => {
            console.info(res.data)
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
            // method: 'POST',
            data: {
                interId: '20323',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                params: {
                    orderId: orderId,
                    payStatus: payStatus
                }
            },
        }).thne((res) => {
            console.info(res.data)
            if (res.data.status == '00') {

            } else {
                utils.alert(res.data.resultMsg)
            }
        })
    },
    //再次购买
    buyAgain: function(e) {
        // 跳转至福利产品详情
        let inviterObjId = e.currentTarget.dataset.goodsid;
        // ----------------------------------------------------------
        wx.navigateTo({
            url: `/pages/detail/detail?inviterObjId=${inviterObjId}`
        })

    },
    toGoodsDetail(e) {
        // 跳转至福利产品详情
        let inviterObjId = e.currentTarget.dataset.goodsid;

        wx.navigateTo({
            url: `/pages/detail/detail?inviterObjId=${inviterObjId}`
        })
    },
    //确认收货
    confirmReceive: function(e) {
        var that = this
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
                                that.getOrderDetail(orderCode)
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
    //复制单号
    copyOrder: function(e) {
        //复制的订单/运单编号 orderCode
        let orderCode = e.currentTarget.dataset.code
        console.log(e);
        wx.setClipboardData({
            data: orderCode,
            success: function(res) {
                wx.showToast({
                    title: '已复制',
                    icon: 'none'
                })
            }
        })
    },
    // 物流服务
    onChangeShippingRate(e) {
        console.log(e)

        const value = e.detail.value;
        this.setData({
            logisticsRate: value
        })
    },
    // 商品质量
    onChangeQualityRate(e) {
        console.log(e)
        const value = e.detail.value;
        this.setData({
            qualityRate: value
        })
    },
    // 提交评分
    confirmComment(orderCode) {
        let { logisticsRate, qualityRate } = this.data
        let { orderNo } = this.data.orderInfo
        let that = this

        postAjax({
            url: "interfaceAction",
            data: {
                interId: '20321',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'order-evaluate',
                params: {
                    channelId: app.globalData.channelId,
                    remark: "",
                    logisticsRate: logisticsRate,
                    qualityRate: qualityRate,
                    orderNo: orderNo
                }
            },

        }).then((res) => {
            console.log("评分提交:", res)

            if (res.data.status == "00") {
                that.getOrderDetail(orderNo)
            } else {
                utils.alert(res.data.resultMsg)
            }
        })
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {

    }
})