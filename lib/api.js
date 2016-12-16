'use strict';

const debug = require('debug')('egg:plugin:rest');
const utility = require('utility');
const STATUS_CODES = require('http').STATUS_CODES;

/**
 * RESTful API is supported in egg, according to JSON API spec.
 *
 * ##### Enable RESTful API in [config.js]
 *
 * ```js
 * exports.rest = {
 *   enable: true, // default to false, disabled
 *
 *   // The prefix of your RESTful API
 *   urlprefix: '/api/',
 *
 *   // Authentication customization, defaults to null
 *   authRequest: null,
 *   // authRequest: function* (ctx) {
 *   //   // A truthy value must be returned when authentication succeeds.
 *   //   // Otherwise the client will be responded with `401 Unauthorized`
 *   //   return accessToken;
 *   // }
 *
 *   // Specify the APIs for which authentication can be ignored.
 *   // If authRequest is configured, authentication for all APIs is required by default.
 *   authIgnores: null,
 *   // authIgnores: {
 *   //   users: {
 *   //     show: true, // allow GET /api/users/:id to ignore authentication
 *   //     index: true,
 *   //   }
 *   // }
 * };
 * ```
 * @class Rest
 * @param {Object} options options for REST.
 * @param {Object} routeConfig route config.
 */
module.exports = (options, routeConfig) => {
  const authRequest = options.authRequest;
  const authIgnores = options.authIgnores;
  const errorResponse = options.errorResponse || defaultErrorResponse;
  const RE_NUMBER = /^\d+$/;

  return function* restapi() {
    // Occurrence of User-Agent is required
    if (!this.get('User-Agent')) {
      this.status = 403;
      this.body = {
        message: 'Please make sure your request has a User-Agent header',
      };
      return;
    }

    if (!routeConfig) {
      notFoundResponse(this);
      return;
    }

    const objectNames = routeConfig.objects;
    const fname = routeConfig.fname;

    // Custom authentication
    if (needAuthRequest(objectNames, fname)) {
      // function* authRequest(ctx) {}
      // TODO: move into try/catch and use const.
      let accessToken;
      try {
        accessToken = yield authRequest(this);
      } catch (err) {
        err.status = err.status || 500;
        errorResponse(this, err);
        return;
      }

      debug('authRequest %s got %j', this.url, accessToken);
      if (!accessToken) {
        this.status = 401;
        this.body = {
          message: 'Bad credentials',
        };
        return;
      }

      // Make accessToken available for controllers.
      this.accessToken = accessToken;
    }

    if (fname === 'show' || fname === 'destroy') {
      // Deal with `/users/1,2,3,4`
      if (this.params.id.indexOf(',') >= 0) {
        const ids = utility.split(this.params.id, ',');
        if (ids.length === 0) {
          // Invalid multiple id combination like `/users/,,,,`,
          // respond with 400, providing a hint of invalid id.
          this.status = 400;
          this.body = {
            message: 'ids format error',
          };
          return;
        }
        this.params.ids = ids;
      } else {
        // Make sure this.params.ids always exist
        this.params.ids = [ this.params.id ];
      }
    } else if (fname === 'index') {
      // Paging
      if (this.query.page && RE_NUMBER.test(this.query.page)) {
        this.params.page = Number(this.query.page);
      }
      if (this.query.per_page && RE_NUMBER.test(this.query.per_page)) {
        this.params.per_page = Number(this.query.per_page);
      }
    } else if (fname === 'create' || fname === 'update') {
      // Detect invalid request automatically
      const requestData = this.request.body;
      if (!requestData || typeof requestData !== 'object') {
        this.status = 400;
        this.body = {
          message: 'Body should be a JSON object',
        };
        return;
      }
      this.params.data = requestData;
    }

    // GET /users?fields=id,name,age
    let fields;
    if (fname === 'show' || fname === 'index') {
      fields = getFields(this, fname);
      if (fields) {
        this.params.fields = fields;
      }
    }

    try {
      if (routeConfig.rule) {
        this.validate(routeConfig.rule, this.params.data);
      }
      yield routeConfig.fn.call(this);
    } catch (err) {
      err.status = err.status || 500;
      errorResponse(this, err);
      return;
    }

    if (fname === 'destroy' && !this.data && !this.body) {
      this.status = 204;
      return;
    }

    // update
    if (fname === 'update' && !this.data && !this.body) {
      this.status = 204;
      return;
    }

    // create
    if (fname === 'create') {
      this.status = 201;
    }

    if (this.body) {
      return;
    }

    let data = this.data;
    if (data) {
      if (typeof data === 'object' && (fname === 'show' || fname === 'index')) {
        // Only return values of requested fields
        if (fields) {
          if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
              data[i] = filterFields(data[i], fields);
            }
          } else {
            data = filterFields(data, fields);
          }
        }
      }
    } else {
      if (fname === 'show') {
        notFoundResponse(this);
        return;
      } else if (fname === 'index') {
        // Return empty array if index() return null
        data = [];
      }
    }

    const result = {
      data,
      // try to include meta
      meta: this.meta,
    };
    this.body = result;
  };

  function needAuthRequest(objectNames, fname) {
    if (!authRequest) {
      return false;
    }
    if (!authIgnores) {
      return true;
    }
    return !authIgnores[objectNames] || !authIgnores[objectNames][fname];
  }

  function getFields(ctx) {
    let fields = ctx.query.fields || null;
    if (fields) {
      // Specify fields which will be responded with 'fields' param
      // GET /users?fields=id,name,age
      fields = utility.split(fields, ',');
      if (fields.length > 0) {
        if (fields.indexOf('id') === -1) {
          // always return id
          fields.push('id');
        }
      } else {
        fields = null;
      }
    }
    return fields;
  }

  function filterFields(data, fields) {
    if (typeof data !== 'object') {
      // If data is an id, fields filtering is not supported
      return data;
    }

    const newData = {};
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      if (data.hasOwnProperty(f)) {
        newData[f] = data[f];
      }
    }
    return newData;
  }

  function notFoundResponse(ctx) {
    ctx.status = 404;
    ctx.body = {
      message: 'Not Found',
    };
  }

  function defaultErrorResponse(ctx, err) {
    let status = err.status;
    const isErrorInstance = err instanceof Error;
    if (!STATUS_CODES[status]) {
      // Respond with 500 if is an error. Otherwise 400 will be returned.
      status = isErrorInstance ? 500 : 400;
    }
    ctx.status = Number(status);

    if (status >= 500) {
      // Server exception
      if (isErrorInstance) {
        ctx.logger.error(err);
      }
      if (options.production) {
        ctx.body = {
          message: 'Internal Server Error',
        };
      } else {
        ctx.body = {
          message: err.name + ': ' + err.message,
          stack: err.stack,
        };
      }
    } else {
      // Client exception
      if (isErrorInstance) {
        ctx.body = {
          code: err.code,
          message: err.message,
          errors: err.errors,
        };
      } else {
        // Do not set status
        err.status = undefined;
        ctx.body = err;
      }
    }
  }
};
