//index.js
import {
    postAjax
} from '../../utils/ajax.js';
import {
    postAjaxS
} from '../../utils/ajax.js';
const utils = require('../../utils/util.js');
import {
    $wuxBackdrop
} from '../../components/dist/index'

const app = getApp()
var runTime = Date.now(); //启动时间
const aldstat = require('../../utils/sdk/ald-stat.js');


Page({
    data: {
        currentTab: 0,
        page: 1,
        size: 20,
        hasMoreData: true,
        loadingImgHidden: true,
        passTipschecked: true,
        currentbottomBar: 2,
        navHeight: app.globalData.navHeight,
        scrollLeft: []
    },
    onLoad: function(options) {
        let that = this
        wx.hideTabBar()

        console.log(options)
        wx.getSystemInfo({
            success: (res) => {
                this.setData({
                    pixelRatio: res.pixelRatio,
                    windowHeight: res.windowHeight,
                    windowWidth: res.windowWidth
                })
            }
        })
        this.setData({
                isTaskTips: app.globalData.isTaskTips,
                isReAwardTips: app.globalData.isReAwardTips
            })
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
                inviterObjId: options.inviterObjId
            })
        }
        if (!!options.shareurl) {
            that.setData({
                    shareurl: options.shareurl,
                    shareartid: options.shareartid || ""
                })
                // 用户直接跳转
            that.NumTap(options.shareartid)
            wx.navigateTo({
                url: `/pages/article_detail/article_detail?url=${options.shareurl}`,
            })
        }

        if (wx.getStorageSync('passTips')) {
            app.globalData.passTips = wx.getStorageSync('passTips')
        }
        if (wx.getStorageSync('failTips')) {
            app.globalData.failTips = wx.getStorageSync('failTips')
        }

    },
    onUnload() {
        wx.removeStorageSync('timeStart');
        app.globalData.openOnShowReading = false
    },
    onReady: function() {
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
            currentbottomBar: 2
        })
        app.visitorLogin(function(uinfo) {
                that.setData({
                    authLevel: wx.getStorageSync("authLevel"),
                    userInfo: wx.getStorageSync('userInfo')
                })

                app.getShareData(4); // 转发语
                // that.getGroup(); // 文章分組
                app.getTasksList() // 是否可领取任务

                if (!app.globalData.openOnShowReading || that.data.shareurl) {
                    that.getGroup(); // 文章分組
                    setTimeout(function() {
                        that._calculateWidth()
                    }, 1000)
                }

                app.getUserInfo([wx.getStorageSync('authLevel'), wx.getStorageSync('userInfo')]).then(function(uinfo) {
                    that.setData({
                        authLevel: wx.getStorageSync("authLevel"),
                        userInfo: wx.getStorageSync('userInfo')
                    })

                    if (wx.getStorageSync("authLevel") == 2) {
                        app.getUserVipList().then(res => {
                            let length = res.data.infos.length
                            if (length) {
                                that.setData({
                                    userVip: true
                                })
                            }
                        })
                        app.getUserVip().then((res) => {
                            let VipEndTime = "",
                                overDate = "";
                            if (res.data.endTime) {
                                VipEndTime = res.data.endTime.substr(0, 10);
                                overDate = utils.judgeTime(res.data.endTime)
                                if (overDate) {
                                    VipEndTime = false
                                }
                            }
                            that.setData({
                                isVip: res.data.isVip,
                                VipEndTime
                            })
                        })
                    }

                    app.globalData.openOnShowReading = true

                });
            })
            // 阅读文章时间
        if (wx.getStorageSync('timeStart')) {

            utils.getReadTime()
                .then((data) => {
                    console.log("阅读完的请求数据:", data);
                    // that.postReadTime(data.id, data.second, data.ruleid, data.url);
                    that.postReadTime(data.id, data.second, data.ruleid, data.url);
                })
                .catch((err) => {
                    console.log(err);
                })
        };
        app.aldstat.sendEvent('阅读页面加载时间', {
            time: Date.now() - runTime
        })
    },
    onHide: function() {
        this.setData({
            readTips: false
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

        });
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
            // 分享文章进来授权后跳转到文章
            if (!!that.data.shareurl) {
                that.NumTap(that.data.shareartid)
                wx.navigateTo({
                    url: `/pages/article_detail/article_detail?url=${that.data.shareurl}`,
                })
            }
        });
    },
    // 文章分組
    getGroup() {
        let that = this
        postAjax({
            url: 'interfaceAction',
            data: {
                interId: '20510',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'content-group'
            }
        }).then((res) => {

            if (res.data.status == '00') {
                let {
                    contentGroupList
                } = res.data;
                that.setData({
                    contentGroupList,
                    groupId: that.data.groupId || contentGroupList[0][0]
                })
                that.getArticleList(that.data.groupId) // 默認第一分組的內容列表
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
                    size: that.data.size
                }
            }
        }).then((res) => {
            if (res.data.status == '00') {
                let {
                    contentList
                } = res.data;
                if (contentList.length < that.data.size) {
                    that.setData({
                        hasMoreData: false
                    })
                } else {
                    that.setData({
                        hasMoreData: true
                    })
                }
                that.setData({
                    contentList
                })
                callback && callback(res)
            }
        })
    },
    _calculateWidth() {
        let scrollLeft = this.data.scrollLeft
        let navList = ""
        let that = this
            //动态设置
        setTimeout(function() {
            var query = wx.createSelectorQuery();
            query.selectAll('.nav-item').boundingClientRect();
            query.exec(function(rect) {
                if (rect[0] === null) return;
                navList = rect[0]
                let width = 0
                scrollLeft.push(width)
                console.log(navList)
                for (let i = 0; i < navList.length; i++) {
                    let item = navList[i]
                    console.log(item)
                    width += item.width - 8
                    scrollLeft.push(width)
                }
                that.setData({
                    scrollLeft
                })
            })

        }, 500)

    },
    // 切换分组tab
    switchNav(e) {
        var {
            current,
            postgroupid
        } = e.currentTarget.dataset;

        //每个tab选项宽度占1/4
        // var singleNavWidth = this.data.windowWidth / 4;
        //tab选项居中                            
        // this.setData({
        //     navScrollLeft: (current - 1) * singleNavWidth
        // })
        var scrollLeft = this.data.scrollLeft
        this.setData({
            navScrollLeft: scrollLeft[current]
        })
        if (this.data.currentTab == current) {
            return false;
        } else {
            this.setData({
                currentTab: current,
                page: 1,
                hasMoreData: true,
                groupId: postgroupid
            })
        }
        // postgroupid 請求列表
        this.getArticleList(postgroupid)
    },
    // 计算横向导航前n-1个宽度累计

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {
        console.log("刷新")
        this.setData({
            page: 1,
            hasMoreData: true
        })
        this.getArticleList(this.data.groupId) // 当前组的第一页
        setTimeout(wx.stopPullDownRefresh, 2000);
    },
    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {
        console.log("触底")
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
                        if (res.data.contentList.length < that.data.size) {
                            that.setData({
                                contentList: that.data.contentList.concat(res.data.contentList),
                                hasMoreData: false
                            })
                        } else {
                            that.setData({
                                contentList: that.data.contentList.concat(res.data.contentList),
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
    // 文章详情
    clickArticle(e) {
        let {
            url,
            id,
            ruleid
        } = e.currentTarget.dataset
        if (wx.getStorageSync('readTips')) {
            this.setData({
                readTips: false
            })
            this.jumpArcticelDetail(id, ruleid, url)
        } else {
            this.setData({
                readTips: true,
                jumpArtObj: {
                    url,
                    id,
                    ruleid
                }
            })
            wx.setStorageSync("readTips", true)
        }
    },
    jumpArcticelDetail(id, ruleid, url) {
        // 记录时间
        this.NumTap(id, ruleid, url)
            // 记录点击数
        this.userAction(id, 3)
        if (!!url) {
            wx.navigateTo({
                url: `/pages/article_detail/article_detail?url=${url}&shareartid=${id}`,
            })
        } else {
            wx.showToast({
                title: '公众号文章不存在',
                icon: 'none'
            })
        }
    },
    // 切换收藏
    toggleCollect(e) {
        let that = this
            // this.setData({
            //     isDeal: true
            // })
        let {
            id,
            iscollected
        } = e.currentTarget.dataset
        let size = that.data.size
        if (iscollected == 0) {
            this.userAction(id, 101) // 收藏
        } else {
            this.userAction(id, 102) // 取消收藏
        }

        this.setData({
            page: 1,
            hasMoreData: true
                // size: 100
        })
        this.getArticleList(this.data.groupId, function() {
            // that.setData({
            //     isDeal: false
            // })
            // that.setData({
            //     size: size
            // })
        })
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
    // 点击计时
    NumTap(id, ruleid, url) {
        let startTime = new Date().getTime(); //获取系统日期
        wx.setStorageSync("timeStart", {
            id,
            ruleid,
            url,
            beginTime: startTime
        })
    },
    // 提交阅读时间
    postReadTime(id, second, ruleid, url, type) {
        var that = this;
        console.log(id)
        console.log(ruleid)
        console.log(url)

        postAjaxS({
                url: 'interfaceAction',
                data: {
                    interId: '70009',
                    version: 1,
                    authKey: wx.getStorageSync('authKey'),
                    method: 'r-rule-click',
                    id: id,
                    params: {
                        stayTime: second,
                        objType: 5,
                        defGroupId: that.data.groupId
                    }
                }
            }).then((res) => {
                if (res.data.status == '00') {
                    if (res.data.award > 0) {
                        if (app.globalData.passTips) {
                            wx.showToast({
                                title: `获得${res.data.award}书签`,
                                icon: 'none'
                            })
                        } else {
                            that.setData({
                                showAwardPass: true,
                                passAward: {
                                    gold: res.data.award
                                }
                            })
                        }
                    }
                } else if (res.data.status == '6') { // 停留时间过短
                    if (app.globalData.failTips) {
                        wx.showToast({
                            title: `阅读时间过短,未获得书签`,
                            icon: 'none'
                        })
                    } else {
                        that.setData({
                            showAwardFail: true,
                            recordRead: {
                                id: id,
                                ruleid: ruleid,
                                url: url
                            },
                            failAward: "阅读时间过短, 未获得书签"
                        })
                    }
                } else if (res.data.status == '4') { // 对象总限, 提示该文章领取过奖励
                    wx.showToast({
                        title: `该文章的阅读奖励已经领取过了`,
                        icon: 'none'
                    })
                }
                wx.removeStorageSync('timeStart');
            })
            .catch((err) => {
                console.log(err);
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
                    path: `/pages/reading/reading?unionId=${unionId}&cid=${channelId}&inviterType=5&shareurl=${shareurl}&shareartid=${shareartid}`,
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
    hideReadTips() {
        this.setData({
            readTips: false
        })
        let {
            jumpArtObj
        } = this.data
        this.jumpArcticelDetail(jumpArtObj.id, jumpArtObj.ruleid, jumpArtObj.url)
    },
    //  领取卡片
    bindReceive() {
        this.setData({
            isMenCard: true
        })
    },
    // 底部导航
    toTabMy() {
        wx.switchTab({
            url: '/pages/my/my'
        })
    },
    toTabBookShelf() {
        wx.switchTab({
            url: '/pages/orderlist/orderlist'
        })
    },
    toTabShopMall() {
        wx.switchTab({
            url: '/pages/index/index'
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