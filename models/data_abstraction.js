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
     * Returns all values for a given key after the reduce step
     *  - the key is only unique within a given problem
     *  - returns an array of objects or primitivesc
     *  - calls callback(err, values)
     */
    that.getResultsByKey = function(problem_id, key, callback) {
        // e.g. word frequencies
        process.nextTick(function() {
            callback(null, [15]);
        });
    };
    /**
     * Same as above, except it returns k,v pairs that come out of the map step.
     *  - technically this means we take rows from the data table where type="reduce"
     * NOTE: half of the "group" step is hidden in here. We have a number of key-value pairs in the db
     *       and now we group them into a {key: array, ...} map
     */
    that.getReduceInputForKey = function(problem_id, key, callback) {
        // e.g. word frequencies
        process.nextTick(function() {
            callback(null, [1, 4, 5, 2, 3]);
        });
    };

    /**
     * Returns a piece of the chunked input for a given key
     *  - this data is used in the map phase
     *  - returns an object or primitive
     *  - calls callback(err, value)
     */
    that.getMapInputForKey = function(problem_id, key, callback) {
        process.nextTick(function() {
            callback(null, "This is a random sentence where some words occur more than one time. Like this.");
        });
    };

    /**
     * Emits an intermediate result for a given key and problem
     *  - results is an array of {key: key, value:value}
     *  - the k,v pairs are saved in the data table with type = "intermediate"
     *  - calls callback(err)
     */
    that.emitFromMap = function(problem_id, results, callback) {
        process.nextTick(function() {
            callback();
        });
    };
    /**
     * Same as above except saved with type = "result".
     * The reason we have this distinction is because we want to clearly mark the results that we
     * need to keep. Clearly this is not the best approach ;)
     */
    that.emitFromReduce = function(problem_id, results, callback) {
        process.nextTick(function() {
            callback();
        });
    };


    /**
     * Other random functions I need. Maybe those can be handled in the model abstractions:
     */

    /**
     * Returns "map", "reduce" or "done"
     *  - map iff there are jobs in the jobs table for the problem with type = map
     *  - reduce iff there are jobs in the jobs table for the problem with type = reduce
     *  - done iff there are no jobs in the jobs table
     *  - calls callback in the end
     */
    that.getProblemStatus = function(problem_id, callback) {
        process.nextTick(function() {
            callback(null, "reduce"); // no error happened
        });
    };

    /**
     * Marks that job as finished and calls a callback(err)
     */
    that.finishJob = function(job_id, callback) {
        process.nextTick(function() {
            callback(); // no error happened
        });
    };

    /**
     * Gets the next job from the jobs table.
     *  - calls callback(err, job)
     */
    that.getNextJob = function(callback) {
        process.nextTick(function() {
            db.view('jobs/queued', function(err, rowSet) {
                // enable this only if u want to delete shit
                // for ( var i =0; i<rowSet.length; i++) {
                //     db.remove(rowSet[i].value._id, rowSet[i].value._rev, function(){
                //         console.log("deleted");
                //         console.log(sys.inspect(arguments));
                //     });
                // }
                if (err || !rowSet || rowSet.length == 0) {
                    callback(err, null);
                } else {
                    callback(err, rowSet[0].value);
                }
            });
        });
    };

    /**
     * Returns the completed results (key -> value) for the problem with id problem_id.
     *  - calls callback(err, key_value_data)
     */
    that.getResultsForProblem = function(problem_id, callback) {
        process.nextTick(function() {
            callback(null, {
                "this": 2,
                "other_word": 1
            }); // no error happened
        });
    };

    /**
     * Returns the a list of jobs for this problem that are done, running or enqueued
     */
    that.getJobsForProblem = function(problem_id, callback) {
        process.nextTick(function() {
            callback(null, {
                "job_1_id": {
                    id: "job_1_id",
                    state: "running",
                    enqueued_at: "some time",
                    started_at: "some other time",
                    type: "map",
                    input_key: "some_key"
                },
                "job_2_id": {
                    id: "job_2_id",
                    state: "done",
                    enqueued_at: "some time",
                    started_at: "some other time",
                    type: "map",
                    input_key: "some_other_key"
                }
            }); // no error happened
        });
    };
    
    
    /**
     * Returns the map algorithm for a given problem id.
     */
    that.getMapForProblem = function(problem_id, callback) {
        process.nextTick(function() {
            // behold the map function for distributed word counting
            callback(null, "("+(function(key, value) {
                
                // NOTE that we already do some grouping here. Courtesy of javascript.
                // This reduces data transfer, too
                var words, i, l, unique_word,
                    unique_word_counts = {},
                    results = [];

                self.postMessage("Running map on input key '"+key+"'");
                // hardcore normalization. strip non-characters
                value = value.toLowerCase();
                value = value.replace(/[^a-z]+/g, ' ');
                words = value.split(" ");
                for (i=0, l=words.length; i<l; i++) {
                    if (unique_word_counts[words[i]] === undefined) {
                        unique_word_counts[words[i]] = 0;
                    }
                    unique_word_counts[words[i]] ++;
                }
                
                for (unique_word in unique_word_counts) {
                    results.push({key: unique_word, value:unique_word_counts[unique_word]});
                }
                
                self.postMessage("Map for input '"+key+"' done. Found "+l+" (non-distinct) words.");

                this.done = true;
                this.results = results;
            }).toString()+")");
        });
    };
    /**
     * Returns the map algorithm for a given problem id.
     */
    that.getReduceForProblem = function(problem_id, callback) {
        process.nextTick(function() {
            callback(null, "This is a random sentence where some words occur more than one time. Like this.");
        });
    };


    return that;

})();
