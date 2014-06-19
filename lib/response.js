var zlib = require('zlib');
var events = require('events');
var util = require('util');
var BufferStream = require('./buffer');
var decodeStream = require('./decoder').decodeStream
var decodeXML = require('./decoder').decodeXML


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
    decodeStream(rawResponse,
      this.headers['content-encoding'],
      this.headers['content-type'])
    .pipe(new BufferStream()).on('finish', function () {
      var body = this.buffer;

      if (!self.headers['content-encoding']) {
        if ([
          'application/xml',
          'text/xml'
        ].indexOf(self.headers['content-type']) >= 0) {
          body = decodeXML(body);
        }
      }

      self.body = body;
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

  return HttpResponse;
})();
