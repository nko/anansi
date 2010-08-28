mongoose.model('Problem', {
	
	properties: ['name', 'mapAlgorithm', 'reduceAlgorithm', 'inputs', 'results', 'status', 'updated_at'],

	methods: {
		save: function(fn) {
			this.updated_at = new Date();
			this.__super__(fn);
		}
	},

});
