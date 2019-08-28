'use strict';

module.exports = function(app) {
  var AccessToken = app.models.accessToken;

  AccessToken.destroyAll({})
    .then(response => console.log('access tokens destroyed: ', response))
    .catch(err => console.log(err));
};
