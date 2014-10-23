var zlib = require('zlib');
var events = require('events');
var util = require('util');
var BufferStream = require('./buffer');
var decodeStream = require('./decoder').decodeStream
var decodeXML = require('./decoder').decodeXML
var decodeBuffer = require('./decoder').decodeBuffer
var decodeHTML = require('./decoder').decodeHTML


module.exports = (function () {
  function HttpMessage(stream) {
    events.EventEmitter.call(this);

    var self = this;
    stream.pipe(new BufferStream()).on('finish', function () {
      self._decodeBody(this.buffer, function (decodedBuffer) {
        self.body = decodedBuffer;
        self.emit('end');
      })
    });
    stream.on('error', function (err) {
      self.emit('error', err);
    })
  }
  
  util.inherits(HttpMessage, events.EventEmitter);

  HttpMessage.prototype._decodeBody = function(body, cb) {
    var self = this;

    decodeBuffer(body,
      self.headers ? self.headers['content-encoding'] : null,
      self.headers ? self.headers['content-type'] : null,
      function (decodedBuffer) {
        if (self.headers['content-type']) {
          if (self.headers['content-type'].indexOf('xml') >= 0) {
            decodedBuffer = decodeXML(decodedBuffer);
          }
          else if (self.headers['content-type'] === 'text/html') {
            decodedBuffer = decodeHTML(decodedBuffer);
          }
        }
        cb.call(self, decodedBuffer);
      }
    );
  };

  HttpMessage.prototype.startDecoding = function () {
    if (!this.decodingStatus) {
      this.decodingStatus = 'decoding';
      this._decodeBody(function (decodedBuffer) {
        this.body = decodedBiuffer;
        this.decodingStatus = 'decoded'
        this.emit('decoded');
      });
    }
    return this;
  }

  return HttpMessage;
})();
