var zlib = require('zlib');
var events = require('events');
var util = require('util');
var HttpMessage = require('./message');


module.exports = (function () {
  function HttpRequest(rawRequest) {
    this.method = rawRequest.method;
    this.url = rawRequest.url;
     
    if (this.method !== 'CONNECT') {
      this.headers = rawRequest.headers;
      HttpMessage.call(this, rawRequest);
    }
  }
  
  util.inherits(HttpRequest, HttpMessage);
  return HttpRequest;
})();
