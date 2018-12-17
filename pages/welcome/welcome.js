// pages/welcome/welcome.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    
    checkItems: [
      { 
        value: 'cul',
        text: "文学",
        checked: 'true'
      },
      {
        value: 'his',
        text: "历史",
        checked: false
      },
      {
        value: 'science',
        text: "科普",
        checked: true
      },
      {
        value: 'story',
        text: "传记",
        checked: true
      },
      {
        value: 'business',
        text: "商业",
        checked: true
      },
      {
        value: 'emotions',
        text: "亲子",
        checked: true
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let radioValue = []
    this.data.checkItems.map((element, index, array) => {
      if (element.checked) {
          radioValue.push(element.value)
      }
    })
    this.setData({
      radioValue
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  // 复选框变化
  checkboxChange(e) {
    console.log(e)
    let value = e.detail.value
    this.setData({
      radioValue: value
    })
  },
  closeModal() {
    this.setData({
      recmenPopup: false
    })
  },
  onConfirm () {
    this.setData({
      recmenPopup: true
    })
  }
})