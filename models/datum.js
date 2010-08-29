/**
 * This is one datum (or result) from a single computation.
 * @param opts
 */
exports.Datum = function(opts) {
    this.id = opts['_id'] || opts.id;
    this.rev = opts['_rev'] || opts.rev;
    this.key = opts.key;
    this.problemId = opts.problemId;
    if (opts.values) {
        if (typeof opts.values === 'string') {
            this.values = JSON.parse(opts.values)
        } else { // already JSON
            this.values = opts.values;
        }
    } else {
        this.values = [];
    }
    this.createdAt = opts.createdAt || (new Date().getTime());
    this.dataType = opts.dataType; // should be 'intermediate' or 'output', because initial inputs start out in problem
    this.type = 'datum';
    this.errors = [];
};
exports.Datum.prototype = {
    validate: function () {
        if (!this.problem_id || this.problem_id.trim() == '') {
            this.errors.push({field: 'name', message: "Problem Name can't be blank"})
        }
        return !this.has_errors();
    },
    has_errors: function() {
        return this.errors.length != 0;
    },
    has_error: function(field_name) {
        return _.any(this.errors, function (item) { return item.field == field_name; }, field_name);
    },
    generateId: function() {
        return this.problemId + '_' + this.key + '_' + this.dataType;
    }
};