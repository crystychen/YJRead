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
        insterPros: {
            type: Array,
            value: []
        },
        userInfo: {
            type: Object,
            value: {}
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
        //阻止冒泡触发
        preventTouchMove: function(res) {
            return false
        },
        // 隐藏模态框
        closeModal() {
            this.setData({
                modalHidden: false
            })
        },
        loadMoreData() {

        },
        // 进入音频详情页面
        freeListen(e) {
            let {
                id
            } = e.currentTarget.dataset
            this.triggerEvent('toAudioDetail', id);
        }
    }
})