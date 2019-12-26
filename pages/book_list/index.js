// pages/productList/productList.js
import {
    postAjax
} from '../../utils/ajax.js';
const utils = require('../../utils/util.js');
const app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        page: 1,
        size: 10,
        hasMoreData: true,
        loadingImgHidden: true
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        console.log(options);
        this.setData({
            pid: options.pid,
            ptitle: options.ptitle,
            bookTypeId: options.bookTypeId
        })
        this.pList(options.pid, options.bookTypeId);
        // this.getShareData(4); //转发语

    },
    onUnload() {},
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
        this.setData({
                page: 1,
                size: 10,
                hasMoreData: true
            })
            // 玩游戏时间
        if (wx.getStorageSync('timeStart')) {
            utils.ToReadTime()
                .then((data) => {
                    console.log(data);
                    that.readTime(data.advert, data.second, data.content_id, data.path);
                })
                .catch((err) => {
                    console.log(err);
                })
        };
    },
    // 时间
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
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {
        var that = this;
        if (this.data.hasMoreData) {
            that.data.page++
                postAjax({
                    url: 'interfaceAction',
                    data: {
                        interId: '20111',
                        version: 1,
                        authKey: wx.getStorageSync('authKey'),
                        method: 'p-group-list',
                        params: {
                            groupId: that.data.pid,
                            bookTypeId: that.data.bookTypeId,
                            page: that.data.page,
                            size: that.data.size
                        }
                    }
                }).then((res) => {
                    if (res.data.status == '00') {
                        if (res.data.products.length < that.data.size) {
                            that.setData({
                                detail: that.data.detail.concat(res.data.products),
                                hasMoreData: false
                            })
                        } else {
                            that.setData({
                                detail: that.data.detail.concat(res.data.products),
                                hasMoreData: true,
                                page: that.data.page
                            })
                        }
                    }
                });
        } else {
            // wx.showToast({
            //     title: '没有更多了',
            // })
            that.setData({
                hasMoreData: false
            })
        }
    },
    // 广告信息
    getShareData: function(position) {
        let that = this;
        postAjax({
            url: 'interfaceAction',
            // method: 'POST',
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
        var that = this;
        const {
            pid
        } = res.target.dataset;
        const target_id = res.target.id;
        const {
            userId
        } = wx.getStorageSync('userInfo');
        if (res.from === 'button') {
            if (target_id == 'shareDetail' || target_id == 'shareAddPro') {
                return {
                    title: that.data.shareData[0][1],
                    path: `${that.data.shareData[0][4]}?cid=${app.globalData.channelId}&inviterUserId=${userId}&inviterType=3&inviterObjId=${pid}`,
                    imageUrl: that.data.shareData[0][3],
                }
            }
            if (target_id == 'shareAddThree') {
                return {
                    title: that.data.shareData[0][1],
                    path: `${that.data.shareData[0][4]}?cid=${app.globalData.channelId}&inviterUserId=${userId}&inviterType=5`,
                    imageUrl: that.data.shareData[0][3],
                }
            }
        }
    },
    // 商品列表
    pList(groupId, bookTypeId) {
        var that = this;
        postAjax({
            url: 'interfaceAction',
            data: {
                interId: '20111',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'p-group-list',
                params: {
                    groupId,
                    bookTypeId,
                    page: that.data.page,
                    size: that.data.size
                }
            }
        }).then((res) => {
            // console.log(data.data.products[0]);
            if (res.data.status == '00') {
                let {
                    products
                } = res.data;
                if (products.length < that.data.size) {
                    that.setData({
                        hasMoreData: false
                    })
                }
                that.setData({
                    detail: products
                })
            }
        })
    },
    toAudioDetail(e) {
        let {
            id
        } = e.currentTarget.dataset
        wx.navigateTo({
            url: `/pages/audio_detail/audio_detail?pid=${id}`
        })

    },
})