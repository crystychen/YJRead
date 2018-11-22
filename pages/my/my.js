// pages/my/my.js
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
        viewCount: 0,
        validViewCount: 0,
        todaygold: 0
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {

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
        let that = this
        app.loginGetUserInfo(function(uinfo) {
            that.setData({
                userInfo: uinfo,
                authLevel: wx.getStorageSync('authLevel')
            });
            app.getShareData(4); // 转发语
            that.getCollectList();
            if (wx.getStorageSync('authLevel') == 2) {
                app.getAccount();
                that.getTodayNumber(); // 今日数量
            }

        });
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
    bindReceive() {}
})