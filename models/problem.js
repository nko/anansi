function Problem(opts) {
    this.name = opts.name;
    this.map_function = opts.map_function;
    this.reduce_function = opts.reduce_function;
    this.status = opts.status;
    this.created_at = opts.created_at;
}

Problem.prototype.findAll = function(conn) {
    conn.query("select * from problems;", function (err, rows) {
        if (err) throw err;
        
    });
};