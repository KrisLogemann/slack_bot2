'use strict';

const expect = require('chai').expect;

const bot = require('../server/bot');

describe('bot.js', () => {
  it('should create a bot named "DingDongBot"', () => {
    expect(bot.name).to.equal('DingDongBot');
  });
});
