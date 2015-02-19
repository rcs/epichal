/* global describe, it */
'use strict';
var chai = require('chai');
var expect = chai.expect;
var MegaHAL = require('../src/megahal');
var async = require('async');

function throwError() {
  var cb = arguments[arguments.length - 1];
  var e = new Error();
  e.name = 'StubError';
  return cb(e);
}
var ErrorStorage = {};
['learn', 'pick', 'pickMulti', 'count', 'clear', 'surprise'].forEach( function(methodName) {
  ErrorStorage[methodName] = throwError;
});

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
  it('returns undefined if it can\'t come up with a reply', function(done) {
    var megahal = MegaHAL();
    megahal.clear(function() {
      megahal.reply('', function(err, res) {
        expect(res).to.equal(undefined);
        done();
      });
    });
  });
  it('can reply', function(done) {
    var megahal = MegaHAL();
    megahal.clear(function() {
      megahal.learn('fancy free-and !fabulous', function() {
        megahal.reply('', function(err, res) {
          expect(res).to.equal('fancy free-and !fabulous');
          done();
        });
      });
    });
  });
  it('can reply to undefined', function(done) {
    var megahal = MegaHAL();
    megahal.clear(function() {
      megahal.learn('fancy free-and !fabulous', function() {
        megahal.reply(undefined,  function(err, res) {
          expect(res).to.equal('fancy free-and !fabulous');
          done();
        });
      });
    });
  });
  it('can reply reasonably after learning some things', function(done) {
    var megahal = MegaHAL();
    megahal.clear(function() {
      var phrases = ['one two three', 'apple strawberry. banana'];
      async.map(phrases, megahal.learn.bind(megahal), function() {
        megahal.reply('strawberry', function(err, res) {
          expect(res).to.equal('apple strawberry. banana');
          done();
        });

      });

    });
  });
  it('propagates errors up when something bad has happened', function(done) {
    var megahal = MegaHAL({storage: ErrorStorage});
    megahal.learn('things', function(err) {
      expect(err).to.exist();
      expect(err.name).to.equal('StubError');
      done();
    });
  });

  describe('does some basic validation on arguments for', function() {
    it('scoreUtterance', function(done) {
      var megahal = MegaHAL();
      megahal.scoreUtterance([], [], function(err, res) {
        expect(res).to.equal(0);
        done();
      });
    });
  });

  it('scores utterances', function(done) {
    var megahal = MegaHAL();
    async.series([
      megahal.learn.bind(megahal, 'one two three four foo'),
      megahal.learn.bind(megahal, 'one two three four baz'),
    ], function() {
      megahal.scoreUtterance(['THREE', 'FOUR', 'BAZ'], ['THREE', 'FOUR', 'BAZ'],  function(err, res) {
        expect(res).to.equal(2);
        done();
      });
    });
  });
  it('reduces score against really long phrase', function(done) {
    var megahal = MegaHAL();
    async.series([
      megahal.learn.bind(megahal, 'one two three four foo'),
      megahal.learn.bind(megahal, 'one two three four baz'),
    ], function() {
      megahal.scoreUtterance(
        ['THREE', 'FOUR', 'BAZ'],
        [ 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A',
          'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A',
          'A', 'A',
          'THREE', 'FOUR', 'BAZ'],
        function(err, res) {
          expect(res).to.equal(0.016);
          done();
        }
      );
    });
  });
  it('returns undefined when it can\'t generate a good seed', function(done) {
    var megahal = MegaHAL();
    async.series([
      megahal.learn.bind(megahal, 'one two three four foo'),
      megahal.learn.bind(megahal, 'one two three four baz'),
    ], function() {
      megahal.seedFromKeywords(['APPLE', 'BANANA'], function(err,res) {
        expect(res).to.equal(undefined);
        done();
      });
    });
  });

  it('returns the seed when it can\'t walk from it', function(done) {
    var megahal = MegaHAL();
    async.series([
      megahal.learn.bind(megahal, 'one two three'),
      megahal.learn.bind(megahal, 'ONE Two three'),
    ], function() {
      megahal.phraseFromSeed(['APPLE'], ['APPLE', 'BANANA'], function(err,res) {
        expect(res).to.deep.equal(['APPLE', 'BANANA']);
        done();
      });
    });
  });

});
