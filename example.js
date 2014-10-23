var HttpProxyLogger = require('./').HttpLogger;
var path = require('path');
var fs = require('fs');
var child_process = require('child_process');
var util = require('util');


var logger = new HttpProxyLogger();
logger.startProxy(9396);
logger.startLogging();


var certFolder = '/Users/patr0nus/repo/Cellist/src/assets/certs';
var keyPath = path.join(certFolder, 'server.key');
var keyFile = fs.readFileSync(keyPath);

logger.setHttpsOption(function (domain, cb) {
  gen_csr = child_process.exec(util.format('bash gen_crt %s', domain), {
    cwd: certFolder
  }, function (error, stdout, stderr) {
    cb({
      key: keyFile,
      cert: stdout
    })
  });
});

logger.on('connection', function (connection) {
  connection.once('response', function (response) {
    response.once('end', function () {
      console.log(response.body);
    });
  });
});
