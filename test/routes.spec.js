'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = require('chai').expect;
chai.use(chaiHttp);

const app = require('../server/server');
const slashCommand = {
  user_id: 'test user',
  channel_id: 'test channel'
};

describe('Slash Commands', () => {
  it('should post to /doorbell', (done) => {
    chai.request(app)
    .post('/slack/doorbell')
    .send(slashCommand)
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(200);
      done();
    });
  });
  it('should post to /checkin', (done) => {
    chai.request(app)
    .post('/slack/checkin')
    .send(slashCommand)
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(200);
      done();
    });
  });
  it('should post to /checkout', (done) => {
    chai.request(app)
    .post('/slack/checkout')
    .send(slashCommand)
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res).to.have.status(200);
      done();
    });
  });
});
