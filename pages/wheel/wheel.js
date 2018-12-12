var utils = require('../../utils/util.js')
import {
    postAjax,
    postAjaxS
} from '../../utils/ajax.js';
var app = getApp()
var fourRBTimer // 控制四个红包定时器
var runTime = Date.now() //启动时间

// 转盘的奖项的left,top值
const lt = [{
        left: 276,
        top: -12,
        deg: 0
    },
    {
        left: 446,
        top: 114,
        deg: 45
    },
    {
        left: 448,
        top: 314,
        deg: 100
    },
    {
        left: 272,
        top: 400,
        deg: -135
    },
    {
        left: 84,
        top: 312,
        deg: -80
    },
    {
        left: 90,
        top: 100,
        deg: -45
    }
]
Page({

    /**
     * 页面的初始数据
     */
    data: {
        ishongbao: false, // 红包弹层 
        ishongbaoFour: true,
        ishongbaonew: true,
        runNum: 6, // 转盘的数目
        consumeNum: 0 // 消耗的步数
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        this.setData({
            totalStep: app.globalData.totalStep
        })
    },
    onUnload() {
        wx.removeStorageSync('timeStart');
    },
    showrules() {
        this.setData({
            showExplain: true
        })
    },
    hideModal() {
        this.setData({
            showExplain: false
        })
    },
    hidePopupTrial() {
        this.setData({
            showStepAward: false
        })
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {
        var that = this

        app.loginGetUserInfo(function(uinfo) {

                that.setData({
                    userInfo: uinfo,
                    authLevel: wx.getStorageSync('authLevel')
                });

                app.getShareData(4) // 分享转发信息   

                that.LTurn()
                    // that.getMarqueeNews()

                if (wx.getStorageSync('authLevel') == 2) {
                    // that.getTodayIsLottery()
                    app.getAccount()
                }
            })
            // 玩游戏时间
        if (wx.getStorageSync('timeStart')) {
            utils.ToReadTime()
                .then((data) => {
                    that.readTime(data.advert, data.second, data.content_id, data.path);
                })
                .catch((err) => {
                    console.log(err);
                })
        };
    },
    // 点击广告时间
    readTime(advert, second, content_id, path) {
        var that = this;
        postAjax({
                url: 'interfaceAction',
                data: {
                    interId: '70009',
                    version: 1,
                    authKey: wx.getStorageSync('authKey'),
                    method: 'r-rule-click',
                    id: advert,
                    params: {
                        stayTime: second,
                        objType: 1
                    }
                }
            })
            .then((res) => {
                if (res.data.status == '00') {
                    if (res.data.award > 0) {
                        that.setData({
                            showStepAward: true,
                            stepAward: res.data.award
                        })
                    }
                    wx.removeStorageSync('timeStart');
                } else if (res.data.status == '7') {
                    that.setData({
                        showStepFail: true,
                        stepAward: res.data.resultMsg,
                        recordGame: {
                            path,
                            advert,
                            appid: content_id
                        }
                    })
                    wx.removeStorageSync('timeStart');
                }
            })
            .catch((err) => {
                console.log(err);
            })
    },
    // 绘制大转盘
    LTurn() {
        var that = this;

        wx.request({
            url: app.globalData.url + 'interfaceAction',
            method: 'POST',
            data: {
                interId: '20101',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'roulette-list',
                params: {
                    channelId: app.globalData.channelId
                }
            },
            success: res => {
                console.log('====== l-turn ======')
                console.log(res);
                if (res.data.status == '00') {
                    let { dayLimit, dayCount } = res.data
                    that.setData({
                            awardsItem: res.data.infos,
                            consumeNum: res.data.gold,
                            dayLimit,
                            dayCount
                        })
                        // 绘制转盘
                    var AwardsItem = this.data.awardsItem,
                        len = AwardsItem.length,
                        runNum = that.data.runNum,
                        html = [],
                        turnNum = 1 / that.data.runNum // 文字旋转 turn 值

                    for (let i = 0; i < len; i++) {
                        // 奖项列表
                        html.push({
                            turn: i * turnNum + 'turn',
                            award: that.data.awardsItem[i].hint,
                            icon: that.data.awardsItem[i].icon,
                            awardId: that.data.awardsItem[i].prizeId,
                            prizeType: that.data.awardsItem[i].prizeType,
                            left: lt[i].left,
                            top: lt[i].top,
                            deg: lt[i].deg
                        });
                    }
                    if (len < runNum) {
                        for (let i = len; i < runNum; i++) {
                            // 奖项列表
                            html.push({
                                turn: i * turnNum + 'turn',
                                award: "明天再来",
                                icon: "",
                                awardId: 0,
                                left: lt[i].left,
                                top: lt[i].top
                            });
                        }
                    }
                    that.setData({
                        awardsList: html
                    });
                }
            }
        })
    },
    // 再次抽奖时关闭抽奖失败窗口
    getLotteryAgain() {
        this.setData({
            showAwardFail: false
        })
        this.getLottery()
    },
    // 点击转盘抽奖
    getLottery: function(e) {
        let that = this;
        let {
            consumeNum
        } = that.data
        if (!!e) {
            app.postFormId(e.detail.formId)
        }
        console.log(that.data.dayLimit)
        console.log(that.data.dayCount)

        // 是否达到限定次数
        if (that.data.dayLimit <= that.data.dayCount) {
            that.setData({
                dayLimitModal: true
            })
            return;
        }
        // 书签
        if (that.data.gold < consumeNum) {
            that.setData({
                EvegoldModal: true
            })
            return;
        }

        wx.showToast({
            title: `每次抽奖消耗${consumeNum}书签`,
            icon: "none"
        })
        that.data.gold -= consumeNum
        that.setData({
            gold: that.data.gold
        })

        // 抽奖玩法二
        this.LDraw().then((res) => {
            console.log("抽中奖:")
            console.log(res);
            console.log(that.data.awardsList)

            for (let i = 0; i < that.data.awardsList.length; i++) {
                var awardIndex = i;
                if (that.data.awardsList[awardIndex].awardId == res.data.prizeId) {
                    var runNum = that.data.runNum
                        // 旋转抽奖
                    app.runDegs = app.runDegs || 0
                    console.log('deg1', app.runDegs)
                        // awardIndex
                    app.runDegs = app.runDegs + (360 - app.runDegs % 360) + (360 * runNum - awardIndex * (360 / runNum))
                    console.log('deg2', app.runDegs)
                        // 创建动画
                    var animationRun = wx.createAnimation({
                        duration: 4000,
                        timingFunction: 'ease'
                    })
                    that.animationRun = animationRun
                    animationRun.rotate(app.runDegs).step()
                    that.setData({
                        animationData: animationRun.export()
                    })

                    // 中奖提示
                    var timer = setTimeout(function() {

                        app.getAccount(); // 刷新书签
                        that.LTurn()
                        if (res.data.success) {
                            var awardItem = {}
                            awardItem = res.data
                                // 中奖实物
                            if (!!awardItem.rests) {
                                wx.showToast({
                                    title: `恭喜获得${awardItem.rests}, 请联系客服`,
                                    icon: "none"
                                })
                            }
                            // 中奖书签
                            if (awardItem.gold > 0) {
                                that.setData({
                                    AwardPass: true,
                                    awardItem: {
                                        gold: awardItem.gold
                                    },
                                    redState: 2
                                })
                            }
                            // 中奖红包
                            if (awardItem.money > 0) {
                                that.setData({
                                    AwardPass: true,
                                    awardItem: awardItem,
                                    redState: 1
                                })
                            }
                            // 中奖广告
                            if (awardItem.ad) {
                                that.setData({
                                    showAwardAd: true,
                                    awardItemad: awardItem.ad
                                })
                            }
                            // 没有中奖
                            if (awardItem.gold == 0 && awardItem.money == 0 && !awardItem.rests && !awardItem.ad) {
                                that.setData({
                                    AwardFail: true,
                                    failAward: "没抽到, 明天继续努力吧~",
                                    awardItem: awardItem
                                })
                            }
                        } else
                            wx.showModal({
                                title: '很遗憾',
                                content: '抽奖失败',
                                showCancel: false
                            })
                    }, 4000);
                }
            }
        });
    },
    // LDraw
    LDraw() {
        var that = this;
        return new Promise((resolve, reject) => {

            wx.request({
                url: app.globalData.url + 'interfaceAction',
                method: 'POST',
                data: {
                    interId: '20101',
                    version: 1,
                    authKey: wx.getStorageSync('authKey'),
                    method: 'roulette-lottery',
                    params: {
                        channelId: app.globalData.channelId
                    }
                },
                success: res => {
                    console.log(res)
                    resolve(res);

                    if (res.data.status == '00') {
                        console.log('=== l-draw ===');
                        console.log(res);
                        resolve(res);
                    } else {
                        reject(res.data.resultMsg)
                    }
                },
                fail: err => {
                    console.log(err);
                }
            })
        })
    },
    // 跳到我的中心
    toMyCenter() {
        wx.switchTab({
            url: '/pages/my/my'
        })
    },
    timeFormat(param) { //小于10的格式化函数
        return param < 10 ? '0' + param : param;
    },
    toIndex() {
        wx.switchTab({
            url: '/pages/index/index',
        })
    },
    toAwardView() {
        wx.switchTab({
            url: '/pages/index/index',
        })
    },
    tomorrowRemind() {
        app.tomorrowMoneyRemind()
    },
    preventTouchMove: function(res) {
        return false
    },
    //分享转发信息
    getShareData: function(position) {
        let that = this;
        postAjax({
            url: 'interfaceAction',
            data: {
                interId: '20210',
                authKey: wx.getStorageSync('authKey'),
                version: 1,
                method: 'ad-positions',
                params: {
                    position,
                    channelId: app.globalData.channelId
                }
            },
        }).then((res) => {
            if (res.data.status == '00') {
                if (position == 4) {
                    that.setData({
                        shareData: res.data.infos
                    })
                } else if (position == 2) {
                    that.setData({
                        bottData: res.data.infos
                    })
                } else if (position == 7) {
                    that.setData({
                        popupadvert: res.data.infos
                    })
                }
            }
        })
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function(res) {
        let that = this
        let userId = wx.getStorageSync("userInfo").userId

        if (res.from === 'button') {
            let target_id = res.target.id; // 转发的按钮
            console.log(target_id)
                // if (target_id === "shareFourbtn") { //四个红包转发
                //   return {
                //     title: that.data.shareData[0][1],
                //     path: that.data.shareData[0][4] + `?cid=` + app.globalData.channelId + `&inviterUserId=${userId}&inviterType=2`,
                //     imageUrl: that.data.shareData[0][3]
                //   }
                // }
            if (target_id === "shareAddThree") {
                return {
                    title: that.data.shareData[0][1],
                    path: that.data.shareData[0][4] + `?cid=` + app.globalData.channelId + `&inviterUserId=${userId}&inviterType=5`,
                    imageUrl: that.data.shareData[0][3]
                }
            }
            if (target_id === "inviteWheel") { //抽奖邀请

                return {
                    title: that.data.shareData[0][1],
                    path: that.data.shareData[0][4] + `?cid=` + app.globalData.channelId + `&inviterUserId=${userId}&inviterType=14`,
                    imageUrl: that.data.shareData[0][3]
                }
            }
        }

        return {
            title: that.data.shareData[0][1],
            path: that.data.shareData[0][4] + `?cid=` + app.globalData.channelId + `&inviterUserId=${userId}&inviterType=0`,
            imageUrl: that.data.shareData[0][3]

        }
    },
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
            that.setData({
                userInfo: uinfo
            })
            app.getAccount(); // 获取账户信息
            // that.getTodayIsLottery()
        });
    },
    // 用户兑换跑马灯信息
    getMarqueeNews: function() {
        let that = this
        postAjax({
            url: 'interfaceAction',
            data: {
                interId: '20500',
                authKey: wx.getStorageSync('authKey'),
                version: 1,
                method: 'ac-marquee',
                id: 2
            },
        }).then((res) => {
            if (res.data.status == '00') {
                that.setData({
                    marqueeNews: res.data.infos
                })
                console.log(that.data.marqueeNews)
                var ii = 1;
                var scnt = res.data.infos.length;
                that.changeOrderTime(0); //先显示第一条，再间隔执行
                if (scnt > 0) {
                    setInterval(function() {
                        // time = Math.random() * 5          
                        that.changeOrderTime(ii);
                        ii = ii + 1;
                        if (ii == scnt) {
                            ii = 0;
                        }
                    }, 10000);
                }
            }
        })
    },
    //change下单时间
    changeOrderTime: function(ii) {
        var that = this
            //后台返回来数组
        let array = that.data.marqueeNews
        that.setData({
            orderText: array[ii][0]
        })
        setTimeout(function() {
            that.setData({
                orderText: ""
            })
        }, 3000);

    },
    // 设置开始时间缓存 
    setStartTime: function(content_id, advert, path) {
        let startTime = new Date().getTime(); //获取系统日期
        wx.setStorageSync("timeStart", {
            advert,
            path,
            beginTime: startTime,
            appid: content_id
        })
    },
    // 点击计时
    NumTap(e) {
        const {
            appid,
            advert,
            path
        } = e.currentTarget.dataset;
        this.setData({
            showAwardAd: false
        })
        this.setStartTime(appid, advert, path);
    },
    hideAwardModal() {
        this.setData({
            showAwardAd: false
        })
    }
})