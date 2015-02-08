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
  it('can learn', function() {
    var megahal = MegaHAL();
    expect(function(){megahal.learn('foo');}).to.not.throw(Error);
  });
  it('can clear', function() {
    var megahal = MegaHAL();
    expect(function(){megahal.clear();}).to.not.throw(Error);
  });
  it('can reply even if there is nothing there', function() {
    var megahal = MegaHAL();
    megahal.clear();
    expect(megahal.reply('', 'blah')).to.equal('blah');
  });
  it('can reply', function() {
    var megahal = MegaHAL();
    megahal.clear();
    megahal.learn('fancy free-and !fabulous');
    expect(megahal.reply('')).to.equal('fancy free-and !fabulous');
  });

});
