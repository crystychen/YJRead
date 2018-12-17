// pages/my/my.js
import {
    postAjax
} from '../../utils/ajax.js';
const utils = require('../../utils/util.js');
const app = getApp()
var runTime = Date.now(); //启动时间
const aldstat = require('../../utils/sdk/ald-stat.js');


Page({

    /**
     * 页面的初始数据
     */
    data: {
        viewCount: 0,
        validViewCount: 0,
        todaygold: 0,
        isVip: false,
        userVip: false,
        currentTab: 3,
        gold: 0,
        ordernum: 0
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
      wx.hideTabBar()

    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {
        wx.hideTabBar({
            fail: function() {
                setTimeout(function() { // 做了个延时重试一次，作为保底。
                    wx.hideTabBar()
                }, 500)
            }
        })
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {
        let that = this
        wx.hideTabBar()

        this.setData({
            currentTab: 3
        })
        app.loginGetUserInfo(function(uinfo) {
            that.setData({
                userInfo: uinfo,
                authLevel: wx.getStorageSync('authLevel')
            });
            app.getShareData(4); // 转发语
            that.getCollectList(); // 收藏数
            that.getTotalOrder() // 书架数量
            app.getTasksList() // 是否可领取任务

            if (wx.getStorageSync('authLevel') == 2) {
                app.getAccount();
                that.getTodayNumber(); // 今日数量
                app.getUserVipList().then(res => {
                    console.log(res)
                    let length = res.data.infos.length
                    if (length) {
                        that.setData({
                            userVip: true
                        })
                    }
                })
                app.getUserVip().then((res) => {
                    let VipEndTime = "",
                        overDate = "";
                    if (res.data.endTime) {
                        VipEndTime = res.data.endTime.substr(0, 10);
                        overDate = utils.judgeTime(res.data.endTime)
                        if (overDate) {
                            VipEndTime = false
                        }
                    }

                    that.setData({
                        isVip: res.data.isVip,
                        VipEndTime
                    })
                })
            }

        });

        app.aldstat.sendEvent('我的页面加载时间', {
            time: Date.now() - runTime
        })
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
    // 授权用户登录
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

            app.getAccount(); // 获取账户信息

        });
    },
    toMyCollect() {
        wx.navigateTo({
            url: '/pages/my_collect/my_collect',
        })
    },
    toOrderList() {
        wx.navigateTo({
            url: '/pages/orderlist/orderlist',
        })
    },
    toDailyTask() {
        wx.navigateTo({
            url: '/pages/daily_task/daily_task',
        })
    },
    getTodayNumber() {
        let that = this
        postAjax({
                url: 'interfaceAction',
                data: {
                    interId: '20005',
                    version: 1,
                    authKey: wx.getStorageSync('authKey'),
                    method: 'user-today-action'
                }
            }).then((res) => {
                if (res.data.status == '00') {
                    let {
                        validViewCount,
                        viewCount
                    } = res.data;
                    that.setData({
                        viewCount,
                        validViewCount
                    })
                }
            })
            //今日阅读获得书签
        postAjax({
            url: 'interfaceAction',
            data: {
                interId: '20005',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'user-today-gold'
            }
        }).then((res) => {
            if (res.data.status == '00') {
                let {
                    gold
                } = res.data;
                that.setData({
                    todaygold: gold
                })
            }
        })
    },
    // 书架总数
    getTotalOrder() {
        let that = this
        postAjax({
            url: 'interfaceAction',
            data: {
                interId: '20321',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'order-count'
            }
        }).then((res) => {
            if (res.data.status == '00') {

                let ordernum = res.data.count;
                that.setData({
                        ordernum
                    })
                    // callback && callback()
            }
        })
    },
    // 收藏
    getCollectList(callback) {
        let that = this
        postAjax({
            url: 'interfaceAction',
            data: {
                interId: '20510',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'content-collect-list'
            }
        }).then((res) => {
            if (res.data.status == '00') {

                let collectNum = res.data.total;
                that.setData({
                    collectNum
                })
                callback && callback()
            }
        })
    },
    // 领取卡片
    bindReceive() {
        this.setData({
            isMenCard: true
        })
    },
    toTabMy() {
        wx.switchTab({
            url: '/pages/my/my'
        })
    },
    toTabIndex() {
        wx.switchTab({
            url: '/pages/index/index'
        })
    },
    toTabShopMall() {
        wx.switchTab({
            url: '/pages/shopMall/shopMall'
        })
    },
    toTabReading() {
        wx.switchTab({
            url: '/pages/reading/reading'
        })
    },
    onChangeTab() {

    }
})