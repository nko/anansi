var express = require('express'),
    sys = require('sys'),
    fs = require('fs'),
	listenPort = 3000,
	app = express.createServer(),
    mongoose = require('mongoose').Mongoose,
    db = mongoose.connect('mongodb://nodeko:a7b9e9c6c9f@nodeko.mongohq.com:27090/bold-glass');
    
require("./models/problem");
    
var Problem = db.model("Problem");
    
app.configure(function() {
    app.use(express.logger({
        format: ':method :url'
    }));
    app.use(express.bodyDecoder());
    app.set('view engine', 'jade');
    app.use(express.staticProvider(__dirname + '/public'));
});

app.configure('development', function() {
    //listenPort = 3000;
});

app.use("/workers", require("./worker_api.js"));

/* Homepage */
app.get('/', function(req, res) {
    
    Problem.find().all(function(array){
     console.log(sys.inspect(array));
     res.render('index');
    });

    // 
    // Problems.find().all(function(arr) {
    //     res.render('index', arr);
    // });
    // var problems = Problem.findAll(c);
    /*c.query("select * from problems;", function(err, rows) {
        if (err) throw err;
        puts(rows);
    }); */
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
    var p = new Problem();
    p.name = req.param('problem_name');
    // TODO sanitize the shit out of this. Make sure it's valid js etc
    // p.map_algorithm = req.param("problem_map_algorithm");
    // p.reduce_algorithm = req.param("problem_reduce_algorithm");

    p.save(function() {
        console.log(sys.inspect(arguments));
        res.redirect('/problem/' + p.id);
    });
});


// Listen on 80? Really?
app.listen(listenPort);
