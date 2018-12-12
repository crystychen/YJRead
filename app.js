//app.js
import {
    postAjax
} from './utils/ajax.js'
const utils = require('./utils/util.js')
const aldstat = require('./utils/sdk/ald-stat.js');
var runTime = Date.now(); //启动时间

App({
    globalData: {
        loginStamp: 0, // 登录时间戳
        iv: null,
        encryptedData: null, // 用户授权码
        authLevel: 0, // 用户授权值
        userInfo: null, // 用户信息
        channelId: 0, // 渠道Id
        shopExtend: '', // 店铺延伸配置信息
        openOnShow: false,
        url: "https://mallapi.ejamad.com/",
        beSyncSelf: 0, // 微信步数
        totalStep: 0, // 总步数
        unionId: '', // 邀请初始化
        isTaskTips: true,
        isReAwardTips: true,
        undone: false
    },
    /**
     * 当小程序初始化完成时，会触发 onLaunch（全局只触发一次）
     */
    onLaunch: function() {
        //隐藏系统tabbar
        wx.hideTabBar();
        // 检查线上版本更新
        const updateManager = wx.getUpdateManager()
        updateManager.onCheckForUpdate(function(res) {
            // 请求完新版本信息的回调
        })
        updateManager.onUpdateReady(function() {
            wx.showModal({
                title: '更新提示',
                content: '新版本已经准备好，是否重启应用？',
                success: function(res) {
                    if (res.confirm) {
                        // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                        updateManager.applyUpdate()
                    }
                }
            })
        })
        updateManager.onUpdateFailed(function() {
            // 新版本下载失败
            wx.showModal({
                title: '更新提示',
                content: '新版本下载失败',
                showCancel: false
            })
        })

    },
    onShow: function(options) {
        //隐藏系统tabbar
        wx.hideTabBar();
        // 记录小程序启动时长
        this.aldstat.sendEvent('小程序的启动时长', {
            time: Date.now() - runTime
        })
    },

    // login
    login() {
        var app = this;
        return new Promise((resolve, reject) => {
            const nt = new Date().valueOf();
            let tinterval = nt - app.globalData.loginStamp;
            if (tinterval < 3600000 && wx.getStorageSync('authKey')) { //利用缓存，直接回调
                console.info("距离上一次登陆:" + tinterval + "ms--不重复登陆");
                resolve([wx.getStorageSync('authLevel'), wx.getStorageSync('userInfo')]);
            } else {
                console.info("距离上一次登陆:" + tinterval + "ms--执行登陆");
                wx.login({
                    success: logres => {
                        // 2.返回code到后台
                        wx.request({
                            url: app.globalData.url + 'interfaceAction',
                            method: 'POST',
                            data: {
                                interId: '20002',
                                version: 1,
                                authKey: wx.getStorageSync('authKey'),
                                // 
                                params: {
                                    shopId: -1,
                                    code: logres.code,
                                    channelId: app.globalData.channelId
                                }
                            },
                            success: res => {
                                console.log('20002')
                                console.log(res);

                                app.aldstat.sendEvent('小程序登录成功', {
                                    time: Date.now() - runTime
                                })

                                if (res.data.status == '00') { //登陆成功记录数据
                                    console.info('登陆成功');

                                    var timestamp = (new Date()).valueOf();
                                    app.globalData.loginStamp = timestamp;
                                    app.globalData.authLevel = res.data.authLevel;
                                    app.globalData.shopExtend = res.data.shopExtend;

                                    wx.setStorageSync('userInfo', res.data.userInfo)
                                    wx.setStorageSync('authKey', res.data.authKey);
                                    wx.setStorageSync('authLevel', res.data.authLevel);
                                    // wx.setStorageSync('authLevel', 1);
                                    wx.setStorageSync('shopRemark', res.data.shopRemark); // 提审版本
                                    wx.setStorageSync('userGuId', res.data.userGuId);

                                    resolve([res.data.authLevel, res.data.userInfo]);
                                } else {
                                    reject(res.data.resultMsg);
                                }
                            }
                        })
                    }
                });
            }
        })
    },
    // getUserInfo解密用户信息
    getUserInfo(arrobj) {
        var app = this;
        return new Promise((resolve, reject) => {
            const authLevel = arrobj[0];
            const uinfo = arrobj[1];
            if (authLevel == 2 && uinfo) { //利用缓存，直接回调
                console.info('getUserInfo-利用缓存，直接回调:authLevel=' + authLevel + ',uinfo=' + uinfo);
                resolve(uinfo);
            } else {
                if (app.globalData.iv && app.globalData.encryptedData) { //已经点过授权，请求后台解密
                    console.log(wx.getStorageSync('authKey'));

                    console.info('getUserInfo-已经点击授权:用户信息提交后台解密');
                    wx.request({
                        url: app.globalData.url + 'interfaceAction',
                        method: 'POST',
                        data: {
                            interId: '20004',
                            version: 3,
                            authKey: wx.getStorageSync('authKey'),
                            params: {
                                iv: app.globalData.iv,
                                uinfo: app.globalData.encryptedData,
                            }
                        },
                        success: res => {
                            console.log('20004')
                            console.log(res);
                            if (res.data.status == '00') {
                                console.info("解密用户信息成功");
                                wx.setStorageSync('authLevel', res.data.authLevel); //设置level
                                app.globalData.authLevel = res.data.authLevel;
                                wx.setStorageSync('userInfo', res.data.userInfo);

                                let pages = getCurrentPages();
                                console.log(pages);
                                let currPage = pages[pages.length - 1];

                                let inviterUserId = currPage.data.inviterUserId || 0;
                                let inviterType = currPage.data.inviterType || 0;
                                let inviterObjId = currPage.data.inviterObjId || 0;

                                // 邀请
                                if (inviterUserId) {
                                    app.recordInviter(inviterUserId, inviterType, inviterObjId).then(function(data) { //login的then  
                                        console.log(data)
                                            // if (data.money > 0) {
                                            //   currPage.showNewRedBag(data);
                                            // }
                                    })
                                }
                                resolve(res.data.userInfo);
                            }
                        }
                    });
                } else { //跳去授权按钮页
                    console.info('getUserInfo-没有加密信息，跳去授权按钮页面');
                    // let pages = getCurrentPages();
                    // console.log(pages);
                    // let currPage = pages[pages.length - 1]; //当前页面

                    // currPage.setData({
                    //   isAuthInfo: true,
                    //   ishongbaonew: true,
                    // })
                    resolve(uinfo);
                }
            }
        })
    },
    // 游客登录
    visitorLogin(logicFn) {
        var app = this;
        app.login()
            .then((data) => {
                if (logicFn != undefined) {
                    logicFn(data);
                }
            })
            .catch((err) => {
                console.log(err);
            })
    },
    // 用户登录并授权
    loginGetUserInfo: function(logicFn) {
        var app = this;
        app.login()
            .then(function(data) { //login的then
                return app.getUserInfo(data);
            })
            .catch(function(data) {
                console.log(data)
            })
            .then(function(data) { //getUserInfo的then
                if (logicFn != undefined) {
                    logicFn(data);
                }
            })
            .catch(function(data) {
                console.log(data);
            })
    },
    // 用户信息授权码上传解密
    uploadUserInfo: function(logicFn) {
        var app = this;
        console.info('上传服务器解密用户信息')
        app.getUserInfo([1, null])
            .then(function(data) {
                if (logicFn != undefined) {
                    logicFn(data);
                }
            })
            .catch(function(data) {
                console.log(data);
            })
    },
    // 记录邀请人Id
    recordInviter: function(userId, inviterType, inviterObjId) {
        console.log("邀请新人进来记录");
        var app = this

        return new Promise(function(resolve, reject) {

            wx.request({
                url: app.globalData.url + "interfaceAction",
                method: 'POST',
                data: {
                    interId: '20005',
                    version: 1,
                    authKey: wx.getStorageSync('authKey'),
                    method: 'user-invited',
                    params: {
                        inviterUserId: userId,
                        inviterType: inviterType,
                        inviterObjId: inviterObjId,
                        channelId: app.globalData.channelId
                    }
                },
                success: res => {
                    console.log("邀请人Id")
                    console.log(res)
                    if (res.data.status == "00") {
                        // money：用户新人红包，
                        // nickName：邀请者名称，
                        // headimgurl：邀请者头像
                        let newUserInfo = {
                            money: res.data.money,
                            nickName: res.data.nickName,
                            headimgurl: res.data.headimgurl
                        }
                        resolve(newUserInfo)
                    } else {
                        reject(res.data.resultMsg);
                    }
                },
                fail: res => {}
            })
        })
    },
    // 提交模板消息formId
    postFormId: function(formId) {
        console.log(formId)
        if (formId == "the formId is a mock one") {
            return;
        }
        var app = this
        postAjax({
            url: "interfaceAction",
            method: 'POST',
            data: {
                interId: '20005',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'user-form',
                params: {
                    formId: formId
                }
            },
        }).then((res) => {
            if (res.data.status == "00") {} else {
                utils.alert(res.data.resultMsg);
            }
        })
    },
    // 获取账号信息(金币，红包)
    getAccount: function(callback) {
        var app = this;
        wx.request({
            url: app.globalData.url + "interfaceAction",
            method: 'POST',
            data: {
                interId: '20005',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'user-account',
                params: {
                    channelId: app.globalData.channelId
                }
            },
            success: res => {
                console.log("app.js账户信息")
                console.log(res)
                if (res.data.status == "00") {
                    let pages = getCurrentPages();
                    let currPage = pages[pages.length - 1]; //获取当前页面
                    currPage.setData({
                        gold: res.data.account.gold,
                        money: res.data.account.money
                            // freezeMoney: res.data.account.freezeMoney  // 冻结金额
                    })
                    callback && callback(res)
                } else {
                    utils.alert(res.data.resultMsg)
                }
            },
            fail: res => {

            }
        })
    },
    // 获取分享信息(廣告列表獲取)
    getShareData: function(position, callback) {
        let app = this
        wx.request({
            url: app.globalData.url + 'interfaceAction',
            method: 'POST',
            data: {
                interId: '20210',
                authKey: wx.getStorageSync('authKey'),
                version: 1,
                method: 'ad-positions',
                params: {
                    position: position,
                    channelId: app.globalData.channelId
                }
            },
            success: res => {
                console.log(`=====ad-positions=====`);
                console.log(res);

                if (res.data.status == "00") {
                    let pages = getCurrentPages();
                    let currPage = pages[pages.length - 1]; //获取当前页面
                    if (position == 4) { // 分享转发语
                        currPage.setData({
                            shareData: res.data.infos
                        })
                    }
                    callback && callback(res)
                } else {
                    utils.alert(res.data.resultMsg)
                }

            }
        })
    },
    // 用户点击分享记录
    userShareRecord(inviterType, inviterObjId) {
        let app = this

        wx.request({
            url: app.globalData.url + "interfaceAction",
            method: 'POST',
            data: {
                interId: '20005',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'user-share',
                params: {
                    inviterType: inviterType,
                    inviterObjId: inviterObjId || 0
                }
            },
            success: res => {
                console.log("app.js分享记录")
                console.log(res)
                if (res.data.status == "00") {} else {
                    // utils.alert(res.data.resultMsg)
                }
            },
            fail: res => {}
        })
    },
    userAction(id, action_type) {
        postAjax({
            url: 'interfaceAction',
            data: {
                interId: '20510',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'content-action',
                params: {
                    action_type: action_type,
                    obj_id: id,
                    channelId: app.globalData.channelId
                }
            }
        }).then((res) => {
            if (res.data.status == '00') {}
        })
    },
    // 会员
    getUserVip: function() {
        let app = this
        return new Promise(function(resolve, reject) {
            wx.request({
                url: app.globalData.url + 'interfaceAction',
                method: 'POST',
                data: {
                    interId: '20005',
                    authKey: wx.getStorageSync('authKey'),
                    version: 1,
                    method: 'user-vip',
                    params: {
                        channelId: app.globalData.channelId
                    }
                },
                success: res => {
                    console.log(`=====user-vip=====`);
                    console.log(res);
                    if (res.data.status == "00") {
                        resolve(res)
                    } else {
                        reject(res.data.resultMsg);
                    }

                }
            })
        })
    },
    // 获取任务列表
    getTasksList(callback) {
        let app = this
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
                let pages = getCurrentPages();
                let currPage = pages[pages.length - 1]; //获取当前页面

                let taskdata = res.data.infos;
                let dailyTasks = []
                let onceTasks = []
                let isToReceive = false
                let undone = ""
                taskdata.map(function(element, index, array) {
                    // 判断是否有可领取任务
                    if (element[10] == 0 && element[4] >= element[3]) {
                        let obj = {}
                        obj.taskid = element[0]
                        obj.award = element[8] || element[9];
                        isToReceive = true
                    }
                    if (element[4] < element[3]) {
                        undone = false
                    }
                    return element;
                });
                console.log(app.globalData.undone)
                if (app.globalData.undone) {
                    undone = true
                }
                console.log(undone)
                currPage.setData({
                    isToReceive,
                    undone
                })
                callback && callback()
            }
        })
    },
})