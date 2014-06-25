var stream = require('stream');
var util = require('util');

module.exports = (function () {
  function BufferStream() {
    stream.Writable.call(this);

    this._buffers = [];
    this._isEnd = false;
  }
  util.inherits(BufferStream, stream.Writable);

  BufferStream.prototype._write = function (chunk, encoding) {
    if (typeof chunk === 'string') {
      chunk = new Buffer(chunk, encoding);
    }
    this._buffers.push(chunk);
  }

  BufferStream.prototype.write = function(chunk, encoding, callback) {
    this._write.apply(this, arguments);
    if (callback) {
      process.nextTick(callback);
    }
    return true;
  };

  BufferStream.prototype.end = function(chunk, encoding, callback) {
    if (arguments.length > 0) {
      this._write.apply(this, arguments);
      if (callback) {
        this.on('finish', callback);
      }
    }
    if (this.listeners('finish').length > 0) {
      var self = this;
      setImmediate(function () {
        self.emit('finish');
      });
    }
    this.buffer = Buffer.concat(this._buffers);
  }

  return BufferStream;
})();
