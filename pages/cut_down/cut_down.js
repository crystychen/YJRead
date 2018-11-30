// pages/cut_down/cut_down.js
import { postAjax } from '../../utils/ajax.js';
const utils = require('../../utils/util.js');
import { $wuxCountDown } from '../../components/dist/index'

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
        that.setData({
            orderid: options.orderid,
            sharetime: options.sharetime || ""
        })
        wx.getSystemInfo({
                success: (res) => {
                    this.setData({
                        pixelRatio: res.pixelRatio,
                        windowHeight: res.windowHeight,
                        windowWidth: res.windowWidth
                    })
                }
            })
            // app.visitorLogin(function(uinfo) {
            //     that.setData({
            //         userInfo: uinfo,
            //         authLevel: wx.getStorageSync('authLevel')
            //     });
            //     // options.orderid 订单I

        // })
        app.loginGetUserInfo(function(uinfo) {
            that.setData({
                userInfo: uinfo,
                authLevel: wx.getStorageSync('authLevel')
            });
            that.getOrderDetail(options.orderid)
            that.getCutDetail(options.orderid) // 获取砍价明细
            app.getShareData(4)

            // that.orderBargain(options.orderid, 1) // 砍第一刀
            if (wx.getStorageSync('authLevel') == 2) {
                app.getAccount();
            }

        });

    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {

    },
    preventDefault() {
        return false;
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
            // console.log("订单详情")
            // console.log(res)
            if (res.data.status === '00') {
                that.setData({
                        orderInfo: res.data.detail,
                        productId: res.data.detail.productId
                    })
                    // 倒计时
                that.countTime = new $wuxCountDown({
                    date: res.data.detail.expiryTime,
                    onEnd() {
                        // 时间结束
                        that.setData({
                            timeOver: true
                        })
                    },
                    render(date) {
                        // const years = this.leadingZeros(date.years, 4) + ' - '
                        // const days = this.leadingZeros(date.days, 3) + ' - '
                        const hours = this.leadingZeros(date.hours, 2)
                        const min = this.leadingZeros(date.min, 2)
                        const sec = this.leadingZeros(date.sec, 2)

                        that.setData({
                            hours,
                            min,
                            sec
                        })
                    },
                })
            } else {
                console.log('------')
                console.log(res.data.resultMsg)
            }
        })
    },
    // 砍价详情
    getCutDetail(orderid) {
        let that = this

        postAjax({
            url: "interfaceAction",
            data: {
                interId: '20321',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'order-bargain-detail',
                params: {
                    orderNo: orderid
                }
            }
        }).then((res) => {
            if (res.data.status === '00') {
                // 处理砍价类型、
                let bargainDetails = res.data.bargain.details.map((element, index, item) => {
                    element.bargainType = that.bargainType(element.bargainType)
                    return element;
                })
                let percent = (res.data.bargain.haveBargainGold / res.data.bargain.gold) * 100
                that.setData({
                    bargain: res.data.bargain,
                    bargainDetails,
                    percent
                })
                console.log(bargainDetails)
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
    onShareAppMessage: function(res) {
        var that = this;
        var {
            unionId,
            channelId
        } = app.globalData;
        console.log(unionId);
        const {
            userId
        } = wx.getStorageSync('userInfo');
        if (res.from == "button") {
            console.log(res)
            let {
                pid,
                sharetime
            } = res.target.dataset;

            let target_id = res.target.id;
            if (target_id === 'first-share') {
                return {
                    title: that.data.shareData[0][1],
                    path: `${that.data.shareData[0][4] || "/pages/index/index"}?cid=${channelId}&orderid=${that.data.orderid}&sharetime=${sharetime}`,
                    imageUrl: that.data.shareData[0][3],
                    complete: res => {
                        console.log(res)
                        if (res.errMsg == 'shareAppMessage:ok') {
                            console.log("首次分享成功")
                            that.orderBargain(that.data.orderid, sharetime, (res) => {
                                // 分享成功后提示操作并刷新页面
                                that.setData({
                                    firstPopup: true,
                                    cutGold: res.data.gold
                                })
                                that.getCutDetail(that.data.orderid);
                            })
                        } else {
                            console.log("分享失败")
                        }
                    }
                }
            }
            // 好友帮砍分享
            if (target_id === 'share-cut') {
                return {
                    title: that.data.shareData[0][1],
                    path: `/pages/cut_down/cut_down?cid=${channelId}&inviterUserId=${userId}&inviterType=3&inviterObjId=${pid}&orderid=${that.data.orderid}&sharetime=${sharetime}`,
                    imageUrl: that.data.shareData[0][3],
                    complete: res => {
                        console.log(res)
                        if (res.errMsg == 'shareAppMessage:ok') {

                        }
                    }
                }
            }


        }
        return {
            title: that.data.shareData[0][1],
            path: `${that.data.shareData[0][4] || "/pages/index/index"}?cid=${channelId}&unionId=${unionId}&inviterType=0`,
            imageUrl: that.data.shareData[0][3],
        }
    },
    // 处理砍价类型
    bargainType(btype) {
        let text = ""
        switch (btype) {
            case 1:
                text = "发起砍价"
                break;
            case 2:
                text = "首次分享"
                break;
            case 3:
                text = "用户帮砍"
                break;
            default:
                break;
        }
        return text
    },
    //  砍一刀
    orderBargain(orderid, bargainType, callback) {
        postAjax({
            url: "interfaceAction",
            method: 'POST',
            data: {
                interId: '20321',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'order-bargain',
                params: {
                    orderNo: orderid,
                    type: bargainType,
                }
            },
        }).then((res) => {
            if (res.data.status == "00") {
                callback && callback(res)
            } else {
                utils.alert(res.data.msg)
            }
        })
    },
    // 提交砍价订单
    postOrderSubmit(e, callback) {
        console.log("解锁订单")
            // 书签判断是否足够
        let { gold, haveBargainGold } = this.data.bargain;
        let orderid = this.data.orderid;
        let needgold = gold - haveBargainGold // 还需要支付的书签
        if (this.data.gold < needgold) {
            this.setData({
                EvegoldModal: true
            })
            return;
        }
        postAjax({
            url: "interfaceAction",
            method: 'POST',
            data: {
                interId: '20321',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'order-bargain-submit',
                params: {
                    orderNo: orderid
                }
            },
        }).then((res) => {
            if (res.data.status == "00") {
                callback && callback(res)
                if (res.data.success) {
                    that.setData({
                        successModal: true
                    })
                }
            } else {
                utils.alert(res.data.msg)
            }
        })
    },
    // 授权新用户登录
    onGotUserInfo: function(e) {
        var that = this
        if (!e.detail.userInfo) {
            return;
        }
        app.globalData.iv = e.detail.iv; //先放app的全局变量，然后在其他方法解密
        app.globalData.encryptedData = e.detail.encryptedData; //先放app的全局变量，然后在其他方法解密

        app.uploadUserInfo(function(uinfo) {
            // uinfo后台返回来的
            app.globalData.fromauth = 1;
            console.log("后台返回的unifo:", uinfo)
            that.setData({
                userInfo: uinfo,
                authLevel: wx.getStorageSync('authLevel')
            });

            // 新好友授权后直接砍价
            that.helpCut();

        });
    },
    // 好友帮砍价
    helpCut() {
        this.orderBargain(this.data.orderid, 3, (res) => {
            // 提示砍价成功
            that.orderBargain(that.data.orderid, sharetime, (res) => {
                // 分享成功后提示操作并刷新页面
                that.setData({
                    helpCutPopup: true,
                    cutGold: res.data.gold
                })

            })
        })
    },
    toIndex() {
        wx.switchTab({
            url: "/pages/index/index"
        })
    },
    toAudioDetail() {
        wx.redirectTo({
            url: `/pages/audio_detail/audio_detail?pid=${this.data.productId}`
        })
    },
    toDailyTask() {
        wx.navigateTo({
            url: "/pages/daily_task/daily_task"
        })
    },
    // 书架页面
    toBookShelf() {
        wx.navigateTo({
            url: "/pages/orderlist/orderlist"
        })
    },
    onCloseModal() {
        this.setData({
            EvegoldModal: false
        })
    }
})