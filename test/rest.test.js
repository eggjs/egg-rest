'use strict';

const assert = require('power-assert');
const request = require('supertest');
const mm = require('egg-mock');

describe('test/rest.test.js', () => {
  let app;
  before(() => {
    app = mm.app({
      baseDir: 'rest',
    });
    return app.ready();
  });
  after(() => app.close());
  afterEach(mm.restore);

  describe('auto url routing', () => {
    it('should GET /api/{objects} => app/apis/{objects}.js:index()', () => {
      return request(app.callback())
        .get('/api/users')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, {
          data: [
            { id: 1, name: 'shaoshuai0102', age: 18 },
            { id: 2, name: 'name2', age: 30 },
          ],
        });
    });

    it('should GET /api/categories', () => {
      return request(app.callback())
        .get('/api/categories')
        .expect({
          data: [
            { name: 'c1' },
            { name: 'c2' },
          ],
        });
    });

    it('should always has this.params.ids', function* () {
      yield request(app.callback())
        .get('/api/categories/1')
        .expect({
          data: {
            id: '1',
            ids: [ '1' ],
          },
        });

      yield request(app.callback())
        .get('/api/categories/1,2,3')
        .expect({
          data: {
            id: '1,2,3',
            ids: [ '1', '2', '3' ],
          },
        });
    });

    it('should GET /api/{objects}?fields=name', () => {
      return request(app.callback())
        .get('/api/users?fields=name')
        .expect(200, {
          data: [
            { id: 1, name: 'shaoshuai0102' },
            { id: 2, name: 'name2' },
          ],
        });
    });

    it('should GET /api/{objects}?fields=name&page=1&per_page=20', () => {
      return request(app.callback())
        .get('/api/users?fields=name&page=1&per_page=20')
        .expect(200, {
          data: [
            { id: 1, name: 'shaoshuai0102' },
            { id: 2, name: 'name2' },
          ],
        });
    });

    it('should GET /api/{objects} return empty array', () => {
      return request(app.callback())
        .get('/api/users?empty=1')
        .expect(200, { data: [] });
    });

    it('should GET /api/{objects}/:id => app/apis/{objects}.js:show()', () => {
      return request(app.callback())
        .get('/api/users/101')
        .expect(200, {
          data: {
            id: 101,
            name: 'shaoshuai0102',
            age: 18,
          },
        });
    });

    it('should return with ctx.body', () => {
      return request(app.callback())
        .get('/api/users/101?body_only=true')
        .expect(200, {
          id: 101,
          name: 'shaoshuai0102',
          age: 18,
        });
    });

    it('should GET /api/{objects}/:id return null', () => {
      return request(app.callback())
        .get('/api/users/404')
        .expect(404, {
          message: 'Not Found',
        });
    });

    it('should GET /api/{objects}/id1,id2,id3 return multi users', () => {
      return request(app.callback())
        .get('/api/users/1,2')
        .expect(200, {
          data: [
            { id: 1, name: 'user_1' },
            { id: 2, name: 'user_2' },
          ],
          meta: {
            count: 100,
          },
        });
    });

    it('should GET multi users', () => {
      return request(app.callback())
        .get('/api/users/1,2?fields=age&id_only=true')
        .expect(200, { data: [ '1', '2' ] });
    });

    it('should GET /api/{objects}/:id?fields=age', () => {
      return request(app.callback())
        .get('/api/users/101?fields=age')
        .expect(200, {
          data: {
            id: 101,
            age: 18,
          },
        });
    });

    it('should GET /api/{objects}/:id?fields=id,name,age,notexists', () => {
      return request(app.callback())
        .get('/api/users/101?fields=id,name,age,notexists')
        .expect(200, {
          data: {
            id: 101,
            name: 'shaoshuai0102',
            age: 18,
          },
        });
    });

    it('should GET /api/{objects}/:id?fields=,', () => {
      return request(app.callback())
        .get('/api/users/101?fields=,')
        .expect(200, {
          data: {
            id: 101,
            name: 'shaoshuai0102',
            age: 18,
          },
        });
    });

    it('should POST /api/{objects} => app/apis/{objects}.js:create()', () => {
      return request(app.callback())
        .post('/api/users')
        .send({
          name: 'newuser@gmail.com',
          age: 1,
        })
        .expect(201, {
          data: {
            id: 3,
            name: 'newuser@gmail.com',
            age: 1,
          },
        });
    });

    it('should POST with meta and return id only', () => {
      return request(app.callback())
        .post('/api/users?id_only=true')
        .send({
          name: 'newuser@gmail.com',
          age: 1,
        })
        .expect(201, { data: 3 });
    });

    it('should POST 422 when name is not email and age missing', () => {
      return request(app.callback())
        .post('/api/users')
        .send({
          name: 'newuser@gmail',
        })
        .expect(422, {
          code: 'invalid_param',
          message: 'Validation Failed',
          errors: [
            { field: 'name', code: 'invalid', message: 'should be an email' },
            { field: 'age', code: 'missing_field', message: 'required' },
          ],
        });
    });

    it('should POST /api/{objects} return null', () => {
      return request(app.callback())
        .post('/api/users')
        .send({
          name: 'empty@gmail.com',
          age: 1,
        })
        .expect(201, {});
    });

    it('should POST with string body return 400', () => {
      return request(app.callback())
        .post('/api/users')
        .set('content-type', 'application/json')
        .send('"string"')
        .expect(400, {
          message: 'Body should be a JSON object',
        });
    });

    it('should PUT /api/{objects}/3 => app/apis/{objects}.js:update() 200 server update', () => {
      return request(app.callback())
        .put('/api/users/3')
        .send({
          age: 3,
        })
        .expect(200, {
          data: {
            id: 3,
            name: 'newuser1',
            age: 3,
          },
        });
    });

    it('should PUT /api/{objects}/3 => app/apis/{objects}.js:update() 204 server not update', () => {
      return request(app.callback())
        .put('/api/users/4')
        .send({
          age: 4,
        })
        .expect(204);
    });

    it('should DELETE /api/{objects}/3 => app/apis/{objects}.js:delete()', () => {
      return request(app.callback())
        .delete('/api/users/3')
        .expect(204);
    });

    it('should DELETE /api/{objects}/1,2,3 support this.params.ids', () => {
      return request(app.callback())
        .delete('/api/users/1,2,3')
        .expect('ids', '1&2&3')
        .expect(204);
    });

    it('should support `module.exports = function (app) {}` format handler', () => {
      return request(app.callback())
        .get('/api/posts')
        .expect(200, { data: [] });
    });

    it('should support nest resources', () => {
      return request(app.callback())
        .get('/api/posts/1/replies/2')
        .expect(200, {
          data: {
            pid: '1',
            id: '2',
            text: 'foo text',
          },
        });
    });

    it('should support two level deep nested resources', () => {
      return request(app.callback())
        .get('/api/users/1/posts/2/replies/3')
        .expect(200, {
          data: {
            pid: '1',
            id: '3',
            cid: '2',
            text: 'foo text',
          },
        });
    });

    describe('sites/index.js => GET /sites', () => {
      it('should auto add routing for sites/index.js', () => {
        return request(app.callback())
          .get('/api/sites')
          .expect(200);
      });

      it('should auto add routing for sites/channels.js', () => {
        return request(app.callback())
          .get('/api/sites/1/channels')
          .expect(200);
      });
    });
  });

  describe('mock error', function() {
    it('should catch error and return 500 status', () => {
      return request(app.callback())
        .get('/api/posts/1/replies')
        .expect(500)
        .expect(function(res) {
          assert(res.body.stack);
          assert(res.body.message === 'ReferenceError: aaa is not defined');
        });
    });

    it('should 404 when dir level beyond 3', () => {
      return request(app.callback())
        .get('/api/users/3/posts/1/replies/2/answer')
        .expect(404, { message: 'Not Found' });
    });

    it('should response 400 id missing', () => {
      return request(app.callback())
        .get('/api/users/,,,,,,')
        .expect(400, { message: 'ids format error' });
    });

    it('should response 400 json parse error', () => {
      return request(app.callback())
        .post('/api/users')
        .set('content-type', 'application/vnd.api+json')
        .send('{error')
        .expect(400)
        .expect(res => {
          assert(res.body.message === 'Problems parsing JSON');
        });
    });

    it('should response 400 json data type error', () => {
      return request(app.callback())
        .post('/api/users')
        .set('content-type', 'application/vnd.api+json')
        .send('123')
        .expect(400, { message: 'Body should be a JSON object' });
    });

    it('should response 403 user agent missing', () => {
      return request(app.callback())
        .post('/api/users')
        .set('content-type', 'application/vnd.api+json')
        .set('user-agent', '')
        .send('123')
        .expect(403, { message: 'Please make sure your request has a User-Agent header' });
    });

    it('should 404 when request invaild resource', () => {
      return request(app.callback())
        .get('/api/users-not-exists')
        .expect(404, { message: 'Not Found' });
    });
  });

  describe('options.authRequest', () => {
    let app;
    before(() => {
      app = mm.app({
        baseDir: 'rest-with-auth',
      });
      return app.ready();
    });

    after(() => app.close());

    it('should 401 when name missing', () => {
      return request(app.callback())
        .get('/v2/users/1')
        .expect(401, { message: 'Bad credentials' });
    });

    it('should 401 when name wrong', () => {
      return request(app.callback())
        .get('/v2/users/1?name=suqian')
        .expect(401, { message: 'username must be shaoshuai0102' });
    });

    it('should 403 custom error message and status', () => {
      return request(app.callback())
        .get('/v2/users/1?name=status304')
        .expect(403, {
          message: 'test status',
          code: 'foo',
        });
    });

    it('should 200 when auth pass', () => {
      return request(app.callback())
        .get('/v2/users/1?name=shaoshuai0102')
        .expect(200, {
          data: {
            name: 'shaoshuai0102',
          },
        });
    });

    it('should 200 when access ignore auth resource', () => {
      return request(app.callback())
        .get('/v2/users')
        .expect(200, { data: [] });
    });

    it('should 500 when authRequest throw error on dev env', () => {
      return request(app.callback())
        .get('/v2/users/1?name=serverError')
        .expect(500)
        .expect(function(res) {
          assert(res.body.message === 'ReferenceError: dd is not defined');
          assert(res.body.stack.indexOf('ReferenceError: dd is not defined') !== -1);
          assert(res.body.stack.indexOf('at authRequest (') !== -1);
        });
    });

    it('should 500 when authRequest throw error on online env', () => {
      mm(app.config.rest, 'production', true);
      return request(app.callback())
        .get('/v2/users/1?name=serverError&env=production')
        .expect(500, { message: 'Internal Server Error' });
    });

    it('should 401 when authRequest return error', () => {
      return request(app.callback())
        .get('/v2/users/1?name=returnError')
        .expect(401, { message: 'mock error' });
    });
  });

  describe('mock error', () => {
    let app;

    after(() => app.close());

    it('should throw error if customized app middleware have the same name "rest"', () => {
      app = mm.cluster({
        baseDir: 'rest-typeerror',
      });
      app.expect('stderr', /AssertionError: Duplication of middleware name found: rest. Rename your middleware other than "rest" please/);
    });

  });

  describe('errorResponse', () => {
    let app;
    before(() => {
      app = mm.app({
        baseDir: 'rest-error',
      });
      return app.ready();
    });
    after(() => app.close());

    it('can custom', () => {
      return request(app.callback())
        .get('/api/users')
        .expect(400, {
          message: 'param not valid',
          code: 'NOT_VALID',
          status: 400,
        });
    });
  });

  describe('test async function from ts', () => {
    it('should response when named function', () => {
      return request(app.callback())
        .get('/api/typescripts/1')
        .expect(200, { success: true });
    });

    it('should response when anonymous function', () => {
      return request(app.callback())
        .get('/api/typescripts')
        .expect(200, { success: true });
    });
  });
});
