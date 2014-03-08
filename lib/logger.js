var HttpProxyServer = require('http-proxy-server');
var ProxySession = require('./session');
var events = require('events');
var util = require('util');

module.exports = (function () {

  var onConnection = function(request, proxySocket) {
    this.emit('connection', new ProxySession(request, proxySocket));
  };

  function HttpLogger() {
    events.EventEmitter.call(this);

    this._proxy = new HttpProxyServer();
    this._boundConnectionHandler = onConnection.bind(this);
    this._isLogging = false;
    this._isProxying = false;
  }
  util.inherits(HttpLogger, events.EventEmitter);

  HttpLogger.prototype.startProxy = function () {
    if (this._isProxying) return;
    HttpProxyServer.prototype.listen.apply(this._proxy, arguments);
    this._isProxying = true;
  }
  HttpLogger.prototype.closeProxy = function () {
    if (!this._isProxying) return;
    HttpProxyServer.prototype.close.apply(this._proxy, arguments);
    this._isProxying = false;
  }
  
  HttpLogger.prototype.isLogging = function () {
    return this._isProxying && this._isLogging;
  }
  
  HttpLogger.prototype.isProxying = function () {
    return this._isProxying;
  }

  HttpLogger.prototype.startLogging = function () {
    if (this._isLogging) return;
    this._proxy.on('connection', this._boundConnectionHandler);
    this._isLogging = true;
  }

  HttpLogger.prototype.stopLogging = function () {
    if (!this._isLogging) return;
    this._proxy.removeListener('connection', this._boundConnectionHandler);
    this._isLogging = false;
  }

  return HttpLogger;
})();
