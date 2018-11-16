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
    passTipschecked: true,
    // isShareBoard: false
  },
  onLoad: function(options) {
    let that = this
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
    wx.removeStorageSync('timeStart');
  },
  onShow: function() {
    let that = this
    app.visitorLogin(function(uinfo) {
      that.setData({
        authLevel: wx.getStorageSync("authLevel"),
        userInfo: wx.getStorageSync('userInfo')
      })
      // 通过链接进来重新加载广告, 邀请人id = inviterUserId(不需授权调用)
      if (!app.globalData.openOnShow || that.data.inviterUserId) {
        // wx.showLoading({
        //   title: '正在加载中'
        // })

        app.getShareData(4); // 转发语
        // 轮播图
        app.getShareData(1, function(res) {
          that.setData({
            bannerData: res.data.infos
          })
        });

        // setTimeout(function() {
        //   wx.hideLoading()
        // }, 800)
      }
      that.getGroup(); // 文章分組

      app.getUserInfo([wx.getStorageSync('authLevel'), wx.getStorageSync('userInfo')]).then(function(uinfo) {
        that.setData({
          authLevel: wx.getStorageSync("authLevel"),
          userInfo: wx.getStorageSync('userInfo')
        })
        that.getSignInfo(function(res) {
          console.log("是否需要签到, res为false不需要，true需要签到") // res为false不需要，true需要签到
          console.log(res)
          if (res && wx.getStorageSync("authLevel") == 1) {
            that.setData({
              isSignedModal: true // 未签到弹出签到层
            })
          }
        });
        if (wx.getStorageSync("authLevel") == 2) {
          // app.getAccount(); // 获取账户信息
          // that.getTodayIsLottery(); //今天是否抽奖          
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
  // 获取任务列表并处理是否有待领取任务
  getTasksList() {
    let that = this
    postAjax({
      url: 'interfaceAction',
      data: {
        interId: '20102',
        version: 1,
        authKey: wx.getStorageSync('authKey'),
        method: 'task-list'
      }
    }).then((res) => {
      if (res.data.status == '00') {
        let taskdata = res.data.infos;
        let tasklistObj = {}
        let arbitrarily = []
        let given = []
        let Invitation = []
        let tmpCartData = taskdata.map(function (element, index, array) {
          // 类型处理
          switch (element[1]) {
            case 1:
              // arbitrarily.push(element)
              break;
            case 2:
              // given.push(element)
              break;
            case 3:
              if (element[4] >= element[3]) {
                Invitation.push(element)
              }
              break;
            default:
              console.log("default");
          }
          return element;
        });
        // tasklistObj.arbitrarily = arbitrarily
        // tasklistObj.given = given
        // tasklistObj.Invitation = Invitation
        that.setData({
          isInvitation: Invitation.length
        })
      }
    })
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
        that.setData({
          contentList
        })
        callback && callback(res)
      }
    })
  },
  // 组件做任务去文章列表
  toAwardView(data) {
    console.log(data.detail) // 要跳转的view id
    this.setData({
      toView: data.detail
    })
  },
  // 切换分组tab
  switchNav(e) {
    var {
      current,
      postgroupid
    } = e.currentTarget.dataset;

    //每个tab选项宽度占1/4
    var singleNavWidth = this.data.windowWidth / 4;
    //tab选项居中                            
    this.setData({
      navScrollLeft: (current - 1) * singleNavWidth
    })
    if (this.data.currentTab == current) {
      return false;
    } else {
      this.setData({
        currentTab: current,
        page: 1,
        groupId: postgroupid
      })
    }
    // postgroupid 請求列表
    this.getArticleList(postgroupid)
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
  // 上拉加载更多
  loadMoreData () {
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
        url: `/pages/article_detail/article_detail?url=${url}`,
      })
    } else {
      wx.showToast({
        title: '公众号文章不存在',
        icon: 'none'
      })
    }
  },
  // 每日任务
  toDailyTask() {
    wx.navigateTo({
      url: '/pages/daily_task/daily_task'
    })
  },
  // 换购商城
  toShopMall() {
    // wx.showToast({
    //   title: '功能即将开放,敬请期待！',
    //   icon: 'none'
    // })
    wx.navigateTo({
      url: '/pages/shopMall/shopMall'
    })
  },
  // 幸运转盘
  toWheel() {
    // wx.showToast({
    //   title: '功能即将开放,敬请期待！',
    //   icon: 'none'
    // })
    wx.navigateTo({
      url: '/pages/wheel/wheel'
    })
  },
  // 切换收藏
  toggleCollect(e) {
    let that = this
    this.setData({
      isDeal: true
    })
    let {
      id,
      iscollected
    } = e.currentTarget.dataset
    if (iscollected == 0) {
      this.userAction(id, 101) // 收藏
    } else {
      this.userAction(id, 102) // 取消收藏
    }
    this.getArticleList(this.data.groupId, function() {
      that.setData({
        isDeal: false
      })
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
  // 阅读时间
  postReadTime(id, second, ruleid, url) {
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
        } else if (res.data.status == '6') {   // 停留时间过短
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
        } else if (res.data.status == '4') {   // 对象总限, 提示该文章领取过奖励
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
  // 检测该奖励规则是否在已完成规则里
  checkIndexArray: function(aid, array) {
    for (let i = 0; i < array.length; i++) {
      if (array[i][0] == aid) {
        return true;
        break;
      }
    }
    return false;
  },
  // 检测已奖励完的规则
  filterDoneAwardRules: function() {
    console.log(this.data.rewardList)
    let rewardList = this.data.rewardList.filter(function(item) {
      return item[5] == item[4]
    });
    console.log(rewardList)
    return rewardList;
  },
  // 获取奖励规则
  getAwardRules() {
    let that = this
    postAjax({
      url: 'interfaceAction',
      data: {
        interId: '20104',
        version: 1,
        authKey: wx.getStorageSync('authKey'),
        method: 'reward-list'
      }
    }).then((res) => {
      if (res.data.status == '00') {
        let rewardList = res.data.infos;
        console.log("reward-list", rewardList)
        that.setData({
          rewardList
        }, function() {
          let doneAwards = that.filterDoneAwardRules();
          that.setData({
            doneAwards
          })
        })
      }
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
  hideReadTips() {
    this.setData({
      readTips: false
    })
    let {
      jumpArtObj
    } = this.data
    this.jumpArcticelDetail(jumpArtObj.id, jumpArtObj.ruleid, jumpArtObj.url)
  },
  hideTaskTips () {
    app.globalData.isTaskTips = false    
    this.setData({
      isTaskTips: false
    })
  },
  hideReAwardTips() {
    app.globalData.isReAwardTips = false
    this.setData({
      isReAwardTips: false
    })
  }
})