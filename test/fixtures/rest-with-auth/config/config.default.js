'use strict';

exports.hsf = {
  enable: false,
};

exports.security = {
  csrf: {
    ignore: /^\/api\//,
  },
  ctoken: {
    ignore: /^\/api\//,
  },
};

exports.rest = {
  urlprefix: '////v2///',
  * authRequest(ctx) {
    const name = ctx.query.name;
    if (!name) {
      return null;
    }
    if (name === 'serverError') {
      /* eslint-disable */
      dd;
      /* eslint-enable */
    }
    if (name === 'returnError') {
      ctx.throw(401, new Error('mock error'));
    }
    if (name === 'status304') {
      ctx.throw(403, 'test status', {
        code: 'foo',
      });
    }
    if (name !== 'shaoshuai0102') {
      ctx.throw(401, 'username must be shaoshuai0102');
    }
    return {
      name,
    };
  },
  authIgnores: {
    users: {
      index: true,
    },
  },
};

exports.keys = 'keys';
