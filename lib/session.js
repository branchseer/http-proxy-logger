var events = require('events');
var util = require('util');
var BufferStream = require('buffer-stream');
var HttpResponse = require('./response');


module.exports = (function () {

  var extractRequestInfo = function (request) {
    return {
      method: request.method,
      url: request.url,
      headers: request.headers
    };
  }

  function ProxySession(rawRequest, rawProxySocket) {
    var thisSession = this;
    if (rawRequest.method !== 'CONNECT') {
      //this.request = new HttpRequest(rawRequest);

      rawProxySocket.on('response', function (response) {
        thisSession.emit('response', new HttpResponse(response));
      });

      rawRequest.pipe(new BufferStream().on('finish', function () {
        thisSession.requestBody = this.buffer;
        thisSession.emit('requestFinish');
      }));
    }
    this.method = rawRequest.method;
    this.url = rawRequest.url;
    this.requestHeaders = rawRequest.headers;
  }
  util.inherits(ProxySession, events.EventEmitter);

  return ProxySession;
})();
