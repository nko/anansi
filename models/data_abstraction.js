var sys = require('sys'),
    Problem = require('./problem').Problem,
    Job = require('./job').Job,
    Datum = require('./datum').Datum,
    cradle = require('cradle'),
    c = new(cradle.Connection)('maprejuice.couchone.com', 5984, {cache: false, raw: false}),
    db = c.database('maprejuice');

module.exports = (function() {

    that = {};

    that.hasUnfinishedJobsByProblemId = function(problemId, callback) {
        db.view('jobs/unfinished', {key: problemId}, function (err, rowSet) {
            callback(err, rowSet && rowSet.length > 0);
        });
    };

    that.findIntermediateDataByProblemId = function(problemId, callback) {
        db.view('datum/intermediate', {key: problemId}, function (err, rowSet) {
            var data = [];
            for (var i in rowSet) {
                data.push(new Datum(rowSet[i].value));
            }
            callback(err, data);
        });

    };

    that.findJob = function(jobId, callback) {
        db.get(jobId, function(err, result) {
            var job = err ? null : new Job(result);
            callback(err, job);
        });
    };

    that.saveJob = function(job, callback) {
        sys.puts('job id => '+job.id);
        sys.puts('job rev => '+job.rev);
        sys.puts('job status => '+job.status);
        if (job.id) { // hackety hack chop chop
            db.save(job.id, job.rev, job, callback);
        } else {
            db.insert(job, callback);
        }
    };

    that.findProblem = function(problemId, callback) {
        db.get(problemId, function(err, result) {
            var problem = err ? null : new Problem(result);
            callback(err, problem);
        });
    };

    that.saveProblem = function(problem, callback) {
        if (problem.id) {
            db.save(problem.id, problem.rev, problem, callback);
        } else {
            db.insert(problem, callback);
        }
    };

    /**
     * This method takes a datum for a given problem, then
     * - if the dataType is output, saves the datum;
     * - if the dataType is intermediate, looks for an existing datum;
     *      - if it finds one, it updates the value of that with the additional value
     *      - if it doesn't find one, it saves the current datum
     * @param datum the datum to update/save
     */
    that.saveDatum = function(datum, callback) {
        var id = datum.generateId();
        db.get(id, function(err, result) {
            // save new datum if we can't find an existing one, or the current one is of type output
            if (err || (datum.dataType && datum.dataType === 'output')) {
                db.insert(id, datum, function (err, result) {
                    callback(null, result);
                });
            } else {
                // update existing datum
                var existingDatum = new Datum(result);
                // if existing is already an array, push new value on it
                if ((datum.values instanceof Array)) {
                    existingDatum.values = existingDatum.values.concat(datum.values);
                } else {
                    // create new array, consisting of old values, plus new one
                    existingDatum.values.push(datum.values);
                }
                db.save(id, existingDatum.rev, existingDatum, function (err, result) {
                    callback(null, result);
                });
            }
        });
    };

    /**
     * Returns all the tasks over 10 minutes old that haven't received a result yet.
     */
    that.getOldTasksWithoutResults = function(callback) {
        db.view('/jobs/stale', function(err, rowSet) {
            if (!err) {
                for (var i in rowSet) {
                    var job = new Job(rowSet[i].value);
                    callback(null, job);
                }
            }
        });
    };

    /**
     * Gets the next job from the jobs table.
     *  - calls callback(err, job)
     */
    that.getNextJob = function(callback) {
        process.nextTick(function() {
            db.view('jobs/queued', function(err, rowSet) {
                if (err || !rowSet || rowSet.length == 0) {
                    callback(err, null);
                } else {
                    callback(err, rowSet[0].value);
                }
            });
        });
    };

    return that;

})();
