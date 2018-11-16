// components/comLogin/comLogin.js
var app = getApp();
import {
  postAjax
} from '../../utils/ajax';
import {
  postAjaxSmall
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
    imgUrl: {
      type: String,
      value: ""
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    loadingImgHidden: true
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
    // 保存分享海报图片
    saveImg: function(e) {
      let that = this;
      console.log(e);
      var shareimg = e.currentTarget.dataset.shareimg
      that.setData({
        loadingImgHidden: false
      })
      wx.downloadFile({
        url: shareimg,
        success: function(res) {
          console.log(res)
          that.setData({
            loadingImgHidden: true
          })
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: function(res) {
              console.log(res);
              wx.showToast({
                title: '保存成功',
                icon: 'success',
                duration: 2000
              })
              setTimeout(function() {
                that.setData({
                  modalHidden: false
                })
              }, 2000)
            },
            fail: function(res) {
              console.log(res)
              // console.log('fail')
            }
          })
        },
        fail: function() {
          // console.log('fail')
        }
      })
    },
    //预览图片
    previewImage: function(e) {
      var that = this;
      var currentsrc = e.target.dataset.src;
      var imageUrl = new Array();
      imageUrl.push(currentsrc);
      //图片预览
      wx.previewImage({
        current: currentsrc, // 当前显示图片的http链接
        urls: imageUrl, // 需要预览的图片http链接列表
        success: function() {
          console.log('success')
        },
        fail: function() {
          console.log('fail')
        },
        complete: function() {
          console.info("点击图片预览了");
        },
      })
    }
  }
})