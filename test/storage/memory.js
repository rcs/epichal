/* global describe, it, beforeEach */
'use strict';
var expect = require('chai').expect;
var memoryStorage = require('../../src/storage/memory');

describe('storage/memory', function() {
  it('allows observations', function() {
    expect(function(){memoryStorage.learn('modelName', 'foo', 'bar');}).to.not.throw(Error);
  });
  it('allows observations with complex contexts', function() {
    expect(function(){memoryStorage.learn('modelName', ['a','b'], 'bar');}).to.not.throw(Error);
  });
  describe('stores and returns stuff from a model', function() {
    beforeEach(function() {
      memoryStorage.clear('modelName');
      memoryStorage.learn('modelName', ['a','b'], 'bar');
      memoryStorage.learn('modelName', ['a','c'], 'baz');
      memoryStorage.learn('modelName', ['a','c'], 'qux');
      memoryStorage.learn('modelName', ['a','c'], 'qux');
      memoryStorage.learn('modelName', ['a','c'], 'qux');
      memoryStorage.learn('modelName', ['a','c'], 'qux');
    });
    it('returns a learned prediction', function() {
      expect(
        memoryStorage.pick('modelName', ['a','b'])
      ).to.equal('bar');
    });
    it('returns multiple picked predictions', function() {
      expect(
        memoryStorage.pickMulti('modelName', ['a','b'], 3)
      ).to.deep.equal(['bar','bar','bar']);
    });
    it('defaults to 1 multiple picked prediction', function() {
      expect(
        memoryStorage.pickMulti('modelName', ['a','b'])
      ).to.deep.equal(['bar']);
    });
    it('clears models', function() {
      memoryStorage.clear('modelName');
      expect(
        memoryStorage.pick('modelName', ['a','b'])
      ).to.equal(undefined);
    });
    it('counts learned predictions', function() {
      expect(
        memoryStorage.count('modelName', ['a','c'])
      ).to.equal(5);
    });
    it('count returns 0 for unlearned contexts', function() {
      expect(
        memoryStorage.count('modelName', ['nothing','here'])
      ).to.equal(0);
    });
    it('returns nothing for an unknown context', function() {
      expect(
        memoryStorage.pick('modelName', ['b','a'])
      ).to.equal(undefined);
    });
    it('returns picks in about the right ratio', function() {
      var predict;
      var counts = {
        baz: 0,
        qux: 0
      };
      for( var i = 0; i < 1000; i++ ) {
        predict = memoryStorage.pick('modelName', ['a','c']);
        counts[predict] = counts[predict] + 1;
      }

      expect(counts.qux/counts.baz).to.be.closeTo(4,1);

    });
  });

});
