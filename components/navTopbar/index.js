const App = getApp()
Component({
    externalClasses: ['i-class'],
    options: {
        addGlobalClass: true
    },
    properties: {
        extra: {
            type: String,
            value: ''
        },
        title: {
            type: String,
            value: ''
        },
        isShowBack: {
            type: Boolean,
            value: false
        },
        isShowHome: {
            type: Boolean,
            value: false
        }
    },
    /**
     * 组件的初始数据
     */
    data() {

    },
    lifetimes: {
        attached() {
            this.setData({
                navHeight: App.globalData.navHeight,
                statusBarHeight: App.globalData.statusBarHeight,
                titleBarHeight: App.globalData.titleBarHeight
            })
        }
    },
    /**
     * 组件的方法列表
     */
    methods: {
        // 回退
        navBack() {
            wx.navigateBack({
                delta: 1
            })
        },
        // 会主页
        toIndex() {
            wx.switchTab({
                url: '/pages/index/index'
            })
        }
    }
})