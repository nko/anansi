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
    dataa = require("./models/data_abstraction"),
    Step = require("step"),
    Datum = require("./models/datum").Datum;

module.exports = (function() {

    var app = express.createServer();

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
                res.send({
                    "message": err.message,
                    "stack": err.stack
                }, 500);
            } else {
                // NO MORE JOBS
                if (job === null) {
                    res.send({
                        "message": "(singing) No jobs today, the jobs have gone away, lalalalala, it wasn't always so."
                    }, 500);
                    return;
                }
                
                res.send({
                    id: job._id,
                    problem_id: job.problem_id,
                    input: job.input,
                    algorithm: job.algorithm,
                    algorithm_type: job.algorithm_type
                });
                
                //job.status = "processing";
                // dataa.saveJob(job, function(err, data) {
                //     // I don't care
                //     console.log("saved job after get /job with arguments " + sys.inspect(arguments));
                // });

            }
            res.send('hello');
        /*
        */
        });
    });

    /**
     * Posts the result of a job back.
     * NOTE: The client is responsible for pulling a new job. We don't do any redirect vodoo or whatever
     * TODO: Do redirect vodoo. Let's squeeze out another 100ms of proc power
//*/
    app.post("/job/:jobId", function(req, res) {
        console.log("Received results "+sys.inspect(req.body));

        dataa.findJob(req.params.jobId, function (err, job) {
            if (job) {
                var results = req.body;
                // create a datum for each k,v pair
                Step(
                    function() {
                        var group = this.group();
                        
                        // mark job as  done
                        job.status = 'completed';
                        //job.status = 'queued';
                        dataa.saveJob(job, group());
                        
                        for (var i=0, l=results.length; i<l; i++) {
                            dataa.saveDatum(new Datum({
                                problemId: job.problem_id,
                                key: results[i].key,
                                values: [results[i].value],
                                dataType: (job.algorithm_type === 'map' ? 'intermediate' : 'output')
                            }), group());
                        }
                        
                    },
                    
                    
                    // once all the datums are saved
                    function() {

                        dataa.hasUnfinishedJobsByProblemId(job.problem_id, function (err, hasUnfinishedJobs) {

                            if (!hasUnfinishedJobs) {
                                // kick off next step by
                                // 1) find intermediate datum
                                dataa.findProblem(job.problem_id, function (err, problem) {
                                    if (!err) {
                                        dataa.findIntermediateDataByProblemId(job.problem_id, function (err, data) {

                                            if (job.algorithm_type === "reduce"){ // we're done!
                                                problem.status = 'complete';
                                                dataa.saveProblem(problem, function() {
                                                    // TODO this doesn't work at all
                                                        console.log("HOLYCRAP WERE DONE!")
                                                });
                                                return;
                                                
                                            }
                                            else if (!err) {
                                                for (var i in data) {
                                                    if (data[i].key !== "") {
                                                        var input = {
                                                            key: data[i].key,
                                                            value: data[i].values
                                                        };
                                                        // TODO 2) add a bunch of reduce jobs to the queue
                                                        dataa.saveJob(new Job({
                                                            problem_id: job.problem_id,
                                                            algorithm: problem.reduce_function,
                                                            algorithm_type: 'reduce',
                                                            input: input
                                                        }), function(err, res) {
                                                            // i don't care
                                                        })                                                        
                                                    }
                                                }
                                            } 
                                            res.send("ok");
                                            return;
                                        });
                                    } else {
                                        res.send("ok");
                                        return;
                                    }
                                });
                            }
                        });
                

                    }
                    
                    
                );
            } else {
                res.send(err.message + "\n" + err.stack, 500);
                // TODO mark this job as failed. roll it back. whatever
            }
        });
    });
    //*/
    return app;
})();
