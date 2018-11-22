// pages/index/index.js
import {
    postAjax,
    postAjaxS
} from '../../utils/ajax';
const utils = require('../../utils/util.js');
var app = getApp();

// var runTime = Date.now(); //启动时间
// const aldstat = require('../../utils/sdk/ald-stat.js');

Page({

    /**
     * 页面的初始数据
     */
    data: {
        // page: 1,
        // size: 6,
        // bannerImg: "/images/mall-top-bcg.png",
        atAddrObj: {},
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        var that = this;
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
        // 获取屏幕高度
        wx.getSystemInfo({
            success: function(res) {
                that.setData({
                    scrollHeight: res.windowHeight
                });
            }
        });
    },
    onUnload: function() {
        app.globalData.openOnShow = false
        wx.removeStorageSync('timeStart');
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
        var that = this;

        app.visitorLogin(function(obj) {
            // 商品
            that.pList();
            app.getShareData(4); // 转发语分享路径
            app.getShareData(20, function(res) { // 换购书签说明(其他广告位置)
                console.log()
                that.setData({
                    ruleDesc: res.data.infos[0]
                })
            })
            that.getAddList(); // 我的地址列表
            app.getUserInfo([wx.getStorageSync('authLevel'), wx.getStorageSync('userInfo')]).then(function(uinfo) {
                that.setData({
                    authLevel: wx.getStorageSync("authLevel"),
                    userInfo: wx.getStorageSync('userInfo')
                })

                if (wx.getStorageSync("authLevel") == 2) {
                    app.getAccount(); // 获取账户信息               
                }

            });

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
        let that = this;
        that.pList();
        setTimeout(wx.stopPullDownRefresh, 2000);
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
        return {
            title: that.data.shareData[0][1],
            path: `${ that.data.shareData[0][4] || "/pages/index/index" }?cid=${channelId}&unionId=${unionId}&inviterType=5`,
            imageUrl: that.data.shareData[0][3],
        }

    },
    // 商品列表
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
                    // groupProductCount: 4  查询全部
                }
            }
        }).then((res) => {
            // console.log(res.data.infos);
            if (res.data.status == '00') {
                let products = res.data.infos;
                that.setData({
                    products: res.data.infos
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
        let { orderProt } = this.data

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
                                wx.navigateTo({
                                    url: '/pages/my/orderlist/orderlist',
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
                                wx.redirectTo({
                                        url: '/pages/my/orderlist/orderlist?state=1&postState=1'
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
    viewBookList() {
        console.log("查看免费书单")
    }


})