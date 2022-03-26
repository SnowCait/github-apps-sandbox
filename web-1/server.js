var fs = require('fs');
var http = require('http');
var server = http.createServer();

server.on('request', function(req, res) {
    var stream = fs.createReadStream('./client.html');
    res.writeHead(200, {
        'Content-Type' : 'text/html'
    });
    stream.pipe(res);
});

var io = require('socket.io').listen(server);
server.listen(8000);

var MAX_MESSAGES_SIZE = 30;
var data = {messages: []};
io.sockets.on('connection', function(socket) {
    // ----------------------------------------------------------------------
    // 2-1. クライアントの描画処理を呼ぶ.
    // ----------------------------------------------------------------------
    socket.emit('setView', data);
    // ----------------------------------------------------------------------
    // 2-2. クライアントから送信されたメッセージをサーバーにて保存する処理.
    // ----------------------------------------------------------------------
    socket.on('saveData', function(dataByClient) {
        data.messages.unshift(dataByClient.message);
        if (data.messages.length > MAX_MESSAGES_SIZE) {
            data.messages.splice(data.messages.length - 1);
        }
        io.sockets.emit('setView', data);
    });
});
