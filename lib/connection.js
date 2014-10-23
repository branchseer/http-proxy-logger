var events = require('events');
var util = require('util');
var BufferStream = require('./buffer');
var HttpResponse = require('./response');
var HttpRequest = require('./request');
var decodeStream = require('./decoder').decodeStream



module.exports = (function () {

  function ProxyConnection(c2p, p2s) {
    events.EventEmitter.call(this);
    var self = this;

    this.request = new HttpRequest(c2p)
    .on('error', function (err) {
      self.emit('error', err);
    });
    
    if (this.request.method !== 'CONNECT') {
      p2s.on('response', function (response) {
        self.emit('response', new HttpResponse(response).on('error', function (err) {
          self.emit('error', err);
        }));
      });
      p2s.on('error', function (err) {
        self.emit('error', err);
      });
    }
  }

  util.inherits(ProxyConnection, events.EventEmitter);

  return ProxyConnection;
})();
