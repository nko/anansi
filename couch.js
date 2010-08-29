var sys = require('sys'),
    fs = require('fs'),
    cradle = require('cradle');
var c = new(cradle.Connection)('maprejuice.couchone.com');
sys.puts('Got c => ' + sys.inspect(c));
sys.puts('Databases => '+c.databases());
var db = c.database('maprejuice');
sys.puts('Got db: '+db.name);

/*
db.exists(function (err, res) {
    sys.puts('db.exists => err = '+sys.inspect(err));
    sys.puts('db.exists => res = '+sys.inspect(res));
    if (!res) {
        db.create();
    }
});
//*/


//db.getDoc('b30fba2e6b5beb795f1fed91f6000c12', function(er, doc) {
//    if (er) throw new Error(JSON.stringify(er));
//    sys.puts('Fetched my new doc from couch:');
//    sys.p(doc);
//});

/*
db.get('db8b3af81b102c450a8440fe870006c8', function (err, doc) {
    sys.puts("db.get => err = "+err);
    sys.puts("db.get => doc = "+doc);
});
sys.puts('Got p');

/*
db.insert({
    name: 'First Problem',
    status: 'queued',
    created_at: new Date().getTime(),
    map_function: "function map(k,v) { ; }",
    reduce_function: "function reduce(k,v) { ; }",
    data: {},
    type: 'problem'
}, function (err, res) {
    // Handle response
    sys.puts('db.insert => err = '+sys.inspect(err));
    sys.puts('db.insert => res = '+sys.inspect(res));
});
sys.puts('Set p');
//*/

db.insert('_design/problems', {
    find_nulls: {
        map: function (doc) {
            if (!doc.name) { emit(null, doc); }
        }
    }
});

db.get('problems/find_nulls', function (err, rowSet) {
    for (var i in rowSet) {
        sys.puts(sys.inspect(rowSet[i]));
    }
});

sys.puts('Got p');
//*/