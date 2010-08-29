var sys = require('sys');

exports.Problem = function(opts) {
    this.id = opts.id || opts['_id'];
    this.rev = opts.rev || opts['_rev'];
    this.name = opts.name;
    this.status = opts.status || 'queued';
    this.created_at = opts.created_at || (new Date().getTime());
    this.map_function = opts.map_function;
    this.reduce_function = opts.reduce_function;
    
	if(opts.data) {
		try {
			this.data = JSON.parse('\'' + opts.data.replace(/\'/g, "\'") + '\'');
		} catch(e) {
			/*	validate() below will catch this being bad when its run, just 
			 *	fail silently for now and let it fall through. (I.e, bad JSON)
			 */
			this.data = opts.data;
		}
    } else {
        this.data = {};
    }

    this.type = 'problem';
    this.errors = [];
};

exports.Problem.prototype = {
    validate: function () {
        if(!this.name || this.name.trim() == '') {
            this.errors.push({message: "We need a name for this problem. Please enter one below!"})
        }
        if (!this.map_function || this.map_function.trim() == '') {
            this.errors.push({message: "We need a Map function entered below."})
        }
        if (!this.reduce_function || this.reduce_function.trim() == '') {
            this.errors.push({message: "We need a Reduce function entered below."})
        }
        
		if(typeof this.data === "string") {
			try {
				JSON.parse('\'' + this.data.replace(/\'/g, "\'") + '\'');
			} catch(e) {
				this.errors.push({message: "It would appear your initial data is in an invalid format. Please check it and try again!"});
			}
		}

		return !this.has_errors();
    },
    
	has_errors: function() {
        return this.errors.length != 0;
    },
    
	has_error: function(field_name) {
        return _.any(this.errors, function (item) { return item.field == field_name; }, field_name);
    }
};
