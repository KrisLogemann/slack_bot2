'use strict';

//require('dotenv').config();
const SlackBot = require('slackbots');

var bot = new SlackBot({
  token: process.env.BOT_USER_OAUTH_ACCESS_TOKEN,
  name: process.env.BOT_NAME,
});

module.exports = bot;
