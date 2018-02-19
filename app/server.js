var http = require('http');
var fs = require('fs');
var finalHandler = require('finalhandler');
var queryString = require('querystring');
var Router = require('router');
var bodyParser   = require('body-parser');

const PORT = 3001;
// State holding variables
var stores = [];
var users = [];

// Setup router
var myRouter = Router();
myRouter.use(bodyParser.json());

http.createServer(function (request, response) {
  myRouter(request, response, finalHandler(request, response))
}).listen(PORT, (error) => {
  if (error) {
    return console.log('Error on Server Startup: ', error)
  }
  fs.readFile('stores.json', 'utf8', function (error, data) {
    if (error) throw error;
    stores = JSON.parse(data);
    console.log(`Server setup: ${stores.length} stores loaded`);
  });
  fs.readFile('users.json', 'utf8', function (error, data) {
    if (error) throw error;
    users = JSON.parse(data);
    console.log(`Server setup: ${users.length} users loaded`);
  });
  console.log(`Server is listening on ${PORT}`);
});

// Public route - all users of API can access
myRouter.get('/api/stores', function(request,response) {
  response.end(JSON.stringify(stores));
});

// Only logged in users can access a specific store's issues
myRouter.get('/api/stores/:storeId/issues', function(request,response) {
  response.end();
});

// Only managers can update a store's information
myRouter.post('/api/stores/:storeId', function(request,response) {
  response.end();
});