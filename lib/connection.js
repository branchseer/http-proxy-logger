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
    this.isSSL = this.url.indexOf('https://') === 0;
    //this.remoteAddress = c2p.connection.remoteAddress;
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


      c2p.pipe(new BufferStream()).on('finish', function () {
        self.requestBody = this.buffer;
        self.emit('end');
      });
    }
  }



  ProxyConnection.prototype.decodeBody = function(cb) {
    var self = this;
    if (self.decodedRequestBody && cb) {
      return setImmediate(cb.bind(self, self.decodedRequestBody));
    }

    decodeBuffer(self.requestBody,
      self.headers['content-encoding'],
      self.headers['content-type'],
      function (decodedBuffer) {
        if (self.headers['content-type'].indexOf('xml') >= 0) {
          decodedBuffer = decodeXML(decodedBuffer);
        }
        else if (self.headers['content-type'] === 'text/html') {
          decodedBuffer = decodeHTML(decodedBuffer);
        }
        self.decodedBody = decodedBuffer;
        if (cb) cb.call(self, decodedBuffer);
      }
    );
  };


  util.inherits(ProxyConnection, events.EventEmitter);

  return ProxyConnection;
})();
