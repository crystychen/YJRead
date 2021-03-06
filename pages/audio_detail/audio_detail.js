// pages/audio_detail/index.js
// import audioList from './data.js'
import {
    postAjax
} from '../../utils/ajax.js';
var WxParse = require('../../wxParse/wxParse.js');
const app = getApp()
const utils = require('../../utils/util.js');
var runTime = Date.now(); //启动时间
const aldstat = require('../../utils/sdk/ald-stat.js');
// 音频信息
var bgMusic = wx.getBackgroundAudioManager();

Page({

    /**
     * 页面的初始数据
     */
    data: {
        audioList: [],
        audioIndex: 0,
        playStatus: false,
        listShow: false,
        timer: '',
        currentPosition: 0,
        duration: 0,
        navBar: [{
                key: "1",
                title: "简介"
            },
            {
                key: "2",
                title: "章节"
            }

        ],
        currentTabKey: "1",
        anchorClass: "ellipsis",
        valueRadio: 2,
        setInter: ''
    },
    startSetInter: function() {
        let that = this;
        //将计时器赋值给setInter
        that.data.setInter = setInterval(
            function() {
                var numVal = app.globalData.postSecond + 1;
                app.globalData.postSecond = numVal
                console.log('setInterval==' + numVal);
            }, 1000);
    },
    endSetInter: function() {
        clearInterval(this.data.setInter)
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        let pid = options.pid // 商品id
        let that = this
        console.log(pid)
        app.loginGetUserInfo(function(uinfo) {
            that.setData({
                userInfo: uinfo,
                authLevel: wx.getStorageSync('authLevel')
            });
            app.getShareData(4); // 转发语            
            that.getFreeTime().then()
                // 是否传有书本Id
            if (!!options.bookId) {
                that.setData({
                    bookId: options.bookId
                })
                that.bookDetail(options.bookId).then((res) => {
                    WxParse.wxParse('about', 'html', res.book.about, that, 5);
                    WxParse.wxParse('goldWord', 'html', res.book.goldWord, that, 5);
                    let sections = res.book.sections.map((element, index) => {
                        element.sectionSec = utils.formatSeconds(element.sectionSec)
                        return element
                    })
                    let audioList
                    if (app.globalData.freeSec <= 0) {
                        audioList = sections.filter((element) => {
                            return element.sectionUrl != "";
                        })
                    } else {
                        audioList = sections
                    }
                    that.setData({
                        book: res.book,
                        sections,
                        audioList,
                        currentAudio: audioList[0] || ""
                    })
                    if (app.globalData.playAudio) {
                        if (bookId == app.globalData.playAudio.bookid) {
                            that.SlideBar()
                        }
                    }
                })
            } else {
                // 先通过pid获取商品详情拿到图书bookid,再获取图书明细 
                that.proDetail(pid).then((res) => {
                    let {
                        bookId
                    } = res.product
                    let {
                        product
                    } = res
                    that.setData({
                        product: product,
                        pid: pid,
                        bookId
                    })
                    console.log(product)
                    that.bookDetail(bookId).then((res) => {
                        // 判断是否是限时免费且未下单, 生成订单
                        console.log(product)
                        if (product.welfareType == 1 && !res.book.isBuy) {
                            that.postOrderSubmit([], 0, (res) => {

                                that.bookDetail(bookId).then((res) => {

                                    WxParse.wxParse('about', 'html', res.book.about, that, 5);
                                    WxParse.wxParse('goldWord', 'html', res.book.goldWord, that, 5);
                                    let sections = res.book.sections.map((element, index) => {
                                        element.sectionSec = utils.formatSeconds(element.sectionSec)
                                        return element
                                    })
                                    let audioList
                                    if (app.globalData.freeSec <= 0) {
                                        audioList = sections.filter((element) => {
                                            return element.sectionUrl != "";
                                        })
                                    } else {
                                        audioList = sections
                                    }
                                    that.setData({
                                        book: res.book,
                                        sections,
                                        audioList,
                                        currentAudio: audioList[0] || ""
                                    })
                                })

                            })
                            return;
                        }
                        WxParse.wxParse('about', 'html', res.book.about, that, 5);
                        WxParse.wxParse('goldWord', 'html', res.book.goldWord, that, 5);
                        let sections = res.book.sections.map((element, index) => {
                                element.sectionSec = utils.formatSeconds(element.sectionSec)
                                return element
                            })
                            // let audioList = sections
                        let audioList
                        if (app.globalData.freeSec <= 0) {
                            audioList = sections.filter((element) => {
                                return element.sectionUrl != "";
                            })
                        } else {
                            audioList = sections
                        }
                        that.setData({
                            book: res.book,
                            sections,
                            audioList,
                            currentAudio: audioList[0] || ""
                        })
                        if (app.globalData.playAudio) {
                            if (bookId == app.globalData.playAudio.bookid) {
                                console.log(that.data.playStatus, 'playStatus')
                                that.SlideBar()
                            }
                        }
                    })
                })
            }
            if (wx.getStorageSync('authLevel') == 2) {
                app.getAccount();
                // 用户是否是vip
                app.getUserVip().then((res) => {
                    console.log("用户vip", res)
                    that.setData({
                        isVip: res.data.isVip
                    })
                })
            }
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
        app.aldstat.sendEvent('音频详情页加载时间', {
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
     * 页面滚动
     */
    onPageScroll: function(e) {

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
            app.getAccount()
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
        console.log(unionId);
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

            let target_id = res.target.id;
            if (target_id === 'free-share') {
                // 分享立刻解锁
                that.postOrderSubmit([], 0, (res) => {

                    setTimeout(function() {
                        that.setData({
                            successModal: true
                        })
                    }, 2000)

                    that.bookDetail(that.data.bookId).then((res) => {
                        let sections = res.book.sections.map((element, index) => {
                                element.sectionSec = utils.formatSeconds(element.sectionSec)
                                return element
                            })
                            // let audioList = sections.filter((element) => {
                            //     return element.sectionUrl2;
                            // })
                        let audioList
                        if (app.globalData.freeSec <= 0) {
                            audioList = sections.filter((element) => {
                                return element.sectionUrl != "";
                            })
                        } else {
                            audioList = sections
                        }
                        that.setData({
                            book: res.book,
                            sections,
                            audioList,
                            currentAudio: audioList[0] || ""
                        })
                    })

                })
                return {
                    title: that.data.shareData[0][1],
                    path: `${that.data.shareData[0][4] || "/pages/index/index"}?cid=${channelId}&inviterUserId=${userId}&inviterType=3&inviterObjId=${pid}`,
                    imageUrl: that.data.shareData[0][3],
                    success: res => {
                        console.log('--- 转发回调 ---', res);
                    },
                    fail: () => {
                        console.log('--- 转发失败 ---');
                    },
                    complete: res => {
                        console.log(res)
                        if (res.errMsg == 'shareAppMessage:ok') {
                            //分享为按钮转发
                            console.log("分享成功")
                        } else {
                            console.log("分享失败")
                        }
                    }
                }
            }
            if (target_id === 'item-share') {
                return {
                    title: that.data.shareData[0][1],
                    path: `${that.data.shareData[0][4] || "/pages/index/index"}?cid=${channelId}&inviterUserId=${userId}&inviterType=3&inviterObjId=${pid}`,
                    imageUrl: that.data.shareData[0][3],
                    complete: res => {
                        console.log(res)
                        if (res.errMsg == 'shareAppMessage:ok') {}
                    }
                }
            }
            return {
                title: that.data.shareData[0][1],
                path: `${that.data.shareData[0][4] || "/pages/index/index"}?cid=${channelId}&inviterUserId=${userId}`,
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
    // 调用更新进度条
    SlideBar: function() {
        var that = this;
        var bgMusic = wx.getBackgroundAudioManager();

        // if (bgMusic.onCanplay) {  是否在播放
        that.setData({
            playStatus: !bgMusic.paused,
            pause: bgMusic,
            currentAudio: app.globalData.playAudio,
            audioIndex: app.globalData.audioIndex
        })
        bgMusic.onPlay(that.onPlay)
        bgMusic.onPause(that.onPause)
        bgMusic.onEnded(that.onEnded)
        bgMusic.onTimeUpdate(that.onTimeUpdate)
        bgMusic.onStop(that.onStop)
            // that.onTimeUpdate() // 更新进度条
    },
    // 播放器操作
    bindSliderchange: function(e) {
        // clearInterval(this.data.timer)
        let value = e.detail.value
        console.log(e.detail.value)
        this.setData({
            sliderValue: value
        })
        const bgMusic = wx.getBackgroundAudioManager()
        let currentTime = (value / 100) * bgMusic.duration
        bgMusic.seek(currentTime)
    },
    bindTapPrev: function(e) {
        console.log('bindTapPrev')
        let that = this
        if (!!e) {
            // 记录时间
            // let time = bgMusic.currentTime
            // console.log("提交时间", time)
            // this.postReadTime(this.data.pid, time, 5)
            // this.getFreeTime().then()
            if (app.globalData.freeSec > 0 && !this.data.book.isBuy && !this.data.isVip) {
                let time = app.globalData.postStartTime
                this.getListenTime(time).then(function(res) {
                    console.log("提交的时间秒数: ", res)
                    that.postReadTime(that.data.pid, res.second, 5)
                    that.getFreeTime().then()
                })
                app.globalData.postStartTime = 0
            }
            app.globalData.playAudio = ''
        }
        let length = this.data.audioList.length
        let audioIndexPrev = this.data.audioIndex
        let audioIndexNow = audioIndexPrev
        if (audioIndexPrev === 0) {
            audioIndexNow = length - 1
        } else {
            audioIndexNow = audioIndexPrev - 1
        }
        this.setData({
            audioIndex: audioIndexNow,
            currentAudio: this.data.audioList[audioIndexNow],
            sliderValue: 0,
            currentPosition: 0,
            duration: this.data.audioList[audioIndexNow].sectionSec
        })
        setTimeout(() => {
            that.beginPlay()
        }, 1000)

        app.globalData.audioIndex = audioIndexNow
        app.globalData.playAudio = {
            bookid: that.data.bookId,
            pid: that.data.pid,
            sectionName: this.data.audioList[audioIndexNow].sectionName,
            audioIndex: audioIndexNow,
            isAudition: this.data.audioList[audioIndexNow].isAudition,
            isBuy: that.data.book.isBuy
        }
    },
    bindTapNext: function(e) {
        console.log('bindTapNext')
        let that = this

        if (!!e) {
            if (app.globalData.freeSec > 0 && !this.data.book.isBuy && !this.data.isVip) {
                // 记录时间提交
                let time = app.globalData.postStartTime
                this.getListenTime(time).then(function(res) {
                    console.log("提交的时间秒数: ", res)
                    that.postReadTime(that.data.pid, res.second, 5)
                    that.getFreeTime().then()
                })
                app.globalData.postStartTime = 0
            }
            app.globalData.playAudio = ''
        }
        let length = this.data.audioList.length
        let audioIndexPrev = this.data.audioIndex
        let audioIndexNow = audioIndexPrev
        if (audioIndexPrev === length - 1) {
            audioIndexNow = 0
        } else {
            audioIndexNow = audioIndexPrev + 1
        }
        this.setData({
            audioIndex: audioIndexNow,
            currentAudio: this.data.audioList[audioIndexNow],
            sliderValue: 0,
            currentPosition: 0,
            duration: this.data.audioList[audioIndexNow].sectionSec,
        })
        setTimeout(() => {
            // if (that.data.playStatus === true) {
            that.beginPlay()
                // }
        }, 1000)

        app.globalData.audioIndex = audioIndexNow
        app.globalData.playAudio = {
            bookid: that.data.bookId,
            pid: that.data.pid,
            sectionName: this.data.audioList[audioIndexNow].sectionName,
            audioIndex: audioIndexNow,
            isAudition: this.data.audioList[audioIndexNow].isAudition,
            isBuy: that.data.book.isBuy
        }
    },
    switchPlayStatus: function() {
        let that = this
            // 首次提示剩余时间
        if (!app.globalData.firstFreeTips && !this.data.book.isBuy && !this.data.isVip) {
            this.setData({
                firstfreeTimeModal: true
            })
            app.globalData.firstFreeTips = true
                // return;
        }
        // 判断剩余时间
        if (app.globalData.freeMin <= 0 && !this.data.book.isBuy && !this.data.isVip && !this.data.audioList) {
            this.setData({
                isfreeTimeModal: true
            })
            return;
        }
        const bgMusic = wx.getBackgroundAudioManager()
        if (this.data.playStatus) {
            bgMusic.pause()
            this.setData({
                playStatus: false
            })
        } else {
            // 获取背景音频信息
            if (app.globalData.playAudio) {
                // console.log(wx.getStorageSync('playAudio').bookid)
                if (this.data.bookId == app.globalData.playAudio.bookid) {
                    if (bgMusic.paused) {
                        bgMusic.play()
                    }
                } else {
                    console.log("播放新的书籍音频")
                        // let time = bgMusic.currentTime
                        // this.postReadTime(app.globalData.playAudio.pid, time, 5)
                        // this.getFreeTime().then()
                    if (app.globalData.freeSec > 0 && !app.globalData.playAudio.isBuy && !this.data.isVip) {
                        // 提交听书时间
                        let time = app.globalData.postStartTime
                        this.getListenTime(time).then(function(res) {
                            console.log("提交时间秒: ", res)
                            that.postReadTime(app.globalData.playAudio.pid, time, 5)
                            that.getFreeTime().then()
                        })
                        app.globalData.postStartTime = 0
                    }
                    this.beginPlay()
                }
            } else {
                console.log("开始播放")
                this.beginPlay()
            }
            this.setData({
                playStatus: true
            })
        }

    },
    beginPlay(e) {
        let {
            audioList,
            audioIndex,
            pause
        } = this.data
        let that = this
            // 首次提示剩余时间
        if (!app.globalData.firstFreeTips && !this.data.book.isBuy && !this.data.isVip) {
            this.setData({
                firstfreeTimeModal: true
            })
            app.globalData.firstFreeTips = true
                // return;
        }
        const bgMusic = wx.getBackgroundAudioManager();
        if (!!e) {
            let index = e.currentTarget.dataset.index
            if (audioIndex == index) {
                if (this.data.playStatus) {
                    return;
                } else if (pause) {
                    bgMusic.play()
                    return;
                }
            } else {
                audioIndex = e.currentTarget.dataset.index;
            }
            // 提交已播放的时间
            let time = bgMusic.currentTime
            if (!!time) {
                // console.log("提交时间", time)
                // this.postReadTime(this.data.pid, time, 5)
                // this.getFreeTime().then()
                // app.globalData.playAudio = ''
                // audioIndex = e.currentTarget.dataset.index;

                if (app.globalData.freeSec > 0 && !this.data.book.isBuy && !this.data.isVip) {
                    // 记录时间提交
                    let time = app.globalData.postStartTime
                    this.getListenTime(time).then(function(res) {
                        console.log("提交时间秒: ", res)
                        that.postReadTime(that.data.pid, res.second, 5)
                        that.getFreeTime().then()
                    })
                    app.globalData.postStartTime = 0
                }

            }
        }
        this.setData({
            playStatus: true,
            currentAudio: this.data.audioList[audioIndex],
            audioIndex: audioIndex
        })

        this.postReadTime(this.data.pid, 0, 5)

        bgMusic.src = audioList[audioIndex].sectionUrl2
        bgMusic.title = audioList[audioIndex].sectionName
        bgMusic.play();
        bgMusic.onPlay(that.onPlay)
        bgMusic.onPause(that.onPause)
        bgMusic.onEnded(that.onEnded)
        bgMusic.onTimeUpdate(that.onTimeUpdate)

        app.globalData.audioIndex = audioIndex

        app.globalData.playAudio = {
            bookid: that.data.bookId,
            pid: that.data.pid,
            sectionName: audioList[audioIndex].sectionName,
            audioIndex: audioIndex,
            isAudition: audioList[audioIndex].isAudition,
            isBuy: that.data.book.isBuy
        }
    },
    onPlay() {
        console.log("onPlay")
        this.setData({
            playStatus: true
        })
        if (app.globalData.freeSec > 0 && !this.data.book.isBuy && !this.data.isVip) {
            let startTime = new Date().getTime();
            app.globalData.postStartTime = startTime
        }
    },
    onPause() {
        console.log("onPause")
        let that = this
        this.setData({
            playStatus: false,
            pause: true
        })
        if (app.globalData.freeSec > 0 && !this.data.book.isBuy && !this.data.isVip) {
            // 记录时间提交
            let time = app.globalData.postStartTime
            this.getListenTime(time).then(function(res) {
                console.log("提交秒数: ", res)
                that.postReadTime(that.data.pid, res.second, 5)
                that.getFreeTime().then()
            })
            app.globalData.postStartTime = 0
        }
    },
    onEnded() {
        console.log("onEnded")
        let that = this
        this.setData({
                playStatus: false,
                pause: false
            })
            // 记录时间
            // const bgMusic = wx.getBackgroundAudioManager()

        // let time = app.globalData.postSecond
        // console.log("提交时间", time)
        // app.globalData.postSecond = 0
        // this.postReadTime(this.data.pid, time, 5)
        // 提交
        let time = app.globalData.postStartTime
        console.log("开始的时间戳", time)
        this.getListenTime(time).then(function(res) {
            console.log("提交的时间秒数: ", res)
            that.postReadTime(that.data.pid, res.second, 5)
            that.getFreeTime().then()
        })
        app.globalData.postStartTime = 0

        app.globalData.playAudio = ''
            // 判断剩余时间
        if (app.globalData.freeMin <= 0 && !this.data.book.isBuy && !this.data.isVip && !this.data.audioList) {
            this.setData({
                isfreeTimeModal: true
            })
            return;
        }
        // 自动播放下一首
        this.bindTapNext()
    },
    onStop() {
        console.log("onStop")
            // wx.removeStorageSync('playAudio');
    },
    onTimeUpdate() {
        const bgMusic = wx.getBackgroundAudioManager()
        let sliderValue = bgMusic.currentTime / bgMusic.duration * 100
        this.setData({
            currentPosition: this.stotime(bgMusic.currentTime),
            sliderValue: sliderValue,
            duration: this.stotime(bgMusic.duration)
        })

        if (app.globalData.freeSec <= 0 && !this.data.book.isBuy && !this.data.isVip) {
            if (!this.data.currentAudio.isAudition) {
                this.setData({
                    firstfreeTimeModal: true
                })
                bgMusic.pause()
            }
        }
    },
    stotime: function(s) {
        let t = ''
        if (s > -1) {
            let min = Math.floor(s / 60) % 60;
            let sec = Math.floor(s) % 60
            if (min < 10) {
                t += '0'
            }
            t += min + ':'
            if (sec < 10) {
                t += '0'
            }
            t += sec
        }
        return t
    },
    // 点击章节
    onClickCell(e) {
        console.log(e)
    },
    // 商品详情(单品详情)
    proDetail(pid) {
        // var that = this;
        return new Promise((resolve, reject) => {
            postAjax({
                url: 'interfaceAction',
                data: {
                    interId: '20111',
                    version: 1,
                    authKey: wx.getStorageSync('authKey'),
                    method: 'p-detail',
                    params: {
                        productId: pid
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
    },
    // 书本详情
    bookDetail(bid) {
        var that = this;
        return new Promise((resolve, reject) => {
            postAjax({
                url: 'interSyncAction',
                data: {
                    interId: '20400',
                    version: 1,
                    authKey: wx.getStorageSync('authKey'),
                    method: 'book-detail',
                    params: {
                        bookId: bid
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
    },
    // 切换分组tab
    switchNavTab(e) {
        var {
            current
        } = e.currentTarget.dataset;

        //每个tab选项宽度占1/4
        var singleNavWidth = this.data.windowWidth / 4;
        //tab选项居中                            
        this.setData({
            navScrollLeft: (current - 1) * singleNavWidth
        })
        if (this.data.currentTabKey == current) {
            return false;
        } else {
            this.setData({
                currentTabKey: current
            })
        }
        // this.getArticleList(postgroupid)
    },
    // 兑换商品
    postOrderSubmit(e, orderType, callback) {
        let that = this
        let postorderType = orderType ? orderType : 0
        let {
            product
        } = this.data
            // 判断金币不足
        if (this.data.gold < product.gold && postorderType == 0) {
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
                method: 'order-submit',
                params: {
                    productId: product.id,
                    orderType: postorderType,
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
                                    url: '/pages/my/orderlist/orderlist',
                                })
                            }
                        })
                    })
                } else {
                    callback && callback(res)
                }
                // callback && callback(res)
            } else {
                utils.alert(res.data.msg)
            }
        })
    },
    // 领取会员卡 
    onMemCard() {
        console.log("领取会员卡")
        this.setData({
            EvegoldModal: false,
            isMenCard: true
        })
    },
    // 书屋页面
    toBookShelf() {
        // console.log("书屋页面")
        wx.navigateTo({
            url: "/pages/orderlist/orderlist"
        })
    },
    // 立即播放
    playNow() {
        console.log("立即播放")
        this.switchPlayStatus()
        this.setData({
            successModal: false
        })
    },
    // 砍价
    toCutDown(e) {
        console.log("砍价页面")
        let that = this
            // 判断是否已经发起过砍价
        that.getIsCutting(that.data.pid).then((res) => {
            if (res.data.orderNo) {
                wx.navigateTo({
                    url: `/pages/cut_down/cut_down?orderid=${res.data.orderNo}`
                })
                return;
            } else {
                that.postOrderSubmit([], 2, (data) => {
                    console.log("砍价发起", data)
                    let orderid = data.data.orderId
                    that.orderBargain(orderid, 1, (data) => {
                            // wx.navigateTo({
                            //     url: `/pages/cut_down/cut_down?orderid=${orderid}`
                            // })
                        }) // 砍第一刀完后再跳
                    wx.navigateTo({
                        url: `/pages/cut_down/cut_down?orderid=${orderid}`
                    })
                })
            }
        })
    },
    // 是否发起砍价
    getIsCutting(pid) {
        return new Promise((resolve, reject) => {
            postAjax({
                url: "interfaceAction",
                method: 'POST',
                data: {
                    interId: '20111',
                    version: 1,
                    authKey: wx.getStorageSync('authKey'),
                    method: 'p-bargain-order',
                    params: {
                        productId: pid
                    }
                },
            }).then((res) => {
                if (res.data.status == "00") {
                    resolve(res);
                } else {
                    reject(res.data.resultMsg)
                }
            })
        })
    },
    //  砍价砍一刀
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
            if (res.success) {
                callback && callback(res)
            } else {
                // utils.alert(res.data.msg)
            }
        })
    },
    // 播音员更多
    bindAnchorsMore() {
        this.setData({
            anchorClass: "open-ellipsis"
        })
    },
    closeConfirmModal() {
        this.setData({
            confirmModal: false
        })
    },
    // 展示兑换方式选择面板
    showBoard() {
        let that = this
        that.getIsCutting(that.data.pid).then((res) => {
            if (res.data.orderNo) {
                wx.navigateTo({
                    url: `/pages/cut_down/cut_down?orderid=${res.data.orderNo}`
                })
                return;
            } else {
                that.setData({
                    confirmModal: true
                })
            }
        })
    },
    // 切换兑换方式
    onChangeRadio(e) {
        console.log(e)
        let value = e.detail.value
        this.setData({
            valueRadio: value
        })
    },
    preventTouchMove() {
        return false
    },
    // 确认提交订单
    confirmOrder(e) {
        let that = this
        this.setData({
            confirmModal: false
        })
        if (this.data.valueRadio == 2) { // 砍价提交  
            that.toCutDown()
        } else if (this.data.valueRadio == 0) { // 书签兑换
            that.postOrderSubmit([], 0, (res) => {
                that.setData({
                    successModal: true
                })
                app.getAccount()
                that.bookDetail(that.data.bookId).then(() => {
                    let sections = res.book.sections.map((element, index) => {
                        element.sectionSec = utils.formatSeconds(element.sectionSec)
                        return element
                    })

                    let audioList = sections.filter((element) => {
                        // return element.sectionUrl != "";
                        return element.sectionUrl2;
                    })
                    that.setData({
                        book: res.book,
                        sections,
                        audioList,
                        currentAudio: audioList[0] || ""
                    })
                })

            })
        }
    },
    // 提交记录时间
    postReadTime(pid, second, type) {
        postAjax({
            url: "interfaceAction",
            method: 'POST',
            data: {
                interId: '20102',
                version: 2,
                authKey: wx.getStorageSync('authKey'),
                method: 'task-games-duration',
                params: {
                    advertId: pid,
                    durationSecond: second,
                    advertIconUrl: "",
                    advertDescribe: "",
                    type: type
                }
            },
        }).then((res) => {
            if (res.data.status == "00") {
                // resolve(res);
            } else {
                // reject(res.data.resultMsg)
            }
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
    },
    showfreeTimeModal() {
        this.setData({
            isfreeTimeModal: true
        })
    },
    // 开通会员卡提示
    openMenCard() {
        this.setData({
            isMenCard: true
        })
    },
    //  分享记录
    shareRecord() {
        app.userShareRecord(0)
    },
    getListenTime(startTime) {
        return new Promise((resolve, reject) => {
            let endTime = new Date().getTime();
            let url = wx.getStorageSync('timeStart').url;
            var dateDiff = endTime - startTime; //时间差的毫秒数
            var dayDiff = Math.floor(dateDiff / (24 * 3600 * 1000)); //计算出相差天数
            var leave1 = dateDiff % (24 * 3600 * 1000) //计算天数后剩余的毫秒数
            var hours = Math.floor(leave1 / (3600 * 1000)) //计算出小时数
            var leave2 = leave1 % (3600 * 1000) //计算小时数后剩余的毫秒数
            var remainMinutes = Math.floor(leave2 / (60 * 1000)) //计算相差分钟数
            let remainSecond = Math.floor(leave2 % 60); //计算剩余的秒数
            let minutes = dayDiff * 24 * 60 + hours * 60 + remainMinutes
            console.log("小时后剩余分钟数", remainMinutes)
            let second = Math.floor(dateDiff / 1000) // 秒数
            console.log("second", second)
            console.log("minutes", minutes)
            resolve({ second })
        })
    } 
})