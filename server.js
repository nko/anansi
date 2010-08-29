var express = require('express'),
    sys = require('sys'),
    fs = require('fs'),
	listenPort = 3000,
	app = express.createServer(),
    _ = require('./lib/underscore')._,
    Problem = require('./models/problem').Problem,
    Job = require('./models/job').Job,
    backgroundTasks = require('./background_tasks').backgroundTasks,
    dataa = require("./models/data_abstraction");

var cradle = require('cradle'),
    c = new(cradle.Connection)('maprejuice.couchone.com'),
    db = c.database('maprejuice');

var TEN_MINS_IN_MS = (1000 * 60 * 10);
    
app.configure(function() {
    app.use(express.logger({
        format: ':method :url'
    }));
    app.use(express.bodyDecoder());
    app.set('view engine', 'jade');
    app.use(express.staticProvider(__dirname + '/public'));

    // set up database if it doesn't exist
    db.exists(function (err, res) {
        if (!res) {
            db.create();
        }
    });

    // set up problem views
    db.insert('_design/problems', {
        all: {
            map: function (doc) {
                if (doc.type && doc.type == 'problem') {
                    emit(null, doc);
                }
            }
        },
        queued: {
            map: function (doc) {
                if (doc.type && doc.type == 'problem' && doc.status && doc.status == 'queued') {
                    emit(null, doc);
                }
            }
        },
        running: {
            map: function (doc) {
                if (doc.type && doc.type == 'problem' && doc.status && doc.status == 'running') {
                    emit(null, doc);
                }
            }
        },
        complete: {
            map: function (doc) {
                if (doc.type && doc.type == 'problem' && doc.status && doc.status == 'complete') {
                    emit(null, doc);
                }
            }
        }
    });

    // set up problem views
    db.insert('_design/jobs', {
        all: {
            map: function (doc) {
                if (doc.type && doc.type === 'job') {
                    emit(doc.created_at, doc);
                }
            }
        },
        unfinished: {
            map: function (doc) {
                if (doc.type && doc.type === "job"
                        && doc.status && (doc.status === "queued" || doc.status === "processing")
                        && !doc.datumId) {
                    // set problem id as key so we can query by this later
                    emit(doc.problem_id, doc);
                }
            }
        },
        queued: {
            map: function (doc) {
                if (doc.type && doc.type === "job" && doc.status && doc.status === "queued") {
                    emit(doc.created_at, doc);
                }
            }
        },
        stale: {
            map: function (doc) {
                if (doc.type && doc.type == 'job'
                        && doc.status && doc.status == 'processing'
                        && doc.created_at && doc.created_at < (new Date().getTime() - TEN_MINS_IN_MS)) {
                    emit(doc.created_at, doc);
                }
            }
        }
    });

    // set up problem views
    db.insert('_design/datum', {
        all: {
            map: function (doc) {
                if (doc.type && doc.type === 'datum') {
                    emit(null, doc);
                }
            }
        },
        intermediate: {
            map: function (doc) {
                if (doc.type && doc.type === 'datum'
                        && doc.dataType && doc.dataType == 'intermediate') {
                    emit(doc.problemId, doc);
                }

            }
        },
        output: {
            map: function (doc) {
                if (doc.type && doc.type === 'datum'
                        && doc.dataType && doc.dataType == 'output') {
                    emit(doc.problemId, doc);
                }

            }
        }
    });

});

app.use("/workers", require("./worker_api.js"));

/* Redirect to correct URL on every request */
app.get(/.*/, function (req, resp, next) {
    var host = req.header('host');
    var path = req.url;
    if (host == 'www.maprejuice.com' || host == 'anansi.no.de') {
        resp.redirect("http://maprejuice.com"+path, 301);
    } else {
        next();
    }
});

/* Homepage */
app.get('/', function(req, res) {
    db.view('problems/all',
            function (err, rowSet) {
                var problemsList = [];
                for (var row in rowSet) {
                    var p = new Problem(rowSet[row].value);
                    problemsList.push(p);
                }
                res.render('index', {
                    locals: {
                        problems: problemsList
                    }
                });
            });
});

/* Form to create problem */
app.get('/problem', function(req, res) {
    // TODO create object here
    res.render('problem/new', {
        locals: {
            problem: new Problem({})
        }
    });
});

/* Get a specific problem */
app.get('/problem/:id', function(req, resp) {
    // get object
    dataa.findProblem(req.params.id, function (err, problem) {
        resp.render('problem/show', {
            locals: {
                problem: problem
            }
        });
    });
});

/* Kick off the specified problem by queing up all the jobs for it */
app.get('/problem/:id/start', function(req, resp) {
    // get object
    db.get(req.params.id, function (err, result) {
        var p = new Problem(result);
        // only start the job if it isn't already running
        if (!(p.status === 'running')) {
            var input_data = p.data;
            for (var key in input_data) {
                var inp = {};
                inp[key] = input_data[key];
                var job = new Job({
                    problem_id: p.id,
                    input: inp,
                    algorithm: p.map_function,
                    algorithm_type: 'map'
                });
                sys.puts(sys.inspect(job));
                if (job.validate()) {
                    db.insert(job, function (err, result) {
                        sys.puts("insert job "+result.id);
                    });
                }
            }
            p.status = 'running';
            db.save(p.id, p, function (err, result) {
                sys.puts("save status => " + sys.inspect(result));
                resp.redirect('/problem/'+req.params.id);
            });
        } else {
            resp.redirect('/problem/'+req.params.id);
        }
    });
});

/* This is where the problem is actually created */
app.post('/problem', function(req, resp) {
    // TODO sanitize the shit out of this. Make sure it's valid js etc
    var p = new Problem(req.body);

    if (p.validate()) {
        db.insert(p, function (err, result) {
            resp.redirect('/problem/' + result.id);
        });
     } else {
        resp.render('problem/new', {
            locals: {
                problem: p
            }
        });
    }
});


/* Homepage */
app.get('/jobs', function(req, res) {
    db.view('jobs/all',
            function (err, rowSet) {
                var jobsList = [];
                for (var row in rowSet) {
                    var job = new Job(rowSet[row].value);
                    jobsList.push(job);
                }
                res.render('job/list', {
                    layout: false,
                    locals: {
                        jobs: jobsList
                    }
                });
            });
});
app.get('/jobs/queued', function(req, res) {
    db.view('jobs/queued',
            function (err, rowSet) {
                var jobsList = [];
                for (var row in rowSet) {
                    var job = new Job(rowSet[row].value);
                    jobsList.push(job);
                }
                res.render('job/list', {
                    layout: false,
                    locals: {
                        jobs: jobsList
                    }
                });
            });
});



// Listen on 80? Really?
app.listen(parseInt(process.env.PORT || listenPort));
