'use strict';

exports.rest = {
  errorResponse(ctx, err) {
    ctx.status = err.status;
    ctx.body = {
      message: err.message,
      code: err.code,
      status: err.status,
    };
  },
};
