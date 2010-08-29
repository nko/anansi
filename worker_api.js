/**
 * WORKER API
 * This thing is being queried by the workers.
 * The whole thing is hooked up to /workers from server.js.
 * 
 * Baseline facts:
 *  - job_ids have the format: problemId_phaseType_inputKey
 */

var express = require("express"),
    sys = require("sys"),
    Problem = require('./models/problem').Problem,
    Job = require('./models/job').Job,
    dataa = require("./models/data_abstraction");

module.exports = (function() {

    app = express.createServer();

    /**
     * Here's what a job look like:
     * 
     * {
            id: "some_job_id",
            problem_id: "some_problem_id",
            algorithm: "function map(k,v) { ... }",
            algorithm_type: "map",
            created_at: "ms since epoch",
            input: {
                key: "value"
            }
     * }
     *
     */
    app.get("/job", function(req, res) {
        dataa.getNextJob(function(err, job) {
            if (err) {
                res.send(err.message + "\n" + err.stack, 500);
            } else {
                res.send(job);
                // TODO save job start time and perhaps who pulled it
                // TODO mark job as running
            }
        });
    });

    /**
     * Posts the result of a job back.
     * NOTE: The client is responsible for pulling a new job. We don't do any redirect vodoo or whatever
     * TODO: Do redirect vodoo. Let's squeeze out another 100ms of proc power
     */
    app.post("/job/:jobId", function(req, res) {

        console.log("Received results");
        console.log(sys.inspect(req.body));

        dataa.findJob(req.params.jobId, function (err, job) {
            if (job) {
                var results = req.body.results;
                var datum = new Datum({
                    problemId: job.problem_id,
                    key: results.key,
                    values: results.values,
                    dataType: (job.algorithm_type === 'map' ? 'intermediate' : 'output')
                });
                // save the current datum
                dataa.saveDatum(datum, function (result) {
                    // TODO: mark the job as completed
                    job.status = 'completed';
                    job.datumId = result.id;
                    dataa.saveJob(job);
                });
                
                // TODO: check if this was the last job in a map or reduce phase
                dataa.hasUnfinishedJobsByProblemId(job.problem_id, function (hasUnfinishedJobs) {
                    if (!hasUnfinishedJobs) {
                        // kick off next step by
                        // 1) find intermediate datum
                        dataa.findProblem(job.problem_id, function (err, problem) {
                            if (!err) {
                                dataa.findIntermediateDataByProblemId(job.problem_id, function (err, data) {
                                    if (!err) {
                                        for (var i in data) {
                                            // TODO 2) add a bunch of reduce jobs to the queue
                                            var datum = data[i];
                                            var job = new Job({
                                                problem_id: job.problem_id,
                                                algorithm: problem.reduce_function,
                                                algorithm_type: 'reduce',
                                                input: datum.values
                                            });
                                        }
                                    } else { // we're done!
                                        problem.status = 'completed';
                                        dataa.saveProblem(problem);
                                    }
                                });
                            }
                        });
                    }
                });
                // TODO: comp. below

                // successful
                res.send("ok");
            } else {
                res.send(err.message + "\n" + err.stack, 500);
                // TODO mark this job as failed. roll it back. whatever
            }
        });

        var cb = function(err) {
            if (err) {
                res.send(err.message + "\n" + err.stack, 500);
            } else {
                /*
                    if (end_of_map_phase) {
                        dataa.buildReduceJobs(problem_id);
                    } else if (all_done) {
                        dataa.markProblemDone(problem_id);
                    }
                    */

            }
        };

        // req.body.results contains [{key: key, value:value} ...]
        if (job_type === "map") {
            dataa.emitFromMap(req.params.job_id, req.body.results, cb);
        } else if (job_type === "reduce") {
            dataa.emitFromReduce(req.params.job_id, req.body.results, cb);
        }
    });

    /**
     * Returns the map function for a problem
     */
    app.get("/map/:problem_id", function(req, res) {
        dataa.getMapForProblem(req.params.problem_id, function(err, code) {
            if (err) {
                res.send(err.message + "\n" + err.stack, 500);
            } else {
                res.send(code);
            }
        });
    });
    /**
     * Returns the map function for a problem
     */
    app.get("/reduce/:problem_id", function(req, res) {
        dataa.getReduceForProblem(req.params.problem_id, function(err, code) {
            if (err) {
                res.send(err.message + "\n" + err.stack, 500);
            } else {
                res.send(code);
            }
        });
    });

    return app;
})();
