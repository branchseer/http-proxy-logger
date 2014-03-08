var HttpLogger = require('./');


var logger = new HttpLogger();
logger.startProxy(8080);
logger.startLogging();

logger.on('connection', function (session) {
  console.log(session.method, session.url);
  session.on('requestFinish', function () {
    console.log(session.method, session.requestBody.length);
  });
  /*
  session.on('response', function (response) {
    response.on('end', function () {
      var canDecode = response.decodeBody(function (err, decoded) {
        console.log(decoded.toString());
      });
    })
  });
  */
});
