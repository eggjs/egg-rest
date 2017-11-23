'use strict';

module.exports = options => {
  return function rest(ctx, next) {
    if (ctx.url.indexOf(options.urlprefix) === 0) {
      // Make sure all RESTful APIs always respond with json format
      ctx.response.type = 'json';
    }
    return next();
  };
};
