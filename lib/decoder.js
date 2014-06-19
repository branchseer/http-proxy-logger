var util = require('util');
var iconv = require('iconv-lite');
var zlib = require('zlib');

var decompressors = {
  'gzip': function () { return zlib.createGunzip() },
  'deflate': function () {  return zlib.createInflate() }
}

exports.decodeStream = function (stream, contentEncoding, contentType) {
  var newStream = stream;
  if (contentEncoding && contentEncoding in decompressors) {
    newStream = newStream.pipe(decompressors[contentEncoding]())
  }

  if (contentType) {
    charsetIndex = contentType.indexOf('charset=')
    if (charsetIndex >= 0) {
      charset = contentType.substr(charsetIndex + 'charset='.length).toLowerCase()
      if (charset !== 'utf-8') {
        if (iconv.encodingExists(charset)) {
          newStream = newStream.pipe(iconv.decodeStream(charset));
        }
      }
    }
  }

  return newStream;
}

var xmlEncodingRegex = /^<\?xml (.*)encoding=("|')(.*)("|')(.*)\?>/

exports.decodeXML = function (xmlBuffer) {
  var extract = xmlEncodingRegex.exec(xmlBuffer.toString())
  if (extract) {
    var encoding = extract[3]
    if (encoding && encoding.length > 0) {
      encoding = encoding.toLowerCase()
      if (iconv.encodingExists(encoding)) {
        return new Buffer(iconv.decode(xmlBuffer, encoding));
      }
    }
  }
  return xmlBuffer;
}
