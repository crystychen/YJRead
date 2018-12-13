//index.js
import {
    postAjax
} from '../../utils/ajax.js';
import {
    postAjaxS
} from '../../utils/ajax.js';
const utils = require('../../utils/util.js');
// var WxParse = require('../../wxParse/wxParse.js');
const app = getApp()
var runTime = Date.now() //启动时间
const aldstat = require('../../utils/sdk/ald-stat.js') // SDK接入

Page({
    data: {
        currentTab: 0,
        page: 1,
        size: 20,
        hasMoreData: true,
        loadingImgHidden: true,
        isSignedModal: false,
        passTipschecked: true
            // isShareBoard: false
    },

    onLoad: function(options) {
        let that = this
        console.log(options)
            // wx.showLoading({ //期间为了显示效果可以添加一个过度的弹出框提示“加载中”  
            //     title: '加载中',
            //     icon: 'loading',
            // });
        wx.getSystemInfo({
                success: (res) => {
                    this.setData({
                        pixelRatio: res.pixelRatio,
                        windowHeight: res.windowHeight,
                        windowWidth: res.windowWidth
                    })
                }
            })
            // wx.setTabBarBadge({
            //         index: 0,

        //     })
        wx.showTabBarRedDot({
                index: 0
            })
            // this.setData({
            //         isTaskTips: app.globalData.isTaskTips,
            //         isReAwardTips: app.globalData.isReAwardTips
            //     })
            // 页面传参
        if (!!options.cid) { // 渠道取值
            app.globalData.channelId = options.cid;
        }
        // 邀请人
        if (!!options.inviterUserId) {
            that.setData({
                inviterUserId: options.inviterUserId
            })
        }
        if (!!options.inviterType) {
            that.setData({
                inviterType: options.inviterType
            })
        }
        if (!!options.inviterObjId) {
            that.setData({
                inviterObjId: options.inviterObjId || ""
            })
        }
        if (!!options.shareurl && !!options.shareartid) {
            that.setData({
                    shareurl: options.shareurl,
                    shareartid: options.shareartid
                })
                // if (wx.getStorageSync("authLevel") == 2) {
                // 老用户直接跳转
                // that.NumTap(options.shareartid)
            wx.navigateTo({
                    url: `/pages/article_detail/article_detail?url=${options.shareurl}`,
                })
                // }
        }
    },
    onUnload() {
        app.globalData.openOnShow = false
        wx.removeStorageSync('timeStart');
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {
        app.aldstat.sendEvent('首页初次渲染完成时间', {
            time: Date.now() - runTime
        })
        wx.hideTabBar({
            fail: function() {
                setTimeout(function() { // 做了个延时重试一次，作为保底。
                    wx.hideTabBar()
                }, 500)
            }
        })
    },
    onShow: function() {
        let that = this

        wx.hideTabBar()

        this.setData({
            currentTab: 0
        })
        app.visitorLogin(function(uinfo) {
                that.setData({
                        authLevel: wx.getStorageSync("authLevel"),
                        userInfo: wx.getStorageSync('userInfo')
                    })
                    // 通过链接进来重新加载广告, 邀请人id = inviterUserId(不需授权调用)
                if (!app.globalData.openOnShow || that.data.inviterUserId) {
                    app.getShareData(4); // 转发语
                }

                that.pList();
                app.getTasksList(function() {}) // 是否可领取任务
                    // wx.hideLoading();

                app.getUserInfo([wx.getStorageSync('authLevel'), wx.getStorageSync('userInfo')]).then(function(uinfo) {
                    that.setData({
                            authLevel: wx.getStorageSync("authLevel"),
                            userInfo: wx.getStorageSync('userInfo')
                        })
                        // that.getSignInfo(function(res) {
                        //     console.log("是否需要签到, res为false不需要，true需要签到") // res为false不需要，true需要签到
                        //     console.log(res)
                        //     if (res && wx.getStorageSync("authLevel") == 1) {
                        //         that.setData({
                        //             isSignedModal: true // 未签到弹出签到层
                        //         })
                        //     }
                        // });
                    if (wx.getStorageSync("authLevel") == 2) {
                        // app.getAccount(); // 获取账户信息      
                    }
                    app.globalData.openOnShow = true

                });
            })
            // 阅读文章时间
        if (wx.getStorageSync('timeStart')) {

            utils.getReadTime()
                .then((data) => {
                    console.log("阅读完的请求数据:", data);
                    that.postReadTime(data.id, data.second, data.ruleid, data.url);
                })
                .catch((err) => {
                    console.log(err);
                })
        };
        app.aldstat.sendEvent('首页加载时间', {
            time: Date.now() - runTime
        })
    },
    onHide: function() {
        this.setData({
            readTips: false
        })
    },
    // 授权获取从授权组件传用户信息
    getUserInfofromCom: function(e) {
        var that = this

        app.uploadUserInfo(function(uinfo, callback) {
            // uinfo后台返回来的
            app.globalData.fromauth = 1;
            console.log("后台返回的unifo:", uinfo)
            console.log("callback:", callback)
            that.setData({
                userInfo: uinfo,
                // authLevel: 3
            })
            that.signIn();
            app.getAccount(); // 获取账户信息
            // 分享文章进来授权后跳转到文章、
            if (!!that.data.shareurl) {
                that.NumTap(that.data.shareartid)
                wx.navigateTo({
                    url: `/pages/article_detail/article_detail?url=${that.data.shareurl}`,
                })
            }
        });
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
            // 自动下单进入音频详情页
            that.postOrderSubmit(id, function() {
                wx.navigateTo({
                    url: `/pages/audio_detail/audio_detail?pid=${id}`
                })
            })

        });
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
                        var isSigned = that.isSigned()
                        that.setData({
                            signDays: signDays,
                            isSigned: isSigned
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
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {
        // console.log("触底")
    },
    // 上拉加载更多
    loadMoreData() {
        console.log("到底触发")
        var that = this;
        if (this.data.hasMoreData) {
            that.data.page++
                postAjax({
                    url: 'interfaceAction',
                    data: {
                        interId: '20510',
                        version: 1,
                        authKey: wx.getStorageSync('authKey'),
                        method: 'content-list',
                        params: {
                            groupId: that.data.groupId,
                            page: that.data.page,
                            size: that.data.size
                        }
                    }
                }).then((res) => {
                    if (res.data.status == '00') {
                        if (res.data.contentList < that.data.size) {
                            that.setData({
                                detail: that.data.contentList.concat(res.data.contentList),
                                hasMoreData: false
                            })
                        } else {
                            that.setData({
                                detail: that.data.contentList.concat(res.data.contentList),
                                hasMoreData: true,
                                page: that.data.page
                            })
                        }
                    }
                });
        } else {
            wx.showToast({
                title: '没有更多了',
                icon: 'none'
            })
        }
    },
    // 防止冒泡
    preventBubble() {
        return false
    },
    // 用户行为记录
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
                shareartid
            } = res.target.dataset;
            let target_id = res.target.id;
            if (target_id === 'item-share') {
                return {
                    title: that.data.shareData[0][1],
                    path: `${that.data.shareData[0][4] || "/pages/index/index"}?unionId=${unionId}&cid=${channelId}&inviterType=5&shareurl=${shareurl}&shareartid=${shareartid}`,
                    imageUrl: that.data.shareData[0][3],
                }
            }
        }
        return {
            title: that.data.shareData[0][1],
            path: `${that.data.shareData[0][4] || "/pages/index/index"}?cid=${channelId}&unionId=${unionId}&inviterType=0`,
            imageUrl: that.data.shareData[0][3],
        }
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
    showPosterModal(e) {
        let artid = e.detail
        console.log(e)
        this.setData({
            isPosterModal: true,
            shareImgUrl: `https://small.ejamad.com/realSync214?authKey=${wx.getStorageSync('authKey')}&id=${artid}`
        })
    },
    // 进入分享页  
    bindClickCard(e) {
        let {
            id,
            isbuy
        } = e.currentTarget.dataset
        if (isbuy) {
            wx.navigateTo({
                url: `/pages/audio_detail/audio_detail?pid=${id}`
            })
        } else {
            this.postOrderSubmit(id, function() {
                wx.navigateTo({
                    url: `/pages/audio_detail/audio_detail?pid=${id}`
                })
            })
        }

    },
    // 轮播滑动完成
    onSwiperAnimationFinish(e) {
        let {
            current,
            source
        } = e.detail
            // console.log(e)
    },
    // 轮播改变
    onSwiperChange(e) {
        // console.log("轮播改变")
        let {
            current,
            source
        } = e.detail
            // console.log(e)
    },
    pList() {
        var that = this;
        postAjax({
            url: 'interfaceAction',
            data: {
                interId: '20111',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'p-group',
                params: {
                    groupProductCount: 20
                }
            }
        }).then((res) => {
            console.log(res);
            if (res.data.status == '00') {
                let [...bannerData] = res.data.infos.map((element, index) => {
                    console.log(element)
                    element.children.map((ele, idx) => {
                        let nohtml = utils.delHtmlTag(ele.productIntroduction)
                        ele.productIntroduction = nohtml
                        return ele
                    })
                    return element
                })
                that.setData({
                    bannerData
                })

            }
        })
    },
    toShareDetail(e) {
        let {
            groupid,
            gtitle
        } = e.currentTarget.dataset
        wx.navigateTo({
            url: `/pages/share_detail/share_detail?groupid=${groupid}&gtitle=${gtitle}`
        })
    },
    toShopMall() {
        wx.switchTab({
            url: "/pages/shopMall/shopMall"
        })
    },
    putBookshelf(e) {
        let that = this
        let {
            pid
        } = e.currentTarget.dataset
        this.postOrderSubmit(pid, (res) => {
            // 兑换成功提示加入书架
            wx.showToast({
                title: '已放入书架',
                icon: "none",
                success: (res) => {
                    // wx.navigateTo({
                    //     url: '/pages/orderlist/orderlist',
                    // })
                    that.pList()
                }
            })
        })
    },
    // 提交订单
    postOrderSubmit(pid, callback) {
        // let { pid } = e.currentTarget.dataset
        // 生成订单
        postAjax({
            url: "interfaceAction",
            method: 'POST',
            data: {
                interId: '20321',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'order-submit',
                params: {
                    productId: pid,
                    orderType: 0,
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
                                    url: '/pages/orderlist/orderlist',
                                })
                            }
                        })

                    })

                } else {
                    // 兑换成功提示加入书架
                    // wx.showToast({
                    //     title: '已放入书架',
                    //     icon: "none",
                    //     success: (res) => {
                    //         // wx.navigateTo({
                    //         //     url: '/pages/orderlist/orderlist',
                    //         // })
                    //     }
                    // })
                    callback && callback(res)
                }
            } else {
                utils.alert(res.data.msg)
            }
        })
    },
    // 底部导航
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