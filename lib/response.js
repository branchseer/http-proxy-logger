var zlib = require('zlib');
var events = require('events');
var util = require('util');
var BufferStream = require('buffer-stream');


module.exports = (function () {
  function HttpResponse(rawResponse) {
    events.EventEmitter.call(this);

    this._extractInfo(rawResponse);

    thisResponse = this;
    rawResponse.pipe(new BufferStream().on('finish', function () {
      thisResponse.body = this.buffer;
      thisResponse.emit('end');
    }));
  }
  util.inherits(HttpResponse, events.EventEmitter);

  HttpResponse.prototype._extractInfo = function(rawResponse) {
    this.statusCode = rawResponse.statusCode;
    this.headers = rawResponse.headers;
  };

  var decompressors = {
    'gzip': zlib.gunzip.bind(zlib),
    'deflate': zlib.inflate.bind(zlib)
  }

  HttpResponse.prototype.decodeBody = function (callback) {
    var contentEncoding = this.headers['content-encoding'];
    if (contentEncoding && contentEncoding in decompressors) {
      decompressors[contentEncoding](this.body, callback);
      return true;
    }
    else {
      return false;
    }
  };

  return HttpResponse;
})();
