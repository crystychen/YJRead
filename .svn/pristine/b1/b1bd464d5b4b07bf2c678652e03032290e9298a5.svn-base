// components/comLogin/comLogin.js
var app = getApp();
import {
  postAjax
} from '../../utils/ajax';

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    modalHidden: {
      type: Boolean,
      value: true
    },
    stepAward: {
      type: String,
      value: ''
    },
    btnCon: {
      type: String,
      value: ''
    },
    popupState: {
      type: Number,
      value: 0
    },
    shareId: {
      type: String,
      value: ''
    },
    sinProdt: {
      type: Object,
      value: {}
    },
    advert: {
      type: Object,
      value: {}
    },
    // 明日提醒领取步数, 默认不提醒
    isChecked: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },
  pageLifetimes: {
    // 组件所在页面的生命周期函数
    show: function() {
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    // 隐藏模态框
    hideModal() {
      this.setData({
        modalHidden: false
      })
    },
    postOrder(e) {
      let {
        id,
        gold
      } = e.currentTarget.dataset;
      console.log("vhsdfhweewhu")
      let pages = getCurrentPages();  //返回的是当前 栈的路径信息
      let currPage = pages[pages.length - 1];   //当前页面

      let that = this
      // 判断书签数量
      if (currPage.data.gold < gold) {
        // 提示书签数量不足
        that.setData({
          EvegoldModal: true
        })
        return;
      }
      // 提交订单
      postAjax({
        url: "interfaceAction",
        method: 'POST',
        data: {
          interId: '20321',
          version: 1,
          authKey: wx.getStorageSync('authKey'),
          method: 'order-submit',
          params: {
            productId: id
          }
        },
      }).then((res) => {
        if (res.data.success) {
          console.log("商品id", id)
          that.triggerEvent('postOrderCallback', id);
        } else {
          wx.showModal({
            // title: '温馨提示',
            content: '兑换失败',
            showCancel: false
          })
        }
      })
    },
    // 商品详情(单品详情)
    pDetail(pid, callback) {
      var that = this;
      postAjaxt({
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
    toOrderlist() {
      wx.navigateTo({
        url: '/pages/orderlist/orderlist'
      })
      this.setData({
        modalHidden: false
      })
    },
    // 生成邀请图片
    showInvitImg () {
      console.log("vhsdfhweewhu")
      let pages = getCurrentPages();  //返回的是当前 栈的路径信息
      let currPage = pages[pages.length - 1];   //当前页面
      currPage.setData({
        showModal: true
      }) 
    }
  }
})