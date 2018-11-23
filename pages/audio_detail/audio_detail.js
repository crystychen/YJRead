// pages/audio_detail/index.js
import audioList from './data.js'

Page({

    /**
     * 页面的初始数据
     */
    data: {
        audioList: audioList,
        audioIndex: 0,
        pauseStatus: true,
        listShow: false,
        timer: '',
        currentPosition: 0,
        duration: 0,
        chapters: [{
            title: "为什么要听这本书？",
            id: 1,
            free: true,
            duration: "05:10"
        }, {
            title: "什么是厌女症？",
            id: 2,
            free: false,
            duration: "09:10"
        }, {
            title: "世上存在没有厌女症的男人吗？",
            id: 3,
            free: false,
            duration: "04:10"
        }, {
            title: "为什么说女人也有厌女症？",
            id: 4,
            free: false,
            duration: "05:10"
        }]
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
    // 播放器操作
    bindSliderchange: function(e) {
        // clearInterval(this.data.timer)
        let value = e.detail.value
        let that = this
        console.log(e.detail.value)
        wx.getBackgroundAudioPlayerState({
            success: function(res) {
                console.log(res)
                let { status, duration } = res
                if (status === 1 || status === 0) {
                    that.setData({
                        sliderValue: value
                    })
                    wx.seekBackgroundAudio({
                        position: value * duration / 100,
                    })
                }
            }
        })
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
            sliderValue: 0,
            currentPosition: 0,
            duration: 0,
        })
        let that = this
        setTimeout(() => {
            if (that.data.pauseStatus === true) {
                that.play()
            }
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
            sliderValue: 0,
            currentPosition: 0,
            duration: 0,
        })
        let that = this
        setTimeout(() => {
            if (that.data.pauseStatus === false) {
                that.play()
            }
        }, 1000)
        wx.setStorageSync('audioIndex', audioIndexNow)
    },
    bindTapPlay: function() {
        console.log('bindTapPlay')
        console.log(this.data.pauseStatus)
        if (this.data.pauseStatus === true) {
            this.play()
            this.setData({ pauseStatus: false })
        } else {
            wx.pauseBackgroundAudio()
            this.setData({ pauseStatus: true })
        }
    },
    play() {
        let { audioList, audioIndex } = this.data
        wx.playBackgroundAudio({
            dataUrl: audioList[audioIndex].src,
            title: audioList[audioIndex].name,
            coverImgUrl: audioList[audioIndex].poster
        })
        let that = this
        let timer = setInterval(function() {
            that.setDuration(that)
        }, 1000)
        this.setData({ timer: timer })
    },
    setDuration(that) {
        wx.getBackgroundAudioPlayerState({
            success: function(res) {
                // console.log(res)
                let { status, duration, currentPosition } = res
                if (status === 1 || status === 0) {
                    that.setData({
                        currentPosition: that.stotime(currentPosition),
                        duration: that.stotime(duration),
                        sliderValue: Math.floor(currentPosition * 100 / duration),
                    })
                }
            }
        })
    },
    stotime: function(s) {
        let t = '';
        if (s > -1) {
            // let hour = Math.floor(s / 3600);
            let min = Math.floor(s / 60) % 60;
            let sec = s % 60;
            // if (hour < 10) {
            //   t = '0' + hour + ":";
            // } else {
            //   t = hour + ":";
            // }

            if (min < 10) { t += "0"; }
            t += min + ":";
            if (sec < 10) { t += "0"; }
            t += sec;
        }
        return t;
    },
    // 点击章节
    onClickCell(e) {
        console.log(e)
    },
    bindMore() {
        console.log("更多作者信息")
    }
})