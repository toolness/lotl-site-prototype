var express = require('express');

var PORT = process.env.PORT || 3000;

var app = express();

app.use(express.static(__dirname + '/static'));

app.listen(PORT, function() {
  console.log('listening on port', PORT);
});