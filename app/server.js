var http = require('http');
var fs = require('fs');
var finalHandler = require('finalhandler');
var queryString = require('querystring');
var Router = require('router');
var bodyParser   = require('body-parser');
var url = require('url');
const TOKEN_VALIDITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
var uid = require('rand-token').uid;
const CORS_HEADERS = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Origin, X-Requested-With, Content-Type, Accept, X-Authentication"};

const PORT = 3001;
// State holding variables
var stores = [];
var users = [];
const VALID_API_KEYS = ["88312679-04c9-4351-85ce-3ed75293b449","1a5c45d3-8ce7-44da-9e78-02fb3c1a71b7"];
var accessTokens = [];
var failedLoginAttempts = {};

// Setup router
var myRouter = Router();
myRouter.use(bodyParser.json());

http.createServer(function (request, response) {
  if (request.method === 'OPTIONS'){
    response.writeHead(200, CORS_HEADERS);
    response.end();
  }
  if (!VALID_API_KEYS.includes(request.headers['x-authentication'])){
    response.writeHead(401, "You need a valid API Key to use this API", CORS_HEADERS);
    response.end();
  }

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
  response.writeHead(200, Object.assign(CORS_HEADERS, {'Content-Type':'application/json'}))
  response.end(JSON.stringify(stores.map((store) => {
    let clonedStore = Object.assign({}, store);
    delete clonedStore.issues;
    return clonedStore;
  })));
});

  // Make sure there is a username and password in the request
myRouter.post('/api/login', function(request, response){
  response.writeHead(200, Object.assign(CORS_HEADERS, {'Content-Type':'application/json'}))
  if (!failedLoginAttempts[request.body.username]){
    failedLoginAttempts[request.body.username] = 0;
  }
  if(request.body.username && request.body.password && failedLoginAttempts[request.body.username] < 3){
    // See if there is a user that has that username and password
    let user = users.find((user) => {
      return user.login.username === request.body.username && user.login.password === request.body.password
    })

    if (user){
      // Write the header because we know we will be returning successful at this point and that the response will be json
      response.writeHead(200, Object.assign(CORS_HEADERS, {'Content-Type': 'application/json'}))
      failedLoginAttempts[request.body.username] = 0;

      let currentToken = accessTokens.find((token) => {
        return token.username == user.login.username
      })

      if(currentToken){
        currentToken.createdDate = new Date();
        return response.end(JSON.stringify(currentToken.token));
      }
      else {
        let newToken = {
          username: user.login.username,
          createdDate: new Date(),
          token: uid(16)
        }
        accessTokens.push(newToken)
       return  response.end(JSON.stringify(newToken.token));
      }
    }
    else {
      response.writeHead(418, 'Invalid username or password');
      return response.end()
    }
  }
  else {
    if(!failedLoginAttempts[request.body.username]){
      failedLoginAttempts[request.body.username] = 0
      response.writeHead(418, 'invalid username or password');
      return response.end()
    }

        failedLoginAttempts[request.body.username] ++;
        response.writeHead(418, "Invalid username or password")
        return response.end()
  }
  
})  
 

// If we already have an existing access token, use that
// Update the last updated value of the existing token so we get another time period before expiration
// Create a new token with the user value and a "random" token
// When a login fails, tell the client in a generic way that either the username or password was wrong
// If they are missing one of the parameters, tell the client that something was wrong in the formatting of the response
// Only logged in users can access a specific store's issues
myRouter.get('/api/stores/:storeId/issues', function(request,response) {
  response.writeHead(200, Object.assign(CORS_HEADERS, {'Content-Type':'application/json'}))
  let urlParts = url.parse(request.url, true);
  let query = urlParts.query;
  let submittedToken = query.accessToken;
  if(submittedToken){
    let foundToken = accessTokens.find((accessToken) => {
      return accessToken.token == submittedToken && ((new Date) - accessToken.createdDate) < TOKEN_VALIDITY_TIMEOUT;
    })
    if(foundToken){
      response.end(JSON.stringify(stores))
    }
    else{
      response.writeHead(401, 'Access Token not sent or not correct');
     return response.end();
    }
  }
  else {
    response.writeHead(401, 'Access Token not sent or not correct');
     return response.end();
  }

});

// Only managers can update a store's information
myRouter.post('/api/stores/:storeId', function(request,response) {
  response.writeHead(200, {'Content-Type':'application/json'})
  response.end();
});