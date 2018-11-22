Component({
    externalClasses: ['i-class', 'flex-dire', 'item-flex-dire'],
    options: {
        multipleSlots: true
    },

    properties: {
        full: {
            type: Boolean,
            value: false
        },
        thumb: {
            type: String,
            value: ''
        },
        title: {
            type: String,
            value: ''
        },
        extra: {
            type: String,
            value: ''
        },
        bcgImg: {
            type: String,
            value: ''
        },
        foot: {
            type: Boolean,
            value: false
        },
        flexDire: {
            type: String,
            value: ''
        },
        itemFlexDire: {
            type: String,
            value: ''
        }
    }
});