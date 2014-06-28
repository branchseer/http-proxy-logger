assert = require 'assert'
express = require 'express'
{HttpLogger} = require '../'
compression = require 'compression'
iconv = require 'iconv-lite'
parseXmlString = require('xml2js').parseString

SERVER_PORT = 9396;
PROXY_PORT = 4594;

server = express()
server.use compression
  threshold: 0

server.get '/hello/*', (req, res) ->
  res.writeHead 200,
    'Content-Type': 'text/plain'
    'x-field': 'hello'
  res.end 'hello'

server.post '/echo/*', (req, res) ->
  res.writeHead 200, 'Content-Type': 'text/plain'
  req.pipe(res)

server.get '/charset/:charset/in-content-type/:text', (req, res) ->
  res.writeHead 200,
    'Content-Type': "text/plain; charset=#{req.params.charset}"
  res.end iconv.encode req.params.text, req.params.charset

server.get '/charset/:charset/in-xml/:text', (req, res) ->
  res.writeHead 200,
    'Content-Type': "text/xml"
  xml = iconv.encode """
    <?xml version="1.0" encoding="#{req.params.charset}"?>
    <text>#{req.params.text}</text>
  """, req.params.charset
  res.end xml

server.get '/charset/:charset/in-html/:text', (req, res) ->
  res.writeHead 200,
    'Content-Type': "text/html"
  html = iconv.encode """
    <html><head>
    <meta http-equiv="Content-Type" content="text/html; charset=#{req.params.charset}"></head>
    <body>#{req.params.text}</body></html>
  """, req.params.charset
  res.end html


server.get '/charset/:charset/in-html5/:text', (req, res) ->
  res.writeHead 200,
    'Content-Type': "text/html"
  html = iconv.encode """
    <!DOCTYPE html>
    <html><head>
    <meta charset="#{req.params.charset}"></head>
    <body>#{req.params.text}</body></html>
  """, req.params.charset
  res.end html

baseURL = "http://localhost:#{SERVER_PORT}/"

logger = new HttpLogger();
logger.startLogging()

request = require('request').defaults
  proxy: "http://localhost:#{PROXY_PORT}"

describe 'HttpProxyLogger', ->
  before (done) ->
    server.listen SERVER_PORT, -> logger.startProxy PROXY_PORT, done
    #logger.once 'listening', done


  describe 'Request', ->
    it 'should get the method', (done) ->
      url = "#{baseURL}/hello/method"
      logger.on 'connection', (connection) -> if connection.request.url == url
        assert connection.request.method, 'GET'
        done()
      request.get url

    it 'should get the headers', (done)->
      url = "#{baseURL}request_headers"
      logger.on 'connection', (connection) -> if connection.request.url == url
        assert connection.request.headers['x-field'] == 'value'
        done()
      request.get
        url: url
        headers:
          'x-field': 'value'

  describe 'Response', ->
    describe 'Body', () ->
      it 'should get the plain body', (done)->
        body = 'foo and bar'
        url = "#{baseURL}echo/plain_body"
        request.post
          url: url
          body: body
        logger.on 'connection', (connection) ->
          if connection.request.url == url
            connection.once 'response', (response) -> response.on 'end', ->
              assert.equal response.body, body
              done()

      it 'should uncompress the body', (done) ->
        url = "#{baseURL}echo/compress"
        body = 'foo and bar'
        logger.on 'connection', (connection) ->
          if connection.request.url == url
            connection.once 'response', (response) -> response.on 'end', ->
              assert.equal @body, body
              done();
            
                  
        request.post
          url: url
          body: body
          headers:
            'accept-encoding': 'gzip'

      it 'should identity and decode the charset in Content-Type', (done) ->
        text = '你好gbk'
        url = "#{baseURL}charset/gbk/in-content-type/#{text}"
        logger.on 'connection', (connection) ->
          if connection.request.url == url
            connection.once 'response', (response) -> response.on 'end', ->
              assert.equal @body, text
              done()
        request.get url

      it 'should identity and decode the charset in xml', (done) ->
        text = '你好xml里的gbk'
        url = "#{baseURL}charset/gbk/in-xml/#{text}"
        logger.on 'connection', (connection) ->
          if connection.request.url == url
            connection.once 'response', (response) -> response.on 'end', ->
              parseXmlString @body.toString(),
              (err, result) ->
                if err?
                  return done err
                assert.equal result.text, text
                done()
        request.get url

      it 'should identity and decode the charset in html4 head', (done) ->
        text = '你好html4里的gbk'
        url = "#{baseURL}charset/gbk/in-html/#{text}"
        logger.on 'connection', (connection) ->
          if connection.request.url == url
            connection.once 'response', (response) -> response.on 'end', ->
              parseXmlString @body.toString(), strict: false,
              (err, result) ->
                if err?
                  return done err
                assert.equal result.HTML.BODY[0], text
                done()
        request.get url

      it 'should uncompress and decode', (done) ->
        text = '你好压缩了的html5里的gbk'
        url = "#{baseURL}charset/gbk/in-html5/#{text}"
        logger.on 'connection', (connection) ->
          if connection.request.url == url
            connection.once 'response', (response) -> response.on 'end', ->
              parseXmlString @body.toString(), strict: false,
              (err, result) ->
                if err?
                  return done err
                assert.equal result.HTML.BODY[0], text
                done()
        request.get
          url: url
          headers:
            'accept-encoding': 'gzip'
