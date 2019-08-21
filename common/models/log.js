'use strict';

module.exports = (Log) => {
  Log.checkIn = (user, lat, long, cb) => {
    Log.find({where: {and: [{user: user}, {exit: null}]}}, (err, log) => {
      if (err) console.log(err);
      if (log && !log[0]) {
        Log.create({user, entry: new Date(), exit: null, entryLat: lat, entryLong: long}, (newLogErr, newLog) => {
          if (newLogErr) console.log(newLogErr);
          cb(newLogErr, newLog);
        });
      }
      else cb('Currently logged in', null);
    });
  };

  Log.remoteMethod('checkIn', {
    description: 'Creates a new log with a user and the current time',
    accepts: [{ arg: 'user', type: 'string' }, { arg: 'lat', type: 'number' }, { arg: 'long', type: 'number' }],
    http: { path: '/checkIn', verb: 'post' },
    returns: { arg: 'log', type: 'object' }
  });

  Log.checkOut = (user, lat, long, penalty, cb) => {
    Log.find({where: {and: [{user: user}, {exit: null}]}}, (err, log) => {
      if (err) console.log(err);
      if (log && log[0]) {
        log[0].updateAttributes({exit: new Date(), exitLat: lat, exitLong: long, penalty}, (updateLogErr, updateLog) => {
          if (updateLogErr) console.log(updateLogErr);
          cb(updateLogErr, updateLog);
        });
      } else cb('Currently logged out', null);
    });
  };

  Log.remoteMethod('checkOut', {
    description: 'Finds the log by the user without an exit date and appends the current date',
    accepts: [{ arg: 'user', type: 'string' }, { arg: 'lat', type: 'number' }, { arg: 'long', type: 'number' }, { arg: 'penalty', type: 'string' }],
    http: { path: '/checkOut', verb: 'post' },
    returns: { arg: 'log', type: 'object' }
  });
};
