var util = require('util');
var iconv = require('iconv-lite');
var zlib = require('zlib');

var streamDecompressors = {
  'gzip': function () { return zlib.createGunzip() },
  'deflate': function () {  return zlib.createInflate() }
}


var bufferDecompressors = {
  'gzip': zlib.gunzip.bind(zlib),
  'deflate': zlib.inflate.bind(zlib)
}

var xmlEncodingRegex = /^<\?xml (.*)encoding=("|')(.*)("|')(.*)\?>/;
var htmlEncodingRegex = /<meta (.*)content=("|')(.*)charset=(.*)("|')/;
var html5EncodingRegex = /<meta (.*)charset=("|')(.*)("|')/;

var iconvDecode = function(charset, buffer) {
  if (!charset || charset.length === 0) return buffer;
  charset = charset.toLowerCase();
  if (iconv.encodingExists(charset)) {
    return new Buffer(iconv.decode(buffer, charset));
  }
  return buffer;
}

exports.decodeXML = function (xmlBuffer) {
  var extract = xmlEncodingRegex.exec(xmlBuffer.toString());
  if (extract) {
    return iconvDecode(extract[3], xmlBuffer);
  }
  return xmlBuffer;
}

exports.decodeHTML = function (htmlBuffer) {
  var charset;
  var bufStr = htmlBuffer.toString()

  var extract = htmlEncodingRegex.exec(bufStr);
  if (extract) {
    return iconvDecode(extract[4], htmlBuffer);
  }

  extract = html5EncodingRegex.exec(bufStr);
  if (extract) {
    return iconvDecode(extract[3], htmlBuffer);
  }
  return htmlBuffer;
}

exports.decodeBuffer = function (buffer, contentEncoding, contentType, callback) {
  if (contentEncoding && contentEncoding in bufferDecompressors) {
    bufferDecompressors[contentEncoding](buffer, function (err, newBuffer) {
      if (err) {
        if (callback) return callback(decodeCharset(buffer));
      }
      else {
        if (callback) return callback(decodeCharset(newBuffer));
      }
    });
  }
  else {
    if (callback) {
      setImmediate(function () {
        callback(decodeCharset(buffer));
      });
    }
  }

  function decodeCharset (_buffer) {
    if (contentType) {
      charsetIndex = contentType.indexOf('charset=');
      if (charsetIndex >= 0) {
        charset = contentType.substr(charsetIndex + 'charset='.length).toLowerCase();
        if (charset !== 'utf-8') {
          if (iconv.encodingExists(charset)) {
            return new Buffer(iconv.decode(_buffer, charset));
          }
        }
      }
    }
    return _buffer;
  }
}

exports.decodeStream = function (stream, contentEncoding, contentType) {
  var newStream = stream;
  if (contentEncoding && contentEncoding in streamDecompressors) {
    newStream = newStream.pipe(streamDecompressors[contentEncoding]())
  }

  if (contentType) {
    charsetIndex = contentType.indexOf('charset=');
    if (charsetIndex >= 0) {
      charset = contentType.substr(charsetIndex + 'charset='.length).toLowerCase();
      if (charset !== 'utf-8') {
        if (iconv.encodingExists(charset)) {
          newStream = newStream.pipe(iconv.decodeStream(charset));
        }
      }
    }
  }

  return newStream;
}

