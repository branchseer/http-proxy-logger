var HttpProxyServer = require('http-proxy-server');
var ProxyConnection = require('./connection');
var events = require('events');
var util = require('util');

module.exports = (function () {

  var onConnection = function(request, proxySocket) {
    this.emit('connection', new ProxyConnection(request, proxySocket));
  };

  function HttpLogger() {
    events.EventEmitter.call(this);
    var self = this;

    this._proxy = new HttpProxyServer();
    this._boundConnectionHandler = onConnection.bind(this);
    this._isLogging = false;
    this._isProxying = false;

    this._proxy.on('listening', function () {
      self._isProxying = true;
      self.emit('listening');
      if (self._isLogging) self.emit('logging');
    });

    this._proxy.on('close', function () {
      self.emit('close');
      if (self._isLogging) self.emit('blind');
    });

    this._proxy.on('error', function (e) {
      self.emit('error', e);
    });
  }
  util.inherits(HttpLogger, events.EventEmitter);

  HttpLogger.prototype.startProxy = function () {
    if (this._isProxying) return;
    HttpProxyServer.prototype.listen.apply(this._proxy, arguments);
  }

  HttpLogger.prototype.use = function () {
    HttpProxyServer.prototype.use.apply(this._proxy, arguments);
    return this;
  }

  HttpLogger.prototype.setFallback = function (handler) {
    this._proxy.fallback = handler;
    return this;
  };

  HttpLogger.prototype.setHttpsOption = function (option) {
    this._proxy.httpsOption = option;
    return this;
  };

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
    if (this._isProxying) this.emit('logging');
    this._isLogging = true;
  }

  HttpLogger.prototype.stopLogging = function () {
    if (!this._isLogging) return;
    this._proxy.removeListener('connection', this._boundConnectionHandler);
    this.emit('blind');
    this._isLogging = false;
  }

  return HttpLogger;
})();
