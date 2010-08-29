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
     *     id: "some_job_id",
     *     problem_id: "some_problem_id",
     *     type: "map",
     *     enqueued_at: "ms since epoch",
     *     input: {
     *         key: "value"
     *     }
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
    app.post("/job/:job_id", function(req, res) {

        console.log("Received results");
        console.log(sys.inspect(req.body));

        // remember, the second part of the job_id is the type
        var parts = req.params.job_id.split("_"),
            problem_id = parts[0],
            job_type = parts[1];

        var cb = function(err) {
            if (err) {
                res.send(err.message + "\n" + err.stack, 500);

                // TODO mark this job as failed. roll it back. whatever
            } else {
                res.send("ok");

                // TODO: mark the job as completed
                // TODO: check if this was the last job in a map or reduce phase
                // TODO: comp. below
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
