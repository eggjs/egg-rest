'use strict';

const pedding = require('pedding');
const should = require('should');
const request = require('supertest');
const mock = require('egg-mock');

describe('test/rest.test.js', function() {
  let app;
  before(done => {
    app = mock.app({
      baseDir: 'rest',
    });
    app.ready(done);
  });

  afterEach(mock.restore);

  describe('auto url routing', function() {

    it('should GET /api/{objects} => app/apis/{objects}.js:index()', function(done) {
      request(app.callback())
      .get('/api/users')
      .expect({
        data: [
          {
            id: 1,
            name: 'shaoshuai0102',
            age: 18,
          },
          {
            id: 2,
            name: 'name2',
            age: 30,
          },
        ],
      })
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(200, done);
    });

    it('should GET /api/categories', function(done) {
      request(app.callback())
      .get('/api/categories')
      .expect({
        data: [
          { name: 'c1' },
          { name: 'c2' },
        ],
      }, done);
    });

    it('should always has this.params.ids', function(done) {
      done = pedding(2, done);
      request(app.callback())
      .get('/api/categories/1')
      .expect({
        data: {
          id: '1',
          ids: [ '1' ],
        },
      }, done);

      request(app.callback())
      .get('/api/categories/1,2,3')
      .expect({
        data: {
          id: '1,2,3',
          ids: [ '1', '2', '3' ],
        },
      }, done);
    });

    it('should GET /api/{objects}?fields=name', function(done) {
      request(app.callback())
      .get('/api/users?fields=name')
      .expect({
        data: [
          {
            id: 1,
            name: 'shaoshuai0102',
          },
          {
            id: 2,
            name: 'name2',
          },
        ],
      })
      .expect(200, done);
    });

    it('should GET /api/{objects}?fields=name&page=1&per_page=20', function(done) {
      request(app.callback())
      .get('/api/users?fields=name&page=1&per_page=20')
      .expect({
        data: [
          {
            id: 1,
            name: 'shaoshuai0102',
          },
          {
            id: 2,
            name: 'name2',
          },
        ],
      })
      .expect(200, done);
    });

    it('should GET /api/{objects} return empty array', function(done) {
      request(app.callback())
      .get('/api/users?empty=1')
      .expect({
        data: [],
      })
      .expect(200, done);
    });

    it('should GET /api/{objects}/:id => app/apis/{objects}.js:show()', function(done) {
      request(app.callback())
      .get('/api/users/101')
      .expect({
        data: {
          id: 101,
          name: 'shaoshuai0102',
          age: 18,
        },
      })
      .expect(200, done);
    });

    it('should return with ctx.body', function(done) {
      request(app.callback())
      .get('/api/users/101?body_only=true')
      .expect({
        id: 101,
        name: 'shaoshuai0102',
        age: 18,
      })
      .expect(200, done);
    });

    it('should GET /api/{objects}/:id return null', function(done) {
      request(app.callback())
      .get('/api/users/404')
      .expect({
        message: 'Not Found',
      })
      .expect(404, done);
    });

    it('should GET /api/{objects}/id1,id2,id3 return multi users', function(done) {
      request(app.callback())
      .get('/api/users/1,2')
      .expect({
        data: [
          {
            id: 1,
            name: 'user_1',
          },
          {
            id: 2,
            name: 'user_2',
          },
        ],
        meta: {
          count: 100,
        },
      })
      .expect(200, done);
    });

    it('should GET multi users', function(done) {
      request(app.callback())
      .get('/api/users/1,2?fields=age&id_only=true')
      .expect({
        data: [ '1', '2' ],
      })
      .expect(200, done);
    });

    it('should GET /api/{objects}/:id?fields=age', function(done) {
      request(app.callback())
      .get('/api/users/101?fields=age')
      .expect({
        data: {
          id: 101,
          age: 18,
        },
      })
      .expect(200, done);
    });

    it('should GET /api/{objects}/:id?fields=id,name,age,notexists', function(done) {
      request(app.callback())
      .get('/api/users/101?fields=id,name,age,notexists')
      .expect({
        data: {
          id: 101,
          name: 'shaoshuai0102',
          age: 18,
        },
      })
      .expect(200, done);
    });

    it('should GET /api/{objects}/:id?fields=,', function(done) {
      request(app.callback())
      .get('/api/users/101?fields=,')
      .expect({
        data: {
          id: 101,
          name: 'shaoshuai0102',
          age: 18,
        },
      })
      .expect(200, done);
    });

    it('should POST /api/{objects} => app/apis/{objects}.js:create()', function(done) {
      request(app.callback())
      .post('/api/users')
      .send({
        name: 'newuser@gmail.com',
        age: 1,
      })
      .expect({
        data: {
          id: 3,
          name: 'newuser@gmail.com',
          age: 1,
        },
      })
      .expect(201, done);
    });

    it('should POST with meta and return id only', function(done) {
      request(app.callback())
      .post('/api/users?id_only=true')
      .send({
        name: 'newuser@gmail.com',
        age: 1,
      })
      .expect({
        data: 3,
      })
      .expect(201, done);
    });

    it('should POST 422 when name is not email and age missing', function(done) {
      request(app.callback())
      .post('/api/users')
      .send({
        name: 'newuser@gmail',
      })
      .expect({
        code: 'invalid_param',
        message: 'Validation Failed',
        errors: [
          { field: 'name', code: 'invalid', message: 'should be an email' },
          { field: 'age', code: 'missing_field', message: 'required' },
        ],
      })
      .expect(422, done);
    });

    it('should POST /api/{objects} return null', function(done) {
      request(app.callback())
      .post('/api/users')
      .send({
        name: 'empty@gmail.com',
        age: 1,
      })
      .expect({})
      .expect(201, done);
    });

    it('should POST with string body return 400', function(done) {
      request(app.callback())
      .post('/api/users')
      .set('content-type', 'application/json')
      .send('"string"')
      .expect({
        message: 'Body should be a JSON object',
      })
      .expect(400, done);
    });

    it('should PUT /api/{objects}/3 => app/apis/{objects}.js:update() 200 server update',
    function(done) {
      request(app.callback())
      .put('/api/users/3')
      .send({
        age: 3,
      })
      .expect({
        data: {
          id: 3,
          name: 'newuser1',
          age: 3,
        },
      })
      .expect(200, done);
    });

    it('should PUT /api/{objects}/3 => app/apis/{objects}.js:update() 204 server not update',
    function(done) {
      request(app.callback())
      .put('/api/users/4')
      .send({
        age: 4,
      })
      .expect(204, done);
    });

    it('should DELETE /api/{objects}/3 => app/apis/{objects}.js:delete()', function(done) {
      request(app.callback())
      .delete('/api/users/3')
      .expect(204, done);
    });

    it('should DELETE /api/{objects}/1,2,3 support this.params.ids', function(done) {
      request(app.callback())
      .delete('/api/users/1,2,3')
      .expect('ids', '1&2&3')
      .expect(204, done);
    });

    it('should support `module.exports = function (app) {}` format handler', function(done) {
      request(app.callback())
      .get('/api/posts')
      .expect({
        data: [],
      })
      .expect(200, done);
    });

    it('should support nest resources', function(done) {
      request(app.callback())
      .get('/api/posts/1/replies/2')
      .expect({
        data: {
          pid: '1',
          id: '2',
          text: 'foo text',
        },
      })
      .expect(200, done);
    });

    describe('sites/index.js => GET /sites', function() {
      it('should auto add routing for sites/index.js', function(done) {
        request(app.callback())
        .get('/api/sites')
        .expect(200, done);
      });

      it('should auto add routing for sites/channels.js', function(done) {
        request(app.callback())
        .get('/api/sites/1/channels')
        .expect(200, done);
      });
    });
  });

  describe('mock error', function() {
    it('should catch error and return 500 status', function(done) {
      request(app.callback())
      .get('/api/posts/1/replies')
      .expect(500, function(err, res) {
        should.not.exist(err);
        res.body.should.have.keys('message', 'stack');
        res.body.message.should.equal('ReferenceError: aaa is not defined');
        done();
      });
    });

    it('should 404 when dir level beyond 2', function(done) {
      request(app.callback())
      .get('/api/users/3/posts/1/replies')
      .expect({
        message: 'Not Found',
      })
      .expect(404, done);
    });

    it('should response 400 id missing', function(done) {
      request(app.callback())
      .get('/api/users/,,,,,,')
      .expect({
        message: 'ids format error',
      })
      .expect(400, done);
    });

    it('should response 400 json parse error', function(done) {
      request(app.callback())
      .post('/api/users')
      .set('content-type', 'application/vnd.api+json')
      .send('{error')
      .expect({
        message: 'Problems parsing JSON',
      })
      .expect(400, done);
    });

    it('should response 400 json data type error', function(done) {
      request(app.callback())
      .post('/api/users')
      .set('content-type', 'application/vnd.api+json')
      .send('123')
      .expect({
        message: 'Body should be a JSON object',
      })
      .expect(400, done);
    });

    it('should response 403 user agent missing', function(done) {
      request(app.callback())
      .post('/api/users')
      .set('content-type', 'application/vnd.api+json')
      .set('user-agent', '')
      .send('123')
      .expect({
        message: 'Please make sure your request has a User-Agent header',
      })
      .expect(403, done);
    });

    it('should 404 when request invaild resource', function(done) {
      request(app.callback())
      .get('/api/users-not-exists')
      .expect({
        message: 'Not Found',
      })
      .expect(404, done);
    });
  });

  describe('options.authRequest', function() {
    let app;
    before(done => {
      app = mock.app({
        baseDir: 'rest-with-auth',
      });
      app.ready(done);
    });

    it('should 401 when name missing', function(done) {
      request(app.callback())
      .get('/v2/users/1')
      .expect({
        message: 'Bad credentials',
      })
      .expect(401, done);
    });

    it('should 401 when name wrong', function(done) {
      request(app.callback())
      .get('/v2/users/1?name=suqian')
      .expect({
        message: 'username must be shaoshuai0102',
      })
      .expect(401, done);
    });

    it('should 403 custom error message and status', function(done) {
      request(app.callback())
      .get('/v2/users/1?name=status304')
      .expect({
        message: 'test status',
        code: 'foo',
      })
      .expect(403, done);
    });

    it('should 200 when auth pass', function(done) {
      request(app.callback())
      .get('/v2/users/1?name=shaoshuai0102')
      .expect({
        data: {
          name: 'shaoshuai0102',
        },
      })
      .expect(200, done);
    });

    it('should 200 when access ignore auth resource', function(done) {
      request(app.callback())
      .get('/v2/users')
      .expect({
        data: [],
      })
      .expect(200, done);
    });

    it('should 500 when authRequest throw error on dev env', function(done) {
      request(app.callback())
      .get('/v2/users/1?name=serverError')
      .expect(500, function(err, res) {
        (err === null).should.equal(true);
        res.body.should.have.keys('message', 'stack');
        res.body.message.should.equal('ReferenceError: dd is not defined');
        res.body.stack.should.containEql('ReferenceError: dd is not defined\n');
        res.body.stack.should.containEql('at authRequest (');
        done();
      });
    });

    it('should 500 when authRequest throw error on online env', function(done) {
      mock(app.config.rest, 'production', true);
      request(app.callback())
      .get('/v2/users/1?name=serverError&env=production')
      .expect({
        message: 'Internal Server Error',
      })
      .expect(500, done);
    });

    it('should 401 when authRequest return error', function(done) {
      request(app.callback())
      .get('/v2/users/1?name=returnError')
      .expect({
        message: 'mock error',
      })
      .expect(401, done);
    });
  });

  describe('mock error', function() {
    let app;

    after(() => app.close());

    it('should throw error if customized app middleware have the same name "rest"', function(done) {
      app = mock.cluster({
        baseDir: 'rest-typeerror',
      })
      .expect('stderr', /AssertionError: Duplication of middleware name found: rest. Rename your middleware other than "rest" please/)
      .end(done);
    });

  });

  describe('errorResponse', function() {
    let app;
    before(function(done) {
      app = mock.app({
        baseDir: 'rest-error',
      });
      app.ready(done);
    });
    after(() => app.close());

    it('可自定义', function(done) {
      request(app.callback())
      .get('/api/users')
      .expect({
        message: 'param not valid',
        code: 'NOT_VALID',
        status: 400,
      })
      .expect(400, done);
    });
  });

  describe('test async function from ts', function() {
    it('should response when named function', function(done) {
      request(app.callback())
      .get('/api/typescripts/1')
      .expect({
        success: true,
      })
      .expect(200, done);
    });

    it('should response when anonymous function', function(done) {
      request(app.callback())
      .get('/api/typescripts')
      .expect({
        success: true,
      })
      .expect(200, done);
    });
  });
});
