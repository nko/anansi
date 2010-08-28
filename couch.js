var sys = require('sys'),
    fs = require('fs'),
    cradle = require('cradle');
var c = new(cradle.Connection)('maprejuice.couchone.com');
sys.puts('Got c => ' + sys.inspect(c));
sys.puts('Databases => '+c.databases());
var db = c.database('maprejuice');
sys.puts('Got db: '+db.name);
db.exists(function (err, res) {
    sys.puts('db.exists => err = '+sys.inspect(err));
    sys.puts('db.exists => res = '+sys.inspect(res));
});
//*/


//db.getDoc('b30fba2e6b5beb795f1fed91f6000c12', function(er, doc) {
//    if (er) throw new Error(JSON.stringify(er));
//    sys.puts('Fetched my new doc from couch:');
//    sys.p(doc);
//});

///*
db.get('b30fba2e6b5beb795f1fed91f6000c12', function (err, doc) {
    sys.puts("db.get => err = "+err);
    sys.puts("db.get => doc = "+doc);
});
sys.puts('Got p');

/*
db.insert({
    name: 'Problem 2',
    map_function: "function () { ; }",
    reduce_function: "function () { ; }"
}, function (err, res) {
    // Handle response
    sys.puts('db.insert => err = '+sys.inspect(err));
    sys.puts('db.insert => res = '+sys.inspect(res));
});
sys.puts('Set p');
*/

db.get('problem1', function (err, doc) {
    sys.puts('db.get(problem1) => doc = '+doc);
});
sys.puts('Got p');
//*/