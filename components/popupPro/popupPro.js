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
            value: "fail"
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
        // 砍价页面
        toMyCutDown() {
            this.triggerEvent('toMyCutDown');
        },
        // 领会员
        onMemCard() {
            // wx.switchTab({
            //     url: '/pages/my/my'
            // })
            this.triggerEvent('onMemCard');
        },
        // 去书架
        toBookShelf() {
            this.triggerEvent('toBookShelf');
        },
        // 立刻播放
        onPlayNow() {
            this.triggerEvent('onPlayNow');

        },
        // 确定按钮
        onConfirm() {
            this.triggerEvent('onConfirm');

        },
        // 取消按钮
        onCancel() {
            this.triggerEvent('onCancel');

        }

    }
})