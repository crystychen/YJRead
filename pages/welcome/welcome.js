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

        bookTypes: [],
        radioValue: [],
        products: [],
        navHeight: app.globalData.navHeight
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {

        let that = this

        if (!!wx.getStorageSync("isSelected")) {
            wx.switchTab({
                url: '/pages/index/index',
            })
        }

        app.visitorLogin(function(uinfo) {
            that.setData({
                    authLevel: wx.getStorageSync("authLevel"),
                    userInfo: wx.getStorageSync('userInfo')
                })
                // 获取图书类型列表
            that.getBookTypes()
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
    // 用户授权
    onGotUserInfo(e) {
        let that = this
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

        });
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
        wx.setStorageSync('isSelected', "1")
        let that = this
            // 转化数组为字符串
        let bookTypeIds = this.data.radioValue.join(",")
        console.log(bookTypeIds)
            // 设置用户感兴趣类型并跳转到首页
        that.postUserSetting(bookTypeIds).then(() => {
            wx.switchTab({
                url: "/pages/index/index"
            })
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
        let {
            id
        } = e.currentTarget.dataset
            // 自动下单进入音频详情页
            // this.postOrderSubmit(id, function() {
        wx.navigateTo({
                url: `/pages/audio_detail/audio_detail?pid=${id}`
            })
            // })
    },
    getBookTypes() {
        let that = this
        postAjax({
            url: "interSyncAction",
            method: 'POST',
            data: {
                interId: '20400',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'book-type-list',
                params: {
                    "type": 1 //  0 - 所有类型； 1 - 去除附加类型
                }
            },
        }).then((res) => {
            if (res.data.status == "00") {
                let {
                    bookTypes
                } = res.data
                that.setData({
                    bookTypes
                })
            } else {
                utils.alert(res.data.msg)
            }
        })
    },
    postUserSetting(value) {
        // 用户感兴趣类型设置
        return new Promise((resolve, reject) => {
            postAjax({
                url: 'interfaceAction',
                data: {
                    interId: '20005',
                    version: 1,
                    authKey: wx.getStorageSync('authKey'),
                    method: 'user-interested-book-type',
                    params: {
                        bookTypeIds: value
                    }
                }
            }).then((data) => {
                if (data.data.status == '00') {
                    resolve(data.data);
                } else {
                    reject(data.data.resultMsg)
                }
            })
        })
    }
    // getPInsterestedList() {
    //     // 感兴趣商品列表
    //     return new Promise((resolve, reject) => {
    //         postAjax({
    //             url: 'interfaceAction',
    //             data: {
    //                 interId: '20111',
    //                 version: 1,
    //                 authKey: wx.getStorageSync('authKey'),
    //                 method: 'p-interested-list'
    //             }
    //         }).then((data) => {
    //             if (data.data.status == '00') {
    //                 resolve(data.data);
    //             } else {
    //                 reject(data.data.resultMsg)
    //             }
    //         })
    //     })
    // }
})