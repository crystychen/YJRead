import {
  postAjax,
  postAjaxS
} from '../../utils/ajax.js';
const utils = require('../../utils/util.js');
const app = getApp()
var runTime = Date.now(); //启动时间
const aldstat = require('../../utils/sdk/ald-stat.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {},

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          pixelRatio: res.pixelRatio,
          windowHeight: res.windowHeight,
          windowWidth: res.windowWidth
        })
      }
    })
    if (wx.getStorageSync('passTips')) {
      app.globalData.passTips = wx.getStorageSync('passTips')
    }
    if (wx.getStorageSync('failTips')) {
      app.globalData.failTips = wx.getStorageSync('failTips')
    }
    app.getShareData(4) // 分享转发语
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
    let that = this
    this.getCollectList()
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
    app.aldstat.sendEvent('我的收藏页面加载时间', {
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
  preventBubble() {
    return false;
  },
  getCollectList(callback) {
    let that = this

    postAjax({
      url: 'interfaceAction',
      data: {
        interId: '20510',
        version: 1,
        authKey: wx.getStorageSync('authKey'),
        method: 'content-collect-list'
      }
    }).then((res) => {
      if (res.data.status == '00') {

        let contentList = res.data.contentList || [];
        that.setData({
          contentList
        })
        callback && callback()
      }
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
    this.getCollectList(function() {
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
        } else if (res.data.status == '6') {
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
  }
})