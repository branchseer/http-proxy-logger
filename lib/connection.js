var events = require('events');
var util = require('util');
var BufferStream = require('./buffer');
var HttpResponse = require('./response');
var HttpResquest = require('./request');
var decodeStream = require('./decoder').decodeStream


module.exports = (function () {

  var extractRequestInfo = function (request) {
    return {
      method: request.method,
      url: request.url,
      headers: request.headers
    };
  }

  function ProxyConnection(c2p, p2s) {
    var self = this;
    this.method = c2p.method;
    this.url = c2p.url;
    //this.request = new HttpResquest(c2p);

    var onError = function (err) {
      self.emit('error', err);
    }
    
    c2p.on('error', onError);
    p2s.on('error', onError);
    
    if (c2p.method !== 'CONNECT') {
      this.requestHeaders = c2p.headers;
      p2s.on('response', function (response) {
        self.emit('response', new HttpResponse(response));
      });
      
      decodeStream(c2p,
        this.requestHeaders['content-encoding'],
        this.requestHeaders['content-type']
      ).pipe(new BufferStream()).on('finish', function () {
        self.requestBody = this.buffer;
        self.emit('requestFinish');
      });
    }
  }
  util.inherits(ProxyConnection, events.EventEmitter);

  return ProxyConnection;
})();
