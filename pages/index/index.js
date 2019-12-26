// pages/index/index.js
import {
    postAjax,
    postAjaxS
} from '../../utils/ajax';
const utils = require('../../utils/util.js');
var app = getApp();
var runTime = Date.now(); //启动时间
const aldstat = require('../../utils/sdk/ald-stat.js');

Page({

    /**
     * 页面的初始数据
     */
    data: {
        page: 1,
        size: 20,
        atAddrObj: {},
        groupObj: {},
        currentTab: 0,
        currentbottomBar: 0,
        navHeight: app.globalData.navHeight,
        hasMoreData: true,
        scrollLeft: []
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        var that = this;
        wx.hideTabBar()
        console.log("index.jsoptions链接:", options)
            // 二维码扫描渠道取值
        if (!!options.scene) {
            let scene = decodeURIComponent(options.scene);
            let query = scene.split('&')[0];
            let cid = query.split('=')[1];
            app.globalData.channelId = cid;
        }
        // 页面传参渠道取值
        if (!!options.cid) {
            app.globalData.channelId = options.cid;
        }
        // 用户id
        if (!!options.inviterUserId) {
            that.setData({
                inviterUserId: options.inviterUserId
            })
        }
        // 商品类型
        if (!!options.inviterType) {
            that.setData({
                inviterType: options.inviterType
            })
        }
        // 商品id
        if (!!options.inviterObjId) {
            that.setData({
                inviterObjId: options.inviterObjId
            })
        }
        // 步数id
        if (!!options.unionId) {
            app.globalData.unionId = options.unionId;
        }
        // 模板消息
        if (!!options.templateSendLogId) {
            that.postTemplateSendLogId(options.templateSendLogId)
        }

        // 帮忙砍价
        if (!!options.sharetime && options.sharetime == 3) {
            // 跳转至砍价页面
            let {
                cid,
                inviterUserId,
                inviterObjId,
                orderid,
                sharetime
            } = options
            wx.navigateTo({
                url: `/pages/cut_down/cut_down?cid=${cid}&inviterUserId=${inviterUserId}&inviterObjId=${inviterObjId}&orderid=${orderid}&sharetime=${sharetime}`,
            })
        }
        // 获取屏幕高度
        wx.getSystemInfo({
            success: function(res) {
                that.setData({
                    scrollHeight: res.windowHeight,
                    windowWidth: res.windowWidth
                });
            }
        });

        if (!!wx.getStorageSync("isSelected")) {
            // 获取感兴趣的商品列表  
            let isSelected = wx.getStorageSync("isSelected")
            if (isSelected == 1) {
                app.visitorLogin(function(obj) {
                    that.setData({
                        authLevel: wx.getStorageSync("authLevel"),
                        userInfo: wx.getStorageSync('userInfo')
                    })
                    that.getPInsterestedList().then((data) => {
                        let {
                            products
                        } = data
                        // 打开感兴趣商品列表窗口
                        that.setData({
                            recmenPopup: true,
                            insterPros: products
                        })
                    })
                    wx.setStorageSync('isSelected', "2") // 2表示已经展示过
                })
            }
        } else {
            wx.redirectTo({
                url: '/pages/welcome/welcome'
            })
        }
    },
    onUnload: function() {
        app.globalData.openOnShowBooks = false
        wx.removeStorageSync('timeStart');
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {
        wx.hideTabBar({
            fail: function() {
                setTimeout(function() { // 做了个延时重试一次，作为保底。
                    wx.hideTabBar()
                }, 500)
            }
        })
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {
        var that = this;
        wx.hideTabBar()

        this.setData({
            currentbottomBar: 0
        })
        app.visitorLogin(function(obj) {
            // 商品
            // that.getGroup()  // 分组

            app.getShareData(4); // 转发语分享路径
            app.getShareData(1, function(res) { // 轮播广告位置
                // console.log(res)
                that.setData({
                    banner: res.data.infos
                })
            })
            app.getTasksList() // 是否可领取任务

            that.getGroup()
            setTimeout(function() {
                that._calculateWidth()
            }, 1000)

            app.getUserInfo([wx.getStorageSync('authLevel'), wx.getStorageSync('userInfo')]).then(function(uinfo) {
                that.setData({
                    authLevel: wx.getStorageSync("authLevel"),
                    userInfo: wx.getStorageSync('userInfo')
                })

                if (wx.getStorageSync("authLevel") == 2) {
                    app.getAccount(); // 获取账户信息 
                    that.getFreeTime().then()
                }
                app.globalData.openOnShowBooks = true
            });

        })
        app.aldstat.sendEvent('书城页面加载时间', {
            time: Date.now() - runTime
        })

    },
    // 授权用户登录
    onGotUserInfo: function(e) {
        var that = this
        if (!e.detail.userInfo) {
            return;
        }
        app.globalData.iv = e.detail.iv; //先放app的全局变量，然后在其他方法解密
        app.globalData.encryptedData = e.detail.encryptedData; //先放app的全局变量，然后在其他方法解密

        app.uploadUserInfo(function(uinfo) {
            // uinfo后台返回来的
            app.globalData.fromauth = 1;
            console.log("授权后台返回的unifo:", uinfo)
            that.setData({
                userInfo: uinfo,
                authLevel: wx.getStorageSync('authLevel')
            });
            app.getAccount(); // 获取账户信息

        });
    },
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {
        // let that = this;
        // that.pList();
        // setTimeout(wx.stopPullDownRefresh, 2000);
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {

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
            const {
                pid
            } = res.target.dataset;
            let target_id = res.target.id;
            if (target_id === 'shareAddThree') {
                return {
                    title: that.data.shareData[0][1],
                    path: `${that.data.shareData[0][4] || "/pages/index/index"}?unionId=${unionId}&cid=${channelId}&inviterType=5`,
                    imageUrl: that.data.shareData[0][3],
                }
            } else if (target_id === 'shareDetail' || target_id === 'shareAddPro') {
                return {
                    title: that.data.shareData[0][1],
                    path: `${that.data.shareData[0][4] || "/pages/index/index"}?cid=${channelId}&inviterUserId=${userId}&inviterType=3&inviterObjId=${pid}`,
                    imageUrl: that.data.shareData[0][3],
                }
            } else if (target_id === 'shareFourbtn') {
                console.log(target_id);
                return {
                    title: that.data.shareData[0][1],
                    path: `${that.data.shareData[0][4] || "/pages/index/index"}?unionId=${unionId}&cid=${channelId}&inviterUserId=${userId}&inviterType=2`,
                    imageUrl: that.data.shareData[0][3]
                }
            }
        }
        app.userShareRecord(0)
        setTimeout(that.getFreeTime, 1000)
        return {
            title: that.data.shareData[0][1],
            path: `${ that.data.shareData[0][4] || "/pages/index/index" }?cid=${channelId}&unionId=${unionId}&inviterType=5`,
            imageUrl: that.data.shareData[0][3],
        }

    },
    pListTotal(bookTypeId) {
        let that = this
        postAjax({
            url: 'interfaceAction',
            data: {
                interId: '20111',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'p-group',
                params: {
                    groupProductCount: 4, // 查询全部
                    bookTypeId
                }
            }
        }).then((res) => {
            // console.log(res.data.infos);
            if (res.data.status == '00') {
                // let products = res.data.infos;
                let [...HorizontalPros] = res.data.infos.filter((element, index) => {
                    // console.log(element)
                    return element.composeType == 1
                })
                that.setData({
                    HorizontalPros
                })
            }
        })
    },
    // 商品列表
    pList(bookTypeId) {
        var that = this;
        postAjax({
            url: 'interfaceAction',
            data: {
                interId: '20111',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'p-group',
                params: {
                    groupProductCount: 3, // 查询全部
                    bookTypeId: bookTypeId
                }
            }
        }).then((res) => {
            // console.log(res.data.infos);
            if (res.data.status == '00') {
                // let products = res.data.infos;
                let [...products] = res.data.infos.map((element, index) => {
                    console.log(element)
                    element.children.map((ele, idx) => {
                        let nohtml = utils.delHtmlTag(ele.productIntroduction)
                        ele.productIntroduction = nohtml
                        return ele
                    })
                    return element
                })
                that.setData({
                    products
                })
            }
        })
    },
    timeFormat(param) { //小于10的格式化函数
        return param < 10 ? '0' + param : param;
    },
    // 授权微信地址
    ToWxAddress: function() {
        var that = this;
        if (!that.checkAdressAuthorize()) {
            wx.authorize({
                scope: 'scope.address',
                success() {
                    // 用户已经同意小程序使用通讯录功能，后续调用 wx.chooseAddress 接口不会弹窗询问
                    that.setData({
                            isauth: false
                        }) //
                    wx.chooseAddress({
                        success: res => {
                            // console.log("res................", res);
                            postAjaxt({
                                url: 'interfaceAction',
                                data: {
                                    interId: '20130',
                                    version: 1,
                                    authKey: wx.getStorageSync('authKey'),
                                    method: 'addr-save',
                                    params: {
                                        receiver_name: res.userName,
                                        receiver_address: `${res.detailInfo}`,
                                        receiver_mobile: res.telNumber,
                                        zip_code: '',
                                        province_code: '',
                                        city_code: '',
                                        province_name: res.provinceName,
                                        city_name: res.cityName,
                                        district_code: res.postalCode,
                                        district_name: res.countyName
                                    }
                                },
                            }).then((_res) => {
                                console.log(_res.id);
                                that.setData({
                                        atAddrObj: {
                                            atAddr: `${res.provinceName}${res.cityName}${res.countyName}${res.detailInfo}`,
                                            tel: res.telNumber,
                                            name: res.userName,
                                            addrId: _res.data.id
                                        }
                                    })
                                    // that.getAddList();
                            })
                        },
                        fail() {}
                    })
                },
                fail() {
                    //用户拒绝授权显示打开授权按钮
                    that.setData({
                        isauth: true
                    })
                }
            })
        }
    },
    //检测是否授权通讯地址，授权返回true,没授权返回false
    checkAdressAuthorize: function() {
        var that = this
        var isCheck = false;
        wx.getSetting({
            success(res) {
                // utils.isEmptyObject(res.authSetting) || 
                if (utils.isEmptyObject(res.authSetting) || !res.authSetting['scope.address']) {
                    console.log('未授权');
                    isCheck = false;
                } else {
                    that.setData({
                        isauth: false
                    })
                    isCheck = true;
                    // }
                }
                return isCheck;
            }
        });
    },
    authHandler: function(e) {
        if (e.detail.authSetting["scope.address"]) { //如果打开了通讯地址，就会为true
            this.setData({
                isauth: false
            })
        }
    },
    // 商品详情(单品详情)
    pDetail(pid, callback) {
        var that = this;
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

                let {
                    product
                } = data.data;
                callback && callback(product)
            }
        })
    },
    // 地址确认触发
    saveAddrCallback(e, orderType) {
        let that = this
        let addrId = this.data.atAddrObj.addrId || -1;
        console.log(addrId);
        let postorderType = orderType ? orderType : 0
        let {
            orderProt
        } = this.data

        // 判断金币不足
        if (this.data.gold < orderProt.needgold) {
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
                    productId: orderProt.id,
                    addrId: addrId,
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
                                wx.switchTab({
                                    url: '/pages/orderlist/orderlist',
                                })
                            }
                        })

                    })

                } else {
                    // 兑换成功
                    that.setData({
                        successModal: true,
                        successTips: `包裹已准备好\n我们会以最快的速度抵达你身边\n请留意“我的纸质书”进度`
                    })
                }
            } else {
                utils.alert(res.data.msg)
            }
        })
    },
    // 兑换
    postOrderSubmit(e, orderType) {
        let that = this;
        console.log(e)
        if (!!e && e.detail) {
            app.postFormId(e.detail.formId);
        }

        let {
            id,
            protype,
            needgold
        } = e.currentTarget.dataset;
        this.setData({
                orderProt: {
                    id,
                    protype,
                    needgold
                }
            })
            // that.getAddList(); 
        let addrId = that.data.atAddrObj.addrId || -1;
        console.log(addrId);
        let postorderType = orderType ? orderType : 0

        // 实物判断地址
        if (protype === 2) {
            if (addrId < 0) {
                that.setData({
                    noaddressModal: true,
                    addressTitle: "还没填写收件信息",
                    addressTips: "马上填写收件地址\n即可获得书本"
                })
                return;
            } else { // 确认信息弹窗
                that.setData({
                    isaddressModal: true,
                    addressTitle: "确认信息正确无误",
                    addressTips: ""
                })
                return;
            }
        }
        // 判断金币不足
        if (that.data.gold < needgold) {
            that.setData({
                EvegoldModal: true
            })
            return;
        }
    },
    // 支付
    PayFor: function(orderId) {
        let that = this
        return new Promise(function(resolve, reject) {

            postAjax({
                url: "interfaceAction",
                method: 'POST',
                data: {
                    interId: '20322',
                    version: 1,
                    authKey: wx.getStorageSync('authKey'),
                    params: {
                        orderId: orderId
                    }
                },
            }).then((res) => {
                console.info(res.data)
                if (res.data.status == '00') {
                    var weVal = res.data.pay;
                    if (weVal) {
                        wx.requestPayment({
                            timeStamp: weVal.timeStamp,
                            nonceStr: weVal.nonceStr,
                            package: weVal.package,
                            signType: 'MD5',
                            signType: weVal.signType,
                            paySign: weVal.paySign,
                            success: function(info) {
                                console.log("pay success")
                                console.log(info)
                                    // wx.navigateTo({
                                    //   url: '/pages/my/orderlist/orderlist',
                                    // })
                                that.syncPay(res.data.orderId, 1)
                                resolve(info);
                            },
                            fail: function(fail) {
                                console.log('fail')
                                    //取消支付或者为支付失败去到待付款订单列表
                                wx.switchTab({
                                        url: '/pages/orderlist/orderlist'
                                    })
                                    // reject(fail);
                            },
                            complete: function(complete) {
                                console.log('complete')
                            }
                        })
                    }
                } else {
                    utils.alert(res.data.resultMsg)
                }
            })
        })
    },
    // 同步前端支付
    syncPay: function(orderId, payStatus) {
        postAjax({
            url: "interfaceAction",
            method: 'POST',
            data: {
                interId: '20323',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                params: {
                    orderId: orderId,
                    payStatus: payStatus
                }
            },
        }).then((res) => {
            console.info(res.data)
            if (res.data.status == '00') {

            } else {
                utils.alert(res.data.resultMsg)
            }
        })
    },
    // 获取我的地址
    getAddList: function(callback) {
        //获取地址列表
        var that = this;
        postAjax({
            url: "interfaceAction",
            method: 'POST',
            data: {
                interId: '20130',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'addr-list',
            }
        }).then((res) => {
            console.info(res.data)
            if (res.data.status == '00') {
                let length = res.data.infos.length
                let addrArray = res.data.infos ? res.data.infos[0] : false
                if (addrArray) {
                    that.setData({
                        atAddrObj: {
                            atAddr: `${addrArray[6]}${addrArray[8]}${addrArray[10]}${addrArray[2]}`,
                            tel: addrArray[3],
                            name: addrArray[1],
                            addrId: addrArray[0]
                        }
                    })
                }
                callback && callback()
            } else {
                utils.alert(res.data.resultMsg)
            }
        })
    },
    // 单品弹窗
    popupProduct(e) {
        console.log(e)
        let sinProdtInfo = e.currentTarget.dataset.item
        let id = sinProdtInfo.id
        let that = this
        that.pDetail(id, function(data) {
            that.setData({
                popupSinProdtModal: true,
                sinProdtInfo: data,
                // shareUrl: `https://small.ejamad.com/realSync230?authKey=${wx.getStorageSync('authKey')}&id=${id}`
            })
        })
    },
    // 单品订单提交成功回调
    postOrderCallback(data) {
        let id = data.detail
        let that = this
        console.log(data)
        this.pDetail(id, function(data) {
            console.log(data)
            that.setData({
                sinProdtInfo: data
            })
        })
    },
    // 查看免费书单
    viewBookList(e) {
        console.log("查看免费书单")
        let {
            groupid,
            gtitle
        } = e.currentTarget.dataset
        wx.navigateTo({
            url: `/pages/share_detail/share_detail?groupid=${groupid}&gtitle=${gtitle}`
        })
    },
    toAudioDetail(e) {
        let {
            id,
            welftype
        } = e.currentTarget.dataset
        if (welftype == 6) {
            wx.navigateTo({
                url: `/pages/audio_detail/audio_detail?pid=${id}`
            })
        }
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
                // console.log("scrollLeft", scrollLeft)
                that.setData({
                    scrollLeft
                })
            })

        }, 500)

    },
    switchNav(e) {
        var {
            current,
            booktypeid
        } = e.currentTarget.dataset;

        //每个tab选项宽度占1/4
        // var singleNavWidth = this.data.windowWidth / 4;
        var scrollLeft = this.data.scrollLeft
            //tab选项居中                            
        this.setData({
            // navScrollLeft: (current - 1) * singleNavWidth
            navScrollLeft: scrollLeft[current]
        })

        if (this.data.currentTab == current) {
            return false;
        } else {
            this.setData({
                currentTab: current,
                page: 1,
                bookTypeId: booktypeid,
                groupObj: {},
                scrollTop: 0,
                toView: "scrollId",
                hasMoreData: true
            })
        }
        // postgroupid 請求列表
        this.pList(booktypeid)
    },
    switchTab(e) {
        var {
            booktypeid
        } = e.currentTarget.dataset;
        // 检查在数组的第几位
        let current = this.checkIndexInArray(booktypeid, this.data.bookTypes)
        console.log("current:", current)

        //每个tab选项宽度占1/4
        // var singleNavWidth = this.data.windowWidth / 4;
        var scrollLeft = this.data.scrollLeft; // 当前tab前面的累计宽度
        //tab选项居中                            
        this.setData({
            // navScrollLeft: (current - 1) * singleNavWidth
            navScrollLeft: scrollLeft[current]
        })
        if (this.data.currentTab == current) {
            return false;
        } else {
            this.setData({
                currentTab: current,
                page: 1,
                bookTypeId: booktypeid,
                groupObj: {},
                scrollTop: 0,
                toView: "scrollId",
                hasMoreData: true
            })
        }
        // postgroupid 請求列表
        this.pList(booktypeid)
    },
    scrolltoupper(e) {
        // console.log(e.detail.scrollTop)
    },
    // 头部分类信息
    getGroup() {
        let that = this
        postAjax({
            url: 'interSyncAction',
            data: {
                interId: '20400',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'book-type-list',
                params: {
                    "type": 0 //  0 - 所有类型； 1 - 去除附加类型
                }
            }
        }).then((res) => {
            if (res.data.status == '00') {
                console.log("res", res)
                let {
                    bookTypes
                } = res.data;

                that.setData({
                    bookTypes,
                    bookTypeId: that.data.bookTypeId || bookTypes[0][0]
                        // bookTypeId: bookTypes[0][0],
                        // groupObj: {},
                        // currentTab: 0,
                        // navScrollLeft: 0
                })
                that.pList(that.data.bookTypeId) // 默認第一分組的內容列表
                    // that.pList(bookTypes[0][0]) // 默認第一分組的內容列表
                that.pListTotal(that.data.bookTypeId) // 获取横向排列的数据
            }
        })
    },
    // 加载更多商品
    loadMoreDataBypid(e) {
        let that = this
        if (this.data.currentTab == 0 || !this.data.hasMoreData) {
            return;
        }
        this.setData({
            isloading: true
        })
        that.data.page++;
        that.pMoreList()
    },
    pMoreList() {
        let that = this;
        postAjax({
            url: 'interfaceAction',
            data: {
                interId: '20111',
                version: 1,
                authKey: wx.getStorageSync('authKey'),
                method: 'p-group',
                params: {
                    // groupId,
                    groupProductCount: 0,
                    page: that.data.page,
                    size: that.data.size,
                    bookTypeId: that.data.bookTypeId
                }
            }
        }).then((res) => {
            if (res.data.status == '00') {
                // let [...products] = res.data.products.map((element, index) => {
                //     console.log(element)
                //     element[2] = utils.delHtmlTag(element[2])
                //     return element
                // })
                setTimeout(function() {
                    that.setData({
                        isloading: false
                    })
                }, 500)

                if (res.data.infos.length == 0) {
                    // wx.showToast({
                    //     title: '没有更多了',
                    //     icon: "none"
                    // })
                    that.setData({
                        hasMoreData: false
                    })
                    return;
                }
                let [...products] = res.data.infos.map((element, index) => {
                        // console.log(element)
                        element.children.map((ele, idx) => {
                                let nohtml = utils.delHtmlTag(ele.productIntroduction)
                                ele.productIntroduction = nohtml
                                return ele
                            })
                            // let conArr = that.dealMoreData(that.data.products, element)
                            // console.log(conArr)
                        return element
                    })
                    // console.log("add", products)
                products.map((element, index) => {
                    let conArr = that.dealMoreData(that.data.products, element.children)
                        // console.log(conArr)
                    that.setData({
                        products: conArr
                    })
                })

            }
        })
    },
    dealMoreData(arr, addArr) {
        let [...products] = arr.map((element, index) => {
            if (index == arr.length - 1) {
                element.children = element.children.concat(addArr)
                    // console.log(element)
                return element
            }
            return element
        })
        return products
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

    },
    toDailyTask() {
        wx.navigateTo({
            url: `/pages/daily_task/daily_task`
        })
    },
    toBookList(e) {
        let {
            pid,
            ptitle
        } = e.currentTarget.dataset
        let {
            bookTypeId
        } = this.data
        wx.navigateTo({
            url: `/pages/book_list/index?pid=${pid}&ptitle=${ptitle}&bookTypeId=${bookTypeId}`
        })

    },
    toShopMall() {
        wx.navigateTo({
            url: `/pages/shopMall/shopMall`
        })
    },
    //  领取会员卡
    bindReceive() {
        this.setData({
            isMenCard: true
        })
    },
    getPInsterestedList() {
        // 感兴趣商品列表
        return new Promise((resolve, reject) => {
            postAjax({
                url: 'interfaceAction',
                data: {
                    interId: '20111',
                    version: 1,
                    authKey: wx.getStorageSync('authKey'),
                    method: 'p-interested-list'
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
    // 进入音频详情页面
    freeListen(e) {
        let id = e.detail
        console.log(id)
        wx.navigateTo({
            url: `/pages/audio_detail/audio_detail?pid=${id}`
        })
    },
    checkIndexInArray(id, arr) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i][0] == id) {
                return i;
            }
        }
    },
    showFreeTimeModal() {
        // 展示剩余免费时长窗口
        this.setData({
            firstfreeTimeModal: true
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
    }
})