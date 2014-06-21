var zlib = require('zlib');
var events = require('events');
var util = require('util');
var BufferStream = require('./buffer');
var decodeStream = require('./decoder').decodeStream
var decodeXML = require('./decoder').decodeXML
var decodeBuffer = require('./decoder').decodeBuffer
var decodeHTML = require('./decoder').decodeHTML


module.exports = (function () {
  function HttpResponse(rawResponse) {
    events.EventEmitter.call(this);

    this._extractInfo(rawResponse);

    var self = this;
/*
    var contentEncoding = this.headers['content-encoding'];
    if (contentEncoding && contentEncoding in decompressors) {
      rawResponse = rawResponse.pipe(decompressors[contentEncoding]())
    }

    contentType = this.headers['content-type']
    if (contentType) {
      charsetIndex = contentType.indexOf('charset=')
      if (charsetIndex >= 0) {
        charset = contentType.substr(charsetIndex + 'charset='.length)
        try {
          rawResponse = rawResponse.pipe(new Iconv(charset, 'utf-8'));
        }
        catch (e) { }
      }
    }
*/
    rawResponse.pipe(new BufferStream()).on('finish', function () {
      self.body = this.buffer;
      self.emit('end');
    });
    
    rawResponse.on('error', function (err) {
      self.on(err);
    })
  }
  
  util.inherits(HttpResponse, events.EventEmitter);

  HttpResponse.prototype._extractInfo = function(rawResponse) {
    this.statusCode = rawResponse.statusCode;
    this.headers = rawResponse.headers;
  };

  HttpResponse.prototype.decodeBody = function(cb) {
    var self = this;
    decodeBuffer(self.body,
      self.headers['content-encoding'],
      self.headers['content-type'],
      function (decodedBuffer) {
        if (!self.headers['content-encoding']) {
          if ([
            'application/xml',
            'text/xml'
          ].indexOf(self.headers['content-type']) >= 0) {
            decodedBuffer = decodeXML(self.body);
          }
          else if (self.headers['content-type'] === 'text/html') {
            decodedBuffer = decodeHTML(self.body);
          }
        }
      this.body = decodedBuffer;
      if (cb) cb.call(this, decodedBuffer);
      }
    );
  };

  return HttpResponse;
})();
