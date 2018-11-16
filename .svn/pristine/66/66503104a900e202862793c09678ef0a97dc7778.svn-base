const app = getApp()
Component({
  properties: {
    modalHidden: {
      type: Boolean,
      value: true
    }, //这里定义了modalHidden属性，属性值可以在组件使用时指定.写法为modal-hidden
    modalMsg: {
      type: Array,
      value: []
    },
    signDays: {
      type: Number,
      value: 0
    },
    isSigned: {
      type: Boolean,
      value: false
    },
    authLevel: {
      type: String,
      value: 1
    }
  },
  data: {
    // 这里是一些组件内部数据
    current: 2,
    verticalCurrent: 2
  },
  methods: {
    // 这里放置自定义方法
    //阻止冒泡触发
    preventTouchMove: function (res) {
      return false
    },
    //关闭模态框
    closeModal: function() {
      this.setData({
        modalHidden: false
      })
    },
    // 每天签到
    signIn: function(e) {
      // console.log(e.detail.formId)
      this.triggerEvent('signIn', e.detail.formId);
    },
    // 授权用户登录
    onGotUserInfo: function(e, callback) {
      if (!e.detail.userInfo) {
        return;
      }
      this.setData({
        userInfo: e.detail.userInfo
      })
      console.log("授权")
      app.globalData.iv = e.detail.iv; //先放app的全局变量，然后在其他方法解密
      app.globalData.encryptedData = e.detail.encryptedData; //先放app的全局变量，然后在其他方法解密 
      this.triggerEvent('getUserInfo', this.data.userInfo);
    },
    openRedBag() {

      let pages = getCurrentPages();
      let currPage = pages[pages.length - 1]; //当前页面
      wx.showToast({
        title: `授权奖励获得${currPage.data.firstAward}`,
        icon: "none"
      })
      this.triggerEvent("openRedBag")
    }
  }
})