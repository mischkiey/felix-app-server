# Node Style Guide

## RESTful Structure

**Keep** **server.js simple** 

A developer should be able to quickly find necessary information, such as the database url and the port connection. We like to sneak our db connection into the app here. We initialize express in app.js

Below is an example server.js file.

```jsx
const knex = require('knex');

const app = require('./app');
const { PORT, DATABASE_URL } = require('./config');

const db = knex({
  client: 'pg',
  connection: DATABASE_URL,
});

app.set('db', db);

app.listen(PORT, () => {
  console.log(`server listening at ${DATABASE_URL} on ${PORT}`);
});
```

**app.js**

A developer should be able to quickly read the file and identify all supported routes. Imagine it as a table of contents for the REST API.

Below is an example app.js file.

```jsx
const express = require('express');

const loginRouter = require('./login/loginRouter');
const registerRouter = require('./register/registerRouter');

const app = express();

app.use('/login', loginRouter);
app.use('/register', registerRouter);
```

**One route per file**

Each API route is in a separate external file within a routes subfolder. A developer should be able to quickly read the file, identify any middleware, and all the sub-routes and HTTP methods for each.

For example:

/src

/routes

/loginRouter

loginRouter.js

loginRouterService.js

/registerRouter

registerRouter.js

registerRouterService.js

Each route is an [express router object](http://expressjs.com/en/api.html#express.router).

Each HTTP method (GET, POST, PUT, DELETE) for a given route will be implemented via a function call. This allows a developer to quickly navigate to the implementation of any given route. For clarity, the function name will have a prefix corresponding to the HTTP method, specifically:

- GET = get
- POST = create
- PATCH = update
- PUT = replace
- DELETE = delete

The function name will also be in camelCase and reference the specific resource. The function will also exist in a separate service file. This all helps increase readability.  

With that in mind, the file `routes/user/user.js` would resemble the following:

```jsx
var express = require('express');
var router = express.Router();

const { service } = require('./userService')

router.use(() => someMiddleware(req, res, next) {
  next();
});

router.route('/')                                // Supports GET, POST
  .get((req, res) => {
    service.getUsers(req, res);
  })
  .post((req, res) => {
    service.createUser(req, res);
  });

router.route('/:id')                             // Supports GET, PATCH, DELETE
  .get((req, res) => {
    service.getUser(req, res);
  })
  .patch((req, res) => {
    service.updateUser(req, res);
  })
  .delete((req, res) => {
    service.deleteUser(req, res);
  });

module.exports = router;
```

```jsx
// INSIDE SERVICE FILE

function getUsers(req, res) { }         // GET = retrieve
function createUser(req, res) { }           // POST = create

function getUser(req, res) { } // GET = retrieve
function updateUser(req, res) { }  // PATCH = update
function deleteUser(req, res) { }   // DELETE = delete

```

## Development Tools

We use a handful of development tools to ensure our code is consistent, tested, and documented, making everyone's life easier.

chai

mocha