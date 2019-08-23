'use strict';

module.exports = {
  'mongod': {
    'connector': 'mongodb',
    'url': process.env.MONGODB_URI,
  },
};
