'use strict';

exports.hsf = {
  enable: false,
};

exports.security = {
  csrf: {
    ignore: '/api/',
  },
  ctoken: {
    ignore: '/api/',
  },
};

exports.bodyParser = {
  // 可能需要测试 body 可能异常的情况
  strict: false,
};

exports.keys = 'keys';
