
/* global describe, it */
'use strict';
var expect = require('chai').expect;
var tokenize = require('../../src/tokenize').tokenize;
var forwardStrategy = require('../../src/model_strategy/forward');

describe('model_strategy/forward', function() {
  it('encodes tokens into a forward facing model', function() {
    var observations = forwardStrategy(tokenize('one two three'));
    expect(observations).to.deep.equal(
      [
        {context: ['<fence>', '<fence>'], observed: 'ONE'},
        {context: ['<fence>', 'ONE'], observed:  'TWO'},
        {context: ['ONE', 'TWO'], observed:  'THREE'},
        {context: ['TWO', 'THREE'], observed:  '<fence>'}
      ]
    );
  });
});
