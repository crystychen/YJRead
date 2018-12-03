//index.js
import {
    postAjax
} from '../../utils/ajax.js';
import {
    postAjaxS
} from '../../utils/ajax.js';
const utils = require('../../utils/util.js');
const app = getApp()

Page({
    data: {
        currentTab: 0,
        page: 1,
        size: 20,
        hasMoreData: true,
        loadingImgHidden: true,
        isSignedModal: false,
        // isShareBoard: false
    },
    onLoad: function(options) {
        let that = this
        console.log(options)
        this.setData({
            groupid: options.groupid,
            gtitle: options.gtitle
        })
        wx.getSystemInfo({
            success: (res) => {
                this.setData({
                    pixelRatio: res.pixelRatio,
                    windowHeight: res.windowHeight,
                    windowWidth: res.windowWidth
                })
            }
        })
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
                inviterObjId: options.inviterObjId
            })
        }
        if (!!options.shareurl && !!options.shareartid) {
            that.setData({
                shareurl: options.shareurl,
                shareartid: options.shareartid
            })
            if (wx.getStorageSync("authLevel") == 2) {
                // 老用户直接跳转
                that.NumTap(options.shareartid)
                wx.navigateTo({
                    url: `/pages/article_detail/article_detail?url=${options.shareurl}`,
                })
            }
        }
    },
    onUnload() {
        app.globalData.openOnShow = false
    },
    onShow: function() {
        let that = this
        app.visitorLogin(function(uinfo) {
            that.setData({
                authLevel: wx.getStorageSync("authLevel"),
                userInfo: wx.getStorageSync('userInfo')
            })

            app.getShareData(4); // 转发语
            that.groupList(that.data.groupid);
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

                app.globalData.openOnShow = true

            });
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
    preventDefault() {
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
                shareartid,
                pid
            } = res.target.dataset;

            let target_id = res.target.id;
            if (target_id === 'item-share') {
                that.postOrder(pid)

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
                            // if (_this.data.shareBtn) {
                            //     //判断是否分享到群
                            //     if (res.hasOwnProperty('shareTickets')) {
                            //         console.log(res.shareTickets[0]);
                            //         //分享到群
                            //         _this.data.isshare = 1;
                            //     } else {
                            //         // 分享到个人
                            //         _this.data.isshare = 0;
                            //     }
                            // }
                            // wx.showToast({
                            //     title: '分享成功',
                            // })
                            // that.postOrder(pid)
                        } else {
                            // wx.showToast({
                            //     title: '分享失败',
                            // })
                        }
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
    // 提交订单
    postOrder(pid, orderType) {
        let that = this

        let postorderType = orderType ? orderType : 0
            // let { orderProt } = this.data

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
                    orderType: postorderType,
                    channelId: app.globalData.channelId
                }
            },
        }).then((res) => {
            if (res.data.success) {
                // 判断是否需要支付，true调起支付
                if (res.data.pay) {
                    that.PayFor(res.data.orderId).then(function(data) {

                        // that.pDetail(pid);
                        // that.getProductDetail(that.data.productId);
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
                    // 兑换成功
                    // that.setData({
                    //     successModal: true,
                    //     successTips: `包裹已准备好\n我们会以最快的速度抵达你身边\n请留意“我的纸质书”进度`
                    // })
                    wx.showToast({
                        title: "领取成功"
                    })
                    that.groupList(that.data.groupid);

                }
            } else {
                utils.alert(res.data.msg)
            }
        })
    },
    // 进入分享页  
    bindClickCard(e) {
        let { id } = e.currentTarget.dataset
        wx.navigateTo({
            url: `/pages/audio_detail/audio_detail?pid=${id}`
        })
    },
    // 轮播滑动完成
    onSwiperAnimationFinish(e) {
        let { current, source } = e.detail
            // console.log(e)
    },
    // 轮播改变
    onSwiperChange(e) {
        // console.log("轮播改变")
        let { current, source } = e.detail
            // console.log(e)
    },
    groupList(gid) {
        var that = this;
        postAjax({
            url: 'interfaceAction',
            data: {
                interId: '20111',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'p-group-list',
                params: {
                    groupId: gid,
                    page: that.data.page,
                    size: that.data.size
                }
            }
        }).then((res) => {
            console.log(res);
            if (res.data.status == '00') {
                let {
                    products
                } = res.data;
                that.setData({
                    products
                })
            }
        })
    },
    toAudioDetail(e) {
        let { pid } = e.currentTarget.dataset
        wx.navigateTo({
            url: `/pages/audio_detail/audio_detail?pid=${pid}`
        })
    }
})