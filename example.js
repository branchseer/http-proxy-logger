var HttpLogger = require('./');


var logger = new HttpLogger();
logger.startProxy(8080);
logger.startLogging();


logger.on('connection', function (connection) {
  console.log(connection.method);
  connection.once('error', function (err) {
    //console.log(err)
  });

  connection.once('requestFinish', function (request) {
    //console.log(connection.requestHeaders['user-agent']);
  });
  
  connection.once('response', function (response) {
      response.once('end', function (err) {
    })
  });
});
