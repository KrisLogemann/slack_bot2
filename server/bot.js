'use strict';

const SlackBot = require('slackbots');

var bot = new SlackBot({
  token: process.env.BOT_USER_OAUTH_ACCESS_TOKEN,
  name: 'DingDongBot',
});

module.exports = bot;
