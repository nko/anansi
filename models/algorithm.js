mongoose.model('Algorithm', {

    /*	Not sure if we'd ever use an updated_at in this scenario,
	 *	but it doesn't hurt to have.
	 */
    properties: ['mapfn', 'reducefn', 'updated_at'],

    indexes: ['mapfn'],

    /* See note above concerning updated_at */
    methods: {
        save: function(fn) {
            this.updated_at = new Date();
            this.__super__(fn);
        }
    }

});
