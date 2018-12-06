Component({
    externalClasses: ['wux-class', 'wux-class-body', 'wux-class-title', 'wux-class-desc','wux-class-thumb'],
    properties: {
        thumb: {
            type: String,
            value: '',
        },
        thumbStyle: {
            type: String,
            value: '',
        },
        title: {
            type: String,
            value: '',
        },
        label: {
            type: String,
            value: '',
        },
        align: {
            type: String,
            value: 'center',
        },
    },
})