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
        toMyCenter() {
            wx.switchTab({
                url: '/pages/my/my'
            })
        },
        onContact() {
            this.closeModal()
        }
    }
})