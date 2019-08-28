'use strict';

module.exports = function(Checkin) {
  Checkin.getBySlackId = function(slackId, cb) {
    Checkin.find({where: {slack_id: slackId}})
      .then(result => {
        cb(null, result);
      })
      .catch(err => console.log(err));
  };

  Checkin.active = function(cb) {
    Checkin.find({where: {checkout_time: null}})
      .then(result => {
        cb(null, result);
      })
      .catch(err => console.log(err));
  };

  Checkin.remoteMethod(
    'getBySlackId', {
      http: {
        path: '/slackId/:slack_id',
        verb: 'get',
      },
      accepts: {
        arg: 'slack_id',
        type: 'string',
        required: true,
        http: {source: 'path'},
      },
      returns: {arg: 'checkins', type: ['checkin'], root: true},
    }
  );

  Checkin.remoteMethod(
    'active', {
      http: {
        path: '/active',
        verb: 'get',
      },
      returns: {arg: 'data', type:['checkin'], root: true},
    }
  );
};
