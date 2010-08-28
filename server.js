var express = require('express'),
    sys = require('sys'),
    fs = require('fs'),
    pg = require('postgres');
var puts = sys.puts;

var listenPort = 80;
var c = pg.createConnection("host='' dbname=anansi");

var app = express.createServer();

app.configure(function() {
    app.use(express.logger({
        format: ':method :url'
    }));
    app.set('view engine', 'jade');
    app.use(express.staticProvider(__dirname + '/public'));
});
app.configure('development', function() {
    //listenPort = 3000;
});

app.use("/workers", require("./worker_api.js"));

/* Homepage */
app.get('/', function(req, res) {
    // var problems = Problem.findAll(c);
    c.query("select * from problems;", function(err, rows) {
        if (err) throw err;
        puts(rows);
    });
    res.render('index');
});

/* Form to create problem */
app.get('/problem', function(req, res) {
    // TODO create object here
    res.render('problem/new');
});

/* Get a specific problem */
app.get('/problem/:id', function(req, res) {
    // TODO get object here
    // TODO if this problem isn't running yet, then show an option to start it
    res.render('problem/show', {
        locals: {
            problem: {
                name: 'Problem 1'
            }
        }
    });
});

/* This is where the problem is actually created */
app.post('/problem', function(req, res) {
    var id = 1;
    // TODO save the problem
    // TODO create all the tasks necessary for the map part of this map-reduce algorithm
    res.redirect('/problem/' + id);
});

/* Get the next task on the queue */
app.get('/task.js', function(req, res) {
    // TODO get next task from queue
    // TODO look up problem, algo, and data for this task and then create the javascript
    var task = {
        id: 1
    };
    var algorithm = {
        map_function: "function(key, val) { anansi.emit('intermediate', key, val); }",
        reduce_function: "function(key, val) { anansi.emit('output', key, val); }"
    };
    var data = {
        key: "key",
        value: "value",
        type: "input"
    };
    res.send("anansi.run(" + task.id + ",'" + data.key + "','" + data.value + "'," + (data.type == "input" ? algorithm.map_function : algorithm.reduce_function) + ");", {
        'Content-Type': 'text/javascript'
    });
});

/* Save the result of a task */
app.post('/task/:id/result/:type', function(req, res) {
    var taskId = req.params.id;
    var dataType = req.params.type;
    var dataKey = req.params.key;
    var dataVal = req.params.value;
    // TODO lookup task
    // TODO save result
    res.send('{ message: "success" }', {
        'Content-Type': 'text/javascript'
    });
});

// Listen on 80? Really?
app.listen(listenPort);
