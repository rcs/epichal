/* global describe, it */
'use strict';
var expect = require('chai').expect;
var util = require('../src/util');

describe('mergeModel', function() {
  it('merges models', function() {
    var mergeModels = util.mergeModels;

    expect(
      mergeModels({a: [1,2], b: [3]}, {a: [3], c: [4]})
    ).to.deep.equal({a: [1,2,3], b: [3], c: [4]});
  });
});

describe('sum', function() {
  it('returns 0 for an empty list', function() {
    expect(util.sum([])).to.equal(0);
  });
  it('sums things', function() {
    expect(util.sum([1,2,3])).to.equal(6);
  });
});

describe('uncertainty', function() {
  it('has no uncertainty for an empty mapping', function() {
    expect(util.uncertainty({})).to.equal(undefined);
  });
  it('has zero uncertainty for a single response', function() {
    expect(util.uncertainty({'a': 1})).to.equal(0);
  });
  it('has max uncertainty for a uniform distribution', function() {
    var weights = {};
    for( var i = 0; i < 256; i++ ) {
      weights[i] = 1;
    }
    expect(util.uncertainty(weights)).to.equal(8);
  });
});

describe('surprise', function() {
  it('has no surprise for an unseen observation', function() {
    expect(util.surprise({},'llama')).to.equal(undefined);
  });
  it('has zero surprise for a lone context', function() {
    expect(util.surprise({'a': 1}, 'a')).to.equal(0);
  });
  it('has 1 surprise for a coin flip', function() {
    expect(util.surprise({'a': 1, 'b': 1}, 'a')).to.equal(1);
  });
  it('has max surprise for a uniform distribution', function() {
    var weights = {};
    for( var i = 0; i < 256; i++ ) {
      weights[i] = 1;
    }
    expect(util.surprise(weights, 0)).to.equal(8);
  });
});
