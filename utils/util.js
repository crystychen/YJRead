const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}
// 是否为空对象
const isEmptyObject = e => {
  var t;
  for (t in e)
    return !1;
  return !0
}
// 弹出框
const alert = (opt, success) => {
  let _opt = opt
  if (!opt) {
    _opt = {}
  } else if (typeof opt === 'string') {
    _opt = {
      content: opt
    }
    if (!!success) {
      _opt.success = success
    }
  }
  wx.showModal({
    title: _opt.title || '温馨提示',
    content: _opt.content || '系统错误，请稍后重试',
    showCancel: false,
    confirmText: _opt.confirmText || '确定',
    confirmColor: _opt.confirmColor || '#3CC51F',
    success: _opt.success || {},
    fail: _opt.fail || {},
    complete: _opt.complete || {}
  })
}
const getReadTime = () => {
  return new Promise((resolve, reject) => {
    let endTime = new Date().getTime();
    let id = wx.getStorageSync('timeStart').id;
    let ruleid = wx.getStorageSync('timeStart').ruleid;
    let url = wx.getStorageSync('timeStart').url;
    let startTime = wx.getStorageSync('timeStart').beginTime;
    var dateDiff = endTime - startTime; //时间差的毫秒数
    var dayDiff = Math.floor(dateDiff / (24 * 3600 * 1000)); //计算出相差天数
    var leave1 = dateDiff % (24 * 3600 * 1000) //计算天数后剩余的毫秒数
    var hours = Math.floor(leave1 / (3600 * 1000)) //计算出小时数
    var leave2 = leave1 % (3600 * 1000) //计算小时数后剩余的毫秒数
    var remainMinutes = Math.floor(leave2 / (60 * 1000)) //计算相差分钟数
    let remainSecond = Math.floor(leave2 % 60); //计算剩余的秒数
    let minutes = dayDiff * 24 * 60 + hours * 60 + remainMinutes
    console.log("小时后剩余分钟数", remainMinutes)
    // let second = Math.floor(dateDiff / 1000)  // 秒数
    // console.log("second", second)
    let second = Math.floor(dateDiff / 1000)  // 秒数
    console.log("second", second)
    console.log("minutes", minutes)
    resolve({ id, second, ruleid, url })
  })
}

module.exports = {
  formatTime: formatTime,
  isEmptyObject,
  alert,
  getReadTime,  
}
