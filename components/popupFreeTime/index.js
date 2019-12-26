// components/comLogin/comLogin.js
const app = getApp();

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    modalHidden: {
      type: Boolean,
      value: true
    },
    modalTitle: {
      type: String,
      value: '今日免费时长已用完'
    },
    btnText2: {
      type: String,
      value: '开通畅听会员卡'
    },
    time: {
      type: Number,
      value: 0
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },
  lifetimes: {
    attached() {
      this.setData({
        navHeight: app.globalData.navHeight
      })
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {
    // 隐藏模态框
    closeModal() {
      this.setData({
        modalHidden: false
      })
    },
    shareRecord () {
        this.triggerEvent('shareRecord')
    },
    openMenCardModal() {
      this.triggerEvent('openMenCard')
    }
  }
})