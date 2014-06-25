var zlib = require('zlib');
var events = require('events');
var util = require('util');
var BufferStream = require('./buffer');
var decodeStream = require('./decoder').decodeStream
var decodeXML = require('./decoder').decodeXML
var decodeBuffer = require('./decoder').decodeBuffer
var decodeHTML = require('./decoder').decodeHTML
var Promise = require('es6-promise').Promise;


module.exports = (function () {
  function HttpMessage(stream) {
    events.EventEmitter.call(this);

    var self = this;
    var body = null;
    stream.pipe(new BufferStream()).on('finish', function () {
      body = self.body = this.buffer;
      self.emit('end');
    });
    
    stream.on('error', function (err) {
      self.emit('error', err);
    });
  }
  
  util.inherits(HttpMessage, events.EventEmitter);

  HttpMessage.prototype.decodeBody = function(cb) {
    var self = this;
    if (self.decodedBody && cb) {
      return setImmediate(cb.bind(self, self.decodedBody));
    }

    decodeBuffer(self.body,
      self.headers ? self.headers['content-encoding'] : null,
      self.headers ? self.headers['content-type'] : null,
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

  return HttpMessage;
})();
