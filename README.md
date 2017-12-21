# egg-rest

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-rest.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-rest
[travis-image]: https://img.shields.io/travis/eggjs/egg-rest.svg?style=flat-square
[travis-url]: https://travis-ci.org/eggjs/egg-rest
[codecov-image]: https://codecov.io/github/eggjs/egg-rest/coverage.svg?branch=master
[codecov-url]: https://codecov.io/github/eggjs/egg-rest?branch=master
[david-image]: https://img.shields.io/david/eggjs/egg-rest.svg?style=flat-square
[david-url]: https://david-dm.org/eggjs/egg-rest
[snyk-image]: https://snyk.io/test/npm/egg-rest/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-rest
[download-image]: https://img.shields.io/npm/dm/egg-rest.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-rest

RESTful API plugin for Egg.

Developing RESTful API with egg-rest is very simple. You may read [JSON API spec](http://jsonapi.org.cn/format/) first.

---

## Install

```bash
$ npm i egg-rest --save
```

## Usage

Enable the rest plugin in `plugin.js`:

```js
exports.rest = {
  enable: true,
  package: 'egg-rest',
};
```

## Configuration

- `urlprefix`: Prefix of rest api url. Default to `/api/`
- `authRequest`: a function for getting some value of authentication
- `authIgnores`: allow some request to ignore authentication
- `errorResponse`: Error handling function


Example: Configure the rest plugin in `config/config.default.js`:

```js
exports.rest = {
  urlprefix: '/doc/api/', // Prefix of rest api url. Default to /api/
  authRequest: null,
  // authRequest: async ctx => {
  //   // A truthy value must be returned when authentication succeeds.
  //   // Otherwise the client will be responded with `401 Unauthorized`
  //   return accessToken;
  // }

  // Specify the APIs for which authentication can be ignored.
  // If authRequest is configured, authentication for all APIs is required by default.
  authIgnores: null,
  // authIgnores: {
  //   users: {
  //     show: true, // allow GET /api/users/:id to ignore authentication
  //     index: true,
  //   }
  // }
};
```


Controllers in files matching `${baseDir}/app/apis/**.js` will be loaded automatically according to routing rules.

__Caution__

If your RESTful API is open to public systems or websites,
you should disable [ctoken] security validation, which is
provided by security plugin, for your RESTful url prefix:

```js
exports.security = {
  ignore: '/doc/api/'
};
```

## URL Routing

Follow the naming conventions of rails:

method     | url                                                    | file path               | controller name
---        | ---                                                    | ---                     | ---
**GET**    | `/doc/api/{objects}[?per_page={per_page}&page={page}]` | `app/apis/{objects}.js` | **index()**
**GET**    | `/doc/api/{objects}/:id`                               | `app/apis/{objects}.js` | **show()**
**POST**   | `/doc/api/{objects}`                                   | `app/apis/{objects}.js` | **create()**
**PUT**    | `/doc/api/{objects}/:id`                               | `app/apis/{objects}.js` | **update()**
**DELETE** | `/doc/api/{objects}/:id[s]`                            | `app/apis/{objects}.js` | **destroy()**

### Nested Resources

Nesting of two layer at most is supported.

method     | url                                                                       | file path                         | controller name
---        | ---                                                                       | ---                               | ---
**GET**    | `/doc/api/{parents}/:parent_id/{children}/:child_id/{objects}?per_page={per_page}&page={page}` | `app/apis/{parents}/{objects}.js` | **index()**
**GET**    | `/doc/api/{parents}/:parent_id/{children}/:child_id/{objects}/:id`                             | `app/apis/{parents}/{objects}.js` | **show()**
**POST**   | `/doc/api/{parents}/:parent_id/{children}/:child_id/{objects}`                                 | `app/apis/{parents}/{objects}.js` | **create()**
**PUT**    | `/doc/api/{parents}/:parent_id/{children}/:child_id/{objects}/:id`                             | `app/apis/{parents}/{objects}.js` | **update()**
**DELETE** | `/doc/api/{parents}/:parent_id/{children}/:child_id/{objects}/:id[s]`                          | `app/apis/{parents}/{objects}.js` | **destroy()**

Example: `/api/users/3/posts/1/replies/2` => params: `{ parent_id: 3, child_id: 2, id: 1 }`. The idea is that you can can retrieve the ids from `this.params`,
which you get values of `{ users: '3', posts: '1', replies: '2' }`. It matches the file path `/api/users/3/posts/1/replies/2`.

**Note:** It does not support more than three level deep nesting. Example: `/api/users/3/posts/1/replies/2/answer` won't match file path
`apis/users/posts/replies/answer.js`. Currently, it can only retrieve maximum three query parameters.

Controllers can be loaded from `index.js` in parent directory.

Example: `/doc/api/{parents}` => `app/apis/{parents}/index.js`

---

## Resource Conventions

All RESTful API __must and will__ respond data with JSON format, following the JSON API spec.

A JSON object MUST be at the root of every JSON API request and response containing data. This object defines a document’s “top level”.


A document MUST contain at least one of the following top-level members:

- meta: a meta object that contains non-standard meta-information, eg. paging info
- links: a links object related to the primary data.
- linked: resource objects linked in a relationship. When fetched, the related resource object(s) are returned as the response’s primary data.
- data: the document’s “primary data”

Primary data MUST be either:

- a single resource object, a single resource identifier object, or null, for requests that target single resources
- an array of resource objects, an array of resource identifier objects, or an empty array ([]), for requests that target resource collections

Why should we use the 'data' field as the entry of accessing primary data, instead of respond with it directly?
In same cases, such as searching API, paging meta info is required other than primary data.

### Single Resource Object

Here’s how an post (i.e. a resource of type “post”) might appear in a document:

```js
{
  "data": {
    "id": "1",
    // ... attributes of this post
  }
}
```

Represent the post with just an id:

```js
{
  "data": "1"
}
```

### Resource Collection

```js
{
  "data": [{
    "id": "1"
    // ... attributes of this post
  }, {
    "id": "2"
    // ... attributes of this post
  }],
  "meta": {
    "count": 100 // totol number of posts
  }
}
```

Represent posts with an array of post Ids:

```js
{
  "data": ["1", "2"]
}
```

### Resource Fields

Four reserved fields:

- "id"
- "type"
- "href"
- "links"

---

## Resource Searching `GET /doc/api/{objects}[?page={page}&per_page={per_page}]`

### Request

```js
GET /doc/api/users?per_page=2
Accept: application/json
```

### Controller

Controller `exports.index` will be loaded automatically.

Paging params must be accessed by `this.params.page` and `this.params.per_page`.
And both of them must be numbers.

```js
// app/apis/user.js
// routing: GET /doc/api/users
exports.index = function* (next) {
  // coding as a common controller
  var users = yield uic.listUser({limit: this.params.per_page});
  // totol number of users
  var total = yield uic.total();

  // set meta info
  this.meta = {
    total: total
  };
  this.data = users;
};
```

### Response

- `200 OK`: the resource exists, accessing it successfully

```bash
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": [{
    "id": 1024,
    "name": "shaoshuai0102",
    "mobile": '186xxxxxxxx'
  }, {
    "id": 1025,
    "name": "fengmk2",
    "mobile": '186xxxxxxxx'
  }],
  "meta": {
    "total": 100000
  }
}
```

---

## Fetching One Single Resource Document `GET /doc/api/{objects}/:id`

### Request

```bash
GET /doc/api/users/1024
Accept: application/json
```

### Controller

Controller `exports.show` will be loaded automatically.

```js
// app/apis/user.js
// routing: GET /doc/api/users/:id
exports.show = function* (next) {
  // coding as a common controller
  var user = yield uic.getUser(this.params.id);
  if (!user) {
    return yield* next;
  }
  this.data = user;
};
```

### Response

- `200 OK`: the resource exists, accessing it successfully

```bash
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": {
    "id": 1024,
    "name": "苏千",
    "mobile": '186xxxxxxxx'
  }
}
```

---

## Fetching A Resource Collection `GET /doc/api/{objects}/:ids`

### Request

`GET /doc/api/users/:ids`, multiple ids are seperated with comma.

```bash
GET /doc/api/users/1024,10,111
Accept: application/json
```

### Controller

Controller `exports.show` will be loaded automatically.

Multiple id can be accessed with `this.params.ids` as an array, if you want to support multiple id.

```js
// app/apis/user.js
// routing: GET /doc/api/users/:ids
exports.show = function* (next) {
  // coding as a common controller
  const users = yield userService.listUsers(this.params.ids);
  this.data = users;
};
```

### Response

- `200 OK`: the resource exists, accessing it successfully

```bash
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": [{
    "id": 1024,
    "name": "fengmk2",
    "mobile": '186xxxxxxxx'
  }, {
    "id": 10,
    "name": "shaoshuai0102",
    "mobile": '186xxxxxxxx'
  }]
}
```

---

## Creating Resources `POST /doc/api/{objects}`

### Request

Must be a `POST` request:

```bash
POST /doc/api/users
Content-Type: application/json
Accept: application/json

{
  "name": "fengmk2",
  "mobile": '186xxxxxxxx'
}
```

### Controller

Controller `exports.create` will be loaded automatically.

```js
// app/apis/user.js
// Routing: POST /doc/api/users
exports.create = function* (next) {
  var newUser = this.params.data;
  var user = yield userService.create(newUser);
  this.data = user;
};
```

### Response

When resource document is created successfully, `201 Created` is returned, with the created document as the body.

```bash
HTTP/1.1 201 Created
Content-Type: application/json

{
  "data": {
    "id": 1024,
    "name": "fengmk2",
    "mobile": '186xxxxxxxx'
  }
}
```

---

## Updating Resources `PUT /doc/api/{objects}/:id`

### Request

Must be a `PUT` request.

In the example below, only `mobile` field is updated:

```bash
PUT /doc/api/users/1024
Content-Type: application/json
Accept: application/json

{
  "mobile": '186xxxxxxxx'
}
```

### Controller

Controller `exports.update` is loaded automatically.

```js
// app/apis/user.js
// Routing: PUT /doc/api/users/:id
exports.update = function* (next) {
  var user = this.params.data;
  yield userService.update(user);
};
```

### Response

- `204 No Content`: when an update is successful and the server
doesn’t update any attributes besides those provided,
the server MUST return `204 No Content` without the document.

```bash
HTTP/1.1 204 No Content
```

- `200 OK`: If a server accepts an update but also changes the
resource(s) in ways other than those specified by the request
(for example, updating the updated-at attribute or a computed sha),
it MUST return a 200 OK response.
The response document MUST include a representation of the updated
resource(s) as if a GET request was made to the request URL.

```bash
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": {
    "id": 1024,
    "name": "fengmk2",
    "mobile": '186xxxxxxxx'
  }
}
```

---

## Deleting Resources `DELETE /doc/api/{objects}/:id[s]`

### Request

- Deleting one single resource document

```bash
DELETE /doc/api/users/1024
```

- Deleting multiple resource documents

```bash
DELETE /doc/api/users/1024,100,100023
```

### Controller

Controller `exports.destroy` will be loaded automatically.

Multiple id can be accessed with `this.params.ids` as an array, if you want to support multiple id.

```js
// app/apis/user.js
// Routing: DELETE /doc/api/users/:id
exports.destroy = function* (next) {
  yield userService.update(this.params.id);
  // or `this.params.ids` for multiple id
};
```

### Response

- `204 No Content`: If a server deletes the document(s) successfully, it MUST return `204 No Content`.

```bash
HTTP/1.1 204 No Content
```

---

## Errors

An error object is a special resource, with additional information about problems encountered while performing an operation.

## Semantic Status Code

### Success codes

- `201 Created` should be used when creating content (INSERT),
- `202 Accepted` should be used when a request is queued for background processing (async tasks),
- `204 No Content` should be used when the request was properly executed but no content was returned (a good example would be when you delete something).

### Client error codes

- `400 Bad Request` should be used when there was an error while processing the request payload (malformed JSON, for instance).
- `401 Unauthorized` should be used when a request is not authenticiated (wrong access token, or username or password).
- `403 Forbidden` should be used when the request is successfully authenticiated (see 401), but the action was forbidden.
- `406 Not Acceptable` should be used when the requested format is not available (for instance, when requesting an XML resource from a JSON only server).
- `410 Gone` Should be returned when the requested resource is permenantely deleted and will never be available again.
- `422 Unprocesable entity` Could be used when there was a validation error while creating an object.

### Server error codes

- `500 Internal Server Error` should be used when server unexpected error happend.

A more complete list of status codes can be found in [RFC2616](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html).

## Server Error(5xx) Example

Usually detailed error information will be hidden in production to prevent security issues for code leaking
Detailed error information can be found in `$HOME/logs/$APPNAME/common-error.log`.

```bash
HTTP/1.1 500 Server Error

{
  "message": "Internal Server Error"
}
```

Detailed infomation will be returned in development. It's helpful when developing and debuging.

```json
{
  "message": "TypeError: foo.bar is undefined",
  "stack": "TypeError: foo.bar is undefined\n    at Object.checkAuth (/Users/..."
}
```

## Client Error(4xx) Example

Ref: https://developer.github.com/v3/#client-errors

### 404

https://api.github.com/gists/df2d46e24563df97cd9b

```bash
HTTP/1.1 404 Not Found

{
  "message": "Not Found",
  "documentation_url": "https://developer.github.com/v3"
}
```

### 400

There's a problem when parsing the recieved data as JSON.

```bash
HTTP/1.1 400 Bad Request

{
  "message": "Problems parsing JSON"
}
```

The recieved data is not a JSON object.

```bash
HTTP/1.1 400 Bad Request

{
  "message": "Body should be a JSON object"
}
```

### 422 Unprocessable Entity

Param validation failed.

```bash
HTTP/1.1 422 Unprocessable Entity

{
  "message": "Validation Failed",
  "errors": [
    {
      "field": "username",
      "code": "missing_field",
      "message": "username required"
    }
  ]
}
```

### 401 Unauthorized

Authorization failed

```bash
$ curl -i localhost/doc/api/users/1 -u foo:bar

HTTP/1.1 401 Unauthorized

{
  "message": "Bad credentials"
}
```

## User-Agent is Required

https://developer.github.com/v3/#user-agent-required

```bash
$ curl -iH 'User-Agent: ' https://api.github.com/meta
HTTP/1.0 403 Forbidden

{
  "message": "Please make sure your request has a User-Agent header"
}
```

## Parameter Validation

Rest plugin provides a way of validating request params.

For more details of validating rules, see [parameter](https://github.com/node-modules/parameter).

### `createRule` 和 `updateRule`

```js
// Specify validation rules of create request
// If failed, '422' will be returned automatically
exports.createRule = {
  username: 'email',
  password: {
    type: 'password',
    compare: 're-password'
  },
  age: {
    type: 'int',
    required: false
  }
};

exports.create = function* () {
  var user = this.params.data;
  // handle user
};

// Specify validation rules of create request
exports.updateRule = {
  age: {
    type: 'int',
    required: false
  }
};

exports.update = function* () {

};
```

Validation failure example:

```bash
HTTP/1.1 422 Unprocessable Entity

{
  "message": "Validation Failed",
  "errors": [
    {
      "field": "username",
      "code": "invalid",
      "message": "username should be an email"
    },
    {
      "field": "password",
      "code": "missing_field",
      "message": "password required"
    },
    {
      "field": "age",
      "code": "invalid",
      "message": "age should be an integer"
    }
  ]
}
```

### Execute Validation Manually

In most cases, the automatic way above is just fine.
But sometimes we need do the validation manualy.
So we can use `this.validate(rules[, data])`

```js
var createRule = {...};

exports.create = function* () {
  var user = this.params.data;

  // If validation failed, status 422 will be returned
  this.validate(createRule, user);

  // handle user
};
```

## Custom Authentication

If you want to add request authentication, configure it with `rest.authRequest` in `config/config.default.js`:

```js
exports.rest = {
  enable: true,
  authIgnores: {
    // allow users.show() and users.index() to ignore authentication
    users: {
      show: true,
      index: true
    }
  },
  authRequest: function* (ctx) {
    if (ctx.query.private_token === 'admintoken-123') {
      // If authentication succeeds, the info returned below can be accessed with `this.accessToken` in controller.
      return {
        name: 'admin'
      };
    }

    // authentication failure
    return null;
  }
};
```

For `user.create()`, `user.update()` and `user.destroy()`, they will be invoked only after passing authentication.

Authentication failure response:

```bash
HTTP/1.1 401 Unauthorized

{
  "message": "Bad credentials"
}
```

## Ref

- [JSON API Spec](http://jsonapi.org.cn/format/)
- [REST: Representational State Transfer](http://zh.wikipedia.org/zh/REST)
- [ome REST best practices](https://bourgeois.me/rest/)
- [Restful routing using resourceful and director](https://npm.taobao.org/package/restful)
- [Rails Routing from the Outside In](http://guides.rubyonrails.org/routing.html)
- [HTTP API design guide extracted from work on the Heroku Platform API](https://github.com/interagent/http-api-design)
- [ctoken](https://github.com/eggjs/egg-security#ctoken)


## License

[MIT](LICENSE)
