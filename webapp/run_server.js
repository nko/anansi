var express = require('express'),
	mustache = require('mustache'),
	sys = require('sys'),
	fs = require('fs');

var app = express.createServer();

app.configure(function(){
	app.use(express.logger({ format: ':method :url' }));
	app.set('view engine', 'jade');
    app.use(express.staticProvider(__dirname + '/public'));
});

app.get('/', function(req, res) {
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
    res.render('problem/show', {
        locals: {
            problem: { name: 'Problem 1' }
        }
    });
});

/* This is where the problem is actually created */
app.post('/problem', function(req, res){
    var id = 1;
    res.redirect('/problem/'+id);
});

app.listen(3000);