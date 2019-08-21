'use strict';

const expect = require('chai').expect;

const {doorbell,
  gotIn,
  checkIn,
  checkOut} = require('../server/events');

describe('Bot Events', () => {
  it('should have doorbell event', () => {
    expect(doorbell).to.exist;
  });
    it('should have gotIn event', () => {
      expect(gotIn).to.exist;
    });
    it('should have checkIn event', () => {
      expect(checkIn).to.exist;
    });
    it('should have checkOut event', () => {
      expect(checkOut).to.exist;
    });
   
});
