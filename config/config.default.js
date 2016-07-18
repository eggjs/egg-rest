'use strict';

module.exports = function(antx) {
  const exports = {};

  /**
   * REST API options
   *
   * @member Config#rest
   * @property {String} urlprefix - prefix of rest api url. Defaluts to /api/
   * @property {Boolean} production - speicify if it's production environment or not
   * @property {Function} authRequest - authentication customization, defaults to null
   * @property {Function} authIgnores - Specify the APIs for which authentication can be ignored<br/>If authRequest is configured, authentication for all APIs is required by default.
   */

  exports.rest = {
    urlprefix: '/api/',
    production: antx.env === 'prod',
    authRequest: null,
    // authRequest: function* (ctx) {
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

  return exports;
};
