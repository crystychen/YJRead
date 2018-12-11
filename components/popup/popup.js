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
        award: {
            type: Object,
            value: {}
        },
        modalTitle: {
            type: String,
            value: '恭喜'
        },
        tips: {
            type: String,
            value: ''
        },
        btnType: { // 提示类型, 2为失败，默认为1成功(做任务赚书签)
            type: String,
            value: 1
        },
        recordRead: {
            type: Object,
            value: {}
        },
        // 不再提醒弹窗
        isChecked: {
            type: Boolean,
            value: false
        },
        modalType: { // 默认为做任务弹窗, 2为抽奖弹窗
            type: String,
            value: 0
        },
        isCurrentpage: {
            type: Boolean,
            value: false
        }
    },

    /**
     * 组件的初始数据
     */
    data: {

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
        // 做任务去每日任务页
        jumpTo(e) {
            // 获取标签元素上自定义的 data-opt 属性的值
            let target = e.currentTarget.dataset.opt;
            this.closeModal()
            if (!this.data.isCurrentpage) {
                wx.navigateTo({
                    url: '/pages/daily_task/daily_task'
                })
            }
            this.triggerEvent('toView', target);
        },
        // 设置开始时间缓存 
        setStartTime: function(id, ruleid, url) {
            let startTime = new Date().getTime(); //获取系统日期
            wx.setStorageSync("timeStart", {
                id,
                ruleid,
                url,
                beginTime: startTime
            })
        },
        // 点击计时
        NumTap(e) {
            this.setData({
                modalHidden: false
            })
            let {
                url,
                id,
                ruleid
            } = e.currentTarget.dataset
            this.setStartTime(id, ruleid, url);
            // app.userAction(id, 3); // 记录点击数
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
        // 不再提示
        formSubmit: function(e) {
            let that = this
            let pages = getCurrentPages();
            let currPage = pages[pages.length - 1];
            console.log("不再提示触发")
            app.postFormId(e.detail.formId); // 模板埋点
            this.closeModal()
            if (this.data.btnType == 1) {
                app.globalData.passTips = true
                wx.setStorageSync("passTips", true)
                currPage.setData({
                    passTipschecked: true
                })
            } else if (this.data.btnType == 2) {
                app.globalData.failTips = true
                wx.setStorageSync("failTips", true)
                currPage.setData({
                    failTipschecked: true
                })
            }
        },
        toMyCenter() {
            wx.redirectTo({
                url: '/pages/my/my'
            })
        }
    }
})