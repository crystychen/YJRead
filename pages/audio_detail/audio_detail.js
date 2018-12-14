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
        valueRadio: 2
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
            // 先通过pid获取商品详情拿到图书bookid,再获取图书明细 
            that.proDetail(pid).then((res) => {
                // console.log(res)
                let {
                    bookId,
                    product
                } = res.product
                that.setData({
                    product: res.product,
                    pid: pid,
                    bookId
                })

                // 获取背景音频信息
                // if (app.globalData.playAudio) {
                //     // console.log(wx.getStorageSync('playAudio').bookid)
                //     if (bookId == app.globalData.playAudio.bookid) {

                //         console.log(that.data.playStatus, 'playStatus')

                //         const backgroundAudioManager = wx.getBackgroundAudioManager()
                //         console.log(backgroundAudioManager, 'backgroundAudioManager')
                //         console.log(backgroundAudioManager.paused, 'paused')
                //             // if (backgroundAudioManager.paused != 'undefined' && !backgroundAudioManager.paused) {
                //             //     that.setData({
                //             //         playStatus: true
                //             //     })
                //             // }
                //         that.setData({
                //             sectionName: app.globalData.playAudio.sectionName,
                //             playStatus: !backgroundAudioManager.paused,
                //             // duration: this.stotime(backgroundAudioManager.duration),
                //             // currentPosition: this.stotime(backgroundAudioManager.currentTime),
                //         })
                //         backgroundAudioManager.onPlay(that.onPlay) // 监听背景音频播放事件
                //         backgroundAudioManager.onPause(that.onPause) // 监听背景音频暂停事件
                //         backgroundAudioManager.onTimeUpdate(that.onTimeUpdate) // 监听背景音频播放进度更新事件
                //         backgroundAudioManager.onEnded(that.onEnded) // 监听背景音频自然播放结束事件
                //         backgroundAudioManager.onStop(that.onStop)
                //     }
                // }
                that.bookDetail(bookId).then((res) => {
                    // console.log("图书详情", res)
                    WxParse.wxParse('about', 'html', res.book.about, that, 5);
                    WxParse.wxParse('goldWord', 'html', res.book.goldWord, that, 5);
                    let sections = res.book.sections.map((element, index) => {
                        element.sectionSec = utils.formatSeconds(element.sectionSec)
                        return element
                    })
                    let audioList = sections.filter((element) => {
                        return element.sectionUrl != "";
                    })
                    that.setData({
                        book: res.book,
                        sections,
                        audioList,
                        currentAudio: audioList[0] || ""
                    })
                    if (app.globalData.playAudio) {
                        // console.log(wx.getStorageSync('playAudio').bookid)
                        if (bookId == app.globalData.playAudio.bookid) {

                            console.log(that.data.playStatus, 'playStatus')

                            const backgroundAudioManager = wx.getBackgroundAudioManager()
                            console.log(backgroundAudioManager, 'backgroundAudioManager')
                            console.log(backgroundAudioManager.paused, 'paused')

                            that.setData({
                                sectionName: app.globalData.playAudio.sectionName,
                                playStatus: !backgroundAudioManager.paused,
                                currentAudio: app.globalData.playAudio,
                                audioIndex: app.globalData.audioIndex
                            })
                            backgroundAudioManager.onPlay(that.onPlay) // 监听背景音频播放事件
                            backgroundAudioManager.onPause(that.onPause) // 监听背景音频暂停事件
                            backgroundAudioManager.onTimeUpdate(that.onTimeUpdate) // 监听背景音频播放进度更新事件
                            backgroundAudioManager.onEnded(that.onEnded) // 监听背景音频自然播放结束事件
                            backgroundAudioManager.onStop(that.onStop)
                        }
                    }
                })
            })
            app.getShareData(4); // 转发语
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
                        let audioList = sections.filter((element) => {
                            return element.sectionUrl != "";
                        })
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
                                // that.postOrderSubmit()
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
        }
        return {
            title: that.data.shareData[0][1],
            path: `${that.data.shareData[0][4] || "/pages/index/index"}?cid=${channelId}&unionId=${unionId}&inviterType=0`,
            imageUrl: that.data.shareData[0][3],
        }
    },
    // 播放器操作
    bindSliderchange: function(e) {
        // clearInterval(this.data.timer)
        let that = this
        let value = e.detail.value
        console.log(e.detail.value)
        this.setData({
            sliderValue: value
        })
        const backgroundAudioManager = wx.getBackgroundAudioManager()
        let currentTime = (value / 100) * backgroundAudioManager.duration
        backgroundAudioManager.seek(currentTime)
    },
    bindTapPrev: function() {
        console.log('bindTapPrev')
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
        let that = this
        setTimeout(() => {
            that.beginPlay()
        }, 1000)

        app.globalData.audioIndex = audioIndexNow
        app.globalData.playAudio = {
            bookid: that.data.bookId,
            pid: that.data.pid,
            sectionName: this.data.audioList[audioIndexNow].sectionName,
            audioIndex: audioIndexNow
        }
    },
    bindTapNext: function() {
        console.log('bindTapNext')
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
        let that = this
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
            audioIndex: audioIndexNow
        }
    },
    switchPlayStatus: function() {
        console.log('bindTapPlay')
        console.log(this.data.playStatus)
        const backgroundAudioManager = wx.getBackgroundAudioManager()
        console.log("backgroundAudioManager", backgroundAudioManager)
            // console.log(backgroundAudioManager.paused)
        if (this.data.playStatus) {
            backgroundAudioManager.pause()
            this.setData({
                playStatus: false
            })
        } else {
            // 获取背景音频信息
            if (app.globalData.playAudio) {
                // console.log(wx.getStorageSync('playAudio').bookid)
                if (this.data.bookId == app.globalData.playAudio.bookid) {
                    if (backgroundAudioManager.paused) {
                        backgroundAudioManager.play()
                    }
                } else {
                    console.log("播放下一首111")
                        // const backgroundAudioManager = wx.getBackgroundAudioManager()
                    let time = backgroundAudioManager.currentTime
                    console.log("播放的时间", time)
                    this.postReadTime(app.globalData.playAudio.pid, time, 5)
                    this.beginPlay()
                }
            } else {
                console.log("播放下一首222")
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
            audioIndex
        } = this.data
        let that = this
        if (!!e) {
            audioIndex = e.currentTarget.dataset.index
        }
        this.setData({
            playStatus: true,
            currentAudio: this.data.audioList[audioIndex]
        })
        const backAudio = wx.getBackgroundAudioManager();

        backAudio.src = audioList[audioIndex].sectionUrl
        backAudio.title = audioList[audioIndex].sectionName
        backAudio.play();
        backAudio.onPlay(that.onPlay)
        backAudio.onEnded(that.onEnded)
        backAudio.onTimeUpdate(that.onTimeUpdate)
            // wx.setStorageSync('playAudio', {
            //     bookid: that.data.bookId,
            //     pid: that.data.pid,
            //     sectionName: audioList[audioIndex].sectionName,
            //     audioIndex: audioIndex
            // })
        app.globalData.audioIndex = audioIndex

        app.globalData.playAudio = {
            bookid: that.data.bookId,
            pid: that.data.pid,
            sectionName: audioList[audioIndex].sectionName,
            audioIndex: audioIndex
        }
    },
    onPlay() {
        console.log("onPlay")
        this.setData({
            playStatus: true
        })
    },
    onPause() {
        console.log("onPause")
        this.setData({
            playStatus: false
        })
    },
    onEnded() {
        console.log("onEnded")
        this.setData({
                playStatus: false
            })
            // 记录时间
        const backgroundAudioManager = wx.getBackgroundAudioManager()
        let time = backgroundAudioManager.currentTime
        this.postReadTime(this.data.pid, time, 5)
        app.globalData.playAudio = ''

    },
    onStop() {
        console.log("onStop")
        wx.removeStorageSync('playAudio');
    },
    onTimeUpdate() {
        const backgroundAudioManager = wx.getBackgroundAudioManager()
        let sliderValue = backgroundAudioManager.currentTime / backgroundAudioManager.duration * 100
        this.setData({
            currentPosition: this.stotime(backgroundAudioManager.currentTime),
            sliderValue: sliderValue,
            duration: this.stotime(backgroundAudioManager.duration)
        })
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
    proDetail(pid, callback) {
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
    // 商品详情(单品详情)
    bookDetail(bid, callback) {
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
    // 书架页面
    toBookShelf() {
        console.log("书架页面")
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
            // this.setData({
            //     confirmModal: true
            // })
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
                        return element.sectionUrl != "";
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
    }
})