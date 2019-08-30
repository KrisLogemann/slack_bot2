'use strict';

module.exports = function(app) {
  var AccessToken = app.models.accessToken;
  AccessToken.destroyAll({});
};
