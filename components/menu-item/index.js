Component({
    externalClasses: ['i-class'],
    options: {
        multipleSlots: true
    },

    properties: {
        freeMin: {
            type: String,
            value: 0
        }
    },
    /**
     * 组件的方法列表
     */
    methods: {
        showModal() {
            this.triggerEvent('showModal');
        }
    }
});