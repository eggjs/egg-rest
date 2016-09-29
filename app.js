/**!
 * Plugin initialization, loading from directories following the conventions.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// load all js files in app/apis/ directory automatically

module.exports = function(app) {
  // remove existed rest plugin configuration to prevent error configurations.
  const index = app.config.appMiddleware.indexOf('rest');
  assert.equal(index, -1, 'Duplication of middleware name found: rest. Rename your middleware other than "rest" please.');
  // put rest middleware in the first place
  app.config.coreMiddleware.unshift('rest');

  // make sure that REST APIs are loaded after the router taking effect
  process.nextTick(function() {
    loadRestApis(app);
  });
};

function loadRestApis(app) {
  // load rest api
  const apisDir = path.join(app.config.baseDir, 'app', 'apis');
  // register routing automatically
  let urlprefix = app.config.rest.urlprefix;
  // /api/ => /api, / => "", ///a// => /a
  urlprefix = urlprefix.replace(/\/+$/, '').replace(/^\/+/, '/');

  // load the middleware only and if only the rest plugin enabled
  registerDir(app, urlprefix, apisDir, 0);

  function registerDir(app, prefix, dir, level) {
    const names = fs.readdirSync(dir);
    for (const name of names) {
      const filepath = path.join(dir, name);
      const stat = fs.statSync(filepath);
      if (stat.isDirectory()) {
        // nesting is supported, for only two layers at most, `/api/parents/:parent_id/children/:child_id/objects/:id`
        if (level === 0) {
          registerDir(app, prefix + '/' + name + '/:parent_id', filepath, level + 1);
        } else if (level === 1) {
          registerDir(app, prefix + '/' + name + '/:child_id', filepath, level + 1 );
        } else {
          app.loggers.coreLogger.warn('[egg:rest] for directory "%s", the nesting is too deep(%d layer), one layer at most, which means `/api/parents/:parent_id/objects/:id`', filepath, level + 1);
        }

        continue;
      }

      if (stat.isFile() && path.extname(name) === '.js') {
        let handler = require(filepath);
        // support `module.exports = function (app) { return exports; }`
        if (typeof handler === 'function') {
          handler = handler(app);
        }
        let objectNames = path.basename(name, '.js');
        // apis/sites/index.js => GET /sites
        if (level >= 1 && objectNames === 'index') {
          objectNames = path.basename(dir);
          register(app, prefix.replace('/' + objectNames + '/:parent_id', ''), objectNames, handler);
        } else {
          register(app, prefix, objectNames, handler);
        }
      }
    }
  }

  function register(app, prefix, objectNames, handler) {
    const routeConfigs = {
      index: {
        method: 'get',
        url: '/{objects}',
      },
      show: {
        method: 'get',
        url: '/{objects}/:id',
      },
      create: {
        method: 'post',
        url: '/{objects}',
      },
      update: {
        method: 'put',
        url: '/{objects}/:id',
      },
      destroy: {
        method: 'delete',
        url: '/{objects}/:id',
      },
    };

    // check: index(), show(), create(), update(), destroy()
    for (const fname in handler) {
      const fn = handler[fname];
      const routeConfig = routeConfigs[fname];
      if (!routeConfig) {
        continue;
      }

      const url = prefix + routeConfig.url.replace('{objects}', objectNames);
      const routerName = routeConfig.method + ':' + url;
      const restapi = require('./api')(app.config.rest, {
        fname,
        objects: objectNames,
        fn,
        rule: handler[fname + 'Rule'],
      });
      app[routeConfig.method](routerName, url, restapi);
      app.loggers.coreLogger.info('[egg:rest] register router: %s %s => %s.%s()',
        routeConfig.method.toUpperCase(), url, objectNames, fname);
    }
  }
}
