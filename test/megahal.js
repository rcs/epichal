/* global describe, it */
'use strict';
var chai = require('chai');
var expect = chai.expect;
var MegaHAL = require('../src/megahal');

describe('MegaHAL', function() {
  it('constructs', function() {
    expect(MegaHAL({errorResponse: 'blah'})).to.be.instanceOf(MegaHAL);
  });
  it('constructs with new', function() {
    expect(new MegaHAL()).to.be.instanceOf(MegaHAL);
  });
  it('can learn', function(done) {
    var megahal = MegaHAL();
    megahal.learn('foo', function() {
      expect(1).to.equal(1);
      done();
    });
  });
  it('can clear', function(done) {
    var megahal = MegaHAL();
    megahal.clear(function() {
      expect(1).to.equal(1);
      done();
    });
  });
  it('can reply even if there is nothing there', function(done) {
    var megahal = MegaHAL();
    megahal.clear(function() {
      megahal.reply('', 'blah', function(err, res) {
        expect(res).to.equal('blah');
        done();
      });
    });
  });
  it('can reply', function(done) {
    var megahal = MegaHAL();
    megahal.clear();
    megahal.learn('fancy free-and !fabulous', function() {
      megahal.reply('', function(err, res) {
        expect(res).to.equal('fancy free-and !fabulous');
        done();
      });
    });
  });

});
