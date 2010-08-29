/*
{
     id: "some_job_id",
     problem_id: "some_problem_id",
     algorithm: "function map(k,v) { ... }",
     algorithm_type: "map",
     created_at: "ms since epoch",
     input: {
         key: "value"
     }
}
*/

exports.Job = function(opts) {
    this.id = opts.id || opts['_id'];
    this.rev = opts.rev || opts['_rev'];
    this.problem_id = opts.problem_id;
    this.created_at = opts.created_at || (new Date().getTime());
    this.status = opts.status || 'queued'; // can be 'queued' 'processing' or 'complete'
    if (opts.input) {
        if (typeof opts.input === 'string') {
            this.input = JSON.parse(opts.input)
        } else { // already JSON
            this.input = opts.input;
        }
    } else {
        this.input = {};
    }
    this.algorithm = opts.algorithm;
    this.algorithm_type = opts.algorithm_type;
    this.datumId = opts.datumId;
    this.type = 'job';
    this.errors = [];
};
exports.Job.prototype = {
    validate: function () {
        if (!this.problem_id || this.problem_id.trim() == '') {
            this.errors.push({field: 'name', message: "Problem Name can't be blank"})
        }
        if (!this.algorithm || this.algorithm.trim() == '') {
            this.errors.push({field: 'algorithm', message: "Algorithm can't be blank"})
        }
        if (!this.input) {
            this.errors.push({field: 'input', message: "Input data is required"})
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