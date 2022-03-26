var express = require('express');

var app = express();

app.set('port', 3001);

app.get('/', (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
