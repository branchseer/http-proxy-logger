var zlib = require('zlib');
var events = require('events');
var util = require('util');
var BufferStream = require('./buffer');
var HttpMessage = require('./message');


module.exports = (function () {
  function HttpResponse(rawResponse) {
    this.statusCode = rawResponse.statusCode;
    this.headers = rawResponse.headers;

    HttpMessage.call(this, rawResponse);
  }
  
  util.inherits(HttpResponse, HttpMessage);
  return HttpResponse;
})();
