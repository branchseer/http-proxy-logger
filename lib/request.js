var zlib = require('zlib');
var events = require('events');
var util = require('util');
var BufferStream = require('./buffer');



module.exports = (function () {
  function HttpResponse(c2p) {
    events.EventEmitter.call(this);

    this._extractInfo(c2p);

    var self = this;
    rawResponse.pipe(new BufferStream()).on('finish', function () {
      self.body = this.buffer;
      
      var decompressed = self._decompressBody(function (result) {
        this.body = result;
        self.emit('end');
      });
      if (!decompressed) {
        self.emit('end');
      }
    });
    
    rawResponse.on('error', function (err) {
      self.on(err);
    })
  }
  
  util.inherits(HttpResponse, events.EventEmitter);

  HttpResponse.prototype._extractInfo = function(c2p) {
    this.url = c2p.url;
    this.method = c2p.method;
    this.headers = c2p.headers;
  };

  var decompressors = {
    'gzip': zlib.gunzip.bind(zlib),
    'deflate': zlib.inflate.bind(zlib)
  }

  HttpResponse.prototype._decompressBody = function (callback) {
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
