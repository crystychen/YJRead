// pages/audio_detail/index.js
// import audioList from './data.js'
import {
    postAjax
} from '../../utils/ajax.js';
var WxParse = require('../../wxParse/wxParse.js');
const utils = require('../../utils/util.js');


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
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        // 获取背景音频信息
        const backgroundAudioManager = wx.getBackgroundAudioManager()
        console.log(backgroundAudioManager, 'backgroundAudioManager')
        this.setData({
            // playStatus: backgroundAudioManager.paused,
            // duration: this.stotime(backgroundAudioManager.duration),
            // currentPosition: this.stotime(backgroundAudioManager.currentTime),
        })
        console.log(this.data.playStatus, 'playStatus')
        backgroundAudioManager.onPlay(this.onPlay) // 监听背景音频播放事件
        backgroundAudioManager.onPause(this.onPause) // 监听背景音频暂停事件
        backgroundAudioManager.onTimeUpdate(this.onTimeUpdate) // 监听背景音频播放进度更新事件
        backgroundAudioManager.onEnded(this.onEnded) // 监听背景音频自然播放结束事件
        let pid = options.pid // 商品id
        let that = this
        console.log(pid)
            // 先通过pid获取商品详情拿到图书bookid,再获取图书明细 
        this.proDetail(pid).then((res) => {
            console.log(res)
            let { bookId } = res.product
            console.log(bookId)
            that.bookDetail(bookId).then((res) => {
                console.log("图书详情", res)
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
                    currentAudio: audioList[0]
                })
            })
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
     * 页面滚动
     */
    onPageScroll: function(e) {
        console.log(e); //{scrollTop:99}
        if (e.scrollTop >= 400) {
            this.setData({
                isShowFloat: true
            })
        } else if (e.scrollTop < 400) {
            this.setData({
                isShowFloat: false
            })
        }
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {

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
            // if (that.data.playStatus === true) {
            that.beginPlay()
                // }
        }, 1000)
        wx.setStorageSync('audioIndex', audioIndexNow)
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
        wx.setStorageSync('audioIndex', audioIndexNow)
    },
    switchPlayStatus: function() {
        console.log('bindTapPlay')
        console.log(this.data.playStatus)
        const backgroundAudioManager = wx.getBackgroundAudioManager()
        console.log("backgroundAudioManager", backgroundAudioManager)
        if (this.data.playStatus) {
            backgroundAudioManager.pause()
            this.setData({ playStatus: false })
        } else {
            if (backgroundAudioManager.paused) {
                backgroundAudioManager.play()
            } else {
                this.beginPlay()
            }
            this.setData({ playStatus: true })
        }
    },
    beginPlay(e) {
        let { audioList, audioIndex } = this.data
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
        backAudio.onPlay(() => {
            console.log("音乐播放开始");
        })
        backAudio.onEnded(() => {
            console.log("音乐播放结束");
        })
        backAudio.onTimeUpdate(this.onTimeUpdate)
    },
    onPlay() {
        this.setData({
            pause
        })
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
            if (min < 10) { t += '0' }
            t += min + ':'
            if (sec < 10) { t += '0' }
            t += sec
        }
        return t
    },
    // 点击章节
    onClickCell(e) {
        console.log(e)
    },
    bindMore() {
        console.log("更多作者信息")
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
                    reject(res.data.resultMsg)
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
})