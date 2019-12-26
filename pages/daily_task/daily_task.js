// pages/daily_task/daily_task.js
//index.js
import {
    postAjax
} from '../../utils/ajax.js';
import {
    postAjaxS
} from '../../utils/ajax.js';
const app = getApp()
var runTime = Date.now(); //启动时间
const aldstat = require('../../utils/sdk/ald-stat.js');


Page({

    /**
     * 页面的初始数据
     */
    data: {
        page: 1,
        size: 10
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        let that = this
        wx.getSystemInfo({
            success: (res) => {
                this.setData({
                    pixelRatio: res.pixelRatio,
                    windowHeight: res.windowHeight,
                    windowWidth: res.windowWidth
                })
            }
        })
        app.globalData.undone = true
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

            app.getShareData(4); //转发语
            that.getSignInfo(function(res) {
                console.log("是否需要签到, res为false不需要，true需要签到") // res为false不需要，true需要签到
                console.log(res)
                    // if (res) {
                    //   that.setData({
                    //     isSignedModal: true // 未签到弹出签到层
                    //   })
                    // }
            });
            that.getTasksList()
            that.getAwardRules()
            if (wx.getStorageSync('authLevel') == 2) {
                app.getAccount();

            }

        });
        app.aldstat.sendEvent('每日任务页加载时间', {
            time: Date.now() - runTime
        })
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
                shareurl,
                shareartid,
                id
            } = res.target.dataset;
            let target_id = res.target.id;
            if (target_id === 'item-share') {
                // app.userShareRecord(4, id)
                // setTimeout(function() {
                //     that.getTasksList()
                // }, 2000)
                return {
                    title: that.data.shareData[0][1],
                    path: `${that.data.shareData[0][4] || "/pages/index/index"}?unionId=${unionId}&cid=${channelId}&inviterUserId=${userId}&inviterType=4&inviterObjId=${id}`,
                    imageUrl: that.data.shareData[0][3],
                }
            }
            if (target_id === 'item-invite') {
                return {
                    title: that.data.shareData[0][1],
                    path: `${that.data.shareData[0][4] || "/pages/index/index"}?unionId=${unionId}&cid=${channelId}&inviterUserId=${userId}&inviterType=4&inviterObjId=${id}`,
                    imageUrl: that.data.shareData[0][3],
                }
            }

        }
        return {
            title: that.data.shareData[0][1],
            path: `${that.data.shareData[0][4] || "/pages/index/index"}?unionId=${unionId}&cid=${channelId}&inviterUserId=${userId}&inviterType=4&shareurl=${shareurl}&shareartid=${shareartid}`,
            imageUrl: that.data.shareData[0][3],
        }
    },
    toShareDetail(e) {
        let {
            id
        } = e.currentTarget.dataset
        wx.navigateTo({
            url: `/pages/share_detail/share_detail?inviterObjId=${id}`
        })

    },
    // 授权用户登录
    onGotUserInfo: function(e) {
        var that = this
        console.log(e)
        let {
            id
        } = e.currentTarget.dataset
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

            that.signIn();
            app.getAccount(); // 获取账户信息

        });
    },
    // 获取任务列表
    getTasksList() {
        let that = this
        postAjax({
            url: 'interfaceAction',
            data: {
                interId: '20102',
                version: 2,
                authKey: wx.getStorageSync('authKey'),
                method: 'task-list'
            }
        }).then((res) => {
            if (res.data.status == '00') {
                let taskdata = res.data.infos;
                let dailyTasks = []
                let onceTasks = []
                let isToReceive = ""
                taskdata.map(function(element, index, array) {
                    // 类型处理(单次2与每日1)
                    // 处理时长
                    if (element[13]) {
                        let min = Math.floor(element[13] / 60)
                        element[13] = min + "分钟"
                    }
                    // 判断是否有可领取任务
                    if (element[10] == 0 && element[4] >= element[3]) {
                        let obj = {}
                        obj.taskid = element[0]
                        obj.award = element[8] || element[9];
                        isToReceive = obj
                    }
                    switch (element[12]) {
                        case 1:
                            if (element[1] != 1) {
                                dailyTasks.push(element)
                            }
                            break;
                        case 2:
                            // if (element[1] != 1) {
                            onceTasks.push(element)
                                // }
                            break;
                        default:
                            console.log("default");
                    }
                    return element;
                });

                that.setData({
                    dailyTasks,
                    onceTasks,
                    isToReceive
                })
            }
        })
    },
    // 获取奖励规则
    getAwardRules() {
        let that = this
        postAjax({
            url: 'interfaceAction',
            data: {
                interId: '20104',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'reward-list'
            }
        }).then((res) => {
            if (res.data.status == '00') {
                let rewardList = res.data.infos;
                that.setData({
                    rewardList
                })
            }
        })
    },
    // 文章列表
    getArticleList(groupId, callback) {
        var that = this;
        postAjax({
            url: 'interfaceAction',
            data: {
                interId: '20510',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'content-list',
                params: {
                    groupId,
                    page: that.data.page,
                    size: that.data.size,
                    contentType: 1
                }
            }
        }).then((res) => {
            if (res.data.status == '00') {
                let {
                    contentList
                } = res.data;
                that.setData({
                    contentList
                })
                callback && callback(res)
            }
        })
    },
    toRead() {
        // wx.navigateBack({
        //     delta: 1
        // })
        wx.switchTab({
            url: '/pages/reading/reading'
        })
    },
    // 签到
    signIn: function(e) {
        var that = this
            // console.log("签到", e)
        if (!!e) {
            app.postFormId(e.detail);
        }
        if (!that.data.isSigned) {
            return;
        }
        wx.request({
            url: app.globalData.url + "interfaceAction",
            method: 'POST',
            data: {
                interId: '20100',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'sign-in',
                params: {
                    channelId: app.globalData.channelId
                }
            },
            success: res => {
                console.log("++签到成功++");
                console.log(res);
                if (res.data.status == "00") {
                    // 签到提示
                    if (res.data.success) {
                        let {
                            gold,
                            money
                        } = res.data
                        that.setData({
                            signAward: {
                                gold,
                                money
                            },
                            isSigned: false,
                            tipsModal: true,
                            isSignedModal: false
                        })

                        // that.checkFirstSign() // false为首次签到, true为老用户签到(请求异步)       
                        that.getSignInfo(); // 刷新签到列表
                        app.getAccount();
                    }

                } else {
                    utils.alert(res.data.resultMsg)
                }
            },
            fail: res => {

            }
        })
    },
    // 是否签到
    isSigned: function() {
        let signInfo = this.data.signInfo.filter(function(item) { //过滤，返回新数组（需要签到的信息）
            return item.issign == 2
        });
        console.log(signInfo);
        let issign = signInfo.length > 0 ? signInfo : false;
        return issign;
    },
    // 签到天数
    getIsSignDays: function() {
        let issignInfo = this.data.signInfo.filter(function(item) {
            return item.issign == 1
        });
        let signDays = issignInfo.length || 0;
        return signDays;
    },
    // 已签信息
    getSignedDays: function() {
        let issignInfo = this.data.signInfo.filter(function(item) {
            return item.issign == 1
        });
        let signedInfos = issignInfo || 0;
        return signedInfos;
    },
    // 获取签到信息
    getSignInfo: function(callback) {
        var that = this
        wx.request({
            url: app.globalData.url + "interfaceAction",
            method: 'POST',
            data: {
                interId: '20100',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'sign-list',
                params: {
                    channelId: app.globalData.channelId
                }
            },
            success: res => {
                console.log("++签到信息++");
                console.log(res);
                if (res.data.status == "00") {
                    that.setData({
                        signInfo: res.data.infos
                    }, function() {
                        var signDays = that.getIsSignDays();
                        var isSigned = that.isSigned();
                        var signedDays = that.getSignedDays();
                        that.setData({
                            signDays,
                            isSigned,
                            signedDays
                        })
                        if (callback) {
                            callback(isSigned);
                        }
                    })
                } else {
                    utils.alert(res.data.resultMsg)
                }
            },
            fail: res => {

            }
        })
    },
    hideInviteList() {
        this.setData({
            isInviteList: false
        })
    },
    showInviteList() {
        this.setData({
            isInviteList: true
        })
        this.getArticleList()
    },
    // 分享面板
    hideShareBoard() {
        this.setData({
            isShareBoard: false
        })
    },
    showShareBoard(e) {
        let {
            shareurl,
            shareartid
        } = e.currentTarget.dataset
        console.log(e)
        this.setData({
            isShareBoard: true,
            putshareurl: shareurl,
            putshareartid: shareartid
        })
    },
    // 专属海报
    showPosterModal() {
        this.setData({
            isPosterModal: true
        })
    },
    showSignModal() {
        this.setData({
            isSignedModal: true
        })
    },
    toShopMall() {
        // wx.navigateBack({
        //     delta: 1
        // })
        wx.switchTab({
            url: '/pages/index/index'
        })
    },
    // 领取
    onReceive: function(e, obj) {
        let that = this,
            taskId, award;

        if (!!e) {
            // app.postFormId(e.detail.formId); // 提交formId
            taskId = e.currentTarget.dataset.taskid
            award = e.currentTarget.dataset.award;
            // award = award.replace("/\+/g", "")
            wx.showToast({
                title: `获得${award}书签`,
                icon: 'none',
                success: function() {}
            })
        }
        if (!!obj) {
            taskId = obj.taskid;
            award = obj.award;
            // award = award.replace("/\+/g", "");
            wx.showModal({
                title: '',
                content: `任务完成，获得${award}书签`,
                showCancel: false
            })
        }
        wx.request({
            url: app.globalData.url + "interfaceAction",
            method: 'POST',
            data: {
                interId: '20102',
                version: 2,
                authKey: wx.getStorageSync('authKey'),
                method: 'task-finish',
                params: {
                    taskId: taskId,
                    channelId: app.globalData.channelId
                }
            },
            success: res => {
                if (res.data.status == "00") {

                    that.getTasksList();
                    app.getAccount();
                    that.getSignInfo(function(res) {}); // 签到信息

                } else {
                    utils.alert(res.data.resultMsg)
                }
            },
            fail: res => {}
        })

    },
})