module.exports = (function() {

    that = {};

    /**
     * Returns all values for a given key after the map step
     *  - the key is only unique within a given problem
     *  - returns an array of objects or primitives
     *  - calls callback(err, values)
     */
    that.getResultsByKey = function(problem_id, key, callback) {
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
    that.getInputForKey = function(problem_id, key, callback) {
        process.nextTick(function() {
            callback(null, "This is a random sentence where some words occur more than one time. Like this.");
        });
    };

    /**
     * Emits a result for a given key and problem
     *  - value is a primitive or object
     *  - the value can later be retrieved as one of the elements of getResultsByKey(problem_id, key)
     *  - calls callback(err)
     */
    that.emit = function(problem_id, key, value, callback) {
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
    that.getNextJob = function() {
        process.nextTick(function() {
            callback(null, {
                id: "some_job_id",
                problem_id: "some_problem_id",
                type: "map",
                enqueued_at: new Date().getTime(),
                input: {
                    key: "value"
                }
            }); // no error happened
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

    return that;

})();
