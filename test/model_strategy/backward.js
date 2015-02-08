
/* global describe, it */
'use strict';
var expect = require('chai').expect;
var tokenize = require('../../src/tokenize').tokenize;
var backwardStrategy = require('../../src/model_strategy/backward');

describe('model_strategy/backward', function() {
  it('encodes tokens into a backward facing model', function() {
    var observations = backwardStrategy(tokenize('one two three'));
    expect(observations).to.deep.equal(
      [
        {context: ['<fence>', '<fence>'], observed: 'THREE'},
        {context: ['<fence>', 'THREE'], observed:  'TWO'},
        {context: ['THREE', 'TWO'], observed:  'ONE'},
        {context: ['TWO', 'ONE'], observed:  '<fence>'}
      ]
    );
  });
});
