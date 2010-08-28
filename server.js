var http = require('http'),
    port = process.env.PORT || 8001,
    sys = require('sys');

http.createServer(function (request, response) {
  response.writeHead(200, {'Content-Type': 'text/plain'});
  response.end('Hello World\n');
}).listen(parseInt(port));

sys.print('Server running at http://127.0.0.1:'+port);

