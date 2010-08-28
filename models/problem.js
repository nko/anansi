var mongoose = require('mongoose').Mongoose;

mongoose.model('Problem', {
    
    properties: ['name', 'map_algorithm', 'reduce_algorithm', 'status', 'updated_at'],

    methods: {
        save: function(fn) {
            this.updated_at = new Date();
            this.__super__(fn);
        }
    }

});
