/* global describe, it, beforeEach */
'use strict';
var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);
var async = require('async');

module.exports = function abstractStorageTest(storageAdapter) {
  describe('storage/memory', function() {
    it('allows observations', function() {
      expect(function(){storageAdapter.learn('modelName', 'foo', 'bar');}).to.not.throw(Error);
    });
    it('allows observations with complex contexts', function() {
      expect(function(){storageAdapter.learn('modelName', ['a','b'], 'bar');}).to.not.throw(Error);
    });
    it('calls the callback', function() {
      var cb = sinon.spy();
      storageAdapter.learn('modelName', ['a','b'], 'bar', cb);

      expect(cb).to.have.been.calledWith();
    });
    describe('stores and returns stuff from a model', function() {
      beforeEach(function(done) {
        async.series([
          function(cb) { storageAdapter.clear('modelName', cb); },
          function(cb){ storageAdapter.learn('modelName', ['a','b'], 'bar', cb); },
          function(cb){ storageAdapter.learn('modelName', ['a','c'], 'baz', cb); },
          function(cb){ storageAdapter.learn('modelName', ['a','c'], 'qux', cb); },
          function(cb){ storageAdapter.learn('modelName', ['a','c'], 'qux', cb); },
          function(cb){ storageAdapter.learn('modelName', ['a','c'], 'qux', cb); },
          function(cb){ storageAdapter.learn('modelName', ['a','c'], 'qux', cb); },
          ], function() {
            done();
          });
      });
      it('returns a learned prediction', function(done) {
        storageAdapter.pick('modelName', ['a','b'], function(err, res) {
          expect(res).to.equal('bar');
          done();
        });
      });
      it('returns multiple picked predictions', function(done) {
        storageAdapter.pickMulti('modelName', ['a','b'], 3, function(err, res) {
          expect(err).to.be.undefined();
          expect(res).to.deep.equal(['bar','bar','bar']);
          done();
        });
      });
      it('defaults to 1 multiple picked prediction', function(done) {
        storageAdapter.pickMulti('modelName', ['a','b'], function(err, res) {
          expect(res).to.deep.equal(['bar']);
          done();
        });
      });
      it('clears models', function(done) {
        storageAdapter.clear('modelName', function() {
          storageAdapter.pick('modelName', ['a','b'], function(err, res) {
            expect(err).to.be.null();
            expect(res).to.be.undefined();
            done();
          });
        });
      });
      it('counts learned predictions', function(done) {
        storageAdapter.count('modelName', ['a','c'], function(err, res) {
          expect(res).to.equal(5);
          done();
        });
      });
      it('count returns 0 for unlearned contexts', function(done) {
        storageAdapter.count('modelName', ['nothing','here'], function(err,res) {
          expect(res).to.equal(0);
          done();
        });
      });
      it('returns nothing for an unknown context', function(done) {
        storageAdapter.pick('modelName', ['b','a'], function(err,res) {
          expect(res).to.equal(undefined);
          done();
        });
      });
      it('returns picks in about the right ratio', function(done) {
        var predict;
        var counts = {
          baz: 0,
          qux: 0
        };
        async.times(1000, function(n,next) {
          predict = storageAdapter.pick('modelName', ['a','c'], function(err, res) {
            counts[res]  = counts[res] + 1;
            next();
          });
        }, function() {
          expect(counts.qux/counts.baz).to.be.closeTo(4,1);
          done();
        });
      });
    });

  });
};
