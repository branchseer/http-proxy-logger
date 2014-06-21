var HttpLogger = require('./');
var path = require('path');
var fs = require('fs');


var logger = new HttpLogger();
logger.startProxy(8080);
logger.startLogging();


var certFolder = '/Users/patr0nus/repo/Cellist/build/certs';
var keyPath = path.join(certFolder, 'privatekey.pem');
var certPath = path.join(certFolder, 'certificate.pem')
var httpsOpts = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
}

logger.setHttpsOption(httpsOpts);

logger.on('connection', function (connection) {
  console.log(connection.method, connection.url);
  connection.once('error', function (err) {
    //console.log(err)
  });

  connection.once('requestFinish', function (request) {
    //console.log(connection.requestHeaders['user-agent']);
  });
  
  connection.once('response', function (response) {
    response.once('end', function (err) {
      response.decodeBody(function () {
        console.log(this.body.toString());
      });
    })
  });
});
