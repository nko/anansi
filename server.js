var express = require('express'),
    sys = require('sys'),
    fs = require('fs'),
	listenPort = 3000,
	app = express.createServer(),
    _ = require('./lib/underscore')._,
    Problem = require('./models/problem').Problem;

var cradle = require('cradle'),
    c = new(cradle.Connection)('maprejuice.couchone.com'),
    db = c.database('maprejuice');
    
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
                if (doc.name && doc.type == 'problem' && doc.status && doc.status == 'queued') {
                    emit(null, doc);
                }
            }
        },
        running: {
            map: function (doc) {
                if (doc.name && doc.type == 'problem' && doc.status && doc.status == 'running') {
                    emit(null, doc);
                }
            }
        },
        complete: {
            map: function (doc) {
                if (doc.name && doc.type == 'problem' && doc.status && doc.status == 'complete') {
                    emit(null, doc);
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
    db.get(req.params.id, function (err, result) {
        var p = new Problem(result);
        resp.render('problem/show', {
            locals: {
                problem: p
            }
        });
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


// Listen on 80? Really?
app.listen(parseInt(process.env.PORT || listenPort));
