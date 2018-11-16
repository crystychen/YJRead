// components/comLogin/comLogin.js
var app = getApp();
import {
  postAjax
} from '../../utils/ajax.js';
const utils = require('../../utils/util.js');

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    modalHidden: {
      type: Boolean,
      value: true
    },
    // 标题
    modalTitle: {
      type: String,
      value: '恭喜'
    },
    // 小标题提示
    tips: {
      type: String,
      value: ''
    },
    // 按钮类型
    btnType: { // 提示类型, 2为失败，默认为1成功(做任务赚书签)
      type: String,
      value: 1
    },
    // 收货信息
    atAddrObj: {
      type: Object,
      value: {}
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    weXinAdd: {}
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
    // 填写收件地址
    // 授权微信地址
    chooseAddress: function() {
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
                console.log("res................", res);
                that.setData({
                  weXinAdd: res // 先存起微信地址
                })
                that.setData({
                  atAddrObj: {
                    atAddr: `${res.provinceName}${res.cityName}${res.countyName}${res.detailInfo}`,
                    tel: res.telNumber,
                    name: res.userName,
                    // addrId: 1
                  },
                  modalTitle: "确认信息正确无误"
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
    // 保存地址到后台
    saveAddr: function() {
      let that = this
      let pages = getCurrentPages();
      let currPage = pages[pages.length - 1];
      let res = that.data.weXinAdd
      if (!!res) {
        postAjax({
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
          currPage.setData({
            atAddrObj: {
              atAddr: `${res.provinceName}${res.cityName}${res.countyName}${res.detailInfo}`,
              tel: res.telNumber,
              name: res.userName,
              addrId: _res.data.id
            }
          })
          that.setData({
            modalHidden: false
          })
          that.triggerEvent('postOrderSubmit');
        })
      } else {
        that.setData({
          modalHidden: false
        })
        that.triggerEvent('postOrderSubmit');
      }

    },
    authHandler: function(e) {
      if (e.detail.authSetting["scope.address"]) { //如果打开了通讯地址，就会为true
        this.setData({
          isauth: false
        })
      }
    },
    cancel: function() {
      this.setData({
        modalHidden: false,
        // modalTitle: "还没填写收件信息",
        // tips: "马上填写收件地址\n即可获得书本",
        atAddrObj: {}
      })
      this.getAddList(); 
    },
    // 获取我的地址
    getAddList: function() {
      //获取地址列表
      var that = this;
      let pages = getCurrentPages();
      let currPage = pages[pages.length - 1];
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
            currPage.setData({
              atAddrObj: {
                atAddr: `${addrArray[6]}${addrArray[8]}${addrArray[10]}${addrArray[2]}`,
                tel: addrArray[3],
                name: addrArray[1],
                addrId: addrArray[0]
              }
            })
          }
        } else {
          utils.alert(res.data.resultMsg)
        }
      })
    }

  }
})