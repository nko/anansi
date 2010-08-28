mongoose.model('Job', {

    properties: ['type', 'data', 'updated_at'],

    methods: {
        save: function(fn) {
            this.updated_at = new Date();
            this.__super__(fn);
        }
    }

});
