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
  }
  util.inherits(HttpLogger, events.EventEmitter);

  HttpLogger.prototype.startProxy = function () {
    HttpProxyServer.prototype.listen.apply(this._proxy, arguments);
  }
  HttpLogger.prototype.closeProxy = function () {
    HttpProxyServer.prototype.close.apply(this._proxy, arguments);
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
