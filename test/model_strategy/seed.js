
/* global describe, it */
'use strict';
var expect = require('chai').expect;
var tokenize = require('../../src/tokenize').tokenize;
var seedStrategy = require('../../src/model_strategy/seed');

describe('model_strategy/seed', function() {
  it('encodes tokens into a seeding', function() {
    var observations = seedStrategy(tokenize('one two three'));
    expect(observations).to.deep.equal(
      [
        {context: ['<fence>', '<blank>'], observed: 'ONE'},
        {context: ['<blank>', 'ONE'], observed: '<fence>'},

        {context: ['ONE', '<blank>'], observed:  'TWO'},
        {context: ['<blank>', 'TWO'], observed:  'ONE'},

        {context: ['TWO', '<blank>'], observed:  'THREE'},
        {context: ['<blank>', 'THREE'], observed:  'TWO'},

        {context: ['THREE', '<blank>'], observed: '<fence>'},
        {context: ['<blank>', '<fence>'], observed: 'THREE'}
      ]
    );
  });
});
