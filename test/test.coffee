assert = require 'assert'
express = require 'express'
HttpLogger = require '../'

SERVER_PORT = 9396;
PROXY_PORT = 4594;

server = express()

server.get '/*', (req, res) ->
  res.writeHead 200, 'text/plain'
  res.end 'I am what I am.'

server.post '/echo/*', (req, res) ->
  res.writeHead 200, req.headers['content-type']
  req.pipe(res)

baseURL = "http://localhost:#{SERVER_PORT}/"

logger = new HttpLogger();
logger.startLogging()

request = require('request').defaults
  proxy: "http://localhost:#{PROXY_PORT}"

describe 'HttpProxyLogger', ->
  before (done) ->
    server.listen SERVER_PORT, -> logger.startProxy PROXY_PORT
    logger.once 'listening', done


  describe 'Request', ->
    it 'should get the right headers', (done)->
      url = "#{baseURL}headers"
      request.get
        url: url
        headers:
          'x-field': 'value'
      logger.on 'connection', (connection) ->
        if connection.url == url
          assert connection.requestHeaders['x-field'] == 'value'
          done()
    
    describe 'Body', () ->
      it 'should get the right plain body', (done)->
        body = 'foo and bar'
        url = "#{baseURL}echo/plain_body"
        request.post
          url: url
          body: body
        logger.on 'connection', (connection) ->
          if connection.url == url
            connection.once 'response', (response) -> response.on 'end', ->
              assert.equal response.body, body
              done()